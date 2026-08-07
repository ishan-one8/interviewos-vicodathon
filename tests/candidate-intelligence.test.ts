import { describe, it } from "node:test";
import assert from "node:assert";
import { getCandidateIntelligence, getCurriculum, getCandidateById } from "../src/lib/data";
import { profileCandidate, } from "../src/lib/candidate/profiler";
import { CandidateProfile,} from "../src/types/interview";

describe("Candidate Intelligence Engine Tests", () => {
  it("1. Strong Candidate (CAND-003 Emily Chen) - High strength, advanced starting difficulty", () => {
    const report = getCandidateIntelligence("CAND-003");
    assert.notStrictEqual(report, null, "CAND-003 profile should exist");
    if (!report) return;

    assert.strictEqual(report.candidate.name, "Emily Chen");
    assert.strictEqual(report.seniorityTier, "mid");
    assert.strictEqual(report.recommendedStartingDifficulty, "intermediate");
    assert.ok(report.overallSkillEstimate >= 0.70, "Strong candidate overall skill estimate should be >= 0.70");
    assert.ok(report.strongestTopics.length > 0, "Strong candidate should have strongest topics");
    assert.strictEqual(report.skippedTopics.length, 0, "CAND-003 has 0 skipped topics");

    // First try passes should have high estimatedStrength
    const day7Topic = report.skillMap.find((s) => s.curriculumDay === 7);
    assert.ok(day7Topic, "Day 7 topic should be profiled");
    assert.strictEqual(day7Topic?.attemptsCount, 1);
    assert.ok((day7Topic?.estimatedStrength ?? 0) >= 0.70, "Day 7 strength should be high due to 1st try pass");
  });

  it("2. Retry-Heavy Candidate (CAND-004 David Miller) - Identifies topics to verify", () => {
    const report = getCandidateIntelligence("CAND-004");
    assert.notStrictEqual(report, null, "CAND-004 profile should exist");
    if (!report) return;

    assert.strictEqual(report.candidate.name, "David Miller");
    assert.ok(report.topicsToVerify.length > 0, "Retry-heavy candidate should have topics tagged to verify");

    // Check specific struggle topic with attempts >= 3
    const vectorDbTopic = report.skillMap.find((s) => s.curriculumDay === 8);
    assert.ok(vectorDbTopic, "Day 8 Vector DB topic should exist");
    assert.strictEqual(vectorDbTopic?.attemptsCount, 5, "Day 8 required 5 attempts");
    assert.strictEqual(vectorDbTopic?.interviewPriority, "high", "Retry-heavy topic should be high priority for verification");
    assert.strictEqual(vectorDbTopic?.recommendedDifficulty, "debugging");
  });

  it("3. Skipped Topics Candidate (CAND-001 Sarah Johnson) - Fair treatment", () => {
    const report = getCandidateIntelligence("CAND-001");
    assert.notStrictEqual(report, null, "CAND-001 profile should exist");
    if (!report) return;

    assert.strictEqual(report.candidate.name, "Sarah Johnson");
    assert.ok(report.skippedTopics.length > 0, "CAND-001 should have skipped topics");

    const skippedItem = report.skippedTopics[0];
    assert.strictEqual(skippedItem.isSkipped, true);
    assert.strictEqual(skippedItem.interviewPriority, "avoid");
    assert.strictEqual(skippedItem.exposure, "low");
    assert.ok(skippedItem.evidence[0].includes("skipped"), "Evidence should explicitly mention topic was skipped");

    // Overall skill estimate should not be NaN or destroyed by skipped topics
    assert.ok(!isNaN(report.overallSkillEstimate), "Overall skill estimate should be a valid number");
  });

  it("4. Missing / Minimal Data Edge Case - Handles missing optional fields gracefully", () => {
    const { topics } = getCurriculum();
    const minimalCandidate: CandidateProfile = {
      id: "CAND-MINIMAL",
      name: "Minimal Candidate",
      jobRole: "Junior Developer",
      yearsExperience: 0,
      education: "High School",
      status: "COMPLETED",
      completedDays: [],
      completedMissions: [],
      attempts: {},
      skippedTopics: [],
      learningSignals: [],
      signals: { commitDays: 0, missionsCompleted: 0, missionsFirstTry: 0 },
      missions: [],
    };

    const report = profileCandidate(minimalCandidate, topics);
    assert.strictEqual(report.candidate.id, "CAND-MINIMAL");
    assert.strictEqual(report.seniorityTier, "junior");
    assert.strictEqual(report.recommendedStartingDifficulty, "foundation");
    assert.ok(!isNaN(report.overallSkillEstimate), "Skill estimate should be valid number");
    assert.ok(!isNaN(report.overallConfidence), "Confidence should be valid number");
    assert.strictEqual(report.skillMap.length, 31, "Should profile all 31 curriculum topics");
  });

  it("5. Determinism Test - Identical input produces exact identical output across 10 runs", () => {
    const candidate = getCandidateById("CAND-005");
    const { topics } = getCurriculum();
    assert.ok(candidate, "CAND-005 candidate must exist");
    if (!candidate) return;

    const run1 = profileCandidate(candidate, topics);
    for (let i = 0; i < 9; i++) {
      const runN = profileCandidate(candidate, topics);
      assert.deepStrictEqual(runN, run1, `Run ${i + 2} must match Run 1 exactly`);
    }
  });
});
