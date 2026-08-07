import { getCandidateById } from "@/lib/data";
import {
  startAdaptiveInterview,
  submitInterviewAnswer,
  finishInterviewSession,
  getInternalSnapshot,
  canFinishInterview,
} from "@/lib/interview/orchestrator";
import { buildSafeCandidateSnapshot } from "@/lib/interview/orchestrator-snapshots";
import { buildInterviewReport } from "@/lib/report/report";
import { OfficialApiRequest, OfficialApiResponse } from "@/lib/api/contract";
import { buildOfficialResponse } from "@/lib/api/response-adapter";
import { ApiError } from "@/lib/api/errors";

export async function handleOfficialInterviewRequest(
  payload: OfficialApiRequest
): Promise<OfficialApiResponse> {
  // 1. Candidate validation
  if (payload.candidateId) {
    const candidate = getCandidateById(payload.candidateId);
    if (!candidate) {
      throw new ApiError(
        404,
        "CANDIDATE_NOT_FOUND",
        `Candidate '${payload.candidateId}' not found in official candidates dataset.`
      );
    }
  }

  // 2. Scenario A: Start new interview session
  if (!payload.sessionId) {
    if (!payload.candidateId) {
      throw new ApiError(
        400,
        "MISSING_CANDIDATE_ID",
        "A valid 'candidateId' is required to initialize a new interview session."
      );
    }

    const startResult = await startAdaptiveInterview(payload.candidateId);

    if (!startResult.success) {
      throw new ApiError(
        400,
        "SESSION_START_FAILED",
        startResult.error || "Failed to start adaptive interview session."
      );
    }

    return buildOfficialResponse(startResult);
  }

  // 3. Scenario B: Continue existing session
  const internalSnap = await getInternalSnapshot(payload.sessionId);
  if (!internalSnap) {
    throw new ApiError(
      404,
      "SESSION_NOT_FOUND",
      `Session '${payload.sessionId}' not found.`
    );
  }

  const { state } = internalSnap;

  // Check if session is already completed
  if (state.status === "completed") {
    const report = await buildInterviewReport({
      state,
      candidateName: state.candidate.name,
    });

    const snapshot = buildSafeCandidateSnapshot(state);
    return buildOfficialResponse(
      {
        success: true,
        snapshot,
        events: internalSnap.events,
        internalSnapshot: internalSnap,
        report,
      },
      snapshot,
      report
    );
  }

  // 4. Scenario C: Submit candidate answer
  if (payload.answer !== undefined && payload.answer !== null) {
    const targetQuestionId =
      payload.questionId || state.currentQuestion?.id;

    if (!targetQuestionId) {
      throw new ApiError(
        400,
        "MISSING_QUESTION_ID",
        "No pending question found in session to answer."
      );
    }

    // Idempotency check: if already answered this question in a previous turn
    const alreadyAnsweredTurn = state.turns.find(
      (t) => t.question.id === targetQuestionId && t.answer
    );

    if (alreadyAnsweredTurn) {
      // Return current session state without duplicating turn processing
      const currentReport = canFinishInterview(state)
        ? await buildInterviewReport({ state, candidateName: state.candidate.name })
        : null;

      const snapshot = buildSafeCandidateSnapshot(state);
      return buildOfficialResponse(
        {
          success: true,
          snapshot,
          events: internalSnap.events,
          internalSnapshot: internalSnap,
          report: currentReport || undefined,
        },
        snapshot,
        currentReport
      );
    }

    // Process answer through adaptive orchestrator loop
    const answerResult = await submitInterviewAnswer({
      sessionId: payload.sessionId,
      questionId: targetQuestionId,
      answer: payload.answer,
    });

    if (!answerResult.success) {
      throw new ApiError(
        400,
        "ANSWER_SUBMISSION_FAILED",
        answerResult.error || "Failed to process candidate answer."
      );
    }

    // Check if interview should finish now
    const updatedSnap = await getInternalSnapshot(payload.sessionId);
    if (updatedSnap && canFinishInterview(updatedSnap.state)) {
      const finishRes = await finishInterviewSession(payload.sessionId);
      if (finishRes.success) {
        return buildOfficialResponse(finishRes);
      }
    }

    return buildOfficialResponse(answerResult);
  }

  // 5. Scenario D: Read current session status without submitting answer
  const currentReport = canFinishInterview(state)
    ? await buildInterviewReport({ state, candidateName: state.candidate.name })
    : null;

  const snapshot = buildSafeCandidateSnapshot(state);
  return buildOfficialResponse(
    {
      success: true,
      snapshot,
      events: internalSnap.events,
      internalSnapshot: internalSnap,
      report: currentReport || undefined,
    },
    snapshot,
    currentReport
  );
}
