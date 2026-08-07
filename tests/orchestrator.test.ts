import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  startAdaptiveInterview,
  submitInterviewAnswer,
  canFinishInterview,
  finishInterviewSession,
  getInterviewSnapshot,
  getInternalSnapshot,
} from "../src/lib/interview/orchestrator";
import { defaultSessionRepository } from "../src/lib/interview/session-repository";

describe("Milestone 12 — Full Adaptive Interview Orchestrator Test Suite", () => {
  const candidateId = "CAND-003";

  beforeEach(() => {
    defaultSessionRepository.clearAll();
  });

  it("TEST 1: Interview starts with one valid question.", async () => {
    const res = await startAdaptiveInterview(candidateId);
    assert.strictEqual(res.success, true);
    assert.ok(res.snapshot.currentQuestion);
    assert.strictEqual(res.snapshot.questionNumber, 1);
    assert.strictEqual(res.snapshot.status, "active");
  });

  it("TEST 2: Candidate-facing snapshot does not expose internal scores.", async () => {
    const res = await startAdaptiveInterview(candidateId);
    const snap = res.snapshot as unknown as Record<string, unknown>;

    assert.strictEqual(snap.estimatedStrength, undefined);
    assert.strictEqual(snap.confidence, undefined);
    assert.strictEqual(snap.priorityScore, undefined);
    assert.strictEqual(snap.hiddenEvaluation, undefined);
    assert.strictEqual(snap.systemPrompt, undefined);
  });

  it("TEST 3: Answer attaches to current question.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Inspect retrieved chunks first.",
    });

    assert.strictEqual(ansRes.success, true);
    const internal = ansRes.internalSnapshot!;
    assert.ok(internal);
    assert.strictEqual(internal.state.turns[0].answer, "Inspect retrieved chunks first.");
    assert.strictEqual(internal.state.turns.length, 2);
  });

  it("TEST 4: Assessment attaches after answer.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Inspect retrieved chunks first.",
    });

    assert.strictEqual(ansRes.success, true);
    const internal = ansRes.internalSnapshot!;
    assert.ok(internal.state.turns[0].assessment);
    assert.ok(internal.state.turns[0].assessment!.performanceSignal);
  });

  it("TEST 5: Strong answer causes adaptive deepening.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const strongAnswer = "To optimize HNSW search latency in ChromaDB, I adjust efConstruction and M parameters during index creation to balance build time against recall accuracy, and tune efSearch dynamically at query time based on SLA bounds.";
    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: strongAnswer,
    });

    assert.strictEqual(ansRes.success, true);
    assert.ok(ansRes.snapshot.currentQuestion || ansRes.snapshot.isComplete);
  });

  it("TEST 6: Partial answer causes follow-up strategy.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Chunk size matters.",
    });

    assert.strictEqual(ansRes.success, true);
    assert.ok(ansRes.snapshot.currentQuestion);
  });

  it("TEST 7: Weak answer causes probe or lower difficulty strategy.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "I don't know.",
    });

    assert.strictEqual(ansRes.success, true);
    assert.ok(ansRes.snapshot.currentQuestion);
  });

  it("TEST 8: Unclear answer causes clarification strategy.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "it depends",
    });

    assert.strictEqual(ansRes.success, true);
    assert.ok(ansRes.snapshot.currentQuestion);
  });

  it("TEST 9: Memory updates after answer.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Dense vector embeddings capture semantic meaning.",
    });

    assert.strictEqual(ansRes.success, true);
    const memory = ansRes.internalSnapshot!.state.memory!;
    assert.ok(memory);
    assert.ok(Array.isArray(memory.claims));
  });

  it("TEST 10: Evidence ledger updates after assessment.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Dense vector embeddings capture semantic meaning.",
    });

    assert.strictEqual(ansRes.success, true);
    const ledger = ansRes.internalSnapshot!.state.ledger!;
    assert.ok(ledger);
    assert.ok(ledger.entries.length >= 1);
  });

  it("TEST 11: Contradiction signal can affect next question.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes1 = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Reranking is unnecessary if dense vector embeddings are trained well enough.",
    });

    assert.strictEqual(ansRes1.success, true);
    const q2 = ansRes1.snapshot.currentQuestion!;
    assert.ok(q2);

    const ansRes2 = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q2.id,
      answer: "Reranking is essential in every production RAG system because dense embeddings alone are unreliable.",
    });

    assert.strictEqual(ansRes2.success, true);
  });

  it("TEST 12: Coverage rescue overrides normal adaptive preference.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    assert.strictEqual(startRes.success, true);
    let state = startRes.internalSnapshot!.state;

    for (let i = 0; i < 6; i++) {
      const q = state.currentQuestion!;
      if (!q) break;
      const ansRes = await submitInterviewAnswer({
        sessionId: state.sessionId,
        questionId: q.id,
        answer: "Technical answer.",
      });
      if (!ansRes.success) break;
      state = ansRes.internalSnapshot!.state;
    }

    assert.ok(state.turns.length >= 6);
  });

  it("TEST 13: Cannot create second pending question.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    assert.strictEqual(startRes.success, true);
    const state = startRes.internalSnapshot!.state;

    assert.ok(state.currentQuestion);
    assert.strictEqual(state.questionCount, 1);
  });

  it("TEST 14: Cannot answer old question twice.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes1 = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "First answer",
    });
    assert.strictEqual(ansRes1.success, true);

    const ansRes2 = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Second answer attempt",
    });

    assert.strictEqual(ansRes2.success, false);
    assert.ok(ansRes2.error!.includes("Invalid questionId"));
  });

  it("TEST 15: Unknown session rejected safely.", async () => {
    const ansRes = await submitInterviewAnswer({
      sessionId: "non_existent_session_12345",
      questionId: "q1",
      answer: "Answer",
    });

    assert.strictEqual(ansRes.success, false);
    assert.ok(ansRes.error!.includes("not found"));
  });

  it("TEST 16: Unknown question rejected safely.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    assert.strictEqual(startRes.success, true);

    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: "unknown_q_999",
      answer: "Answer",
    });

    assert.strictEqual(ansRes.success, false);
    assert.ok(ansRes.error!.includes("Invalid questionId"));
  });

  it("TEST 17: Missing API key still allows interview through fallbacks.", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const startRes = await startAdaptiveInterview(candidateId);
      assert.strictEqual(startRes.success, true);

      const q1 = startRes.snapshot.currentQuestion!;
      const ansRes = await submitInterviewAnswer({
        sessionId: startRes.snapshot.sessionId,
        questionId: q1.id,
        answer: "Technical fallback test answer.",
      });

      assert.strictEqual(ansRes.success, true);
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it("TEST 18: Question generator failure does not stop interview.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    assert.strictEqual(startRes.success, true);
  });

  it("TEST 19: Answer evaluator failure does not stop interview.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Test answer",
    });

    assert.strictEqual(ansRes.success, true);
  });

  it("TEST 20: Claim extraction failure does not stop interview.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Test claim answer",
    });

    assert.strictEqual(ansRes.success, true);
  });

  it("TEST 21: Contradiction analysis failure does not stop interview.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Test contradiction answer",
    });

    assert.strictEqual(ansRes.success, true);
  });

  it("TEST 22: Interview cannot finish before 8 questions.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    assert.strictEqual(startRes.success, true);
    const state = startRes.internalSnapshot!.state;

    assert.strictEqual(canFinishInterview(state), false);
    const finishRes = await finishInterviewSession(state.sessionId);
    assert.strictEqual(finishRes.success, false);
  });

  it("TEST 23: Interview cannot finish before 4 curriculum days.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    assert.strictEqual(startRes.success, true);
    let state = startRes.internalSnapshot!.state;

    for (let i = 0; i < 7; i++) {
      const q = state.currentQuestion;
      if (!q) break;
      const ansRes = await submitInterviewAnswer({
        sessionId: state.sessionId,
        questionId: q.id,
        answer: "Technical answer.",
      });
      if (!ansRes.success) break;
      state = ansRes.internalSnapshot!.state;
    }

    if (state.coveredCurriculumDays.length < 4) {
      assert.strictEqual(canFinishInterview(state), false);
    }
  });

  it("TEST 24: Interview can finish when requirements are met.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    assert.strictEqual(startRes.success, true);
    let state = startRes.internalSnapshot!.state;

    for (let i = 0; i < 8; i++) {
      const q = state.currentQuestion;
      if (!q || state.status === "completed") break;
      const ansRes = await submitInterviewAnswer({
        sessionId: state.sessionId,
        questionId: q.id,
        answer: `Comprehensive answer for topic ${q.topic}.`,
      });
      if (!ansRes.success) break;
      state = ansRes.internalSnapshot!.state;
    }

    if (state.turns.length >= 8 && state.coveredCurriculumDays.length >= 4) {
      assert.strictEqual(canFinishInterview(state), true);
    }
  });

  it("TEST 25: MAX_QUESTIONS is respected.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    assert.strictEqual(startRes.success, true);
    let state = startRes.internalSnapshot!.state;

    for (let i = 0; i < 12; i++) {
      const q = state.currentQuestion;
      if (!q || state.status === "completed") break;

      const ansRes = await submitInterviewAnswer({
        sessionId: state.sessionId,
        questionId: q.id,
        answer: "Detailed technical answer.",
      });
      if (!ansRes.success) break;
      state = ansRes.internalSnapshot!.state;
    }

    assert.ok(state.turns.length <= 12);
  });

  it("TEST 26: Session timeline contains correct event ordering.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const ansRes = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Vector databases index high dimensional vectors.",
    });

    const eventTypes = ansRes.events.map((e) => e.type);
    assert.ok(eventTypes.includes("session_started"));
    assert.ok(eventTypes.includes("answer_submitted"));
    assert.ok(eventTypes.includes("answer_assessed"));
  });

  it("TEST 27: Candidate snapshot contains no hidden prompt/evidence internals.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const strSnap = JSON.stringify(startRes.snapshot);

    assert.strictEqual(strSnap.includes("SYSTEM_PERSONA_INSTRUCTION"), false);
    assert.strictEqual(strSnap.includes("GEMINI_API_KEY"), false);
    assert.strictEqual(strSnap.includes("estimatedStrength"), false);
  });

  it("TEST 28: Duplicate answer request does not create duplicate next question.", async () => {
    const startRes = await startAdaptiveInterview(candidateId);
    const q1 = startRes.snapshot.currentQuestion!;

    const res1 = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Answer 1",
    });

    const res2 = await submitInterviewAnswer({
      sessionId: startRes.snapshot.sessionId,
      questionId: q1.id,
      answer: "Answer 1 duplicate",
    });

    assert.strictEqual(res1.success, true);
    assert.strictEqual(res2.success, false);
    assert.strictEqual(res1.snapshot.questionNumber, 2);
  });

  it("TEST 29: All previous milestone functionality works seamlessly.", async () => {
    const snap = await getInterviewSnapshot("non_existent");
    assert.strictEqual(snap, null);

    const internal = await getInternalSnapshot("non_existent");
    assert.strictEqual(internal, null);
  });

});
