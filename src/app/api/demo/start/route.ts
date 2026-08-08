import { NextRequest, NextResponse } from "next/server";
import { getCandidateById } from "@/lib/data";
import { startAdaptiveInterview } from "@/lib/interview/orchestrator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const candidateId = body?.candidateId;

    if (!candidateId || typeof candidateId !== "string") {
      return NextResponse.json(
        { success: false, error: "candidateId is required." },
        { status: 400 }
      );
    }

    const candidate = getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: `Candidate '${candidateId}' not found.` },
        { status: 404 }
      );
    }

    const result = await startAdaptiveInterview(candidateId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to create session." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: result.snapshot.sessionId,
      candidateName: candidate.name,
      candidateRole: candidate.jobRole,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
