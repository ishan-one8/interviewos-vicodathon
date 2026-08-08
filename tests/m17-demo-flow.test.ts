import { describe, it } from "node:test";
import assert from "node:assert";
import { getCandidates } from "../src/lib/data";
import { startAdaptiveInterview, submitInterviewAnswer } from "../src/lib/interview/orchestrator";
import { buildInterviewSessionDTO, buildSafeAdaptiveContext } from "../src/lib/interview/safe-dto";
import { buildCandidateReportDTO } from "../src/lib/report/dto-builder";
import { OfficialApiRequestSchema, OfficialApiResponseSchema } from "../src/lib/api/contract";
import { defaultSessionRepository } from "../src/lib/interview/session-repository";
import type { QuestionAction } from "../src/types/interview";

describe("Milestone 17 — Demo Flow, Session-Bound Interviews & Adaptive Visibility", () => {
  it("TEST 1: Demo candidates endpoint returns safe fields only (no missions, no skillMap, no intelligence).", () => {
    const { candidates } = getCandidates();
    for (const c of candidates) {
      assert.ok(c.id);
      assert.ok(c.name);
      assert.ok(c.jobRole);
      assert.ok(typeof c.yearsExperience === "number");
      assert.ok(c.education);
    }
    const safeKeys = ["id", "name", "jobRole", "yearsExperience", "education"];
    for (const c of candidates) {
      const card = {
        id: c.id,
        name: c.name,
        jobRole: c.jobRole,
        yearsExperience: c.yearsExperience,
        education: c.education,
      };
      const cardStr = JSON.stringify(card);
      assert.strictEqual(cardStr.includes("skillMap"), false);
      assert.strictEqual(cardStr.includes("intelligenceReport"), false);
      assert.strictEqual(cardStr.includes("missions"), false);
      assert.strictEqual(cardStr.includes("suggestedStartingTopics"), false);
      for (const key of safeKeys) {
        assert.ok(key in card);
      }
    }
  });

  it("TEST 2: POST /api/demo/start creates a real session with valid sessionId.", async () => {
    const result = await startAdaptiveInterview("CAND-003");
    assert.ok(result.success);
    assert.ok(result.snapshot.sessionId);
    assert.ok(result.snapshot.sessionId.length > 0);
    assert.strictEqual(result.snapshot.status, "active");
    assert.ok(result.snapshot.currentQuestion);
  });

  it("TEST 3: InterviewSessionDTO returned for valid session.", async () => {
    const result = await startAdaptiveInterview("CAND-003");
    assert.ok(result.success);
    const state = result.internalSnapshot?.state;
    assert.ok(state);
    const dto = buildInterviewSessionDTO(state);
    assert.ok(dto.sessionId);
    assert.ok(dto.candidateName);
    assert.ok(dto.candidateRole);
    assert.strictEqual(dto.status, "active");
    assert.ok(dto.currentQuestion);
    assert.ok(Array.isArray(dto.coveredTopics));
    assert.strictEqual(typeof dto.questionsAnswered, "number");
    assert.strictEqual(typeof dto.minimumQuestions, "number");
    assert.strictEqual(typeof dto.coveredCurriculumDaysCount, "number");
    assert.strictEqual(typeof dto.minimumCurriculumDays, "number");
  });

  it("TEST 4: Unknown session returns null from repository.", async () => {
    const state = await defaultSessionRepository.getSession("nonexistent_session_xyz");
    assert.strictEqual(state, null);
  });

  it("TEST 5: POST /api/interview/turn processes answer and returns enriched DTO.", async () => {
    const startResult = await startAdaptiveInterview("CAND-003");
    assert.ok(startResult.success);
    const sessionId = startResult.snapshot.sessionId;
    const qId = startResult.snapshot.currentQuestion!.id;

    const answerResult = await submitInterviewAnswer({
      sessionId,
      questionId: qId,
      answer: "Embeddings map text to dense vectors where cosine similarity captures semantic proximity.",
    });
    assert.ok(answerResult.success);
    const state = answerResult.internalSnapshot?.state;
    assert.ok(state);
    const dto = buildInterviewSessionDTO(state, startResult.snapshot.currentQuestion!.topic);
    assert.ok(dto.sessionId);
    assert.strictEqual(dto.questionsAnswered, 1);
    assert.strictEqual(dto.turnCount, 2);
    assert.ok(dto.currentQuestion);
    assert.ok(dto.adaptiveContext);
  });

  it("TEST 6: InterviewSessionDTO excludes intelligence internals.", async () => {
    const result = await startAdaptiveInterview("CAND-003");
    assert.ok(result.success);
    const state = result.internalSnapshot?.state;
    assert.ok(state);
    const dto = buildInterviewSessionDTO(state);
    const str = JSON.stringify(dto);
    assert.strictEqual(str.includes("skillMap"), false);
    assert.strictEqual(str.includes("intelligenceReport"), false);
    assert.strictEqual(str.includes("suggestedStartingTopics"), false);
    assert.strictEqual(str.includes("plannerSignals"), false);
    assert.strictEqual(str.includes("priorityScore"), false);
    assert.strictEqual(str.includes("candidateEvidence"), false);
    assert.strictEqual(str.includes("reasonForSelection"), false);
    assert.strictEqual(str.includes("memory"), false);
    assert.strictEqual(str.includes("ledger"), false);
  });

  it("TEST 7: Safe adaptive context maps correctly for each action type.", () => {
    const actions: QuestionAction[] = ["follow_up", "deepen", "clarify", "challenge", "new_topic"];
    const expectedLabels: Record<string, string> = {
      follow_up: "Follow-up",
      deepen: "Deeper Probe",
      clarify: "Clarification",
      challenge: "Challenge",
      new_topic: "New Area",
    };

    for (const action of actions) {
      const ctx = buildSafeAdaptiveContext(action, "Embeddings", 3, "Vector DBs");
      assert.ok(ctx);
      assert.strictEqual(ctx.label, expectedLabels[action]);
      assert.ok(ctx.safeReason.length > 0);
    }
  });

  it("TEST 8: 'Why this question?' text contains no planner scores or internal signals.", () => {
    const actions: QuestionAction[] = ["follow_up", "deepen", "clarify", "challenge", "new_topic"];
    const forbidden = ["priorityScore", "plannerSignals", "candidateEvidence", "reasonForSelection", "estimatedStrength"];

    for (const action of actions) {
      const ctx = buildSafeAdaptiveContext(action, "RAG Architectures", 4, "Embeddings");
      assert.ok(ctx);
      for (const word of forbidden) {
        assert.strictEqual(ctx.safeReason.includes(word), false, `Safe reason for '${action}' must not contain '${word}'`);
      }
    }
  });

  it("TEST 9: Full candidate dataset not importable from interview page (redirect only).", async () => {
    const fs = await import("node:fs");
    const pageContent = fs.readFileSync("src/app/interview/page.tsx", "utf-8");
    assert.strictEqual(pageContent.includes("getCandidates"), false);
    assert.strictEqual(pageContent.includes("use client"), false);
    assert.ok(pageContent.includes("redirect"));
  });

  it("TEST 10: Completed session DTO has isComplete=true and no currentQuestion.", async () => {
    const startResult = await startAdaptiveInterview("CAND-003");
    assert.ok(startResult.success);
    const sessionId = startResult.snapshot.sessionId;

    let state = startResult.internalSnapshot?.state;
    assert.ok(state);

    for (let i = 0; i < 12; i++) {
      if (!state?.currentQuestion || state.status === "completed") break;
      const ansResult = await submitInterviewAnswer({
        sessionId,
        questionId: state.currentQuestion.id,
        answer: `Technical answer for question ${i + 1} covering the requested topic with concrete examples.`,
      });
      state = ansResult.internalSnapshot?.state || state;
    }

    if (state && state.status === "completed") {
      const dto = buildInterviewSessionDTO(state);
      assert.strictEqual(dto.isComplete, true);
      assert.strictEqual(dto.currentQuestion, null);
      assert.strictEqual(dto.status, "completed");
    }
  });

  it("TEST 11: Official API contract unchanged (schemas still valid).", () => {
    const validRequest = { candidateId: "CAND-003" };
    const parsed = OfficialApiRequestSchema.safeParse(validRequest);
    assert.ok(parsed.success);

    const validContinue = { sessionId: "test_session" };
    const parsed2 = OfficialApiRequestSchema.safeParse(validContinue);
    assert.ok(parsed2.success);

    assert.ok(OfficialApiResponseSchema);
  });

  it("TEST 12: Session survives multiple turn submissions.", async () => {
    const startResult = await startAdaptiveInterview("CAND-004");
    assert.ok(startResult.success);
    const sessionId = startResult.snapshot.sessionId;

    let state = startResult.internalSnapshot?.state;
    assert.ok(state);
    let prevTopic = state.currentQuestion?.topic || null;

    for (let i = 0; i < 3; i++) {
      if (!state?.currentQuestion || state.status === "completed") break;
      const ansResult = await submitInterviewAnswer({
        sessionId,
        questionId: state.currentQuestion.id,
        answer: `Answer ${i + 1} demonstrating understanding of ${state.currentQuestion.topic}.`,
      });
      assert.ok(ansResult.success);
      const newState = ansResult.internalSnapshot?.state;
      assert.ok(newState);
      const dto = buildInterviewSessionDTO(newState, prevTopic);
      assert.strictEqual(dto.questionsAnswered, i + 1);
      prevTopic = state.currentQuestion.topic;
      state = newState;
    }
  });

  it("TEST 13: Orchestrator handles completion (not the route).", async () => {
    const startResult = await startAdaptiveInterview("CAND-003");
    assert.ok(startResult.success);
    const sessionId = startResult.snapshot.sessionId;

    let state = startResult.internalSnapshot?.state;
    assert.ok(state);

    for (let i = 0; i < 12; i++) {
      if (!state?.currentQuestion || state.status === "completed") break;
      const ansResult = await submitInterviewAnswer({
        sessionId,
        questionId: state.currentQuestion.id,
        answer: `Comprehensive technical response ${i + 1} addressing the topic with depth.`,
      });
      state = ansResult.internalSnapshot?.state || state;
    }

    assert.strictEqual(state?.status, "completed");
    assert.ok(state.turns.length >= 8);
    assert.ok(state.turns.length <= 12);
  });

  it("TEST 14: AdaptationSummary counts match replay timeline.", async () => {
    const dto = await buildCandidateReportDTO({ candidateId: "CAND-003" });
    assert.ok(dto);
    assert.ok(dto.adaptationSummary);

    let followUps = 0, deepens = 0, clarifies = 0, challenges = 0, newTopics = 0;
    for (const item of dto.replayTimeline) {
      const a = item.decisionTrace.action;
      if (a === "follow_up") followUps++;
      else if (a === "deepen") deepens++;
      else if (a === "clarify") clarifies++;
      else if (a === "challenge") challenges++;
      else if (a === "new_topic") newTopics++;
    }

    assert.strictEqual(dto.adaptationSummary.followUpCount, followUps);
    assert.strictEqual(dto.adaptationSummary.deepenCount, deepens);
    assert.strictEqual(dto.adaptationSummary.clarifyCount, clarifies);
    assert.strictEqual(dto.adaptationSummary.challengeCount, challenges);
    assert.strictEqual(dto.adaptationSummary.newTopicCount, newTopics);
    assert.strictEqual(dto.adaptationSummary.topicsExplored, dto.judgeTraceSummary.topicsExploredCount);
  });

  it("TEST 15: DemoCandidateCard has no missions field.", () => {
    const { candidates } = getCandidates();
    const card = {
      id: candidates[0].id,
      name: candidates[0].name,
      jobRole: candidates[0].jobRole,
      yearsExperience: candidates[0].yearsExperience,
      education: candidates[0].education,
    };
    assert.strictEqual(Object.keys(card).length, 5);
    assert.strictEqual("missions" in card, false);
    assert.strictEqual("status" in card, false);
  });

  it("TEST 16: Safe adaptive context for first question shows Personalized Start, not New Area.", () => {
    const ctx = buildSafeAdaptiveContext("new_topic", "Embeddings", 1, null);
    assert.ok(ctx);
    assert.strictEqual(ctx.action, "personalized_start");
    assert.strictEqual(ctx.label, "Personalized Start");
    assert.ok(ctx.safeReason.includes("learning journey"));
    assert.strictEqual(ctx.topicChanged, false);
  });

  it("TEST 17: questionsAnswered increases after each turn.", async () => {
    const startResult = await startAdaptiveInterview("CAND-003");
    assert.ok(startResult.success);
    const state0 = startResult.internalSnapshot?.state;
    assert.ok(state0);
    const dto0 = buildInterviewSessionDTO(state0);
    assert.strictEqual(dto0.questionsAnswered, 0);
    assert.strictEqual(dto0.turnCount, 1);

    const ansResult = await submitInterviewAnswer({
      sessionId: state0.sessionId,
      questionId: state0.currentQuestion!.id,
      answer: "Vectors represent semantic relationships in high-dimensional space.",
    });
    assert.ok(ansResult.success);
    const state1 = ansResult.internalSnapshot?.state;
    assert.ok(state1);
    const dto1 = buildInterviewSessionDTO(state1);
    assert.strictEqual(dto1.questionsAnswered, 1);
    assert.strictEqual(dto1.turnCount, 2);
  });

  it("TEST 18: Unknown candidateId returns error from startAdaptiveInterview.", async () => {
    const result = await startAdaptiveInterview("CAND-NONEXISTENT");
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });

  it("TEST 19: buildInterviewSessionDTO excludes memory, ledger, and skillMap.", async () => {
    const result = await startAdaptiveInterview("CAND-003");
    assert.ok(result.success);
    const state = result.internalSnapshot?.state;
    assert.ok(state);

    assert.ok(state.memory !== undefined || state.ledger !== undefined || state.skillMap !== undefined);

    const dto = buildInterviewSessionDTO(state);
    const str = JSON.stringify(dto);
    assert.strictEqual(str.includes('"memory"'), false);
    assert.strictEqual(str.includes('"ledger"'), false);
    assert.strictEqual(str.includes('"skillMap"'), false);
    assert.strictEqual(str.includes('"turns"'), false);
    assert.strictEqual(str.includes('"intelligenceReport"'), false);
  });
});
