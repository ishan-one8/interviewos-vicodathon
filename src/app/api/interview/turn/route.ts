import { NextRequest, NextResponse } from "next/server";
import { submitInterviewAnswer } from "@/lib/interview/orchestrator";
import { buildInterviewSessionDTO } from "@/lib/interview/safe-dto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, questionId, answer } = body || {};

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { success: false, error: "sessionId is required." },
        { status: 400 }
      );
    }
    if (!questionId || typeof questionId !== "string") {
      return NextResponse.json(
        { success: false, error: "questionId is required." },
        { status: 400 }
      );
    }
    if (!answer || typeof answer !== "string" || answer.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "answer is required and must be non-empty." },
        { status: 400 }
      );
    }

    const result = await submitInterviewAnswer({ sessionId, questionId, answer });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to process answer." },
        { status: 400 }
      );
    }

    const state = result.internalSnapshot?.state;
    if (!state) {
      return NextResponse.json(
        { success: false, error: "Session state unavailable after submission." },
        { status: 500 }
      );
    }

    const previousTopic = body.previousTopic || null;
    const dto = buildInterviewSessionDTO(state, previousTopic);

    return NextResponse.json({ success: true, session: dto });
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
