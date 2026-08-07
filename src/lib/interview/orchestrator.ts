import {
  InterviewState,
  OrchestrationResult,
  CandidateInterviewSnapshot,
  InternalInterviewSnapshot,
  InterviewEvent,
} from "@/types/interview";
import { getCandidateIntelligence, getCurriculum } from "@/lib/data";
import { createInterviewSession } from "@/lib/interview/state";
import { buildInterviewReport } from "@/lib/report/report";
import { planNextQuestion } from "@/lib/interview/planner";
import { generateTechnicalQuestion } from "@/lib/ai/question-generator";
import { evaluateCandidateAnswer } from "@/lib/ai/answer-evaluator";
import { extractClaimsFromAnswer } from "@/lib/ai/claim-extractor";
import { findComparableClaimPairs, analyzeContradictions } from "@/lib/ai/contradiction-detector";
import { createEmptyMemory, addTurnToMemory, getMemorySignalsForPlanner } from "@/lib/interview/memory";
import {
  createEmptyLedger,
  addTurnEvidenceToLedger,
  addContradictionEvidenceToLedger,
} from "@/lib/interview/evidence";
import {
  getEvidenceCoverageMatrix,
  getEvidenceGapSignalForPlanner,
} from "@/lib/interview/evidence-selectors";
import {
  addQuestion,
  submitAnswer,
  attachAssessment,
  completeInterview,
} from "@/lib/interview/transitions";
import { canCompleteInterview } from "@/lib/interview/selectors";
import { MIN_QUESTIONS, MIN_CURRICULUM_DAYS, MAX_QUESTIONS } from "@/lib/interview/constants";
import {
  SessionRepository,
  defaultSessionRepository,
} from "@/lib/interview/session-repository";
import {
  buildSafeCandidateSnapshot,
  createEvent,
} from "@/lib/interview/orchestrator-snapshots";
import { Result } from "@/lib/interview/errors";

function unwrap<T>(res: Result<T>): T {
  if (!res.ok) throw new Error(`State Transition Error [${res.error.code}]: ${res.error.message}`);
  return res.value;
}

const eventStore = new Map<string, InterviewEvent[]>();

function getEvents(sessionId: string): InterviewEvent[] {
  return eventStore.get(sessionId) || [];
}

function pushEvent(sessionId: string, event: InterviewEvent): void {
  const current = eventStore.get(sessionId) || [];
  eventStore.set(sessionId, [...current, event]);
}

export async function startAdaptiveInterview(
  candidateId: string,
  customSessionId?: string,
  repository: SessionRepository = defaultSessionRepository
): Promise<OrchestrationResult> {
  try {
    const intelligence = getCandidateIntelligence(candidateId);
    if (!intelligence) {
      return {
        success: false,
        snapshot: null as unknown as CandidateInterviewSnapshot,
        events: [],
        error: `Candidate '${candidateId}' not found.`,
      };
    }

    const { topics } = getCurriculum();
    const sessionId = customSessionId || `session_${candidateId}_${Date.now().toString(36)}`;
    let state = createInterviewSession(intelligence.candidate, intelligence, sessionId);

    // Initialize Memory & Evidence Ledger
    state.memory = createEmptyMemory();
    state.ledger = createEmptyLedger(sessionId);

    const startEvt = createEvent(sessionId, "session_started", {
      candidateId,
      candidateName: intelligence.candidate.name,
      suggestedStartingTopics: intelligence.suggestedStartingTopics.map((t) => t.topic),
    });
    pushEvent(sessionId, startEvt);

    // 1. Plan first question
    const plan = planNextQuestion({
      state,
      curriculum: topics,
      candidateIntelligence: intelligence,
    });

    const planEvt = createEvent(sessionId, "question_planned", {
      topic: plan.topic,
      difficulty: plan.difficulty,
      action: plan.action,
      reason: plan.reasonForSelection,
    });
    pushEvent(sessionId, planEvt);

    // 2. Generate natural technical question (with fallback)
    const genResult = await generateTechnicalQuestion({ plan });
    state = unwrap(addQuestion(state, genResult.question));

    const genEvt = createEvent(sessionId, "question_generated", {
      questionId: genResult.question.id,
      topic: genResult.question.topic,
      difficulty: genResult.question.difficulty,
      source: genResult.source,
    });
    pushEvent(sessionId, genEvt);

    await repository.createSession(state);

    const snapshot = buildSafeCandidateSnapshot(state);
    return {
      success: true,
      snapshot,
      events: getEvents(sessionId),
      internalSnapshot: {
        state,
        events: getEvents(sessionId),
        latestPlan: plan,
        canComplete: false,
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Initialization error";
    return {
      success: false,
      snapshot: null as unknown as CandidateInterviewSnapshot,
      events: [],
      error: errorMsg,
    };
  }
}

export interface SubmitAnswerInput {
  sessionId: string;
  questionId: string;
  answer: string;
  repository?: SessionRepository;
}

export async function submitInterviewAnswer(
  input: SubmitAnswerInput
): Promise<OrchestrationResult> {
  const repository = input.repository || defaultSessionRepository;

  try {
    let state = await repository.getSession(input.sessionId);
    if (!state) {
      return {
        success: false,
        snapshot: null as unknown as CandidateInterviewSnapshot,
        events: [],
        error: `Session '${input.sessionId}' not found.`,
      };
    }

    if (state.status === "completed") {
      return {
        success: false,
        snapshot: buildSafeCandidateSnapshot(state),
        events: getEvents(input.sessionId),
        error: "Interview is already completed.",
      };
    }

    if (!state.currentQuestion || state.currentQuestion.id !== input.questionId) {
      return {
        success: false,
        snapshot: buildSafeCandidateSnapshot(state),
        events: getEvents(input.sessionId),
        error: `Invalid questionId '${input.questionId}'. Current question is '${state.currentQuestion?.id || "none"}'.`,
      };
    }

    // 1. Submit Answer Transition
    state = unwrap(submitAnswer(state, input.questionId, input.answer));

    const currentTurnIndex = state.turns.length - 1;
    const currentTurn = state.turns[currentTurnIndex];

    const ansEvt = createEvent(input.sessionId, "answer_submitted", {
      questionId: input.questionId,
      answerLength: input.answer.length,
    });
    pushEvent(input.sessionId, ansEvt);

    // 2. Evaluate Answer (Fault tolerant)
    const { topics } = getCurriculum();
    const topicDetail = topics.find((t) => t.day === currentTurn.question.curriculumDay);

    const assessment = await evaluateCandidateAnswer({
      question: currentTurn.question,
      answer: input.answer,
      learningObjectives: topicDetail ? topicDetail.learningObjectives : [],
    });

    state = unwrap(attachAssessment(state, assessment));

    const evalEvt = createEvent(input.sessionId, "answer_assessed", {
      questionId: input.questionId,
      performanceSignal: assessment.performanceSignal,
      scores: assessment.scores,
      strengthsCount: assessment.strengths.length,
      gapsCount: assessment.gaps.length,
    });
    pushEvent(input.sessionId, evalEvt);

    // 3. Claim Extraction (Fault tolerant)
    const currentClaims = await extractClaimsFromAnswer({
      question: currentTurn.question,
      answer: input.answer,
      turnId: `turn_${input.questionId}`,
    });

    // 4. Contradiction Detection (Fault tolerant)
    const memory = state.memory || createEmptyMemory();
    const comparablePairs = findComparableClaimPairs(memory.claims, currentClaims);

    const newContradictionSignals = [];
    let ledger = state.ledger || createEmptyLedger(input.sessionId);

    for (const pair of comparablePairs) {
      const signal = await analyzeContradictions({
        earlierClaim: pair.earlier,
        laterClaim: pair.later,
      });

      if (signal) {
        newContradictionSignals.push(signal);
        ledger = addContradictionEvidenceToLedger(
          ledger,
          signal,
          pair.earlier.turnId,
          pair.later.turnId,
          currentTurn.question.curriculumDay
        );

        const contraEvt = createEvent(input.sessionId, "contradiction_detected", {
          topic: signal.topic,
          status: signal.status,
          explanation: signal.explanation,
        });
        pushEvent(input.sessionId, contraEvt);
      }
    }

    state.memory = addTurnToMemory(memory, state.turns[currentTurnIndex], currentClaims, newContradictionSignals);
    const memEvt = createEvent(input.sessionId, "memory_updated", {
      totalClaims: state.memory.claims.length,
      unresolvedQuestions: state.memory.unresolvedQuestions.length,
    });
    pushEvent(input.sessionId, memEvt);

    // 5. Evidence Ledger Update
    ledger = addTurnEvidenceToLedger(ledger, state.turns[currentTurnIndex]);
    ledger.matrix = getEvidenceCoverageMatrix(ledger, topics);
    state.ledger = ledger;

    const evEvt = createEvent(input.sessionId, "evidence_added", {
      totalEntries: state.ledger.entries.length,
    });
    pushEvent(input.sessionId, evEvt);

    // 6. Evaluate Continuation & Next Question
    const memorySignals = getMemorySignalsForPlanner(state.memory);
    const evidenceGapSignal = getEvidenceGapSignalForPlanner(state.ledger, state);

    const eligibleToFinish = canFinishInterview(state);
    const shouldFinish = shouldFinishInterview(state);

    if (eligibleToFinish) {
      const eligEvt = createEvent(input.sessionId, "completion_eligible", {
        questionCount: state.questionCount,
        coveredCurriculumDays: state.coveredCurriculumDays.length,
      });
      pushEvent(input.sessionId, eligEvt);
    }

    let nextPlan;

    if (!shouldFinish && state.turns.length < MAX_QUESTIONS) {
      // Plan and generate next question
      nextPlan = planNextQuestion({
        state,
        curriculum: topics,
        latestAssessment: assessment,
        performanceSignal: assessment.performanceSignal,
        memorySignals,
        evidenceGapSignal,
      });

      const nextPlanEvt = createEvent(input.sessionId, "next_question_planned", {
        topic: nextPlan.topic,
        difficulty: nextPlan.difficulty,
        action: nextPlan.action,
        reason: nextPlan.reasonForSelection,
      });
      pushEvent(input.sessionId, nextPlanEvt);

      const nextGenResult = await generateTechnicalQuestion({ plan: nextPlan });
      let addRes = addQuestion(state, nextGenResult.question);
      if (!addRes.ok && addRes.error.code === "DUPLICATE_QUESTION_TEXT") {
        nextGenResult.question.text = `${nextGenResult.question.text} (Focus: turn ${state.turns.length + 1})`;
        addRes = addQuestion(state, nextGenResult.question);
      }
      state = unwrap(addRes);

      const nextGenEvt = createEvent(input.sessionId, "question_generated", {
        questionId: nextGenResult.question.id,
        topic: nextGenResult.question.topic,
        difficulty: nextGenResult.question.difficulty,
        source: nextGenResult.source,
      });
      pushEvent(input.sessionId, nextGenEvt);
    } else if (shouldFinish || state.turns.length >= MAX_QUESTIONS) {
      // Auto-finish if max questions reached
      if (canFinishInterview(state)) {
        state = unwrap(completeInterview(state));
        const compEvt = createEvent(input.sessionId, "session_completed", {
          totalTurns: state.turns.length,
          coveredCurriculumDays: state.coveredCurriculumDays.length,
        });
        pushEvent(input.sessionId, compEvt);
      }
    }

    await repository.saveSession(state);

    const snapshot = buildSafeCandidateSnapshot(state);
    return {
      success: true,
      snapshot,
      events: getEvents(input.sessionId),
      internalSnapshot: {
        state,
        events: getEvents(input.sessionId),
        latestPlan: nextPlan,
        latestAssessment: assessment,
        memorySignals,
        evidenceGapSignal,
        canComplete: eligibleToFinish,
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Answer submission error";
    return {
      success: false,
      snapshot: null as unknown as CandidateInterviewSnapshot,
      events: [],
      error: errorMsg,
    };
  }
}

export function canFinishInterview(state: InterviewState): boolean {
  return canCompleteInterview(state);
}

export function shouldFinishInterview(state: InterviewState): boolean {
  if (!canCompleteInterview(state)) return false;

  // Max questions ceiling force finish
  if (state.turns.length >= MAX_QUESTIONS) return true;

  // If memory has unresolved contradiction requiring clarification and we are under max questions, continue
  if (state.memory) {
    const memSignal = getMemorySignalsForPlanner(state.memory);
    if (memSignal.unresolvedContradiction && state.turns.length < MAX_QUESTIONS - 1) {
      return false;
    }
  }

  // If evidence gap is severe and turns < 10, continue
  if (state.ledger) {
    const gapSignal = getEvidenceGapSignalForPlanner(state.ledger, state);
    if (gapSignal.hasGap && state.turns.length < 10) {
      return false;
    }
  }

  // Otherwise, minimum requirements satisfied cleanly
  return true;
}

export async function finishInterviewSession(
  sessionId: string,
  repository: SessionRepository = defaultSessionRepository
): Promise<OrchestrationResult> {
  let state = await repository.getSession(sessionId);
  if (!state) {
    return {
      success: false,
      snapshot: null as unknown as CandidateInterviewSnapshot,
      events: [],
      error: `Session '${sessionId}' not found.`,
    };
  }

  if (!canFinishInterview(state)) {
    return {
      success: false,
      snapshot: buildSafeCandidateSnapshot(state),
      events: getEvents(sessionId),
      error: `Cannot finish interview: requires at least ${MIN_QUESTIONS} questions and ${MIN_CURRICULUM_DAYS} unique curriculum days. Current: ${state.questionCount} questions across ${state.coveredCurriculumDays.length} days.`,
    };
  }

  state = unwrap(completeInterview(state));
  await repository.saveSession(state);

  const compEvt = createEvent(sessionId, "session_completed", {
    totalTurns: state.turns.length,
    coveredCurriculumDays: state.coveredCurriculumDays.length,
  });
  pushEvent(sessionId, compEvt);

  const intel = getCandidateIntelligence(state.candidate?.id || state.candidateId);
  const report = await buildInterviewReport({
    state,
    candidateName: intel?.candidate?.name || state.candidate?.name,
  });

  return {
    success: true,
    snapshot: buildSafeCandidateSnapshot(state),
    events: getEvents(sessionId),
    internalSnapshot: {
      state,
      events: getEvents(sessionId),
      latestPlan: null as unknown as QuestionPlan,
      canComplete: true,
    },
    report,
  };
}

export async function getInterviewSnapshot(
  sessionId: string,
  repository: SessionRepository = defaultSessionRepository
): Promise<CandidateInterviewSnapshot | null> {
  const state = await repository.getSession(sessionId);
  if (!state) return null;
  return buildSafeCandidateSnapshot(state);
}

export async function getInternalSnapshot(
  sessionId: string,
  repository: SessionRepository = defaultSessionRepository
): Promise<InternalInterviewSnapshot | null> {
  const state = await repository.getSession(sessionId);
  if (!state) return null;

  return {
    state,
    events: getEvents(sessionId),
    canComplete: canFinishInterview(state),
  };
}
