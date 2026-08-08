import { NextResponse } from "next/server";
import { guardDebugRoute } from "@/lib/security/debug-policy";
import { getCurriculum, getCandidates } from "@/lib/data";

export async function GET() {
  const guarded = guardDebugRoute();
  if (guarded) return guarded;

  try {
    const curriculumResult = getCurriculum();
    const candidateResult = getCandidates();

    const sampleCandidate = candidateResult.candidates.length > 0
      ? candidateResult.candidates[0]
      : null;

    const sampleTopic = curriculumResult.topics.length > 0
      ? curriculumResult.topics[0]
      : null;

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      curriculum: {
        loaded: curriculumResult.topics.length > 0,
        count: curriculumResult.topics.length,
        cohort: curriculumResult.cohort,
        sampleTopic,
        validationErrors: curriculumResult.errors,
      },
      candidates: {
        loaded: candidateResult.candidates.length > 0,
        count: candidateResult.candidates.length,
        sampleCandidate,
        validationErrors: candidateResult.errors,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load data";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    );
  }
}
