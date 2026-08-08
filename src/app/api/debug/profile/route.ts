import { NextRequest, NextResponse } from "next/server";
import { guardDebugRoute } from "@/lib/security/debug-policy";
import { getCandidateIntelligence, getCandidates } from "@/lib/data";

export async function GET(request: NextRequest) {
  const guarded = guardDebugRoute();
  if (guarded) return guarded;

  try {
    const searchParams = request.nextUrl.searchParams;
    const candidateId = searchParams.get("candidateId") || searchParams.get("id");

    const allCandidates = getCandidates().candidates;

    if (!candidateId) {
      const defaultId = allCandidates.length > 0 ? allCandidates[0].id : "CAND-001";
      const defaultProfile = getCandidateIntelligence(defaultId);

      return NextResponse.json({
        status: "success",
        message: "No candidateId query parameter provided. Showing list of available candidates and default candidate profile.",
        availableCandidates: allCandidates.map((c) => ({
          id: c.id,
          name: c.name,
          jobRole: c.jobRole,
          yearsExperience: c.yearsExperience,
          completedDaysCount: c.completedDays.length,
          skippedTopicsCount: c.skippedTopics.length,
        })),
        defaultCandidateId: defaultId,
        intelligenceReport: defaultProfile,
      });
    }

    const report = getCandidateIntelligence(candidateId);
    if (!report) {
      return NextResponse.json(
        {
          status: "error",
          error: `Candidate with ID '${candidateId}' not found.`,
          availableCandidateIds: allCandidates.map((c) => c.id),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      candidateId: report.candidate.id,
      candidateName: report.candidate.name,
      intelligenceReport: report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    );
  }
}
