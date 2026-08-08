import { NextRequest, NextResponse } from "next/server";
import { getSessionRepository } from "@/lib/interview/repository-factory";
import { buildInterviewSessionDTO } from "@/lib/interview/safe-dto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id") || searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const state = await getSessionRepository().getSession(sessionId);
    if (!state) {
      return NextResponse.json(
        { success: false, error: "SESSION_NOT_FOUND" },
        { status: 404 }
      );
    }

    const dto = buildInterviewSessionDTO(state);
    return NextResponse.json({ success: true, session: dto });
  } catch {
    // Never leak DB internals — treat as a safe unavailable state.
    return NextResponse.json(
      { success: false, error: "SESSION_UNAVAILABLE" },
      { status: 503 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
