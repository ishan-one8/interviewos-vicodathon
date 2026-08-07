import { describe, it } from "node:test";
import assert from "node:assert";
import { getCandidates, getCandidateById } from "../src/lib/data";
import { startAdaptiveInterview } from "../src/lib/interview/orchestrator";

describe("Milestone 15 — Premium Candidate Interview UI & Security Suite", () => {
  it("TEST 1: Candidates dataset loads valid candidate profiles.", () => {
    const { candidates } = getCandidates();
    assert.ok(candidates.length > 0);

    const cand = candidates[0];
    assert.ok(cand.id);
    assert.ok(cand.name);
    assert.ok(cand.jobRole);
    assert.ok(typeof cand.yearsExperience === "number");
  });

  it("TEST 2: Candidate selector candidate list strictly contains zero internal planner scores.", () => {
    const { candidates } = getCandidates();
    for (const cand of candidates) {
      const obj = cand as Record<string, unknown>;
      assert.strictEqual(obj.estimatedStrength, undefined);
      assert.strictEqual(obj.weaknessClassification, undefined);
      assert.strictEqual(obj.plannerScore, undefined);
      assert.strictEqual(obj.hypothesisScore, undefined);
    }
  });

  it("TEST 3: Candidate snapshot strictly redacts internal scoring and memory internals.", async () => {
    const res = await startAdaptiveInterview("CAND-003", "test_ui_snap");
    assert.ok(res.success);

    const snapshot = res.snapshot as Record<string, unknown>;
    assert.ok(snapshot.sessionId);
    assert.strictEqual(snapshot.status, "active");
    assert.ok(typeof snapshot.coveredCurriculumDaysCount === "number");

    // Security check: no leakage of raw memory, raw ledger, or internal candidate priors
    assert.strictEqual(snapshot.memory, undefined);
    assert.strictEqual(snapshot.ledger, undefined);
    assert.strictEqual(snapshot.plannerScore, undefined);
    assert.strictEqual(snapshot.evidenceLedger, undefined);
    assert.strictEqual(snapshot.contradictionSignals, undefined);
  });

  it("TEST 4: Question object contains safe presentation metadata without internal rationale.", async () => {
    const res = await startAdaptiveInterview("CAND-003", "test_q_meta");
    assert.ok(res.success);
    assert.ok(res.snapshot.currentQuestion);

    const question = res.snapshot.currentQuestion as Record<string, unknown>;
    assert.ok(question.id);
    assert.ok(question.text);
    assert.ok(question.topic);
    assert.ok(question.difficulty);

    // Verify metadata does not leak internal decision values
    assert.strictEqual(question.plannerScore, undefined);
    assert.strictEqual(question.candidateStrengthEstimate, undefined);
  });

  it("TEST 5: Single candidate profile selection resolves cleanly.", () => {
    const cand = getCandidateById("CAND-003");
    assert.ok(cand);
    assert.strictEqual(cand.id, "CAND-003");
    assert.strictEqual(cand.name, "Emily Chen");
  });
});
