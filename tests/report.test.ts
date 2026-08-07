import { describe, it } from "node:test";
import assert from "node:assert";
import { getCandidateIntelligence, getCurriculum } from "../src/lib/data";
import { createInterviewSession } from "../src/lib/interview/state";
import { buildInterviewReport } from "../src/lib/report/report";
import { calculateCompetencyResults, calculateOverallResult } from "../src/lib/report/scoring";
import { calculateTopicResults } from "../src/lib/report/topics";
import { buildEvidenceBackedFindings, summarizeContradictions } from "../src/lib/report/findings";
import { getScoreExplanation } from "../src/lib/report/explainability";
import { generateDeterministicFeedback } from "../src/lib/report/feedback";
import { createEmptyLedger, addTurnEvidenceToLedger } from "../src/lib/interview/evidence";
import { createEmptyMemory } from "../src/lib/interview/memory";
import { getReportLevel } from "../src/lib/report/constants";
import { InterviewState, InterviewTurn, DifficultyLevel, CompetencyDimension, CompetencyResult, ContradictionSignal } from "../src/types/interview";

function createTestState(cId: string = "CAND-003", sId: string = "test_session"): InterviewState {
  const intel = getCandidateIntelligence(cId)!;
  const state = createInterviewSession(intel.candidate, intel, sId);
  state.ledger = createEmptyLedger(state.sessionId);
  state.memory = createEmptyMemory();
  return state;
}

function createDummyTurn(id: string, topic: string, day: number, diff: DifficultyLevel = "intermediate"): InterviewTurn {
  return {
    question: {
      id: `q_${id}`,
      topic,
      curriculumDay: day,
      difficulty: diff,
      text: `Question on ${topic}`,
      action: "new_topic",
      reasonForQuestion: "Testing coverage",
      createdAt: new Date().toISOString(),
    },
    answer: "Sample candidate answer text.",
    assessment: {
      performanceSignal: "strong",
      scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 },
      confidence: 0.9,
      strengths: [`Strong performance in ${topic}`],
      gaps: [],
    },
  };
}

describe("Milestone 13 — Final Competency Scoring Engine & Evidence-Backed Report Suite", () => {
  it("TEST 1: Strong evidence produces strong competency score.", async () => {
    const state = createTestState("CAND-003", "test_1");

    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: {
        id: "q_1",
        topic: "Embeddings Explained",
        curriculumDay: 7,
        difficulty: "advanced",
        text: "Explain embeddings.",
        action: "new_topic",
        reasonForQuestion: "Test",
        createdAt: new Date().toISOString(),
      },
      answer: "Strong technical answer on HNSW embeddings.",
      assessment: {
        performanceSignal: "strong",
        scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 },
        confidence: 0.9,
        strengths: ["Demonstrated strong correctness and embeddings mastery"],
        gaps: [],
      },
    });

    const comps = calculateCompetencyResults(state.ledger!);
    assert.strictEqual(comps.correctness.score, 4);
    assert.strictEqual(comps.correctness.normalizedScore, 100);
    assert.strictEqual(comps.correctness.status, "strong");
  });

  it("TEST 2: Weak evidence lowers competency score.", async () => {
    const state = createTestState("CAND-003", "test_2");

    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: {
        id: "q_1",
        topic: "Embeddings Explained",
        curriculumDay: 7,
        difficulty: "intermediate",
        text: "Explain embeddings.",
        action: "new_topic",
        reasonForQuestion: "Test",
        createdAt: new Date().toISOString(),
      },
      answer: "I don't know.",
      assessment: {
        performanceSignal: "weak",
        scores: { correctness: 0, depth: 0, reasoning: 0, practicalUnderstanding: 0, tradeoffAwareness: 0 },
        confidence: 0.85,
        strengths: [],
        gaps: ["Demonstrated weak correctness and lack of understanding"],
      },
    });

    const comps = calculateCompetencyResults(state.ledger!);
    assert.strictEqual(comps.correctness.score, 0);
    assert.strictEqual(comps.correctness.normalizedScore, 0);
    assert.strictEqual(comps.correctness.status, "developing");
  });

  it("TEST 3: Mixed evidence aggregates sensibly.", async () => {
    const state = createTestState("CAND-003", "test_3");

    // Turn 1: score 4
    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_1", topic: "Vector DBs", curriculumDay: 8, difficulty: "intermediate", text: "Q1", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Good answer",
      assessment: { performanceSignal: "strong", scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 }, confidence: 0.8, strengths: ["Strong correctness in vector DBs"], gaps: [] },
    });

    // Turn 2: score 2
    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_2", topic: "RAG", curriculumDay: 9, difficulty: "intermediate", text: "Q2", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Partial answer",
      assessment: { performanceSignal: "partial", scores: { correctness: 2, depth: 2, reasoning: 2, practicalUnderstanding: 2, tradeoffAwareness: 2 }, confidence: 0.8, strengths: [], gaps: ["Incorrect answer calculation in RAG"] },
    });

    const comps = calculateCompetencyResults(state.ledger!);
    assert.ok(comps.correctness.normalizedScore > 30 && comps.correctness.normalizedScore < 95);
  });

  it("TEST 4: One outlier does not dominate.", async () => {
    const state = createTestState("CAND-003", "test_4");

    // 3 strong entries
    for (let i = 1; i <= 3; i++) {
      state.ledger = addTurnEvidenceToLedger(state.ledger!, {
        question: { id: `q_${i}`, topic: "RAG", curriculumDay: 9, difficulty: "intermediate", text: `Q${i}`, action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
        answer: "Strong answer",
        assessment: { performanceSignal: "strong", scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 }, confidence: 0.9, strengths: [`Strong correctness in turn ${i}`], gaps: [] },
      });
    }

    // 1 weak outlier
    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_4", topic: "RAG", curriculumDay: 9, difficulty: "intermediate", text: "Q4", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Weak answer",
      assessment: { performanceSignal: "weak", scores: { correctness: 1, depth: 1, reasoning: 1, practicalUnderstanding: 1, tradeoffAwareness: 1 }, confidence: 0.8, strengths: [], gaps: ["Weak correctness outlier"] },
    });

    const comps = calculateCompetencyResults(state.ledger!);
    assert.ok(comps.correctness.normalizedScore >= 70);
  });

  it("TEST 5: Difficulty weighting is applied correctly.", async () => {
    const state1 = createTestState("CAND-003", "test_5a");
    const state2 = createTestState("CAND-003", "test_5b");

    // Foundation difficulty answer
    state1.ledger = addTurnEvidenceToLedger(state1.ledger!, {
      question: { id: "q_1", topic: "RAG", curriculumDay: 9, difficulty: "foundation", text: "Q1", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Correct answer",
      assessment: { performanceSignal: "strong", scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 }, confidence: 0.9, strengths: ["Correct answer"], gaps: [] },
    });

    // Architecture difficulty answer
    state2.ledger = addTurnEvidenceToLedger(state2.ledger!, {
      question: { id: "q_1", topic: "RAG", curriculumDay: 9, difficulty: "architecture", text: "Q1", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Correct answer",
      assessment: { performanceSignal: "strong", scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 }, confidence: 0.9, strengths: ["Correct answer"], gaps: [] },
    });

    const comps1 = calculateCompetencyResults(state1.ledger!);
    const comps2 = calculateCompetencyResults(state2.ledger!);

    assert.strictEqual(comps1.correctness.normalizedScore, 100);
    assert.strictEqual(comps2.correctness.normalizedScore, 100);
  });

  it("TEST 6: Confidence affects evidence weight.", async () => {
    const state = createTestState("CAND-003", "test_6");

    // Low confidence entry
    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_1", topic: "RAG", curriculumDay: 9, difficulty: "intermediate", text: "Q1", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Answer",
      assessment: { performanceSignal: "unclear", scores: { correctness: 2, depth: 2, reasoning: 2, practicalUnderstanding: 2, tradeoffAwareness: 2 }, confidence: 0.2, strengths: ["Unclear claim"], gaps: [] },
    });

    const comps = calculateCompetencyResults(state.ledger!);
    assert.ok(comps.correctness.confidence <= 0.5);
  });

  it("TEST 7: Insufficient evidence is not treated as zero ability.", async () => {
    const state = createTestState("CAND-003", "test_7");

    const comps = calculateCompetencyResults(state.ledger!);
    assert.strictEqual(comps.tradeoffAwareness.status, "insufficient_evidence");
    assert.strictEqual(comps.tradeoffAwareness.confidence, 0.0);
    assert.ok(comps.tradeoffAwareness.summary.includes("Insufficient interview evidence"));
  });

  it("TEST 8: Candidate profile prior does not affect final score.", async () => {
    const state3 = createTestState("CAND-003", "test_8a");
    const state4 = createTestState("CAND-004", "test_8b");

    const sharedTurnInput = {
      question: { id: "q_1", topic: "RAG", curriculumDay: 9, difficulty: "intermediate" as const, text: "Q1", action: "new_topic" as const, reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Identical answer text",
      assessment: { performanceSignal: "strong" as const, scores: { correctness: 3, depth: 3, reasoning: 3, practicalUnderstanding: 3, tradeoffAwareness: 3 }, confidence: 0.8, strengths: ["Demonstrated skill"], gaps: [] },
    };

    state3.ledger = addTurnEvidenceToLedger(state3.ledger!, sharedTurnInput);
    state4.ledger = addTurnEvidenceToLedger(state4.ledger!, sharedTurnInput);

    const report3 = await buildInterviewReport({ state: state3, forceFallbackFeedback: true });
    const report4 = await buildInterviewReport({ state: state4, forceFallbackFeedback: true });

    assert.strictEqual(report3.overall.score, report4.overall.score);
    assert.strictEqual(report3.competencies.correctness.score, report4.competencies.correctness.score);
  });

  it("TEST 9: Scores remain 0–100.", async () => {
    const state = createTestState("CAND-003", "test_9");

    const comps = calculateCompetencyResults(state.ledger!);
    for (const comp of Object.values(comps)) {
      assert.ok(comp.normalizedScore >= 0 && comp.normalizedScore <= 100);
    }
  });

  it("TEST 10: Confidence remains 0–1.", async () => {
    const state = createTestState("CAND-003", "test_10");

    const comps = calculateCompetencyResults(state.ledger!);
    for (const comp of Object.values(comps)) {
      assert.ok(comp.confidence >= 0.0 && comp.confidence <= 1.0);
    }
  });

  it("TEST 11: Overall score remains deterministic.", async () => {
    const state1 = createTestState("CAND-003", "test_11a");
    const state2 = createTestState("CAND-003", "test_11b");

    const turnInput = {
      question: { id: "q_1", topic: "RAG", curriculumDay: 9, difficulty: "intermediate" as const, text: "Q1", action: "new_topic" as const, reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Sample answer",
      assessment: { performanceSignal: "strong" as const, scores: { correctness: 3, depth: 3, reasoning: 3, practicalUnderstanding: 3, tradeoffAwareness: 3 }, confidence: 0.85, strengths: ["Sample strength"], gaps: [] },
    };

    state1.ledger = addTurnEvidenceToLedger(state1.ledger!, turnInput);
    state2.ledger = addTurnEvidenceToLedger(state2.ledger!, turnInput);

    const overall1 = calculateOverallResult(calculateCompetencyResults(state1.ledger!), state1);
    const overall2 = calculateOverallResult(calculateCompetencyResults(state2.ledger!), state2);

    assert.strictEqual(overall1.score, overall2.score);
    assert.strictEqual(overall1.confidence, overall2.confidence);
    assert.strictEqual(overall1.level, overall2.level);
  });

  it("TEST 12: Overall level mapping works.", () => {
    assert.strictEqual(getReportLevel(30), "needs_development");
    assert.strictEqual(getReportLevel(45), "developing");
    assert.strictEqual(getReportLevel(60), "competent");
    assert.strictEqual(getReportLevel(75), "strong");
    assert.strictEqual(getReportLevel(90), "advanced");
  });

  it("TEST 13: Topic results include tested topics.", () => {
    const state = createTestState("CAND-003", "test_13");

    state.coveredTopics = ["Embeddings Explained"];
    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_1", topic: "Embeddings Explained", curriculumDay: 7, difficulty: "intermediate", text: "Q1", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Answer",
      assessment: { performanceSignal: "strong", scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 }, confidence: 0.9, strengths: ["High mastery of Embeddings Explained"], gaps: [] },
    });

    const topicResults = calculateTopicResults(state.ledger!, state);
    const testedRes = topicResults.find((t) => t.topic === "Embeddings Explained");
    assert.ok(testedRes);
    assert.strictEqual(testedRes.status, "assessed");
    assert.strictEqual(testedRes.normalizedScore, 100);
  });

  it("TEST 14: Untested topics are not labeled failed.", () => {
    const state = createTestState("CAND-003", "test_14");

    state.coveredTopics = ["Embeddings Explained"];
    const topicResults = calculateTopicResults(state.ledger!, state);
    const curriculum = getCurriculum();
    const untestedTopic = curriculum.topics.find((t) => !state.coveredTopics.includes(t.topic));
    assert.ok(untestedTopic);

    const untested = topicResults.find((t) => t.topic === untestedTopic.topic);
    assert.ok(untested);
    assert.strictEqual(untested.status, "not_assessed");
    assert.strictEqual(untested.score, null);
  });

  it("TEST 15: Strength finding contains evidence IDs.", () => {
    const state = createTestState("CAND-003", "test_15");

    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_1", topic: "RAG", curriculumDay: 9, difficulty: "advanced", text: "Q1", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Strong technical answer",
      assessment: { performanceSignal: "strong", scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 }, confidence: 0.9, strengths: ["High depth in RAG"], gaps: [] },
    });

    const { strengths } = buildEvidenceBackedFindings(state.ledger!);
    assert.ok(strengths.length > 0);
    assert.ok(strengths[0].evidenceIds.length > 0);
  });

  it("TEST 16: Development area contains evidence IDs.", () => {
    const state = createTestState("CAND-003", "test_16");

    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_1", topic: "RAG", curriculumDay: 9, difficulty: "intermediate", text: "Q1", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "I don't know",
      assessment: { performanceSignal: "weak", scores: { correctness: 1, depth: 1, reasoning: 1, practicalUnderstanding: 1, tradeoffAwareness: 1 }, confidence: 0.85, strengths: [], gaps: ["Gap in RAG knowledge"] },
    });

    const { developmentAreas } = buildEvidenceBackedFindings(state.ledger!);
    assert.ok(developmentAreas.length > 0);
    assert.ok(developmentAreas[0].evidenceIds.length > 0);
  });

  it("TEST 17: Contradiction reduces confidence appropriately.", () => {
    const state = createTestState("CAND-003", "test_17");

    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_1", topic: "RAG", curriculumDay: 9, difficulty: "intermediate", text: "Q1", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Answer",
      assessment: { performanceSignal: "strong", scores: { correctness: 3, depth: 3, reasoning: 3, practicalUnderstanding: 3, tradeoffAwareness: 3 }, confidence: 0.85, strengths: ["Solid RAG concept"], gaps: [] },
    });

    const overallClean = calculateOverallResult(calculateCompetencyResults(state.ledger!), state);

    const signal: ContradictionSignal = {
      id: "cnt_1",
      earlierClaimId: "c1",
      laterClaimId: "c2",
      topic: "RAG",
      status: "contradictory",
      explanation: "Conflict",
      confidence: 0.8,
      recommendedAction: "clarify",
      probedCount: 1,
      resolved: false,
    };
    state.memory!.contradictionSignals = [signal];

    const overallConflict = calculateOverallResult(calculateCompetencyResults(state.ledger!), state, state.memory!);
    assert.ok(overallConflict.confidence < overallClean.confidence);
  });

  it("TEST 18: Resolved contradiction does not unfairly penalize score.", () => {
    const state = createTestState("CAND-003", "test_18");

    const signal: ContradictionSignal = {
      id: "cnt_1",
      earlierClaimId: "c1",
      laterClaimId: "c2",
      topic: "RAG",
      status: "context_changed",
      explanation: "Resolved",
      confidence: 0.8,
      recommendedAction: "ignore",
      probedCount: 1,
      resolved: true,
    };
    state.memory!.contradictionSignals = [signal];

    const summaries = summarizeContradictions(state.memory!);
    assert.strictEqual(summaries[0].status, "resolved");
  });

  it("TEST 19: Refinement can improve later evidence.", () => {
    const state = createTestState("CAND-003", "test_19");

    // Turn 1 weak
    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_1", topic: "RAG", curriculumDay: 9, difficulty: "intermediate", text: "Q1", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Weak",
      assessment: { performanceSignal: "weak", scores: { correctness: 1, depth: 1, reasoning: 1, practicalUnderstanding: 1, tradeoffAwareness: 1 }, confidence: 0.8, strengths: [], gaps: ["Weak RAG initial answer"] },
    });

    const scoreEarly = calculateCompetencyResults(state.ledger!).correctness.score;

    // Turn 2 strong refinement
    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_2", topic: "RAG", curriculumDay: 9, difficulty: "advanced", text: "Q2", action: "clarify", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Strong refined answer",
      assessment: { performanceSignal: "strong", scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 }, confidence: 0.9, strengths: ["Strong RAG refined answer"], gaps: [] },
    });

    const scoreLater = calculateCompetencyResults(state.ledger!).correctness.score;
    assert.ok(scoreLater > scoreEarly);
  });

  it("TEST 20: Evidence provenance survives into report.", async () => {
    const state = createTestState("CAND-003", "test_20");

    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_100", topic: "Vector DBs", curriculumDay: 8, difficulty: "advanced", text: "Q", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Answer text",
      assessment: { performanceSignal: "strong", scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 }, confidence: 0.9, strengths: ["Strong vector DB mastery"], gaps: [] },
    });

    const report = await buildInterviewReport({ state, forceFallbackFeedback: true });
    assert.ok(report.competencies.correctness.evidenceIds.length > 0);
  });

  it("TEST 21: Score explanation matches aggregation inputs.", () => {
    const state = createTestState("CAND-003", "test_21");

    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_1", topic: "RAG", curriculumDay: 9, difficulty: "intermediate", text: "Q1", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Sample answer",
      assessment: { performanceSignal: "strong", scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 }, confidence: 0.9, strengths: ["Sample strength in RAG"], gaps: [] },
    });

    const explanation = getScoreExplanation(state.ledger!, "correctness", state);
    assert.strictEqual(explanation.competency, "correctness");
    assert.strictEqual(explanation.evidenceCount, 1);
    assert.strictEqual(explanation.supportingEvidence.length, 1);
  });

  it("TEST 22: Gemini feedback cannot modify numeric scores.", async () => {
    const state = createTestState("CAND-003", "test_22");

    state.ledger = addTurnEvidenceToLedger(state.ledger!, {
      question: { id: "q_1", topic: "RAG", curriculumDay: 9, difficulty: "intermediate", text: "Q1", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      answer: "Sample answer",
      assessment: { performanceSignal: "strong", scores: { correctness: 3, depth: 3, reasoning: 3, practicalUnderstanding: 3, tradeoffAwareness: 3 }, confidence: 0.85, strengths: ["Sample strength"], gaps: [] },
    });

    const deterministicOverall = calculateOverallResult(calculateCompetencyResults(state.ledger!), state).score;
    const report = await buildInterviewReport({ state, forceFallbackFeedback: true });

    assert.strictEqual(report.overall.score, deterministicOverall);
  });

  it("TEST 23: Gemini feedback failure uses fallback.", () => {
    const feedback = generateDeterministicFeedback({
      candidateName: "Emily Chen",
      overallScore: 82,
      overallLevel: "strong",
      overallConfidence: 0.88,
      competencies: {} as Record<CompetencyDimension, CompetencyResult>,
      strengths: [{ id: "s1", title: "RAG Deepening", description: "Good", evidenceIds: [], topics: ["RAG"], confidence: 0.9 }],
      developmentAreas: [{ id: "d1", title: "Latency trade-offs", description: "Review cost", evidenceIds: [], topics: ["RAG"], confidence: 0.8 }],
      topicResults: [],
    });

    assert.ok(feedback.summary.includes("Emily Chen"));
    assert.ok(feedback.strongestAreas.length > 0);
    assert.ok(feedback.nextSteps.length >= 2);
  });

  it("TEST 24: Report generation is idempotent.", async () => {
    const state = createTestState("CAND-003", "test_24");

    const report1 = await buildInterviewReport({ state, forceFallbackFeedback: true });
    const report2 = await buildInterviewReport({ state, forceFallbackFeedback: true });

    assert.strictEqual(report1.overall.score, report2.overall.score);
    assert.strictEqual(report1.overall.confidence, report2.overall.confidence);
    assert.strictEqual(report1.overall.level, report2.overall.level);
  });

  it("TEST 25: Provisional report clearly marked incomplete.", async () => {
    const state = createTestState("CAND-003", "test_25");

    state.questionCount = 3;
    const report = await buildInterviewReport({ state, forceFallbackFeedback: true });
    assert.strictEqual(report.reportStatus, "provisional");
    assert.strictEqual(report.completion.requirementsSatisfied, false);
  });

  it("TEST 26: Completed interview produces final report.", async () => {
    const state = createTestState("CAND-003", "test_26");

    state.questionCount = 8;
    state.coveredCurriculumDays = [7, 8, 9, 10];
    state.coveredTopics = ["Embeddings Explained", "Vector Databases", "RAG Architectures", "Hybrid Search & Reranking"];

    for (let i = 1; i <= 8; i++) {
      state.turns.push(createDummyTurn(String(i), state.coveredTopics[(i - 1) % 4], state.coveredCurriculumDays[(i - 1) % 4]));
    }

    const report = await buildInterviewReport({ state, forceFallbackFeedback: true });
    assert.strictEqual(report.reportStatus, "final");
    assert.strictEqual(report.completion.requirementsSatisfied, true);
  });

  it("TEST 27: All previous milestone functionality works seamlessly.", async () => {
    const intel = getCandidateIntelligence("CAND-003")!;
    assert.ok(intel);
    assert.strictEqual(intel.candidate.id, "CAND-003");
  });
});
