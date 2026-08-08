import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  InMemorySessionRepository,
} from "../src/lib/interview/session-repository";
import { PostgresSessionRepository } from "../src/lib/interview/postgres-session-repository";
import type { SqlExecutor } from "../src/lib/db/client";
import {
  validatePersistedState,
  generateSecureSessionId,
  PersistenceError,
  SCHEMA_VERSION,
} from "../src/lib/interview/persistence";
import {
  startAdaptiveInterview,
  submitInterviewAnswer,
} from "../src/lib/interview/orchestrator";
import { buildInterviewSessionDTO } from "../src/lib/interview/safe-dto";
import { buildCandidateReportDTO } from "../src/lib/report/dto-builder";
import { getCandidateIntelligence } from "../src/lib/data";
import { createInterviewSession } from "../src/lib/interview/state";
import { createEmptyMemory } from "../src/lib/interview/memory";
import { createEmptyLedger } from "../src/lib/interview/evidence";
import {
  OfficialApiRequestSchema,
  OfficialApiResponseSchema,
} from "../src/lib/api/contract";
import type { InterviewState } from "../src/types/interview";

const ANSWER =
  "Dense embeddings map semantics into vector space; I benchmark recall@k against domain sets and weigh latency vs accuracy trade-offs, verifying retrieval separately from generation.";

function craftState(sessionId: string, status: InterviewState["status"] = "active"): InterviewState {
  const intel = getCandidateIntelligence("CAND-003");
  assert.ok(intel, "CAND-003 intelligence should exist");
  const s = createInterviewSession(intel!.candidate, intel!, sessionId);
  s.memory = createEmptyMemory();
  s.ledger = createEmptyLedger(sessionId);
  s.status = status;
  return s;
}

/** Minimal in-memory fake of a Postgres SqlExecutor (no live DB). Recognizes
 *  exactly the parameterized queries PostgresSessionRepository issues. */
function makeFakePg(): { exec: SqlExecutor; store: Map<string, Record<string, unknown>> } {
  const store = new Map<string, Record<string, unknown>>();
  const exec: SqlExecutor = async (text, params = []) => {
    const p = params as unknown[];
    if (/^\s*INSERT/i.test(text)) {
      const id = p[0] as string;
      store.set(id, {
        id, candidate_id: p[1], status: p[2], schema_version: p[3], version: p[4],
        state_json: p[5], report_json: p[6], created_at: p[7], updated_at: p[8], completed_at: p[9],
      });
      return [];
    }
    if (/^\s*DELETE/i.test(text)) { store.delete(p[0] as string); return []; }
    if (/^\s*UPDATE/i.test(text) && /RETURNING/i.test(text)) {
      // CAS: [state_json, status, version, updated_at, completed_at, id, expected]
      const id = p[5] as string;
      const row = store.get(id);
      if (!row || row.version !== p[6]) return [];
      row.state_json = p[0]; row.status = p[1]; row.version = p[2]; row.updated_at = p[3]; row.completed_at = p[4];
      return [{ version: row.version }];
    }
    if (/^\s*UPDATE/i.test(text)) {
      // saveReport: [report_json, updated_at, id]
      const row = store.get(p[2] as string);
      if (row) { row.report_json = p[0]; row.updated_at = p[1]; }
      return [];
    }
    if (/SELECT\s+state_json/i.test(text)) {
      const row = store.get(p[0] as string);
      return row ? [{ state_json: row.state_json, version: row.version }] : [];
    }
    if (/SELECT\s+version/i.test(text)) {
      const row = store.get(p[0] as string);
      return row ? [{ version: row.version }] : [];
    }
    if (/SELECT\s+report_json/i.test(text)) {
      const row = store.get(p[0] as string);
      return row ? [{ report_json: row.report_json }] : [];
    }
    return [];
  };
  return { exec, store };
}

async function runFullInterview(repo: InMemorySessionRepository) {
  const start = await startAdaptiveInterview("CAND-003", undefined, repo);
  assert.ok(start.success);
  const sessionId = start.snapshot.sessionId;
  let state = start.internalSnapshot!.state;
  let guard = 0;
  while (state.status !== "completed" && guard < 15) {
    const qid = state.currentQuestion?.id;
    if (!qid) break;
    const r = await submitInterviewAnswer({ sessionId, questionId: qid, answer: ANSWER, repository: repo });
    if (!r.success || !r.internalSnapshot) break;
    state = r.internalSnapshot.state;
    guard++;
  }
  return { sessionId, state };
}

describe("Milestone 19 — Production Persistence & Secure Session Recovery", () => {
  it("TEST 1: secure session id contains no candidate id / counter", async () => {
    const id = generateSecureSessionId();
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.ok(!id.includes("CAND"));
    assert.ok(!id.startsWith("session_"));

    const start = await startAdaptiveInterview("CAND-003", undefined, new InMemorySessionRepository());
    assert.ok(start.success);
    assert.ok(!start.snapshot.sessionId.includes("CAND"));
    assert.ok(!start.snapshot.sessionId.includes("session_"));
  });

  it("TEST 2: session save/load works", async () => {
    const repo = new InMemorySessionRepository();
    const state = craftState(generateSecureSessionId());
    await repo.createSession(state);
    const loaded = await repo.getSession(state.sessionId);
    assert.ok(loaded);
    assert.equal(loaded!.sessionId, state.sessionId);
    assert.equal(loaded!.candidate.id, "CAND-003");
  });

  it("TEST 3: current question survives reload", async () => {
    const repo = new InMemorySessionRepository();
    const start = await startAdaptiveInterview("CAND-003", undefined, repo);
    const qId = start.internalSnapshot!.state.currentQuestion!.id;
    const reloaded = await repo.getSession(start.snapshot.sessionId);
    assert.ok(reloaded!.currentQuestion);
    assert.equal(reloaded!.currentQuestion!.id, qId);
  });

  it("TEST 4: answered turns survive reload", async () => {
    const repo = new InMemorySessionRepository();
    const start = await startAdaptiveInterview("CAND-003", undefined, repo);
    const sessionId = start.snapshot.sessionId;
    const qId = start.internalSnapshot!.state.currentQuestion!.id;
    await submitInterviewAnswer({ sessionId, questionId: qId, answer: ANSWER, repository: repo });
    const reloaded = await repo.getSession(sessionId);
    assert.ok(reloaded!.turns.length >= 1);
    assert.equal(reloaded!.turns[0].answer, ANSWER);
  });

  it("TEST 5 & 6: memory (claims/contradictions) survives reload", async () => {
    const repo = new InMemorySessionRepository();
    const start = await startAdaptiveInterview("CAND-003", undefined, repo);
    const sessionId = start.snapshot.sessionId;
    const qId = start.internalSnapshot!.state.currentQuestion!.id;
    const after = await submitInterviewAnswer({ sessionId, questionId: qId, answer: ANSWER, repository: repo });
    const memoryBefore = after.internalSnapshot!.state.memory;
    const reloaded = await repo.getSession(sessionId);
    assert.ok(reloaded!.memory);
    assert.deepEqual(reloaded!.memory, memoryBefore);
  });

  it("TEST 7: evidence ledger survives reload", async () => {
    const repo = new InMemorySessionRepository();
    const start = await startAdaptiveInterview("CAND-003", undefined, repo);
    const sessionId = start.snapshot.sessionId;
    const qId = start.internalSnapshot!.state.currentQuestion!.id;
    const after = await submitInterviewAnswer({ sessionId, questionId: qId, answer: ANSWER, repository: repo });
    const ledgerBefore = after.internalSnapshot!.state.ledger;
    const reloaded = await repo.getSession(sessionId);
    assert.ok(reloaded!.ledger);
    assert.ok(reloaded!.ledger!.entries.length >= 1);
    assert.deepEqual(reloaded!.ledger, ledgerBefore);
  });

  it("TEST 8 & 9: replay timeline & completed report survive (and are cached)", async () => {
    const repo = new InMemorySessionRepository();
    const { sessionId, state } = await runFullInterview(repo);
    assert.equal(state.status, "completed");

    const dto1 = await buildCandidateReportDTO({ sessionId }, repo);
    assert.ok(dto1);
    assert.equal(dto1!.replayTimeline.length, state.turns.length);

    // report was persisted once
    const cached = await repo.getReport!(sessionId);
    assert.ok(cached);

    // second load returns the cached report (no regeneration)
    const dto2 = await buildCandidateReportDTO({ sessionId }, repo);
    assert.deepEqual(dto2, dto1);
  });

  it("TEST 10: invalid persisted schema rejected safely", async () => {
    assert.throws(() => validatePersistedState({ nonsense: true }), (e: unknown) => e instanceof PersistenceError && e.code === "SESSION_UNAVAILABLE");
    assert.throws(() => validatePersistedState(null), (e: unknown) => e instanceof PersistenceError);

    // A valid state round-trips through validation
    const good = craftState(generateSecureSessionId());
    const parsed = validatePersistedState(JSON.parse(JSON.stringify(good)));
    assert.equal(parsed.sessionId, good.sessionId);

    // Postgres repo returns null (not a crash) for a corrupt stored payload
    const { exec, store } = makeFakePg();
    const repo = new PostgresSessionRepository(exec);
    store.set("corrupt", { id: "corrupt", version: 1, state_json: { garbage: 1 } });
    const loaded = await repo.getSession("corrupt");
    assert.equal(loaded, null);
  });

  it("TEST 11: unknown session yields safe null (not-found)", async () => {
    const repo = new InMemorySessionRepository();
    assert.equal(await repo.getSession("does-not-exist"), null);
    const { exec } = makeFakePg();
    const pgRepo = new PostgresSessionRepository(exec);
    assert.equal(await pgRepo.getSession("nope"), null);
  });

  it("TEST 12: duplicate submission is idempotent (no duplicate turn)", async () => {
    const repo = new InMemorySessionRepository();
    const start = await startAdaptiveInterview("CAND-003", undefined, repo);
    const sessionId = start.snapshot.sessionId;
    const qId = start.internalSnapshot!.state.currentQuestion!.id;

    const first = await submitInterviewAnswer({ sessionId, questionId: qId, answer: ANSWER, repository: repo });
    assert.ok(first.success);
    const turnsAfterFirst = (await repo.getSession(sessionId))!.turns.length;

    // Re-submit the SAME (already-answered) questionId — must be rejected, no new turn
    const second = await submitInterviewAnswer({ sessionId, questionId: qId, answer: ANSWER, repository: repo });
    assert.equal(second.success, false);
    const turnsAfterSecond = (await repo.getSession(sessionId))!.turns.length;
    assert.equal(turnsAfterSecond, turnsAfterFirst);
  });

  it("TEST 13: stale concurrent update handled safely (TURN_CONFLICT)", async () => {
    const { exec, store } = makeFakePg();
    const repo = new PostgresSessionRepository(exec);
    const state = craftState(generateSecureSessionId());
    await repo.createSession(state);

    // Simulate another instance writing first (version advances underneath us)
    store.get(state.sessionId)!.version = 5;

    await assert.rejects(
      repo.saveSession(state),
      (e: unknown) => e instanceof PersistenceError && e.code === "TURN_CONFLICT"
    );
  });

  it("TEST 13b: Postgres repo CAS happy path (save/load via mock)", async () => {
    const { exec } = makeFakePg();
    const repo = new PostgresSessionRepository(exec);
    const state = craftState(generateSecureSessionId());
    await repo.createSession(state);
    const loaded = await repo.getSession(state.sessionId);
    assert.ok(loaded);
    loaded!.questionCount = 2;
    await assert.doesNotReject(repo.saveSession(loaded!));
    const reloaded = await repo.getSession(state.sessionId);
    assert.equal(reloaded!.questionCount, 2);
  });

  it("TEST 14: safe DTO remains safe (no candidate internals)", async () => {
    const state = craftState(generateSecureSessionId());
    const dto = buildInterviewSessionDTO(state);
    const json = JSON.stringify(dto);
    for (const forbidden of ["intelligenceReport", "skillMap", "estimatedStrength", "priorityScore", "reasonForSelection", "suggestedStartingTopics"]) {
      assert.ok(!json.includes(forbidden), `DTO must not expose ${forbidden}`);
    }
    assert.equal(dto.sessionId, state.sessionId);
    assert.ok(!json.includes("CAND-003"));
  });

  it("TEST 15: official API contract schemas unchanged", () => {
    assert.ok(OfficialApiRequestSchema.safeParse({ candidateId: "CAND-003" }).success);
    assert.ok(OfficialApiRequestSchema.safeParse({ sessionId: "x", questionId: "q", answer: "a" }).success);
    assert.ok(!OfficialApiRequestSchema.safeParse({}).success);

    const validResponse = {
      sessionId: "s",
      status: "active",
      turnCount: 0,
      coveredCurriculumDays: [],
      coveredTopics: [],
      question: null,
      report: null,
    };
    assert.ok(OfficialApiResponseSchema.safeParse(validResponse).success);
  });

  it("TEST 16: schema version constant is present and stable", () => {
    assert.equal(SCHEMA_VERSION, 1);
  });
});
