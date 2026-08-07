import { NextRequest, NextResponse } from "next/server";
import { getCandidateIntelligence, getCurriculum } from "@/lib/data";
import { createInterviewSession } from "@/lib/interview/state";
import { planNextQuestion } from "@/lib/interview/planner";
import { generateInterviewQuestion } from "@/lib/ai/question-generator";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const candidateId = searchParams.get("candidateId") || searchParams.get("id") || "CAND-003";
    const forceFallback = searchParams.get("fallback") === "true";

    const intelligence = getCandidateIntelligence(candidateId);
    if (!intelligence) {
      return NextResponse.json(
        { status: "error", error: `Candidate '${candidateId}' not found.` },
        { status: 404 }
      );
    }

    const { topics } = getCurriculum();

    const session = createInterviewSession(
      intelligence.candidate,
      intelligence,
      `debug_gen_session_${candidateId}`
    );

    // Step 1: Milestone 7 Adaptive Question Planner
    const plan = planNextQuestion({
      state: session,
      curriculum: topics,
      candidateIntelligence: intelligence,
    });

    const topicDetail = topics.find((t) => t.day === plan.curriculumDay);

    // Step 2: Milestone 8 Natural Language Question Generator
    const generationResult = await generateInterviewQuestion({
      plan,
      candidateContext: {
        role: intelligence.candidate.jobRole,
        experience: intelligence.candidate.yearsExperience,
        relevantEvidence: plan.candidateEvidence,
      },
      curriculumContext: {
        topic: plan.topic,
        module: plan.moduleTitle,
        learningObjectives: topicDetail ? topicDetail.learningObjectives : [],
      },
      forceFallback,
    });

    return NextResponse.json({
      status: "success",
      candidate: {
        id: intelligence.candidate.id,
        name: intelligence.candidate.name,
        jobRole: intelligence.candidate.jobRole,
        seniorityTier: intelligence.seniorityTier,
      },
      approvedPlan: {
        topic: plan.topic,
        curriculumDay: plan.curriculumDay,
        moduleTitle: plan.moduleTitle,
        difficulty: plan.difficulty,
        action: plan.action,
        objective: plan.objective,
        reasonForSelection: plan.reasonForSelection,
        phase: plan.phase,
        selectionMode: plan.selectionMode,
      },
      generatedQuestionResult: generationResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Question generation debug error";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    );
  }
}
