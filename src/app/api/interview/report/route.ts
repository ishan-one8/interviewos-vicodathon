import { NextRequest, NextResponse } from "next/server";
import { buildCandidateReportDTO } from "@/lib/report/dto-builder";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId") || undefined;
  const candidateId = searchParams.get("candidateId") || undefined;
  const scenario = searchParams.get("scenario") || undefined;

  try {
    const dto = await buildCandidateReportDTO({ sessionId, candidateId, scenario });

    if (!dto) {
      return NextResponse.json(
        { error: "Interview report not found or session unavailable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dto,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to load report", details: String(error) },
      { status: 500 }
    );
  }
}
