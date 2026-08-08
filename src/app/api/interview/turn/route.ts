import { NextRequest, NextResponse } from "next/server";
import { submitInterviewAnswer } from "@/lib/interview/orchestrator";
import { buildInterviewSessionDTO } from "@/lib/interview/safe-dto";
import { getSessionRepository } from "@/lib/interview/repository-factory";

/** Map an orchestrator error into a safe { code, status } pair. */
function mapSafeError(raw: string | undefined): { code: string; status: number } {
  const e = raw || "";
  if (e === "TURN_CONFLICT") return { code: "TURN_CONFLICT", status: 409 };
  if (e === "SESSION_UNAVAILABLE") return { code: "SESSION_UNAVAILABLE", status: 503 };
  if (e === "SESSION_NOT_FOUND" || /not found/i.test(e)) return { code: "SESSION_NOT_FOUND", status: 404 };
  if (/invalid questionid|already completed/i.test(e)) return { code: "INVALID_REQUEST", status: 409 };
  return { code: "INVALID_REQUEST", status: 400 };
}

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

    const result = await submitInterviewAnswer({
      sessionId,
      questionId,
      answer,
      repository: getSessionRepository(),
    });

    if (!result.success) {
      const { code, status } = mapSafeError(result.error);
      return NextResponse.json({ success: false, error: code }, { status });
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
