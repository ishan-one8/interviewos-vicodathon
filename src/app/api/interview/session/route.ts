import { NextRequest, NextResponse } from "next/server";
import { defaultSessionRepository } from "@/lib/interview/session-repository";
import { buildInterviewSessionDTO } from "@/lib/interview/safe-dto";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required." },
        { status: 400 }
      );
    }

    const state = await defaultSessionRepository.getSession(sessionId);
    if (!state) {
      return NextResponse.json(
        { success: false, error: "Session not found or expired." },
        { status: 404 }
      );
    }

    const dto = buildInterviewSessionDTO(state);
    return NextResponse.json({ success: true, session: dto });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
