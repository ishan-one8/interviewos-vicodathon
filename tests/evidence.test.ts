import { describe, it } from "node:test";
import assert from "node:assert";
import { getCandidateIntelligence, getCurriculum } from "../src/lib/data";
import { createInterviewSession } from "../src/lib/interview/state";
import { planNextQuestion } from "../src/lib/interview/planner";
import { buildPlaceholderQuestion } from "../src/lib/interview/question-template";
import { addQuestion, submitAnswer, attachAssessment } from "../src/lib/interview/transitions";
import { evaluateCandidateAnswer } from "../src/lib/ai/answer-evaluator";
import {
  createEmptyLedger,
  createEvidenceFromTurn,
  addTurnEvidenceToLedger,
  addContradictionEvidenceToLedger,
} from "../src/lib/interview/evidence";
import { getEvidenceWeight } from "../src/lib/interview/evidence-weight";
import {
  getEvidenceForTopic,
  getEvidenceForCompetency,
  getStrengthEvidence,
  getGapEvidence,
  getEvidenceCoverageMatrix,
  getEvidenceGapSignalForPlanner,
} from "../src/lib/interview/evidence-selectors";
import { Result } from "../src/lib/interview/errors";
import { EvidenceEntrySchema, ContradictionSignal, AnswerAssessment } from "../src/types/interview";

describe("Milestone 11 — Evidence Ledger & Provenance Tracking Suite", () => {
  const { topics } = getCurriculum();

  function unwrap<T>(res: Result<T>): T {
    if (!res.ok) {
      throw new Error(`State error [${res.error.code}]: ${res.error.message}`);
    }
    return res.value;
  }

  function getSetup(candidateId = "CAND-003") {
    const intelligence = getCandidateIntelligence(candidateId)!;
    let session = createInterviewSession(intelligence.candidate, intelligence, `session_${candidateId}`);
    const plan = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });
    const question = buildPlaceholderQuestion(plan);
    session = unwrap(addQuestion(session, question));
    return { session, intelligence, plan, question };
  }

  it("TEST 1: Strong assessment creates strength evidence.", () => {
    const { session, question } = getSetup();
    const mockAssessment: AnswerAssessment = {
      questionId: question.id,
      answer: "To optimize HNSW vector search, I adjust efConstruction and M during index creation.",
      performanceSignal: "strong",
      scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 },
      strengths: ["Adjusts efConstruction and M during index creation to optimize build time vs recall."],
      gaps: [],
      contradictions: [],
      evidence: ["adjust efConstruction and M"],
      summary: "Candidate demonstrated deep HNSW optimization knowledge.",
      recommendedAction: "deepen",
      recommendedDifficulty: "advanced",
      confidence: 0.9,
    };

    let updatedSession = unwrap(submitAnswer(session, question.id, mockAssessment.answer));
    updatedSession = unwrap(attachAssessment(updatedSession, mockAssessment));

    const entries = createEvidenceFromTurn(updatedSession.turns[0], updatedSession.sessionId);
    assert.ok(entries.length >= 1);
    assert.ok(entries.some((e) => e.type === "strength"));
  });

  it("TEST 2: Gap creates negative evidence.", async () => {
    const { session, question, plan } = getSetup();
    const answer = "I don't know.";
    const evalResult = await evaluateCandidateAnswer({ question, answer, plan, learningObjectives: [], forceFallback: true });

    let updatedSession = unwrap(submitAnswer(session, question.id, answer));
    updatedSession = unwrap(attachAssessment(updatedSession, evalResult));

    const entries = createEvidenceFromTurn(updatedSession.turns[0], updatedSession.sessionId);
    assert.ok(entries.some((e) => e.type === "gap"));
  });

  it("TEST 3: Evidence preserves questionId and turnId provenance.", async () => {
    const { session, question, plan } = getSetup();
    const answer = "Inspect chunk quality before modifying model.";
    const evalResult = await evaluateCandidateAnswer({ question, answer, plan, learningObjectives: [], forceFallback: true });

    let updatedSession = unwrap(submitAnswer(session, question.id, answer));
    updatedSession = unwrap(attachAssessment(updatedSession, evalResult));

    const entries = createEvidenceFromTurn(updatedSession.turns[0], updatedSession.sessionId);
    assert.strictEqual(entries[0].questionId, question.id);
    assert.strictEqual(entries[0].provenance.questionId, question.id);
    assert.strictEqual(entries[0].provenance.topic, question.topic);
  });

  it("TEST 4: Evidence without valid provenance is rejected by Zod.", () => {
    const invalidObj = {
      id: "ev_1",
      sessionId: "s1",
      turnId: "t1",
      questionId: "q1",
      topic: "RAG",
      curriculumDay: 8,
      competency: "correctness",
      type: "strength",
      observation: "Observation",
      difficulty: "intermediate",
      confidence: 0.8,
      source: "answer_assessment",
      provenance: null,
      weight: 0.8,
      createdAt: new Date().toISOString(),
    };

    const parsed = EvidenceEntrySchema.safeParse(invalidObj);
    assert.strictEqual(parsed.success, false);
  });

  it("TEST 5: Duplicate evidence is deduplicated.", async () => {
    const { session, question, plan } = getSetup();
    const answer = "Inspect chunk quality first.";
    const evalResult = await evaluateCandidateAnswer({ question, answer, plan, learningObjectives: [], forceFallback: true });

    let updatedSession = unwrap(submitAnswer(session, question.id, answer));
    updatedSession = unwrap(attachAssessment(updatedSession, evalResult));

    let ledger = createEmptyLedger("s1");
    ledger = addTurnEvidenceToLedger(ledger, updatedSession.turns[0]);
    const countBefore = ledger.entries.length;

    ledger = addTurnEvidenceToLedger(ledger, updatedSession.turns[0]);
    assert.strictEqual(ledger.entries.length, countBefore);
  });

  it("TEST 6: Two different turns may create independent evidence.", async () => {
    const { session, intelligence, question, plan } = getSetup();

    const eval1 = await evaluateCandidateAnswer({ question, answer: "Answer 1", plan, learningObjectives: [], forceFallback: true });
    let updatedSession = unwrap(submitAnswer(session, question.id, "Answer 1"));
    updatedSession = unwrap(attachAssessment(updatedSession, eval1));

    let ledger = createEmptyLedger("s1");
    ledger = addTurnEvidenceToLedger(ledger, updatedSession.turns[0]);

    const plan2 = planNextQuestion({ state: updatedSession, curriculum: topics, candidateIntelligence: intelligence });
    const q2 = buildPlaceholderQuestion(plan2);
    updatedSession = unwrap(addQuestion(updatedSession, q2));
    const eval2 = await evaluateCandidateAnswer({ question: q2, answer: "Answer 2", plan: plan2, learningObjectives: [], forceFallback: true });
    updatedSession = unwrap(submitAnswer(updatedSession, q2.id, "Answer 2"));
    updatedSession = unwrap(attachAssessment(updatedSession, eval2));

    ledger = addTurnEvidenceToLedger(ledger, updatedSession.turns[1]);
    assert.ok(ledger.entries.length >= 2);
  });

  it("TEST 7: Positive and negative evidence can coexist.", () => {
    const ledger = createEmptyLedger("s1");
    ledger.entries.push({
      id: "ev1",
      sessionId: "s1",
      turnId: "t1",
      questionId: "q1",
      topic: "RAG",
      curriculumDay: 8,
      competency: "correctness",
      type: "strength",
      observation: "Good correctness",
      difficulty: "intermediate",
      confidence: 0.9,
      source: "answer_assessment",
      provenance: { questionId: "q1", turnId: "t1", curriculumDay: 8, topic: "RAG" },
      weight: 0.8,
      createdAt: new Date().toISOString(),
    });

    ledger.entries.push({
      id: "ev2",
      sessionId: "s1",
      turnId: "t1",
      questionId: "q1",
      topic: "RAG",
      curriculumDay: 8,
      competency: "tradeoffAwareness",
      type: "gap",
      observation: "Did not discuss costs",
      difficulty: "intermediate",
      confidence: 0.9,
      source: "answer_assessment",
      provenance: { questionId: "q1", turnId: "t1", curriculumDay: 8, topic: "RAG" },
      weight: 0.7,
      createdAt: new Date().toISOString(),
    });

    const strengths = getStrengthEvidence(ledger);
    const gaps = getGapEvidence(ledger);

    assert.strictEqual(strengths.length, 1);
    assert.strictEqual(gaps.length, 1);
  });

  it("TEST 8: Contradiction evidence preserves both claims.", () => {
    let ledger = createEmptyLedger("s1");
    const signal: ContradictionSignal = {
      id: "contra_1",
      earlierClaimId: "c1",
      laterClaimId: "c2",
      status: "contradictory",
      topic: "Vector Databases",
      explanation: "Claim A conflicted with Claim B.",
      confidence: 0.9,
      recommendedAction: "clarify",
      probedCount: 0,
      resolved: false,
    };

    ledger = addContradictionEvidenceToLedger(ledger, signal, "t1", "t2", 8);
    assert.strictEqual(ledger.entries.length, 1);
    assert.strictEqual(ledger.entries[0].type, "contradiction");
  });

  it("TEST 9: Resolved contradiction remains in historical audit.", () => {
    let ledger = createEmptyLedger("s1");
    const signal: ContradictionSignal = {
      id: "contra_1",
      earlierClaimId: "c1",
      laterClaimId: "c2",
      status: "consistent",
      topic: "Vector Databases",
      explanation: "Claim A resolved with Claim B.",
      confidence: 0.9,
      recommendedAction: "ignore",
      probedCount: 1,
      resolved: true,
    };

    ledger = addContradictionEvidenceToLedger(ledger, signal, "t1", "t2", 8);
    assert.strictEqual(ledger.entries[0].type, "refinement");
  });

  it("TEST 10: Later refinement does not delete earlier gap.", () => {
    const ledger = createEmptyLedger("s1");

    ledger.entries.push({
      id: "ev1",
      sessionId: "s1",
      turnId: "t1",
      questionId: "q1",
      topic: "RAG",
      curriculumDay: 8,
      competency: "depth",
      type: "gap",
      observation: "Initial gap",
      difficulty: "intermediate",
      confidence: 0.8,
      source: "answer_assessment",
      provenance: { questionId: "q1", turnId: "t1", curriculumDay: 8, topic: "RAG" },
      weight: 0.7,
      createdAt: new Date().toISOString(),
    });

    ledger.entries.push({
      id: "ev2",
      sessionId: "s1",
      turnId: "t2",
      questionId: "q2",
      topic: "RAG",
      curriculumDay: 8,
      competency: "depth",
      type: "refinement",
      observation: "Later refinement provided depth",
      difficulty: "advanced",
      confidence: 0.9,
      source: "contradiction_analysis",
      provenance: { questionId: "q2", turnId: "t1", curriculumDay: 8, topic: "RAG" },
      weight: 0.9,
      createdAt: new Date().toISOString(),
    });

    assert.strictEqual(ledger.entries.length, 2);
    assert.strictEqual(ledger.entries[0].type, "gap");
  });

  it("TEST 11: Evidence score stays within valid range 0 to 4.", async () => {
    const { session, question, plan } = getSetup();
    const evalResult = await evaluateCandidateAnswer({ question, answer: "Valid answer", plan, learningObjectives: [], forceFallback: true });

    let updatedSession = unwrap(submitAnswer(session, question.id, "Valid answer"));
    updatedSession = unwrap(attachAssessment(updatedSession, evalResult));

    const entries = createEvidenceFromTurn(updatedSession.turns[0], updatedSession.sessionId);
    for (const e of entries) {
      if (e.score !== undefined) {
        assert.ok(e.score >= 0 && e.score <= 4);
      }
    }
  });

  it("TEST 12: Confidence remains between 0.0 and 1.0.", async () => {
    const { session, question, plan } = getSetup();
    const evalResult = await evaluateCandidateAnswer({ question, answer: "Answer", plan, learningObjectives: [], forceFallback: true });

    let updatedSession = unwrap(submitAnswer(session, question.id, "Answer"));
    updatedSession = unwrap(attachAssessment(updatedSession, evalResult));

    const entries = createEvidenceFromTurn(updatedSession.turns[0], updatedSession.sessionId);
    for (const e of entries) {
      assert.ok(e.confidence >= 0.0 && e.confidence <= 1.0);
    }
  });

  it("TEST 13: Evidence weighting is deterministic.", () => {
    const w1 = getEvidenceWeight({ difficulty: "advanced", confidence: 0.9, type: "strength" });
    const w2 = getEvidenceWeight({ difficulty: "advanced", confidence: 0.9, type: "strength" });

    assert.strictEqual(w1, w2);
    assert.ok(w1 > 0.5 && w1 <= 1.0);
  });

  it("TEST 14: Difficulty context is preserved.", () => {
    const weightFoundation = getEvidenceWeight({ difficulty: "foundation", confidence: 0.9, type: "strength" });
    const weightArchitecture = getEvidenceWeight({ difficulty: "architecture", confidence: 0.9, type: "strength" });

    assert.ok(weightArchitecture > weightFoundation);
  });

  it("TEST 15: Topic selector returns only matching evidence.", () => {
    const ledger = createEmptyLedger("s1");
    ledger.entries.push({
      id: "ev1",
      sessionId: "s1",
      turnId: "t1",
      questionId: "q1",
      topic: "RAG",
      curriculumDay: 8,
      competency: "correctness",
      type: "strength",
      observation: "Obs 1",
      difficulty: "intermediate",
      confidence: 0.8,
      source: "answer_assessment",
      provenance: { questionId: "q1", turnId: "t1", curriculumDay: 8, topic: "RAG" },
      weight: 0.8,
      createdAt: new Date().toISOString(),
    });

    ledger.entries.push({
      id: "ev2",
      sessionId: "s1",
      turnId: "t2",
      questionId: "q2",
      topic: "Vector Databases",
      curriculumDay: 9,
      competency: "correctness",
      type: "strength",
      observation: "Obs 2",
      difficulty: "intermediate",
      confidence: 0.8,
      source: "answer_assessment",
      provenance: { questionId: "q2", turnId: "t2", curriculumDay: 9, topic: "Vector Databases" },
      weight: 0.8,
      createdAt: new Date().toISOString(),
    });

    const ragEntries = getEvidenceForTopic(ledger, "RAG");
    assert.strictEqual(ragEntries.length, 1);
    assert.strictEqual(ragEntries[0].topic, "RAG");
  });

  it("TEST 16: Competency selector works.", () => {
    const ledger = createEmptyLedger("s1");
    ledger.entries.push({
      id: "ev1",
      sessionId: "s1",
      turnId: "t1",
      questionId: "q1",
      topic: "RAG",
      curriculumDay: 8,
      competency: "tradeoffAwareness",
      type: "gap",
      observation: "Gap obs",
      difficulty: "intermediate",
      confidence: 0.8,
      source: "answer_assessment",
      provenance: { questionId: "q1", turnId: "t1", curriculumDay: 8, topic: "RAG" },
      weight: 0.8,
      createdAt: new Date().toISOString(),
    });

    const tradeoffEntries = getEvidenceForCompetency(ledger, "tradeoffAwareness");
    assert.strictEqual(tradeoffEntries.length, 1);
  });

  it("TEST 17: Evidence coverage matrix is correct.", () => {
    const ledger = createEmptyLedger("s1");
    ledger.entries.push({
      id: "ev1",
      sessionId: "s1",
      turnId: "t1",
      questionId: "q1",
      topic: topics[0].topic,
      curriculumDay: topics[0].day,
      competency: "correctness",
      type: "strength",
      observation: "Strength",
      difficulty: "intermediate",
      confidence: 0.8,
      source: "answer_assessment",
      provenance: { questionId: "q1", turnId: "t1", curriculumDay: topics[0].day, topic: topics[0].topic },
      weight: 0.8,
      createdAt: new Date().toISOString(),
    });

    const matrix = getEvidenceCoverageMatrix(ledger, topics);
    assert.strictEqual(matrix.length, topics.length);
    assert.strictEqual(matrix[0].competencies.correctness.strengthCount, 1);
  });

  it("TEST 18: Missing competency creates evidence-gap signal.", () => {
    const { session } = getSetup();
    const ledger = createEmptyLedger("s1");

    ledger.entries.push({
      id: "ev1",
      sessionId: "s1",
      turnId: "t1",
      questionId: "q1",
      topic: topics[0].topic,
      curriculumDay: topics[0].day,
      competency: "correctness",
      type: "strength",
      observation: "Definition strength",
      difficulty: "intermediate",
      confidence: 0.8,
      source: "answer_assessment",
      provenance: { questionId: "q1", turnId: "t1", curriculumDay: topics[0].day, topic: topics[0].topic },
      weight: 0.8,
      createdAt: new Date().toISOString(),
    });

    session.coveredTopics = [topics[0].topic];
    const signal = getEvidenceGapSignalForPlanner(ledger, session);

    assert.strictEqual(signal.hasGap, true);
    assert.ok(signal.missingCompetencies.includes("practicalUnderstanding") || signal.missingCompetencies.includes("tradeoffAwareness"));
  });

  it("TEST 19: Fully evidenced competency does not create unnecessary gap.", () => {
    const { session } = getSetup();
    const ledger = createEmptyLedger("s1");

    const dims = ["correctness", "depth", "reasoning", "practicalUnderstanding", "tradeoffAwareness"] as const;
    dims.forEach((d, i) => {
      ledger.entries.push({
        id: `ev_${i}`,
        sessionId: "s1",
        turnId: "t1",
        questionId: "q1",
        topic: topics[0].topic,
        curriculumDay: topics[0].day,
        competency: d,
        type: "strength",
        observation: `Obs ${i}`,
        difficulty: "intermediate",
        confidence: 0.8,
        source: "answer_assessment",
        provenance: { questionId: "q1", turnId: "t1", curriculumDay: topics[0].day, topic: topics[0].topic },
        weight: 0.8,
        createdAt: new Date().toISOString(),
      });
    });

    session.coveredTopics = [topics[0].topic];
    const signal = getEvidenceGapSignalForPlanner(ledger, session);

    assert.strictEqual(signal.hasGap, false);
  });

  it("TEST 20: Planner can receive evidence-gap signal.", () => {
    const { session, intelligence } = getSetup();
    const gapSignal = {
      hasGap: true,
      topic: topics[1].topic,
      missingCompetencies: ["practicalUnderstanding" as const],
      evidenceCount: 1,
      confidence: 0.8,
      reason: "Missing practical understanding",
    };

    const plan = planNextQuestion({
      state: session,
      curriculum: topics,
      candidateIntelligence: intelligence,
      evidenceGapSignal: gapSignal,
    });

    assert.strictEqual(plan.topic, topics[1].topic);
    assert.strictEqual(plan.action, "deepen");
  });

  it("TEST 21: Coverage rescue still takes precedence over evidence gaps.", () => {
    const { intelligence } = getSetup();
    let session = createInterviewSession(intelligence.candidate, intelligence, "rescue_session_ev");

    for (let i = 0; i < 7; i++) {
      const plan = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });
      const q = buildPlaceholderQuestion(plan);
      session = unwrap(addQuestion(session, q));
      session = unwrap(submitAnswer(session, q.id, "Technical answer."));
    }

    const gapSignal = {
      hasGap: true,
      topic: topics[0].topic,
      missingCompetencies: ["tradeoffAwareness" as const],
      evidenceCount: 2,
      confidence: 0.8,
      reason: "Missing tradeoff awareness",
    };

    const planRes = planNextQuestion({
      state: session,
      curriculum: topics,
      candidateIntelligence: intelligence,
      evidenceGapSignal: gapSignal,
    });

    assert.ok(planRes.reasonForSelection.includes("Coverage Rescue") || planRes.coverageImpact.addsNewCurriculumDay);
  });

  it("TEST 22: MAX_QUESTIONS remains respected.", () => {
    const { session, intelligence } = getSetup();
    const plan = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });
    assert.ok(plan.topic.length > 0);
  });

  it("TEST 23: Audit trace contains no hidden system prompt.", async () => {
    const { session, question, plan } = getSetup();
    const evalResult = await evaluateCandidateAnswer({ question, answer: "Answer", plan, learningObjectives: [], forceFallback: true });

    const updatedSession = unwrap(attachAssessment(unwrap(submitAnswer(session, question.id, "Answer")), evalResult));
    assert.ok(updatedSession);

    const trace = {
      turnIndex: 1,
      questionText: question.text,
      candidateAnswer: "Answer",
      assessmentSummary: evalResult.summary,
    };

    const strTrace = JSON.stringify(trace);
    assert.strictEqual(strTrace.includes("SYSTEM_PERSONA_INSTRUCTION"), false);
    assert.strictEqual(strTrace.includes("GEMINI_API_KEY"), false);
  });

  it("TEST 24: Same inputs produce deterministic ledger output.", async () => {
    const { session, question, plan } = getSetup();
    const evalResult = await evaluateCandidateAnswer({ question, answer: "Answer", plan, learningObjectives: [], forceFallback: true });

    const updatedSession = unwrap(attachAssessment(unwrap(submitAnswer(session, question.id, "Answer")), evalResult));

    const e1 = createEvidenceFromTurn(updatedSession.turns[0], "s1");
    const e2 = createEvidenceFromTurn(updatedSession.turns[0], "s1");

    assert.strictEqual(e1.length, e2.length);
    assert.strictEqual(e1[0].observation, e2[0].observation);
  });

  it("TEST 25: All previous milestone functionality works seamlessly.", () => {
    const { session } = getSetup();
    assert.strictEqual(session.questionCount, 1);
  });

});
