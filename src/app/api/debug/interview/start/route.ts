import { NextRequest, NextResponse } from "next/server";
import { startAdaptiveInterview } from "@/lib/interview/orchestrator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const candidateId = body.candidateId || "CAND-003";
    const customSessionId = body.customSessionId;

    const result = await startAdaptiveInterview(candidateId, customSessionId);
    if (!result.success) {
      return NextResponse.json({ status: "error", error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      status: "success",
      snapshot: result.snapshot,
      events: result.events,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Start interview error";
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }
}
