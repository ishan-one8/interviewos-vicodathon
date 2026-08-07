import { NextRequest, NextResponse } from "next/server";
import { getCandidateIntelligence } from "@/lib/data";
import { createInterviewSession } from "@/lib/interview/state";
import { buildInterviewReport } from "@/lib/report/report";
import { getScoreExplanation } from "@/lib/report/explainability";
import { defaultSessionRepository } from "@/lib/interview/session-repository";
import {
  addTurnEvidenceToLedger,
  addContradictionEvidenceToLedger,
} from "@/lib/interview/evidence";
import { CompetencyDimension } from "@/types/interview";

export async function GET(request: NextRequest) {
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

      const report = await buildInterviewReport({ state });
      const explanations = (
        ["correctness", "depth", "reasoning", "practicalUnderstanding", "tradeoffAwareness"] as CompetencyDimension[]
      ).map((dim) => getScoreExplanation(state.ledger, dim, state));

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
        },
        answer: "Embeddings turn text into high-dimensional vectors.",
        assessment: {
          performanceSignal: "strong",
          scores: { correctness: 4, depth: 3, reasoning: 3, practicalUnderstanding: 3, tradeoffAwareness: 3 },
          confidence: 0.9,
          strengths: ["Clear definition"],
          gaps: [],
          feedback: "Good answer.",
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
          claimA: {
            id: "cl_1",
            turnId: "turn_1",
            questionId: "q_1",
            topic: "Hybrid Search & Reranking",
            curriculumDay: 10,
            statement: "Reranking is never necessary when vector embeddings are fine-tuned.",
            claimType: "design_choice",
            polarity: "supports",
            confidence: 0.85,
            source: "candidate_answer",
            createdAt: new Date().toISOString(),
          },
          claimB: {
            id: "cl_2",
            turnId: "turn_6",
            questionId: "q_6",
            topic: "Hybrid Search & Reranking",
            curriculumDay: 10,
            statement: "Reranking is strictly essential for high precision in all production RAG systems.",
            claimType: "design_choice",
            polarity: "supports",
            confidence: 0.9,
            source: "candidate_answer",
            createdAt: new Date().toISOString(),
          },
          status: "contradictory",
          explanation: "Candidate claimed reranking is never needed, but later claimed it is strictly essential.",
          confidence: 0.85,
          recommendedAction: "clarify",
          probedCount: 1,
          resolved: false,
        },
      ];
      state.ledger = addContradictionEvidenceToLedger(
        state.ledger,
        state.memory.contradictionSignals[0],
        "q_6",
        "turn_6"
      );
    } else if (scenario === "refinement") {
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
          claimA: {
            id: "cl_1",
            turnId: "turn_1",
            questionId: "q_1",
            topic: "Hybrid Search & Reranking",
            curriculumDay: 10,
            statement: "Reranking is unnecessary.",
            claimType: "design_choice",
            polarity: "supports",
            confidence: 0.85,
            source: "candidate_answer",
            createdAt: new Date().toISOString(),
          },
          claimB: {
            id: "cl_2",
            turnId: "turn_6",
            questionId: "q_6",
            topic: "Hybrid Search & Reranking",
            curriculumDay: 10,
            statement: "Reranking is essential for cross-encoder scoring when initial recall vector top-k is large.",
            claimType: "design_choice",
            polarity: "supports",
            confidence: 0.9,
            source: "candidate_answer",
            createdAt: new Date().toISOString(),
          },
          status: "context_changed",
          explanation: "Candidate clarified that reranking is specifically needed when vector recall top-k is large.",
          confidence: 0.9,
          recommendedAction: "ignore",
          probedCount: 1,
          resolved: true,
        },
      ];
    } else if (scenario === "mixed") {
      state.coveredCurriculumDays = [7, 8, 9, 10];
      state.coveredTopics = [
        "Embeddings Explained",
        "Vector Databases",
        "RAG Architectures",
        "Hybrid Search & Reranking",
      ];
      state.questionCount = 8;
      // Add mixed assessments
      state.ledger = addTurnEvidenceToLedger(state.ledger, {
        question: {
          id: "q_1",
          topic: "Embeddings Explained",
          curriculumDay: 7,
          difficulty: "intermediate",
          text: "Explain embeddings.",
          action: "new_topic",
        },
        answer: "Embeddings map text to vectors.",
        assessment: {
          performanceSignal: "partial",
          scores: { correctness: 3, depth: 2, reasoning: 3, practicalUnderstanding: 2, tradeoffAwareness: 1 },
          confidence: 0.8,
          strengths: ["Basic definition"],
          gaps: ["Lacks trade-off awareness"],
          feedback: "Partial answer.",
        },
      });
    } else {
      // Default: Strong scenario
      state.coveredCurriculumDays = [7, 8, 9, 10];
      state.coveredTopics = [
        "Embeddings Explained",
        "Vector Databases",
        "RAG Architectures",
        "Hybrid Search & Reranking",
      ];
      state.questionCount = 8;

      const topicsList = [
        { day: 7, topic: "Embeddings Explained" },
        { day: 8, topic: "Vector Databases" },
        { day: 9, topic: "RAG Architectures" },
        { day: 10, topic: "Hybrid Search & Reranking" },
      ];

      for (let i = 0; i < 8; i++) {
        const top = topicsList[i % topicsList.length];
        state.ledger = addTurnEvidenceToLedger(state.ledger, {
          question: {
            id: `q_${i + 1}`,
            topic: top.topic,
            curriculumDay: top.day,
            difficulty: "advanced",
            text: `Deep question on ${top.topic}`,
            action: "new_topic",
          },
          answer: `Strong technical answer explaining HNSW index parameters M and efConstruction for ${top.topic}.`,
          assessment: {
            performanceSignal: "strong",
            scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 3 },
            confidence: 0.9,
            strengths: [`High mastery of ${top.topic}`],
            gaps: [],
            feedback: "Strong technical answer.",
          },
        });
      }
    }

    const report = await buildInterviewReport({
      state,
      candidateName: intel.candidate.name,
      forceFallbackFeedback: true,
    });

    const explanations = (
      ["correctness", "depth", "reasoning", "practicalUnderstanding", "tradeoffAwareness"] as CompetencyDimension[]
    ).map((dim) => getScoreExplanation(state.ledger, dim, state));

    return NextResponse.json({
      scenario: scenario || "strong",
      report,
      scoreExplanations: explanations,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Report generation error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
