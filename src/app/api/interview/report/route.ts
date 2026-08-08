import { NextRequest, NextResponse } from "next/server";
import { buildCandidateReportDTO } from "@/lib/report/dto-builder";
import { getSessionRepository } from "@/lib/interview/repository-factory";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId") || searchParams.get("id") || undefined;
  const candidateId = searchParams.get("candidateId") || undefined;
  const scenario = searchParams.get("scenario") || undefined;

  try {
    const dto = await buildCandidateReportDTO(
      { sessionId, candidateId, scenario },
      getSessionRepository()
    );

    if (!dto) {
      return NextResponse.json(
        { success: false, error: "SESSION_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: dto });
  } catch {
    // Never expose SQL / database internals or stack traces.
    return NextResponse.json(
      { success: false, error: "SESSION_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
