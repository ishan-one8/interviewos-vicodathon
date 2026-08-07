import { NextRequest, NextResponse } from "next/server";
import { getInterviewSnapshot, getInternalSnapshot } from "@/lib/interview/orchestrator";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const debug = searchParams.get("debug") === "true";

    if (!sessionId) {
      return NextResponse.json(
        { status: "error", error: "Query parameter 'sessionId' is required." },
        { status: 400 }
      );
    }

    if (debug) {
      const internal = await getInternalSnapshot(sessionId);
      if (!internal) {
        return NextResponse.json({ status: "error", error: `Session '${sessionId}' not found.` }, { status: 404 });
      }
      return NextResponse.json({ status: "success", internal });
    } else {
      const snapshot = await getInterviewSnapshot(sessionId);
      if (!snapshot) {
        return NextResponse.json({ status: "error", error: `Session '${sessionId}' not found.` }, { status: 404 });
      }
      return NextResponse.json({ status: "success", snapshot });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Get snapshot error";
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }
}
