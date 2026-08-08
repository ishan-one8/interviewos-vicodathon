import { NextRequest, NextResponse } from "next/server";
import { getCandidateIntelligence } from "@/lib/data";
import { createInterviewSession } from "@/lib/interview/state";
import { buildInterviewReport } from "@/lib/report/report";
import { getScoreExplanation } from "@/lib/report/explainability";
import { defaultSessionRepository } from "@/lib/interview/session-repository";
import { createEmptyLedger, addTurnEvidenceToLedger } from "@/lib/interview/evidence";
import { createEmptyMemory } from "@/lib/interview/memory";
import { CompetencyDimension } from "@/types/interview";
import { guardDebugRoute } from "@/lib/security/debug-policy";

export async function GET(request: NextRequest) {
  const guarded = guardDebugRoute();
  if (guarded) return guarded;

  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get("scenario");
  const sessionId = searchParams.get("sessionId");

  try {
    if (sessionId) {
      const state = await defaultSessionRepository.getSession(sessionId);
      if (!state) {
        return NextResponse.json(
          { error: `Session '${sessionId}' not found.` },
          { status: 404 }
        );
      }

      const ledger = state.ledger || createEmptyLedger(state.sessionId);
      const report = await buildInterviewReport({ state });
      const explanations = (
        ["correctness", "depth", "reasoning", "practicalUnderstanding", "tradeoffAwareness"] as CompetencyDimension[]
      ).map((dim) => getScoreExplanation(ledger, dim));

      return NextResponse.json({
        report,
        scoreExplanations: explanations,
      });
    }

    const intel = getCandidateIntelligence("CAND-003")!;
    const state = createInterviewSession(
      intel.candidate,
      intel,
      `debug_rep_${scenario || "strong"}`
    );
    state.ledger = createEmptyLedger(state.sessionId);
    state.memory = createEmptyMemory();

    if (scenario === "insufficient-evidence") {
      // Only 1 turn executed
      state.coveredCurriculumDays = [7];
      state.coveredTopics = ["Embeddings Explained"];
      state.questionCount = 1;
      state.ledger = addTurnEvidenceToLedger(state.ledger, {
        question: {
          id: "q_1",
          topic: "Embeddings Explained",
          curriculumDay: 7,
          difficulty: "intermediate",
          text: "Explain embeddings.",
          action: "new_topic",
          reasonForQuestion: "Debug",
          createdAt: new Date().toISOString(),
        },
        answer: "Embeddings turn text into high-dimensional vectors.",
        assessment: {
          questionId: "q_1",
          answer: "Embeddings turn text into high-dimensional vectors.",
          performanceSignal: "strong",
          scores: { correctness: 4, depth: 3, reasoning: 3, practicalUnderstanding: 3, tradeoffAwareness: 3 },
          confidence: 0.9,
          strengths: ["Clear definition"],
          gaps: [],
          contradictions: [],
          evidence: [],
          summary: "Good answer.",
          recommendedAction: "new_topic",
          recommendedDifficulty: "intermediate",
        },
      });
    } else if (scenario === "contradiction") {
      state.coveredCurriculumDays = [7, 8, 9, 10];
      state.coveredTopics = [
        "Embeddings Explained",
        "Vector Databases",
        "RAG Architectures",
        "Hybrid Search & Reranking",
      ];
      state.questionCount = 8;
      state.memory.contradictionSignals = [
        {
          id: "cnt_1",
          topic: "Hybrid Search & Reranking",
          earlierClaimId: "cl_1",
          laterClaimId: "cl_2",
          status: "contradictory",
          explanation: "Conflict on reranking efficiency",
          confidence: 0.85,
          recommendedAction: "challenge",
          probedCount: 1,
          resolved: false,
        },
      ];
      state.ledger = addTurnEvidenceToLedger(state.ledger, {
        question: {
          id: "q_1",
          topic: "Hybrid Search & Reranking",
          curriculumDay: 10,
          difficulty: "advanced",
          text: "Explain reranking.",
          action: "new_topic",
          reasonForQuestion: "Debug",
          createdAt: new Date().toISOString(),
        },
        answer: "Reranking is great.",
        assessment: {
          questionId: "q_1",
          answer: "Reranking is great.",
          performanceSignal: "strong",
          scores: { correctness: 3, depth: 3, reasoning: 3, practicalUnderstanding: 3, tradeoffAwareness: 3 },
          confidence: 0.85,
          strengths: ["Solid understanding"],
          gaps: [],
          contradictions: [],
          evidence: [],
          summary: "Solid.",
          recommendedAction: "new_topic",
          recommendedDifficulty: "intermediate",
        },
      });
    } else {
      // Default strong scenario
      state.coveredCurriculumDays = [7, 8, 9, 10];
      state.coveredTopics = [
        "Embeddings Explained",
        "Vector Databases",
        "RAG Architectures",
        "Hybrid Search & Reranking",
      ];
      state.questionCount = 8;
      state.ledger = addTurnEvidenceToLedger(state.ledger, {
        question: {
          id: "q_1",
          topic: "Embeddings Explained",
          curriculumDay: 7,
          difficulty: "advanced",
          text: "Explain HNSW indexing.",
          action: "new_topic",
          reasonForQuestion: "Debug",
          createdAt: new Date().toISOString(),
        },
        answer: "Detailed answer on graph indexing.",
        assessment: {
          questionId: "q_1",
          answer: "Detailed answer on graph indexing.",
          performanceSignal: "strong",
          scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 },
          confidence: 0.9,
          strengths: ["Deep understanding of HNSW graph construction"],
          gaps: [],
          contradictions: [],
          evidence: [],
          summary: "Strong candidate answer.",
          recommendedAction: "deepen",
          recommendedDifficulty: "advanced",
        },
      });
    }

    const report = await buildInterviewReport({
      state,
      candidateName: intel.candidate.name,
      forceFallbackFeedback: true,
    });

    const ledger = state.ledger || createEmptyLedger(state.sessionId);
    const explanations = (
      ["correctness", "depth", "reasoning", "practicalUnderstanding", "tradeoffAwareness"] as CompetencyDimension[]
    ).map((dim) => getScoreExplanation(ledger, dim));

    return NextResponse.json({
      report,
      scoreExplanations: explanations,
    });
  } catch (error) {
    console.error("Debug report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate debug report", details: String(error) },
      { status: 500 }
    );
  }
}
