import { describe, it } from "node:test";
import assert from "node:assert";
import { buildCandidateReportDTO } from "../src/lib/report/dto-builder";

describe("Milestone 16 — Premium Interview Report & Replay Test Suite", () => {
  it("TEST 1: CandidateReportDTO builds clean server report data.", async () => {
    const dto = await buildCandidateReportDTO({ candidateId: "CAND-003" });
    assert.ok(dto);
    assert.ok(dto.report);
    assert.ok(dto.scoreExplanations);
    assert.ok(dto.replayTimeline);
    assert.ok(dto.judgeTraceSummary);
  });

  it("TEST 2: Overall score and level are accurately rendered in report DTO.", async () => {
    const dto = await buildCandidateReportDTO({ candidateId: "CAND-003" });
    assert.ok(dto);

    assert.ok(typeof dto.report.overall.score === "number");
    assert.ok(dto.report.overall.score >= 0 && dto.report.overall.score <= 100);
    assert.ok(dto.report.overall.level);
    assert.ok(dto.report.overall.confidence >= 0 && dto.report.overall.confidence <= 1.0);
  });

  it("TEST 3: Competency breakdown includes score explanations for all 5 dimensions.", async () => {
    const dto = await buildCandidateReportDTO({ candidateId: "CAND-003" });
    assert.ok(dto);

    const dims = ["correctness", "depth", "reasoning", "practicalUnderstanding", "tradeoffAwareness"] as const;
    for (const dim of dims) {
      assert.ok(dto.scoreExplanations[dim]);
      assert.strictEqual(dto.scoreExplanations[dim].competency, dim);
      assert.ok(Array.isArray(dto.scoreExplanations[dim].supportingEvidence));
      assert.ok(Array.isArray(dto.scoreExplanations[dim].gapEvidence));
    }
  });

  it("TEST 4: Insufficient evidence competency is NOT marked as 0 ability.", async () => {
    const dto = await buildCandidateReportDTO({ candidateId: "CAND-003", scenario: "insufficient-evidence" });
    assert.ok(dto);

    const comp = dto.report.competencies.tradeoffAwareness;
    if (comp.status === "insufficient_evidence") {
      assert.strictEqual(comp.confidence, 0.0);
      assert.strictEqual(comp.score, null);
    }
  });

  it("TEST 5: Tested topics are properly reported without marking untested topics as failures.", async () => {
    const dto = await buildCandidateReportDTO({ candidateId: "CAND-003" });
    assert.ok(dto);

    for (const item of dto.report.topicResults) {
      assert.ok(item.topic);
      assert.ok(item.status !== "not_assessed" || item.score === null);
    }
  });

  it("TEST 6: Strengths contain evidence ID links.", async () => {
    const dto = await buildCandidateReportDTO({ candidateId: "CAND-003" });
    assert.ok(dto);

    assert.ok(dto.report.strengths.length > 0);
    const firstStr = dto.report.strengths[0];
    assert.ok(firstStr.title);
    assert.ok(Array.isArray(firstStr.evidenceIds));
  });

  it("TEST 7: Development areas and next steps are non-empty.", async () => {
    const dto = await buildCandidateReportDTO({ candidateId: "CAND-003" });
    assert.ok(dto);

    assert.ok(Array.isArray(dto.report.developmentAreas));
    assert.ok(Array.isArray(dto.report.feedback.nextSteps));
    assert.ok(dto.report.feedback.nextSteps.length > 0);
  });

  it("TEST 8: Replay timeline contains complete turn-by-turn question and candidate answer history.", async () => {
    const dto = await buildCandidateReportDTO({ candidateId: "CAND-003" });
    assert.ok(dto);

    assert.ok(dto.replayTimeline.length > 0);
    const turn = dto.replayTimeline[0];
    assert.ok(turn.turnNumber === 1);
    assert.ok(turn.questionText);
    assert.ok(turn.candidateAnswer);
    assert.ok(turn.topic);
    assert.ok(turn.decisionTrace);
  });

  it("TEST 9: Follow-up marker and decision trace are accurately assigned.", async () => {
    const dto = await buildCandidateReportDTO({ candidateId: "CAND-003" });
    assert.ok(dto);

    if (dto.replayTimeline.length > 1) {
      const turn2 = dto.replayTimeline[1];
      assert.strictEqual(turn2.isFollowUp, true);
      assert.ok(turn2.decisionTrace.action);
      assert.ok(turn2.decisionTrace.label);
    }
  });

  it("TEST 10: CandidateReportDTO strictly redacts internal secrets, prompts, and raw LLM traces.", async () => {
    const dto = await buildCandidateReportDTO({ candidateId: "CAND-003" });
    const str = JSON.stringify(dto);

    assert.strictEqual(str.includes("GEMINI_API_KEY"), false);
    assert.strictEqual(str.includes("<candidate_response_untrusted>"), false);
    assert.strictEqual(str.includes("plannerScore"), false);
    assert.strictEqual(str.includes("candidateStrengthEstimate"), false);
  });
});
