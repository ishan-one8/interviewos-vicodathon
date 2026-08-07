import { describe, it } from "node:test";
import assert from "node:assert";
import { getCandidateIntelligence } from "../src/lib/data";
import { createInterviewSession } from "../src/lib/interview/state";
import {
  addQuestion,
  submitAnswer,
  completeInterview,
} from "../src/lib/interview/transitions";
import {
  getCompletionStatus,
  canCompleteInterview,
  getLastTurn,
  getAskedQuestionIds,
  getCoveredCurriculumDays,
  getFollowUpCount,
} from "../src/lib/interview/selectors";
import { MAX_QUESTIONS, LIFECYCLE_STATUS } from "../src/lib/interview/constants";
import { Result } from "../src/lib/interview/errors";
import { InterviewQuestion } from "../src/types/interview";

describe("Milestone 6 — Interview State Machine & Guardrails Test Suite", () => {

  function unwrap<T>(res: Result<T>): T {
    if (!res.ok) {
      throw new Error(`Unexpected result error [${res.error.code}]: ${res.error.message}`);
    }
    return res.value;
  }

  function getBaseSession() {
    const intelligence = getCandidateIntelligence("CAND-003");
    assert.ok(intelligence, "CAND-003 intelligence must exist");
    return createInterviewSession(intelligence.candidate, intelligence, "test_session_id");
  }

  function makeQuestion(id: string, day: number, title: string, text?: string, action: InterviewQuestion["action"] = "new_topic", basedOn?: string): InterviewQuestion {
    return {
      id,
      text: text || `Question text for ${title} on Day ${day} (id: ${id})`,
      curriculumDay: day,
      topic: title,
      difficulty: "intermediate",
      action,
      reasonForQuestion: "Test question",
      basedOnQuestionId: basedOn,
      createdAt: new Date().toISOString(),
    };
  }

  it("TEST 1: Session initializes correctly.", () => {
    const state = getBaseSession();
    assert.strictEqual(state.sessionId, "test_session_id");
    assert.strictEqual(state.status, LIFECYCLE_STATUS.ACTIVE);
    assert.strictEqual(state.questionCount, 0);
    assert.strictEqual(state.turns.length, 0);
    assert.strictEqual(state.coveredCurriculumDays.length, 0);
    assert.strictEqual(state.coveredTopics.length, 0);
    assert.strictEqual(state.followUpCount, 0);
    assert.strictEqual(state.completedAt, null);
    assert.strictEqual(state.failureReason, null);
  });

  it("TEST 2: Question count increases correctly.", () => {
    let state = getBaseSession();
    state = unwrap(addQuestion(state, makeQuestion("q1", 7, "Embeddings")));

    assert.strictEqual(state.questionCount, 1);
    assert.strictEqual(state.turns.length, 1);
    assert.strictEqual(getAskedQuestionIds(state)[0], "q1");

    state = unwrap(addQuestion(state, makeQuestion("q2", 8, "Vector DB")));

    assert.strictEqual(state.questionCount, 2);
    assert.strictEqual(state.turns.length, 2);
  });

  it("TEST 3: Repeated curriculum days count once.", () => {
    let state = getBaseSession();
    state = unwrap(addQuestion(state, makeQuestion("q1", 7, "Embeddings Topic A")));
    state = unwrap(addQuestion(state, makeQuestion("q2", 7, "Embeddings Topic B")));
    state = unwrap(addQuestion(state, makeQuestion("q3", 7, "Embeddings Topic C")));

    assert.strictEqual(state.questionCount, 3);
    assert.deepStrictEqual(state.coveredCurriculumDays, [7]);
    assert.strictEqual(getCoveredCurriculumDays(state).length, 1);
  });

  it("TEST 4: 7 questions cannot complete.", () => {
    let state = getBaseSession();
    const days = [1, 2, 3, 4, 5, 6, 7];
    for (let i = 0; i < 7; i++) {
      state = unwrap(addQuestion(state, makeQuestion(`q${i + 1}`, days[i], `Topic ${days[i]}`)));
    }
    assert.strictEqual(state.questionCount, 7);

    const status = getCompletionStatus(state);
    assert.strictEqual(status.eligible, false);
    assert.strictEqual(canCompleteInterview(state), false);
    assert.ok(status.reasons.some((r) => r.includes("Minimum question requirement")));

    const compRes = completeInterview(state);
    assert.strictEqual(compRes.ok, false);
    if (!compRes.ok) {
      assert.strictEqual(compRes.error.code, "COMPLETION_INELIGIBLE");
    }
  });

  it("TEST 5: 8 questions across only 3 unique days cannot complete.", () => {
    let state = getBaseSession();
    const questionDays = [7, 7, 7, 8, 8, 8, 9, 9];
    for (let i = 0; i < 8; i++) {
      state = unwrap(addQuestion(state, makeQuestion(`q${i + 1}`, questionDays[i], `Topic Day ${questionDays[i]} (${i})`)));
    }

    assert.strictEqual(state.questionCount, 8);
    assert.strictEqual(state.coveredCurriculumDays.length, 3);

    const status = getCompletionStatus(state);
    assert.strictEqual(status.eligible, false);
    assert.ok(status.reasons.some((r) => r.includes("Minimum curriculum coverage not satisfied")));

    const compRes = completeInterview(state);
    assert.strictEqual(compRes.ok, false);
    if (!compRes.ok) {
      assert.strictEqual(compRes.error.code, "COMPLETION_INELIGIBLE");
    }
  });

  it("TEST 6: 8 questions across 4 unique days can become completion-eligible.", () => {
    let state = getBaseSession();
    const days = [7, 8, 10, 12, 13, 21, 22, 23];
    for (let i = 0; i < 8; i++) {
      state = unwrap(addQuestion(state, makeQuestion(`q${i + 1}`, days[i], `Topic ${days[i]}`)));
    }

    assert.strictEqual(state.questionCount, 8);
    assert.strictEqual(state.coveredCurriculumDays.length, 8);

    const status = getCompletionStatus(state);
    assert.strictEqual(status.eligible, true);
    assert.strictEqual(canCompleteInterview(state), true);

    const compRes = completeInterview(state);
    assert.strictEqual(compRes.ok, true);
    if (compRes.ok) {
      assert.strictEqual(compRes.value.status, LIFECYCLE_STATUS.COMPLETED);
      assert.notStrictEqual(compRes.value.completedAt, null);
    }
  });

  it("TEST 7: Duplicate question ID rejected.", () => {
    let state = getBaseSession();
    state = unwrap(addQuestion(state, makeQuestion("q1", 7, "Embeddings")));

    const dupRes = addQuestion(state, makeQuestion("q1", 8, "Vector DB"));
    assert.strictEqual(dupRes.ok, false);
    if (!dupRes.ok) {
      assert.strictEqual(dupRes.error.code, "DUPLICATE_QUESTION_ID");
    }
  });

  it("TEST 8: Duplicate answer submission rejected.", () => {
    let state = getBaseSession();
    state = unwrap(addQuestion(state, makeQuestion("q1", 7, "Embeddings")));

    state = unwrap(submitAnswer(state, "q1", "First valid answer text."));

    const ans2Res = submitAnswer(state, "q1", "Second attempt to answer same question.");
    assert.strictEqual(ans2Res.ok, false);
    if (!ans2Res.ok) {
      assert.strictEqual(ans2Res.error.code, "QUESTION_ALREADY_ANSWERED");
    }
  });

  it("TEST 9: Unknown question answer rejected.", () => {
    let state = getBaseSession();
    state = unwrap(addQuestion(state, makeQuestion("q1", 7, "Embeddings")));

    const ansRes = submitAnswer(state, "unknown_question_id", "Answering ghost question.");
    assert.strictEqual(ansRes.ok, false);
    if (!ansRes.ok) {
      assert.strictEqual(ansRes.error.code, "QUESTION_NOT_FOUND");
    }
  });

  it("TEST 10: Question cannot be added after completion.", () => {
    let state = getBaseSession();
    const days = [7, 8, 10, 12, 13, 21, 22, 23];
    for (let i = 0; i < 8; i++) {
      state = unwrap(addQuestion(state, makeQuestion(`q${i + 1}`, days[i], `Topic ${days[i]}`)));
    }
    state = unwrap(completeInterview(state));
    assert.strictEqual(state.status, LIFECYCLE_STATUS.COMPLETED);

    const postCompRes = addQuestion(state, makeQuestion("q9", 24, "Agentic Integration"));
    assert.strictEqual(postCompRes.ok, false);
    if (!postCompRes.ok) {
      assert.strictEqual(postCompRes.error.code, "INTERVIEW_ALREADY_CLOSED");
    }
  });

  it("TEST 11: Completion cannot be called twice incorrectly.", () => {
    let state = getBaseSession();
    const days = [7, 8, 10, 12, 13, 21, 22, 23];
    for (let i = 0; i < 8; i++) {
      state = unwrap(addQuestion(state, makeQuestion(`q${i + 1}`, days[i], `Topic ${days[i]}`)));
    }
    state = unwrap(completeInterview(state));

    const secondCompRes = completeInterview(state);
    assert.strictEqual(secondCompRes.ok, false);
    if (!secondCompRes.ok) {
      assert.strictEqual(secondCompRes.error.code, "INTERVIEW_ALREADY_CLOSED");
    }
  });

  it("TEST 12: Follow-up maintains basedOnQuestionId.", () => {
    let state = getBaseSession();
    state = unwrap(addQuestion(state, makeQuestion("q1", 7, "Embeddings")));

    const followUpQ = makeQuestion("q1-followup", 7, "Embeddings Deep Dive", "Can you elaborate on Cosine Similarity?", "follow_up", "q1");
    state = unwrap(addQuestion(state, followUpQ));

    assert.strictEqual(state.questionCount, 2);
    assert.strictEqual(state.followUpCount, 1);
    assert.strictEqual(getFollowUpCount(state), 1);

    const lastTurn = getLastTurn(state);
    assert.notStrictEqual(lastTurn, null);
    assert.strictEqual(lastTurn?.question.basedOnQuestionId, "q1");
  });

  it("TEST 13: MAX_QUESTIONS is respected.", () => {
    let state = getBaseSession();
    const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    for (let i = 0; i < MAX_QUESTIONS; i++) {
      state = unwrap(addQuestion(state, makeQuestion(`q${i + 1}`, days[i], `Topic ${days[i]}`)));
    }
    assert.strictEqual(state.questionCount, 12);

    const overRes = addQuestion(state, makeQuestion("q13", 13, "Exceeding max"));
    assert.strictEqual(overRes.ok, false);
    if (!overRes.ok) {
      assert.strictEqual(overRes.error.code, "MAX_QUESTIONS_EXCEEDED");
    }
  });

  it("TEST 14: Same transition sequence produces equivalent logical state except IDs/timestamps.", () => {
    const intelligence = getCandidateIntelligence("CAND-003")!;
    const stateA = createInterviewSession(intelligence.candidate, intelligence, "fixed_session_id");
    const stateB = createInterviewSession(intelligence.candidate, intelligence, "fixed_session_id");

    const days = [7, 8, 10, 12];
    let runA = stateA;
    let runB = stateB;

    for (let i = 0; i < days.length; i++) {
      const q = { ...makeQuestion(`q${i + 1}`, days[i], `Topic ${days[i]}`), createdAt: "2026-08-08T00:00:00.000Z" };
      runA = unwrap(addQuestion(runA, q));
      runB = unwrap(addQuestion(runB, q));
    }

    assert.strictEqual(runA.questionCount, runB.questionCount);
    assert.deepStrictEqual(runA.coveredCurriculumDays, runB.coveredCurriculumDays);
    assert.deepStrictEqual(runA.coveredTopics, runB.coveredTopics);
    assert.strictEqual(runA.currentDifficulty, runB.currentDifficulty);
    assert.strictEqual(runA.status, runB.status);
  });

});
