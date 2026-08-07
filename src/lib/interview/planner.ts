import {
  InterviewState,
  CurriculumTopic,
  CandidateIntelligenceReport,
  AnswerAssessment,
  PerformanceSignal,
  QuestionPlan,
  SkillHypothesis,
  PlannerMemorySignal,
  EvidenceGapSignal,
} from "@/types/interview";
import { MIN_CURRICULUM_DAYS, MAX_QUESTIONS } from "@/lib/interview/constants";
import { profileCandidate } from "@/lib/candidate/profiler";
import {
  determineInterviewPhase,
  recommendDifficulty,
  determineQuestionAction,
  generateObjective,
} from "@/lib/interview/planner-policy";
import {
  scoreTopicForSelection,
  rankScoredTopics,
  TopicScoreResult,
} from "@/lib/interview/planner-scoring";
import { getMemorySignalsForPlanner } from "@/lib/interview/memory";
import { getEvidenceGapSignalForPlanner } from "@/lib/interview/evidence-selectors";

export interface PlanNextQuestionInput {
  state: InterviewState;
  curriculum: CurriculumTopic[];
  candidateIntelligence?: CandidateIntelligenceReport;
  latestAssessment?: AnswerAssessment;
  performanceSignal?: PerformanceSignal;
  memorySignals?: PlannerMemorySignal;
  evidenceGapSignal?: EvidenceGapSignal;
}

export function planNextQuestion(input: PlanNextQuestionInput): QuestionPlan {
  const { state, curriculum, latestAssessment, performanceSignal } = input;
  const memorySignals = input.memorySignals || (state.memory ? getMemorySignalsForPlanner(state.memory) : undefined);
  const evidenceGapSignal = input.evidenceGapSignal || (state.ledger ? getEvidenceGapSignalForPlanner(state.ledger, state) : undefined);

  const candidateIntelligence =
    input.candidateIntelligence ||
    profileCandidate(state.candidate, curriculum);

  const questionsAsked = state.turns.length;
  const uniqueDays = state.coveredCurriculumDays.length;
  const daysNeeded = Math.max(0, MIN_CURRICULUM_DAYS - uniqueDays);
  const questionsLeft = Math.max(0, MAX_QUESTIONS - questionsAsked);

  const phase = determineInterviewPhase(questionsAsked, uniqueDays);

  // Coverage rescue activates if we are near max questions and still lack required 4 days
  const isCoverageRescue =
    (questionsAsked >= 7 || questionsLeft <= daysNeeded + 1) &&
    uniqueDays < MIN_CURRICULUM_DAYS;

  // Build lookup map for candidate skill hypotheses
  const hypothesisMap = new Map<number, SkillHypothesis>();
  candidateIntelligence.skillMap.forEach((h) => {
    hypothesisMap.set(h.curriculumDay, h);
  });

  // Score all curriculum topics
  const scoredTopics: TopicScoreResult[] = curriculum.map((topic) => {
    const hypothesis = hypothesisMap.get(topic.day) || {
      topic: topic.topic,
      curriculumDay: topic.day,
      moduleTitle: topic.module,
      exposure: "none",
      estimatedStrength: 0.25,
      confidence: 0.4,
      interviewPriority: "low",
      recommendedDifficulty: "foundation",
      isSkipped: false,
      attemptsCount: 0,
      evidence: [],
    };

    return scoreTopicForSelection(topic, hypothesis, state, isCoverageRescue);
  });

  // Rank scored topics deterministically
  const rankedList = rankScoredTopics(scoredTopics);

  // Prefer non-skipped topics unless coverage rescue leaves no choice
  let selected = rankedList.find((item) => !item.hypothesis.isSkipped);
  if (!selected) {
    selected = rankedList[0];
  }

  // Memory Signal Override (unless coverage rescue mode takes priority)
  let overrideReason: string | null = null;
  let actionOverride: "clarify" | "challenge" | "deepen" | null = null;

  if (!isCoverageRescue && memorySignals?.unresolvedContradiction && memorySignals.topic) {
    const memoryTopicMatch = rankedList.find(
      (item) => item.topic.topic.toLowerCase() === memorySignals.topic!.toLowerCase()
    );
    if (memoryTopicMatch) {
      selected = memoryTopicMatch;
      actionOverride = memorySignals.recommendedAction === "challenge" ? "challenge" : "clarify";
      overrideReason = `Cross-Turn Memory: Two earlier statements on '${memorySignals.topic}' appear inconsistent (${memorySignals.reason}). Selected for technical clarification.`;
    }
  } else if (!isCoverageRescue && evidenceGapSignal?.hasGap && evidenceGapSignal.topic) {
    const gapTopicMatch = rankedList.find(
      (item) => item.topic.topic.toLowerCase() === evidenceGapSignal.topic!.toLowerCase()
    );
    if (gapTopicMatch) {
      selected = gapTopicMatch;
      actionOverride = "deepen";
      overrideReason = `Evidence Ledger Gap: '${evidenceGapSignal.topic}' has observed evidence but lacks depth for ${evidenceGapSignal.missingCompetencies.join(", ")}. Selected to collect evidence.`;
    }
  }

  const lastTurn = state.turns.length > 0 ? state.turns[state.turns.length - 1] : null;
  const isSameTopicAsLast = Boolean(
    lastTurn && lastTurn.question.topic === selected.topic.topic
  );

  const difficulty = recommendDifficulty(
    selected.hypothesis,
    phase,
    performanceSignal || (latestAssessment ? (latestAssessment.scores.correctness >= 4 ? "strong" : "partial") : undefined)
  );

  const action = actionOverride || determineQuestionAction(
    selected.hypothesis,
    isSameTopicAsLast,
    performanceSignal
  );

  const addsNewCurriculumDay = !state.coveredCurriculumDays.includes(
    selected.topic.day
  );
  const uniqueDaysAfterQuestion = addsNewCurriculumDay
    ? uniqueDays + 1
    : uniqueDays;

  const objective = generateObjective(selected.topic, difficulty, action);

  const basedOnQuestionId =
    ["follow_up", "clarify", "challenge", "deepen"].includes(action) && lastTurn
      ? lastTurn.question.id
      : undefined;

  // Build explicit, human-readable reason for selection
  let reasonForSelection = overrideReason || "";
  if (!reasonForSelection) {
    if (isCoverageRescue) {
      reasonForSelection = `Coverage Rescue mode active: prioritizing Day ${selected.topic.day} (${selected.topic.topic}) to satisfy minimum ${MIN_CURRICULUM_DAYS} curriculum days requirement before reaching ${MAX_QUESTIONS}-question ceiling.`;
    } else if (selected.hypothesis.attemptsCount >= 3) {
      reasonForSelection = `Candidate completed Day ${selected.topic.day} (${selected.topic.topic}) but required ${selected.hypothesis.attemptsCount} attempts on mission. Selected for high-priority technical verification.`;
    } else if (phase === "calibration" && selected.hypothesis.estimatedStrength >= 0.7) {
      reasonForSelection = `Calibration Phase: Selected high-confidence topic Day ${selected.topic.day} (${selected.topic.topic}) to establish baseline competence at ${difficulty} depth.`;
    } else if (addsNewCurriculumDay) {
      reasonForSelection = `Phase [${phase.toUpperCase()}]: Expanding curriculum coverage to Day ${selected.topic.day} (${selected.topic.topic}) within module '${selected.topic.module}'.`;
    } else {
      reasonForSelection = `Phase [${phase.toUpperCase()}]: Probing ${action} on ${selected.topic.topic} at ${difficulty} level.`;
    }
  }

  const plannerSignals: string[] = [
    `Phase: ${phase}`,
    `Selection Mode: ${selected.selectionMode}`,
    `Adds New Day: ${addsNewCurriculumDay}`,
    ...selected.reasons,
  ];

  return {
    topicId: selected.topic.id,
    topic: selected.topic.topic,
    curriculumDay: selected.topic.day,
    moduleTitle: selected.topic.module,
    difficulty,
    action,
    objective,
    reasonForSelection,
    candidateEvidence: [...selected.hypothesis.evidence],
    plannerSignals,
    basedOnQuestionId,
    coverageImpact: {
      addsNewCurriculumDay,
      uniqueDaysAfterQuestion,
    },
    priorityScore: selected.priorityScore,
    phase,
    selectionMode: selected.selectionMode,
  };
}
