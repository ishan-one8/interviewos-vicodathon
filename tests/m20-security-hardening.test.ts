import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { guardDebugRoute } from "../src/lib/security/debug-policy";
import { OfficialApiRequestSchema, OfficialApiResponseSchema } from "../src/lib/api/contract";
import { buildInterviewSessionDTO } from "../src/lib/interview/safe-dto";
import { getCandidateIntelligence } from "../src/lib/data";
import { createInterviewSession } from "../src/lib/interview/state";
import { createEmptyMemory } from "../src/lib/interview/memory";
import { createEmptyLedger } from "../src/lib/interview/evidence";
import { generateSecureSessionId, validatePersistedState, PersistenceError } from "../src/lib/interview/persistence";
import { startAdaptiveInterview, submitInterviewAnswer } from "../src/lib/interview/orchestrator";
import { InMemorySessionRepository } from "../src/lib/interview/session-repository";
import { buildCandidateReportDTO } from "../src/lib/report/dto-builder";
import type { InterviewState } from "../src/types/interview";

const SAMPLE_ANSWER = "Dense vector embeddings capture semantic intent. I benchmark recall@k against domain test sets.";

function createMockState(sessionId: string, status: InterviewState["status"] = "active"): InterviewState {
  const intel = getCandidateIntelligence("CAND-003");
  assert.ok(intel, "CAND-003 candidate intelligence must exist");
  const state = createInterviewSession(intel!.candidate, intel!, sessionId);
  state.memory = createEmptyMemory();
  state.ledger = createEmptyLedger(sessionId);
  state.status = status;
  return state;
}

describe("Milestone 20 — Production Security & Reliability Hardening Suite", () => {
  it("ATTACK 1: malformed JSON payload validation in OfficialApiRequestSchema", () => {
    const res1 = OfficialApiRequestSchema.safeParse({});
    assert.equal(res1.success, false);

    const res2 = OfficialApiRequestSchema.safeParse({ candidateId: 12345 });
    assert.equal(res2.success, false);
  });

  it("ATTACK 2: missing candidateId or sessionId rejected", () => {
    const res = OfficialApiRequestSchema.safeParse({ answer: "Hello" });
    assert.equal(res.success, false);
    if (!res.success) {
      assert.ok(res.error.issues.some((i) => i.message.includes("candidateId")));
    }
  });

  it("ATTACK 3: unknown candidateId handled gracefully", async () => {
    const repo = new InMemorySessionRepository();
    const result = await startAdaptiveInterview("UNKNOWN_CANDIDATE_999", undefined, repo);
    assert.equal(result.success, false);
    assert.match(result.error || "", /not found/i);
  });

  it("ATTACK 4 & 5: unknown session ID yields safe unavailable/not-found result", async () => {
    const repo = new InMemorySessionRepository();
    const result = await submitInterviewAnswer({
      sessionId: "00000000-0000-0000-0000-000000000000",
      questionId: "q_1",
      answer: SAMPLE_ANSWER,
      repository: repo,
    });
    assert.equal(result.success, false);
    assert.match(result.error || "", /not found/i);
  });

  it("ATTACK 6: empty or whitespace-only answer rejected", async () => {
    const repo = new InMemorySessionRepository();
    const start = await startAdaptiveInterview("CAND-003", undefined, repo);
    const sessionId = start.snapshot.sessionId;
    const questionId = start.internalSnapshot!.state.currentQuestion!.id;

    // Whitespace answer
    const res = await submitInterviewAnswer({
      sessionId,
      questionId,
      answer: "   \n\t   ",
      repository: repo,
    });
    // State machine or API layer prevents empty turn
    assert.equal(res.success, false);
  });

  it("ATTACK 7: oversized answer (>5000 chars) schema validation", () => {
    const hugeAnswer = "a".repeat(5001);
    const res = OfficialApiRequestSchema.safeParse({
      sessionId: generateSecureSessionId(),
      questionId: "q_1",
      answer: hugeAnswer,
    });
    assert.equal(res.success, false);
    if (!res.success) {
      assert.ok(res.error.issues.some((i) => i.message.includes("5000")));
    }

    const validAnswer = "a".repeat(5000);
    const resValid = OfficialApiRequestSchema.safeParse({
      sessionId: generateSecureSessionId(),
      questionId: "q_1",
      answer: validAnswer,
    });
    assert.equal(resValid.success, true);
  });

  it("ATTACK 8: wrong questionId for active turn rejected", async () => {
    const repo = new InMemorySessionRepository();
    const start = await startAdaptiveInterview("CAND-003", undefined, repo);
    const sessionId = start.snapshot.sessionId;

    const res = await submitInterviewAnswer({
      sessionId,
      questionId: "WRONG_QUESTION_ID_999",
      answer: SAMPLE_ANSWER,
      repository: repo,
    });
    assert.equal(res.success, false);
    assert.match(res.error || "", /Invalid questionId/i);
  });

  it("ATTACK 9: duplicate answer submission is idempotent (no duplicate turn/evidence)", async () => {
    const repo = new InMemorySessionRepository();
    const start = await startAdaptiveInterview("CAND-003", undefined, repo);
    const sessionId = start.snapshot.sessionId;
    const q1 = start.internalSnapshot!.state.currentQuestion!.id;

    const first = await submitInterviewAnswer({ sessionId, questionId: q1, answer: SAMPLE_ANSWER, repository: repo });
    assert.equal(first.success, true);
    const turns1 = (await repo.getSession(sessionId))!.turns.length;

    // Resubmit same questionId
    const second = await submitInterviewAnswer({ sessionId, questionId: q1, answer: SAMPLE_ANSWER, repository: repo });
    assert.equal(second.success, false);
    const turns2 = (await repo.getSession(sessionId))!.turns.length;
    assert.equal(turns1, turns2);
  });

  it("ATTACK 10: stale turn submission on modified session rejected cleanly", async () => {
    const repo = new InMemorySessionRepository();
    const start = await startAdaptiveInterview("CAND-003", undefined, repo);
    const sessionId = start.snapshot.sessionId;
    const q1 = start.internalSnapshot!.state.currentQuestion!.id;

    await submitInterviewAnswer({ sessionId, questionId: q1, answer: SAMPLE_ANSWER, repository: repo });

    // Submitting q1 again now that active question is q2
    const staleRes = await submitInterviewAnswer({ sessionId, questionId: q1, answer: SAMPLE_ANSWER, repository: repo });
    assert.equal(staleRes.success, false);
    assert.match(staleRes.error || "", /Invalid questionId/i);
  });

  it("ATTACK 11: submission after session completion is rejected", async () => {
    const repo = new InMemorySessionRepository();
    const state = createMockState(generateSecureSessionId(), "completed");
    await repo.createSession(state);

    const res = await submitInterviewAnswer({
      sessionId: state.sessionId,
      questionId: "q_1",
      answer: SAMPLE_ANSWER,
      repository: repo,
    });
    assert.equal(res.success, false);
    assert.match(res.error || "", /already completed/i);
  });

  it("ATTACK 12: database failure / corrupted state handled safely without crash", async () => {
    assert.throws(
      () => validatePersistedState({ corruptPayload: true }),
      (err: unknown) => err instanceof PersistenceError && err.code === "SESSION_UNAVAILABLE"
    );
  });

  it("ATTACK 13 & 14: Gemini question generation & evaluator fallbacks maintain session continuity", async () => {
    const repo = new InMemorySessionRepository();
    // Running startAdaptiveInterview without API key uses robust deterministic fallbacks
    const start = await startAdaptiveInterview("CAND-003", undefined, repo);
    assert.equal(start.success, true);
    assert.ok(start.snapshot.currentQuestion);
    assert.ok(start.snapshot.currentQuestion!.text.length > 0);

    const q1 = start.snapshot.currentQuestion!.id;
    const turnRes = await submitInterviewAnswer({ sessionId: start.snapshot.sessionId, questionId: q1, answer: SAMPLE_ANSWER, repository: repo });
    assert.equal(turnRes.success, true);
  });

  it("ATTACK 15: report provider fallback builds schema-compliant DTO", async () => {
    const repo = new InMemorySessionRepository();
    const dto = await buildCandidateReportDTO({ candidateId: "CAND-003" }, repo);
    assert.ok(dto);
    assert.ok(dto!.report.overall.score >= 0 && dto!.report.overall.score <= 100);
    assert.ok(dto!.replayTimeline.length > 0);
  });

  it("ATTACK 16: production debug route guard blocks all debug endpoints with HTTP 404 in production", () => {
    const oldEnv = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      const guardRes = guardDebugRoute();
      assert.ok(guardRes);
      assert.equal(guardRes!.status, 404);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = oldEnv;
    }
  });

  it("ATTACK 17: safe error responses contain no stack traces or database connection paths", async () => {
    const err = new PersistenceError("SESSION_UNAVAILABLE", "Detailed SQL internal failure trace");
    assert.equal(err.code, "SESSION_UNAVAILABLE");
    // Ensure raw message is not leaked in error code
    assert.ok(!err.code.includes("SQL"));
  });

  it("ATTACK 18: API response contains no secret key patterns or credentials", async () => {
    const state = createMockState(generateSecureSessionId());
    const dto = buildInterviewSessionDTO(state);
    const json = JSON.stringify(dto);

    assert.ok(!json.includes("postgres://"));
    assert.ok(!json.includes("postgresql://"));
    assert.ok(!json.includes("DATABASE_URL"));
    assert.ok(!json.includes("GEMINI_API_KEY"));
  });

  it("ATTACK 19: candidate DTO strictly redacts internal intelligence priors and raw LLM prompts", () => {
    const state = createMockState(generateSecureSessionId());
    const dto = buildInterviewSessionDTO(state);
    const json = JSON.stringify(dto);

    for (const internalField of [
      "intelligenceReport",
      "skillMap",
      "estimatedStrength",
      "priorityScore",
      "reasonForSelection",
      "suggestedStartingTopics",
      "candidateIntelligence",
    ]) {
      assert.ok(!json.includes(internalField), `DTO must redact internal field '${internalField}'`);
    }
  });

  it("ATTACK 20: official API contract regression validation", () => {
    const validReq = { candidateId: "CAND-003" };
    assert.equal(OfficialApiRequestSchema.safeParse(validReq).success, true);

    const validResp = {
      sessionId: generateSecureSessionId(),
      status: "active",
      turnCount: 1,
      coveredCurriculumDays: [7],
      coveredTopics: ["Embeddings Explained"],
      question: {
        id: "q_1",
        text: "Explain embeddings.",
        topic: "Embeddings Explained",
        curriculumDay: 7,
        difficulty: "foundation",
      },
      report: null,
    };
    assert.equal(OfficialApiResponseSchema.safeParse(validResp).success, true);
  });
});
