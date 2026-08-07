import { NextRequest, NextResponse } from "next/server";
import { submitInterviewAnswer } from "@/lib/interview/orchestrator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, questionId, answer } = body;

    if (!sessionId || !questionId || answer === undefined) {
      return NextResponse.json(
        { status: "error", error: "Missing required fields: sessionId, questionId, answer" },
        { status: 400 }
      );
    }

    const result = await submitInterviewAnswer({ sessionId, questionId, answer });
    if (!result.success) {
      return NextResponse.json({ status: "error", error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      status: "success",
      snapshot: result.snapshot,
      events: result.events,
      assessmentSummary: result.internalSnapshot?.latestAssessment?.summary,
      performanceSignal: result.internalSnapshot?.latestAssessment?.performanceSignal,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Answer submission error";
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }
}
