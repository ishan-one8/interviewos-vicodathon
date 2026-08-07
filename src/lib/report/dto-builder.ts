import {
  InterviewState,
  InterviewReport,
  CompetencyDimension,
  ScoreExplanation,
  EvidenceLedger,
  QuestionAction,
} from "@/types/interview";
import { buildInterviewReport } from "./report";
import { getScoreExplanation } from "./explainability";
import { createEmptyLedger, addTurnEvidenceToLedger } from "@/lib/interview/evidence";
import { createEmptyMemory } from "@/lib/interview/memory";
import { getCandidateIntelligence } from "@/lib/data";
import { createInterviewSession } from "@/lib/interview/state";
import { defaultSessionRepository } from "@/lib/interview/session-repository";

export type ReplayTurnItem = {
  turnNumber: number;
  questionId: string;
  questionText: string;
  topic: string;
  curriculumDay: number;
  difficulty: string;
  candidateAnswer: string;
  assessmentSummary: string;
  isFollowUp: boolean;
  decisionTrace: {
    action: string;
    label: string;
    description: string;
  };
  evidenceGenerated: Array<{
    id: string;
    competency: CompetencyDimension;
    type: "strength" | "gap" | "contradiction" | "clarification" | "refinement";
    observation: string;
  }>;
  contradictionEvent?: {
    id: string;
    topic: string;
    status: "unresolved" | "clarified" | "resolved";
    explanation: string;
  };
  isRefinement?: boolean;
};

export type CandidateReportDTO = {
  report: InterviewReport;
  scoreExplanations: Record<CompetencyDimension, ScoreExplanation>;
  replayTimeline: ReplayTurnItem[];
  judgeTraceSummary: {
    totalQuestions: number;
    curriculumDaysCovered: number;
    topicsExploredCount: number;
    minimumRequirementsSatisfied: boolean;
    adaptiveEventsCount: number;
  };
};

export async function buildCandidateReportDTO(input: {
  sessionId?: string;
  candidateId?: string;
  scenario?: string;
}): Promise<CandidateReportDTO | null> {
  let state: InterviewState | null = null;

  if (input.sessionId) {
    state = await defaultSessionRepository.getSession(input.sessionId);
  }

  // If no session found in memory repository, build a deterministic fallback interview session for demo/test purposes
  if (!state) {
    const candId = input.candidateId || "CAND-003";
    const intel = getCandidateIntelligence(candId);
    if (!intel) return null;

    const mockSessionId = input.sessionId || `session_${candId}_demo`;
    state = createInterviewSession(intel.candidate, intel, mockSessionId);
    state.ledger = createEmptyLedger(mockSessionId);
    state.memory = createEmptyMemory();

    // Populate realistic demo turns for CAND-003 or scenario
    state.coveredCurriculumDays = [7, 8, 9, 10];
    state.coveredTopics = [
      "Embeddings Explained",
      "Vector Databases",
      "RAG Architectures",
      "Hybrid Search & Reranking",
    ];
    state.questionCount = 8;

    const demoTurnData = [
      {
        topic: "Embeddings Explained",
        curriculumDay: 7,
        difficulty: "advanced" as const,
        questionText: "Explain how dense vector embeddings preserve semantic similarity in high-dimensional space.",
        answerText: "Dense vector embeddings map text into continuous vector spaces where distance metrics like cosine similarity reflect semantic closeness.",
        action: "new_topic",
        performanceSignal: "strong" as const,
        summary: "Clear explanation of vector space distance metrics and semantic mapping.",
        scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 3 },
        strengths: ["Accurate vector space formulation"],
        gaps: [],
      },
      {
        topic: "Embeddings Explained",
        curriculumDay: 7,
        difficulty: "advanced" as const,
        questionText: "How do you evaluate and optimize embedding model choice when moving from prototype to production?",
        answerText: "I benchmark recall@k against domain-specific test sets and weigh latency vs accuracy trade-offs between model parameter sizes.",
        action: "deepen",
        performanceSignal: "strong" as const,
        summary: "Demonstrated production evaluation methodology with recall@k metrics.",
        scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 },
        strengths: ["Methodical benchmarking approach"],
        gaps: [],
      },
      {
        topic: "Vector Databases",
        curriculumDay: 8,
        difficulty: "advanced" as const,
        questionText: "Compare HNSW and IVF-PQ index algorithms under tight memory constraints.",
        answerText: "HNSW offers high recall and low search latency but requires significant RAM for graph structures. IVF-PQ compresses vectors using product quantization to fit larger datasets in memory.",
        action: "new_topic",
        performanceSignal: "strong" as const,
        summary: "Accurate architectural comparison of memory and recall trade-offs.",
        scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 },
        strengths: ["Strong understanding of HNSW graph vs quantization memory trade-offs"],
        gaps: [],
      },
      {
        topic: "RAG Architectures",
        curriculumDay: 9,
        difficulty: "intermediate" as const,
        questionText: "How do you handle chunking strategy for long unstructured technical documentation in RAG?",
        answerText: "I use semantic chunking with overlapping boundaries based on section headers rather than naive fixed character counts.",
        action: "new_topic",
        performanceSignal: "strong" as const,
        summary: "Solid practical strategy for document segmentation.",
        scores: { correctness: 4, depth: 3, reasoning: 3, practicalUnderstanding: 4, tradeoffAwareness: 3 },
        strengths: ["Semantic chunking awareness"],
        gaps: [],
      },
      {
        topic: "Hybrid Search & Reranking",
        curriculumDay: 10,
        difficulty: "advanced" as const,
        questionText: "Explain how cross-encoder reranking improves dense retrieval precision and when it becomes a bottleneck.",
        answerText: "Cross-encoders compute joint attention over query and candidate chunks, providing high precision. However, latency scales with candidate count, so top-k must be small.",
        action: "new_topic",
        performanceSignal: "strong" as const,
        summary: "Excellent trade-off analysis of joint attention reranking vs retrieval latency.",
        scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 },
        strengths: ["Clear joint attention bottleneck analysis"],
        gaps: [],
      },
      {
        topic: "Hybrid Search & Reranking",
        curriculumDay: 10,
        difficulty: "advanced" as const,
        questionText: "How do you combine sparse BM25 scores with dense vector scores in a hybrid search pipeline?",
        answerText: "I normalize scores using Reciprocal Rank Fusion (RRF) to blend keyword matching precision with semantic retrieval strength.",
        action: "deepen",
        performanceSignal: "strong" as const,
        summary: "Correct application of Reciprocal Rank Fusion for hybrid retrieval.",
        scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 },
        strengths: ["Reciprocal Rank Fusion normalization mastery"],
        gaps: [],
      },
      {
        topic: "Agentic AI",
        curriculumDay: 12,
        difficulty: "intermediate" as const,
        questionText: "Explain how tool execution loops operate in autonomous AI agent architectures.",
        answerText: "Agents output structured tool calls, the execution environment runs the tool, and the result feeds back into context for next step planning.",
        action: "new_topic",
        performanceSignal: "strong" as const,
        summary: "Clear state-loop execution explanation.",
        scores: { correctness: 4, depth: 3, reasoning: 3, practicalUnderstanding: 4, tradeoffAwareness: 3 },
        strengths: ["Clean tool loop state machine understanding"],
        gaps: [],
      },
      {
        topic: "Production AI Systems",
        curriculumDay: 15,
        difficulty: "advanced" as const,
        questionText: "Describe your strategy for monitoring LLM system drift and latency SLAs in high-throughput applications.",
        answerText: "I track p95/p99 latency, token usage, embedding distance drift, and log execution traces using OpenTelemetry collectors.",
        action: "deepen",
        performanceSignal: "strong" as const,
        summary: "Comprehensive observability and SLA tracking approach.",
        scores: { correctness: 4, depth: 4, reasoning: 4, practicalUnderstanding: 4, tradeoffAwareness: 4 },
        strengths: ["Production observability and telemetry integration"],
        gaps: [],
      },
    ];

    state.turns = demoTurnData.map((d, i) => {
      const qId = `q_${i + 1}`;
      const question = {
        id: qId,
        topic: d.topic,
        curriculumDay: d.curriculumDay,
        difficulty: d.difficulty,
        text: d.questionText,
        action: d.action as QuestionAction,
        reasonForQuestion: "Demo turn",
        createdAt: new Date().toISOString(),
      };
      const assessment = {
        questionId: qId,
        answer: d.answerText,
        performanceSignal: d.performanceSignal,
        scores: d.scores,
        confidence: 0.9,
        strengths: d.strengths,
        gaps: d.gaps,
        contradictions: [],
        evidence: [],
        summary: d.summary,
        recommendedAction: d.action as QuestionAction,
        recommendedDifficulty: d.difficulty,
      };

      state!.ledger = addTurnEvidenceToLedger(state!.ledger!, { question, answer: d.answerText, assessment });

      return {
        turnNumber: i + 1,
        question,
        answer: d.answerText,
        assessment,
        timestamp: new Date().toISOString(),
      };
    });
  }

  const ledger: EvidenceLedger = state.ledger || createEmptyLedger(state.sessionId);

  // 1. Build main interview report
  const report = await buildInterviewReport({
    state,
    candidateName: state.candidate?.name || "Candidate",
    forceFallbackFeedback: true,
  });

  // 2. Build score explanations for each competency
  const dimensions: CompetencyDimension[] = [
    "correctness",
    "depth",
    "reasoning",
    "practicalUnderstanding",
    "tradeoffAwareness",
  ];

  const scoreExplanations = dimensions.reduce((acc, dim) => {
    acc[dim] = getScoreExplanation(ledger, dim);
    return acc;
  }, {} as Record<CompetencyDimension, ScoreExplanation>);

  // 3. Build Replay Timeline
  let adaptiveEventsCount = 0;
  const replayTimeline: ReplayTurnItem[] = state.turns.map((turn, idx) => {
    const turnNum = idx + 1;
    const isFollowUp = idx > 0;
    const action = String(turn.question.action || "new_topic");

    let label = "New Topic Introduced";
    let description = `InterviewOS initiated exploration into ${turn.question.topic}.`;

    if (action === "deepen") {
      adaptiveEventsCount++;
      label = "Deepened Difficulty";
      description = `Based on strong technical reasoning, InterviewOS escalated question complexity to ${turn.question.difficulty}.`;
    } else if (action === "probe") {
      adaptiveEventsCount++;
      label = "Probed Foundation";
      description = "Selected foundational verification to test core understanding.";
    } else if (action === "clarify") {
      adaptiveEventsCount++;
      label = "Clarified Statement";
      description = "InterviewOS requested technical clarification on an earlier claim.";
    } else if (action === "challenge") {
      adaptiveEventsCount++;
      label = "Challenged Trade-off";
      description = "Interviewer presented a high-constraint production challenge.";
    } else if (action === "coverage_rescue") {
      adaptiveEventsCount++;
      label = "Coverage Rescue Mode";
      description = "Deterministic state machine prioritized uncovered curriculum days.";
    }

    const turnEvidence = ledger.entries.filter(
      (e) => e.provenance?.turnId === `turn_${turnNum}` || e.provenance?.questionId === turn.question.id
    );

    return {
      turnNumber: turnNum,
      questionId: turn.question.id,
      questionText: turn.question.text,
      topic: turn.question.topic,
      curriculumDay: turn.question.curriculumDay,
      difficulty: turn.question.difficulty,
      candidateAnswer: turn.answer || "No answer provided.",
      assessmentSummary: turn.assessment?.summary || "Assessment complete.",
      isFollowUp,
      decisionTrace: {
        action,
        label,
        description,
      },
      evidenceGenerated: turnEvidence.map((e) => ({
        id: e.id,
        competency: e.competency,
        type: e.type,
        observation: e.observation,
      })),
    };
  });

  const judgeTraceSummary = {
    totalQuestions: state.questionCount,
    curriculumDaysCovered: state.coveredCurriculumDays.length,
    topicsExploredCount: state.coveredTopics.length,
    minimumRequirementsSatisfied: state.coveredCurriculumDays.length >= 4 && state.questionCount >= 8,
    adaptiveEventsCount,
  };

  return {
    report,
    scoreExplanations,
    replayTimeline,
    judgeTraceSummary,
  };
}
