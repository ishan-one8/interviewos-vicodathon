import { NextRequest, NextResponse } from "next/server";
import { guardDebugRoute } from "@/lib/security/debug-policy";
import { getCandidateIntelligence } from "@/lib/data";
import { createInterviewSession } from "@/lib/interview/state";
import {
  addQuestion,
  submitAnswer,
  completeInterview,
} from "@/lib/interview/transitions";
import { getCompletionStatus } from "@/lib/interview/selectors";
import { InterviewQuestion } from "@/types/interview";

export async function GET(request: NextRequest) {
  const guarded = guardDebugRoute();
  if (guarded) return guarded;

  try {
    const searchParams = request.nextUrl.searchParams;
    const candidateId =
      searchParams.get("candidateId") || searchParams.get("id") || "CAND-003";

    const intelligenceReport = getCandidateIntelligence(candidateId);
    if (!intelligenceReport) {
      return NextResponse.json(
        { status: "error", error: `Candidate '${candidateId}' not found.` },
        { status: 404 }
      );
    }

    // A. Initial Session State
    let session = createInterviewSession(
      intelligenceReport.candidate,
      intelligenceReport,
      `debug_session_${candidateId}`
    );
    const initialSessionStateSnapshot = { ...session };

    // B. Adding initial questions & answers (Turn 1..3)
    const mockQuestions: InterviewQuestion[] = [
      {
        id: "q-1",
        text: "How do vector embeddings map high-dimensional text to dense vectors?",
        curriculumDay: 7,
        topic: "Embeddings Explained",
        difficulty: "advanced",
        action: "new_topic",
        reasonForQuestion: "Test baseline embedding understanding.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "q-2",
        text: "What vector indexing algorithms are used in ChromaDB for fast ANN search?",
        curriculumDay: 8,
        topic: "Vector Databases Overview",
        difficulty: "advanced",
        action: "new_topic",
        reasonForQuestion: "Test vector database indexing familiarity.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "q-3",
        text: "How does a query router decide between SQL, vector search, or hybrid retrieval?",
        curriculumDay: 10,
        topic: "Retrieval & Matching Engine",
        difficulty: "intermediate",
        action: "new_topic",
        reasonForQuestion: "Verify hybrid retrieval engine architecture.",
        createdAt: new Date().toISOString(),
      },
    ];

    for (const q of mockQuestions) {
      const qRes = addQuestion(session, q);
      if (qRes.ok) {
        session = qRes.value;
        const aRes = submitAnswer(
          session,
          q.id,
          `Candidate response explaining concepts for ${q.topic}.`
        );
        if (aRes.ok) session = aRes.value;
      }
    }
    const stateAfter3TurnsSnapshot = { ...session };

    // C. Early Completion Attempt (7 questions / 4 days) -> REJECTED
    let earlyState = { ...session };
    const earlyQuestions: InterviewQuestion[] = [
      {
        id: "q-4",
        text: "Explain prompt engineering zero-shot vs few-shot prompting.",
        curriculumDay: 12,
        topic: "Prompt Engineering Fundamentals",
        difficulty: "intermediate",
        action: "new_topic",
        reasonForQuestion: "Test prompt design techniques.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "q-5",
        text: "How do you handle schema validation with Pydantic in tool calling?",
        curriculumDay: 13,
        topic: "Function Calling & Structured Outputs",
        difficulty: "intermediate",
        action: "new_topic",
        reasonForQuestion: "Test structured output validation.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "q-6",
        text: "What is the difference between ReAct agent loop and linear chain?",
        curriculumDay: 21,
        topic: "LangChain Agents",
        difficulty: "intermediate",
        action: "new_topic",
        reasonForQuestion: "Test agentic reasoning loop.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "q-7",
        text: "How do multi-agent systems coordinate using router patterns?",
        curriculumDay: 22,
        topic: "Multi-Agent Orchestration",
        difficulty: "intermediate",
        action: "new_topic",
        reasonForQuestion: "Test multi-agent delegation.",
        createdAt: new Date().toISOString(),
      },
    ];

    for (const q of earlyQuestions) {
      const qRes = addQuestion(earlyState, q);
      if (qRes.ok) {
        earlyState = qRes.value;
        const aRes = submitAnswer(
          earlyState,
          q.id,
          `Candidate response for ${q.topic}.`
        );
        if (aRes.ok) earlyState = aRes.value;
      }
    }

    const earlyCompletionResult = completeInterview(earlyState);

    // D. Coverage Failure Rejection (8 questions across ONLY 3 unique days: 7, 8, 10) -> REJECTED
    let coverageState = createInterviewSession(
      intelligenceReport.candidate,
      intelligenceReport,
      `debug_coverage_session_${candidateId}`
    );
    const lowCoverageQuestions: InterviewQuestion[] = [
      { id: "cq-1", text: "Day 7 Q1 text", curriculumDay: 7, topic: "Embeddings", difficulty: "intermediate", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      { id: "cq-2", text: "Day 7 Q2 text", curriculumDay: 7, topic: "Embeddings", difficulty: "intermediate", action: "follow_up", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      { id: "cq-3", text: "Day 7 Q3 text", curriculumDay: 7, topic: "Embeddings", difficulty: "intermediate", action: "follow_up", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      { id: "cq-4", text: "Day 8 Q1 text", curriculumDay: 8, topic: "Vector DB", difficulty: "intermediate", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      { id: "cq-5", text: "Day 8 Q2 text", curriculumDay: 8, topic: "Vector DB", difficulty: "intermediate", action: "follow_up", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      { id: "cq-6", text: "Day 8 Q3 text", curriculumDay: 8, topic: "Vector DB", difficulty: "intermediate", action: "follow_up", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      { id: "cq-7", text: "Day 10 Q1 text", curriculumDay: 10, topic: "Retrieval", difficulty: "intermediate", action: "new_topic", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
      { id: "cq-8", text: "Day 10 Q2 text", curriculumDay: 10, topic: "Retrieval", difficulty: "intermediate", action: "follow_up", reasonForQuestion: "Test", createdAt: new Date().toISOString() },
    ];

    for (const q of lowCoverageQuestions) {
      const qRes = addQuestion(coverageState, q);
      if (qRes.ok) {
        coverageState = qRes.value;
        const aRes = submitAnswer(coverageState, q.id, "Candidate response");
        if (aRes.ok) coverageState = aRes.value;
      }
    }
    const coverageCompletionResult = completeInterview(coverageState);

    // E. Valid Structural Completion (8 questions across 5 unique days: 7, 8, 10, 12, 23) -> ELIGIBLE & COMPLETED
    let validState = { ...earlyState };
    const valid8thQuestion: InterviewQuestion = {
      id: "q-8",
      text: "How does Model Context Protocol (MCP) structure tool schemas and server connections?",
      curriculumDay: 23,
      topic: "Model Context Protocol (MCP)",
      difficulty: "advanced",
      action: "new_topic",
      reasonForQuestion: "Test MCP architecture.",
      createdAt: new Date().toISOString(),
    };
    const add8thRes = addQuestion(validState, valid8thQuestion);
    if (add8thRes.ok) {
      validState = add8thRes.value;
      const aRes = submitAnswer(
        validState,
        "q-8",
        "MCP standardizes client-server RPC schemas over JSON-RPC."
      );
      if (aRes.ok) validState = aRes.value;
    }
    const validCompletionResult = completeInterview(validState);

    // F. Duplicate Question ID Attempt -> REJECTED
    const duplicateIdAttempt = addQuestion(validState, {
      id: "q-8", // duplicate ID!
      text: "Brand new question text",
      curriculumDay: 15,
      topic: "Fine-Tuning",
      difficulty: "intermediate",
      action: "new_topic",
      reasonForQuestion: "Duplicate test",
      createdAt: new Date().toISOString(),
    });

    // G. Unknown Question Answer Attempt -> REJECTED
    const unknownAnswerAttempt = submitAnswer(
      validState,
      "non_existent_question_id",
      "Answering phantom question."
    );

    return NextResponse.json({
      status: "success",
      simulation: {
        A_initialSessionState: {
          sessionId: initialSessionStateSnapshot.sessionId,
          candidateName: initialSessionStateSnapshot.candidate.name,
          status: initialSessionStateSnapshot.status,
          questionCount: initialSessionStateSnapshot.questionCount,
          coveredCurriculumDays: initialSessionStateSnapshot.coveredCurriculumDays,
        },
        B_after3Turns: {
          questionCount: stateAfter3TurnsSnapshot.questionCount,
          coveredCurriculumDays: stateAfter3TurnsSnapshot.coveredCurriculumDays,
          coveredTopics: stateAfter3TurnsSnapshot.coveredTopics,
          currentDifficulty: stateAfter3TurnsSnapshot.currentDifficulty,
        },
        C_earlyCompletionAttempt: {
          description: "Attempting completeInterview() with 7 questions asked (MIN_QUESTIONS = 8)",
          attemptResult: earlyCompletionResult,
          statusSnapshot: getCompletionStatus(earlyState),
        },
        D_coverageFailureAttempt: {
          description: "Attempting completeInterview() with 8 questions across only 3 curriculum days (MIN_CURRICULUM_DAYS = 4)",
          attemptResult: coverageCompletionResult,
          statusSnapshot: getCompletionStatus(coverageState),
        },
        E_validCompletionSuccess: {
          description: "Attempting completeInterview() with 8 questions across 5 curriculum days",
          attemptResult: validCompletionResult,
          completedSessionStatus: validCompletionResult.ok ? validCompletionResult.value.status : null,
          completedAt: validCompletionResult.ok ? validCompletionResult.value.completedAt : null,
          statusSnapshot: validCompletionResult.ok ? getCompletionStatus(validCompletionResult.value) : null,
        },
        F_duplicateQuestionIdAttempt: {
          description: "Adding question with pre-existing ID 'q-8'",
          result: duplicateIdAttempt,
        },
        G_unknownQuestionAnswerAttempt: {
          description: "Submitting answer for unknown question ID 'non_existent_question_id'",
          result: unknownAnswerAttempt,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Simulation error";
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    );
  }
}
