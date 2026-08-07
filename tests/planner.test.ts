import { describe, it } from "node:test";
import assert from "node:assert";
import { getCandidateIntelligence, getCurriculum } from "../src/lib/data";
import { createInterviewSession } from "../src/lib/interview/state";
import { planNextQuestion } from "../src/lib/interview/planner";
import { buildPlaceholderQuestion } from "../src/lib/interview/question-template";
import { addQuestion } from "../src/lib/interview/transitions";
import { Result } from "../src/lib/interview/errors";
import { MAX_QUESTIONS } from "../src/lib/interview/constants";

describe("Milestone 7 — Adaptive Question Planner & Strategy Engine Test Suite", () => {
  const { topics } = getCurriculum();

  function unwrap<T>(res: Result<T>): T {
    if (!res.ok) {
      throw new Error(`Unexpected result error [${res.error.code}]: ${res.error.message}`);
    }
    return res.value;
  }

  function getSessionFor(candidateId: string) {
    const intelligence = getCandidateIntelligence(candidateId);
    assert.ok(intelligence, `Candidate intelligence for ${candidateId} must exist`);
    return {
      session: createInterviewSession(intelligence!.candidate, intelligence!, `session_${candidateId}`),
      intelligence: intelligence!,
    };
  }

  it("TEST 1: Strong candidate gets appropriate starting topic and difficulty.", () => {
    const { session, intelligence } = getSessionFor("CAND-003"); // Emily Chen - AI Engineer
    const plan = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });

    assert.strictEqual(plan.phase, "calibration");
    assert.ok(["intermediate", "advanced"].includes(plan.difficulty));
    assert.ok(plan.priorityScore > 0);
    assert.ok(plan.reasonForSelection.length > 0);
  });

  it("TEST 2: Retry-heavy candidate prioritizes verification.", () => {
    const { session, intelligence } = getSessionFor("CAND-004"); // David Miller - Retry heavy on Vector DB & Prompting
    const plan = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });

    assert.strictEqual(plan.selectionMode, "verification");
    assert.ok(plan.reasonForSelection.includes("verification") || plan.reasonForSelection.includes("attempts"));
  });

  it("TEST 3: Skipped topic is not selected first.", () => {
    const { session, intelligence } = getSessionFor("CAND-001"); // Sarah Johnson - Skipped Day 29
    const plan = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });

    assert.strictEqual(plan.curriculumDay !== 29, true);
    const day29Hypothesis = intelligence.skillMap.find((s) => s.curriculumDay === 29);
    assert.strictEqual(day29Hypothesis?.isSkipped, true);
  });

  it("TEST 4: Same inputs produce identical QuestionPlan (100% determinism).", () => {
    const { session, intelligence } = getSessionFor("CAND-005");
    const plan1 = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });

    for (let i = 0; i < 5; i++) {
      const planN = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });
      assert.deepStrictEqual(planN, plan1, `Run ${i + 2} must match Run 1 exactly`);
    }
  });

  it("TEST 5: Recently covered topic is penalized appropriately.", () => {
    const { session: initSession, intelligence } = getSessionFor("CAND-003");
    const plan1 = planNextQuestion({ state: initSession, curriculum: topics, candidateIntelligence: intelligence });

    // Add plan1 question to state
    const q1 = buildPlaceholderQuestion(plan1);
    const session = unwrap(addQuestion(initSession, q1));

    // Plan next question -> should avoid repeating q1's topic immediately
    const plan2 = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });
    assert.notStrictEqual(plan2.topic, plan1.topic);
  });

  it("TEST 6: Uncovered curriculum day becomes more important when coverage is behind.", () => {
    const { session: initSession, intelligence } = getSessionFor("CAND-003");
    let session = initSession;
    // Add 4 questions all on Day 7 with unique texts
    for (let i = 1; i <= 4; i++) {
      const q = buildPlaceholderQuestion({
        topicId: "day-7",
        topic: "Embeddings Explained",
        curriculumDay: 7,
        moduleTitle: "Embeddings",
        difficulty: "intermediate",
        action: i === 1 ? "new_topic" : "follow_up",
        objective: `Test objective variant ${i}`,
        reasonForSelection: "Test",
        candidateEvidence: [],
        plannerSignals: [],
        coverageImpact: { addsNewCurriculumDay: false, uniqueDaysAfterQuestion: 1 },
        priorityScore: 50,
        phase: "calibration",
        selectionMode: "diversity",
      });
      q.id = `q_day7_${i}`;
      q.text = `Unique question text variation ${i} for Day 7 Embeddings.`;
      session = unwrap(addQuestion(session, q));
    }

    const plan = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });
    assert.strictEqual(plan.coverageImpact.addsNewCurriculumDay, true);
    assert.notStrictEqual(plan.curriculumDay, 7);
  });

  it("TEST 7: Coverage rescue mode activates.", () => {
    const { session: initSession, intelligence } = getSessionFor("CAND-003");
    let session = initSession;
    // Force 7 questions on only 2 days (7 & 8) with unique texts
    for (let i = 1; i <= 7; i++) {
      const day = i <= 4 ? 7 : 8;
      const q = buildPlaceholderQuestion({
        topicId: `day-${day}`,
        topic: day === 7 ? "Embeddings" : "Vector DB",
        curriculumDay: day,
        moduleTitle: "Module",
        difficulty: "intermediate",
        action: "new_topic",
        objective: `Test objective variant ${i}`,
        reasonForSelection: "Test",
        candidateEvidence: [],
        plannerSignals: [],
        coverageImpact: { addsNewCurriculumDay: false, uniqueDaysAfterQuestion: 2 },
        priorityScore: 50,
        phase: "deepening",
        selectionMode: "diversity",
      });
      q.id = `q_res_${i}`;
      q.text = `Unique question text variation ${i} for Day ${day}.`;
      session = unwrap(addQuestion(session, q));
    }

    const plan = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });
    assert.strictEqual(plan.selectionMode, "coverage_rescue");
    assert.ok(plan.reasonForSelection.includes("Coverage Rescue"));
    assert.strictEqual(plan.coverageImpact.addsNewCurriculumDay, true);
  });

  it("TEST 8: Planner respects MAX_QUESTIONS constraints.", () => {
    const { session: initSession } = getSessionFor("CAND-003");
    let session = initSession;
    const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    for (let i = 0; i < MAX_QUESTIONS; i++) {
      const q = buildPlaceholderQuestion({
        topicId: `day-${days[i]}`,
        topic: `Topic ${days[i]}`,
        curriculumDay: days[i],
        moduleTitle: "Module",
        difficulty: "intermediate",
        action: "new_topic",
        objective: "Test",
        reasonForSelection: "Test",
        candidateEvidence: [],
        plannerSignals: [],
        coverageImpact: { addsNewCurriculumDay: true, uniqueDaysAfterQuestion: i + 1 },
        priorityScore: 50,
        phase: "coverage",
        selectionMode: "diversity",
      });
      q.id = `q_max_${i}`;
      q.text = `Unique question text variation ${i} for Day ${days[i]}.`;
      session = unwrap(addQuestion(session, q));
    }

    assert.strictEqual(session.questionCount, MAX_QUESTIONS);
  });

  it("TEST 9: Planner does not violate state-machine rules.", () => {
    const { session, intelligence } = getSessionFor("CAND-003");
    const plan = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });

    const q = buildPlaceholderQuestion(plan);
    const addRes = addQuestion(session, q);
    assert.strictEqual(addRes.ok, true);
  });

  it("TEST 10: Planner provides non-empty rationale/evidence.", () => {
    const { session, intelligence } = getSessionFor("CAND-003");
    const plan = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });

    assert.ok(plan.reasonForSelection.length > 10);
    assert.ok(plan.objective.length > 10);
    assert.ok(plan.plannerSignals.length > 0);
  });

  it("TEST 11: Strong performance signal escalates/deepens appropriately.", () => {
    const { session, intelligence } = getSessionFor("CAND-003");
    const plan = planNextQuestion({
      state: session,
      curriculum: topics,
      candidateIntelligence: intelligence,
      performanceSignal: "strong",
    });

    assert.ok(["advanced", "architecture"].includes(plan.difficulty));
  });

  it("TEST 12: Weak performance signal lowers difficulty/probes foundation.", () => {
    const { session, intelligence } = getSessionFor("CAND-003");
    const plan = planNextQuestion({
      state: session,
      curriculum: topics,
      candidateIntelligence: intelligence,
      performanceSignal: "weak",
    });

    assert.strictEqual(plan.difficulty, "foundation");
  });

  it("TEST 13: Partial performance signal creates clarification/follow-up strategy.", () => {
    const { session: initSession, intelligence } = getSessionFor("CAND-003");
    const q1 = buildPlaceholderQuestion({
      topicId: "day-7",
      topic: "Embeddings Explained",
      curriculumDay: 7,
      moduleTitle: "Embeddings",
      difficulty: "intermediate",
      action: "new_topic",
      objective: "Test",
      reasonForSelection: "Test",
      candidateEvidence: [],
      plannerSignals: [],
      coverageImpact: { addsNewCurriculumDay: true, uniqueDaysAfterQuestion: 1 },
      priorityScore: 50,
      phase: "calibration",
      selectionMode: "diversity",
    });
    const session = unwrap(addQuestion(initSession, q1));

    const plan = planNextQuestion({
      state: session,
      curriculum: topics,
      candidateIntelligence: intelligence,
      performanceSignal: "partial",
    });

    assert.strictEqual(plan.action, "clarify");
  });

  it("TEST 14: Contradictory signal creates challenge strategy.", () => {
    const { session: initSession, intelligence } = getSessionFor("CAND-003");
    const q1 = buildPlaceholderQuestion({
      topicId: "day-7",
      topic: "Embeddings Explained",
      curriculumDay: 7,
      moduleTitle: "Embeddings",
      difficulty: "intermediate",
      action: "new_topic",
      objective: "Test",
      reasonForSelection: "Test",
      candidateEvidence: [],
      plannerSignals: [],
      coverageImpact: { addsNewCurriculumDay: true, uniqueDaysAfterQuestion: 1 },
      priorityScore: 50,
      phase: "calibration",
      selectionMode: "diversity",
    });
    const session = unwrap(addQuestion(initSession, q1));

    const plan = planNextQuestion({
      state: session,
      curriculum: topics,
      candidateIntelligence: intelligence,
      performanceSignal: "contradictory",
    });

    assert.strictEqual(plan.action, "challenge");
    assert.strictEqual(plan.difficulty, "debugging");
  });

  it("TEST 15: CAND-003 and CAND-004 produce meaningfully different plans (Personalization contrast).", () => {
    const session3 = getSessionFor("CAND-003");
    const session4 = getSessionFor("CAND-004");

    const plan3 = planNextQuestion({ state: session3.session, curriculum: topics, candidateIntelligence: session3.intelligence });
    const plan4 = planNextQuestion({ state: session4.session, curriculum: topics, candidateIntelligence: session4.intelligence });

    assert.notStrictEqual(plan3.selectionMode, plan4.selectionMode);
    assert.notStrictEqual(plan3.reasonForSelection, plan4.reasonForSelection);
    assert.strictEqual(plan3.selectionMode, "candidate_strength");
    assert.strictEqual(plan4.selectionMode, "verification"); // retry heavy
  });

  it("TEST 16: Skipped topics are not unfairly used to satisfy coverage.", () => {
    const { session, intelligence } = getSessionFor("CAND-001"); // Sarah Johnson - Day 29 skipped
    const plan = planNextQuestion({ state: session, curriculum: topics, candidateIntelligence: intelligence });

    assert.notStrictEqual(plan.curriculumDay, 29);
    assert.strictEqual(plan.candidateEvidence.some((e) => e.includes("skipped")), false);
  });

});
