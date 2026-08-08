import { NextRequest, NextResponse } from "next/server";
import { getCandidateById } from "@/lib/data";
import { startAdaptiveInterview } from "@/lib/interview/orchestrator";
import { getSessionRepository } from "@/lib/interview/repository-factory";
import { guardRateLimit } from "@/lib/security/rate-limiter";

export async function POST(request: NextRequest) {
  const rateLimitError = guardRateLimit(request, "demo_start", 30, 60_000);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const candidateId = body?.candidateId;

    if (!candidateId || typeof candidateId !== "string" || candidateId.trim().length === 0 || candidateId.length > 100) {
      return NextResponse.json(
        { success: false, error: "INVALID_REQUEST", message: "candidateId is required and must be a valid string." },
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

    const result = await startAdaptiveInterview(candidateId, undefined, getSessionRepository());

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
