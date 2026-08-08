import { NextRequest, NextResponse } from "next/server";
import { guardDebugRoute } from "@/lib/security/debug-policy";
import { getCandidateIntelligence, getCurriculum } from "@/lib/data";
import { createInterviewSession } from "@/lib/interview/state";
import { planNextQuestion } from "@/lib/interview/planner";
import { buildPlaceholderQuestion } from "@/lib/interview/question-template";
import { addQuestion, submitAnswer } from "@/lib/interview/transitions";
import { QuestionPlan } from "@/types/interview";

export async function GET(request: NextRequest) {
  const guarded = guardDebugRoute();
  if (guarded) return guarded;

  try {
    const searchParams = request.nextUrl.searchParams;
    const candidateId = searchParams.get("candidateId") || searchParams.get("id") || "CAND-003";
    const scenario = searchParams.get("scenario");

    const intelligence = getCandidateIntelligence(candidateId);
    if (!intelligence) {
      return NextResponse.json(
        { status: "error", error: `Candidate '${candidateId}' not found.` },
        { status: 404 }
      );
    }

    const { topics } = getCurriculum();

    // Scenario 1: Coverage Rescue Simulation
    if (scenario === "coverage-rescue") {
      let rescueSession = createInterviewSession(
        intelligence.candidate,
        intelligence,
        "debug_rescue_session"
      );

      // Force 7 questions asked on only 2 days (Day 7 and Day 8)
      for (let i = 1; i <= 7; i++) {
        const day = i <= 4 ? 7 : 8;
        const topicName = day === 7 ? "Embeddings Explained" : "Vector Databases Overview";
        const qPlan = planNextQuestion({
          state: rescueSession,
          curriculum: topics,
          candidateIntelligence: intelligence,
        });
        const q = buildPlaceholderQuestion({
          ...qPlan,
          curriculumDay: day,
          topic: topicName,
        });
        const addRes = addQuestion(rescueSession, q);
        if (addRes.ok) {
          rescueSession = addRes.value;
          const ansRes = submitAnswer(rescueSession, q.id, "Candidate response.");
          if (ansRes.ok) rescueSession = ansRes.value;
        }
      }

      // Now plan 8th question -> must trigger coverage rescue!
      const rescuePlan = planNextQuestion({
        state: rescueSession,
        curriculum: topics,
        candidateIntelligence: intelligence,
      });

      return NextResponse.json({
        status: "success",
        scenario: "coverage-rescue",
        candidateId: intelligence.candidate.id,
        candidateName: intelligence.candidate.name,
        simulatedQuestionsAsked: rescueSession.turns.length,
        simulatedUniqueDays: rescueSession.coveredCurriculumDays.length,
        coveredDays: rescueSession.coveredCurriculumDays,
        rescuePlan,
      });
    }

    // Default Simulation: 5 multi-turn QuestionPlans for target candidate
    let session = createInterviewSession(
      intelligence.candidate,
      intelligence,
      `debug_planner_session_${candidateId}`
    );

    const plannedSteps: {
      turnNumber: number;
      plan: QuestionPlan;
      coveredDaysSnapshot: number[];
      coveredTopicsSnapshot: string[];
    }[] = [];

    for (let turn = 1; turn <= 5; turn++) {
      const plan = planNextQuestion({
        state: session,
        curriculum: topics,
        candidateIntelligence: intelligence,
      });

      const question = buildPlaceholderQuestion(plan);
      const addRes = addQuestion(session, question);

      if (addRes.ok) {
        session = addRes.value;
        const ansRes = submitAnswer(
          session,
          question.id,
          `Simulated answer for Day ${question.curriculumDay} (${question.topic}).`
        );
        if (ansRes.ok) session = ansRes.value;
      }

      plannedSteps.push({
        turnNumber: turn,
        plan,
        coveredDaysSnapshot: [...session.coveredCurriculumDays],
        coveredTopicsSnapshot: [...session.coveredTopics],
      });
    }

    return NextResponse.json({
      status: "success",
      candidate: {
        id: intelligence.candidate.id,
        name: intelligence.candidate.name,
        jobRole: intelligence.candidate.jobRole,
        seniorityTier: intelligence.seniorityTier,
        recommendedStartingDifficulty: intelligence.recommendedStartingDifficulty,
      },
      summaryNotes: intelligence.summaryNotes,
      suggestedStartingTopics: intelligence.suggestedStartingTopics.map((s) => s.topic),
      plannedSteps,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Planner error";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    );
  }
}
