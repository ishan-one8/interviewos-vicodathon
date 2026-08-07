import { NextRequest, NextResponse } from "next/server";
import { startAdaptiveInterview, submitInterviewAnswer } from "@/lib/interview/orchestrator";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const candidateId = searchParams.get("candidateId") || "CAND-003";

    const simSessionId = `sim_${candidateId}_${Date.now().toString(36)}`;
    let startRes = await startAdaptiveInterview(candidateId, simSessionId);

    if (!startRes.success) {
      return NextResponse.json({ status: "error", error: startRes.error }, { status: 400 });
    }

    const answers = [
      "To optimize HNSW search latency in ChromaDB, I adjust efConstruction and M parameters during index creation to balance build time against recall accuracy, and tune efSearch dynamically at query time based on SLA bounds.",
      "Vector embeddings capture dense semantic relationships; Cosine similarity measures the angle between normalized vectors to evaluate semantic proximity.",
      "To debug RAG issues, I first inspect retrieved chunks before modifying the generation model.",
      "I don't know the exact trade-off parameters for quantization in ChromaDB.",
      "Chunk size impacts context granularity; smaller chunks preserve precision while larger chunks maintain document narrative.",
      "Dense embeddings excel at semantic lookup while sparse BM25 vectors capture exact keyword matches. Hybrid search merges both using reciprocal rank fusion.",
      "In production RAG, I implement prompt caching and reranking with Cross-Encoders to improve precision.",
      "I monitor embedding drift by logging vector distribution statistics over time.",
    ];

    const timeline = [];

    for (let turnIdx = 0; turnIdx < answers.length; turnIdx++) {
      const q = startRes.snapshot.currentQuestion;
      if (!q) break;

      const answer = answers[turnIdx % answers.length];
      const answerRes = await submitInterviewAnswer({
        sessionId: simSessionId,
        questionId: q.id,
        answer,
      });

      if (!answerRes.success) break;

      timeline.push({
        turnIndex: turnIdx + 1,
        questionId: q.id,
        questionText: q.text,
        topic: q.topic,
        difficulty: q.difficulty,
        candidateAnswer: answer,
        performanceSignal: answerRes.internalSnapshot?.latestAssessment?.performanceSignal,
        canComplete: answerRes.snapshot.canComplete,
        isComplete: answerRes.snapshot.isComplete,
      });

      startRes = answerRes;
      if (answerRes.snapshot.isComplete) break;
    }

    return NextResponse.json({
      status: "success",
      candidateId,
      sessionId: simSessionId,
      totalTurnsExecuted: timeline.length,
      finalSnapshot: startRes.snapshot,
      timeline,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Simulation error";
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }
}
