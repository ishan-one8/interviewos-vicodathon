import {
  InterviewState,
  InterviewQuestion,
  AnswerAssessment,
  InterviewTurn,
} from "@/types/interview";
import { LIFECYCLE_STATUS, MAX_QUESTIONS } from "@/lib/interview/constants";
import { Result, ok, err } from "@/lib/interview/errors";
import {
  getAskedQuestionIds,
  getAskedQuestionTexts,
  getCompletionStatus,
} from "@/lib/interview/selectors";
import { isDuplicateQuestionText } from "@/lib/interview/state";

export function addQuestion(
  state: InterviewState,
  question: InterviewQuestion
): Result<InterviewState> {
  if (
    state.status === LIFECYCLE_STATUS.COMPLETED ||
    state.status === LIFECYCLE_STATUS.FAILED
  ) {
    return err(
      "INTERVIEW_ALREADY_CLOSED",
      `Cannot add question to an interview session with status '${state.status}'.`
    );
  }

  if (state.questionCount >= MAX_QUESTIONS) {
    return err(
      "MAX_QUESTIONS_EXCEEDED",
      `Maximum allowed question ceiling of ${MAX_QUESTIONS} reached.`
    );
  }

  if (question.curriculumDay < 1 || question.curriculumDay > 31) {
    return err(
      "INVALID_CURRICULUM_DAY",
      `Curriculum day ${question.curriculumDay} is invalid (must be between 1 and 31).`
    );
  }

  if (getAskedQuestionIds(state).includes(question.id)) {
    return err(
      "DUPLICATE_QUESTION_ID",
      `Question with ID '${question.id}' has already been added to this interview.`
    );
  }

  if (isDuplicateQuestionText(getAskedQuestionTexts(state), question.text)) {
    return err(
      "DUPLICATE_QUESTION_TEXT",
      `A question with identical or near-identical text has already been asked.`
    );
  }

  const isFollowUp =
    Boolean(question.basedOnQuestionId) ||
    ["follow_up", "clarify", "challenge", "deepen"].includes(question.action);

  const coveredCurriculumDays = state.coveredCurriculumDays.includes(
    question.curriculumDay
  )
    ? state.coveredCurriculumDays
    : [...state.coveredCurriculumDays, question.curriculumDay].sort(
        (a, b) => a - b
      );

  const coveredTopics = state.coveredTopics.includes(question.topic)
    ? state.coveredTopics
    : [...state.coveredTopics, question.topic];

  const newTurn: InterviewTurn = {
    question: {
      ...question,
      createdAt: question.createdAt || new Date().toISOString(),
    },
  };

  const nextState: InterviewState = {
    ...state,
    status: LIFECYCLE_STATUS.ACTIVE,
    turns: [...state.turns, newTurn],
    currentQuestion: newTurn.question,
    questionCount: state.questionCount + 1,
    coveredCurriculumDays,
    coveredTopics,
    followUpCount: isFollowUp ? state.followUpCount + 1 : state.followUpCount,
    currentDifficulty: question.difficulty,
  };

  return ok(nextState);
}

export function submitAnswer(
  state: InterviewState,
  questionId: string,
  answerText: string
): Result<InterviewState> {
  if (
    state.status === LIFECYCLE_STATUS.COMPLETED ||
    state.status === LIFECYCLE_STATUS.FAILED
  ) {
    return err(
      "INTERVIEW_ALREADY_CLOSED",
      `Cannot submit answer to an interview session with status '${state.status}'.`
    );
  }

  if (!answerText || !answerText.trim()) {
    return err(
      "EMPTY_ANSWER_TEXT",
      "Answer submission text cannot be empty or whitespace only."
    );
  }

  const turnIndex = state.turns.findIndex((t) => t.question.id === questionId);
  if (turnIndex === -1) {
    return err(
      "QUESTION_NOT_FOUND",
      `Question with ID '${questionId}' was not found in active interview session.`
    );
  }

  const targetTurn = state.turns[turnIndex];
  if (targetTurn.answer) {
    return err(
      "QUESTION_ALREADY_ANSWERED",
      `Question '${questionId}' has already been answered.`
    );
  }

  const updatedTurn: InterviewTurn = {
    ...targetTurn,
    answer: answerText.trim(),
    submittedAt: new Date().toISOString(),
  };

  const updatedTurns = [...state.turns];
  updatedTurns[turnIndex] = updatedTurn;

  const nextState: InterviewState = {
    ...state,
    turns: updatedTurns,
    currentQuestion:
      state.currentQuestion?.id === questionId ? null : state.currentQuestion,
  };

  return ok(nextState);
}

export function attachAssessment(
  state: InterviewState,
  questionId: string,
  assessment: AnswerAssessment
): Result<InterviewState> {
  if (
    state.status === LIFECYCLE_STATUS.COMPLETED ||
    state.status === LIFECYCLE_STATUS.FAILED
  ) {
    return err(
      "INTERVIEW_ALREADY_CLOSED",
      `Cannot attach assessment to an interview session with status '${state.status}'.`
    );
  }

  const turnIndex = state.turns.findIndex((t) => t.question.id === questionId);
  if (turnIndex === -1) {
    return err(
      "QUESTION_NOT_FOUND",
      `Question with ID '${questionId}' was not found in active interview session.`
    );
  }

  const targetTurn = state.turns[turnIndex];
  const updatedTurn: InterviewTurn = {
    ...targetTurn,
    assessment,
  };

  const updatedTurns = [...state.turns];
  updatedTurns[turnIndex] = updatedTurn;

  const nextState: InterviewState = {
    ...state,
    turns: updatedTurns,
    currentDifficulty:
      assessment.recommendedDifficulty || state.currentDifficulty,
  };

  return ok(nextState);
}

export function completeInterview(
  state: InterviewState
): Result<InterviewState> {
  if (state.status === LIFECYCLE_STATUS.COMPLETED) {
    return err(
      "INTERVIEW_ALREADY_CLOSED",
      "Interview is already completed."
    );
  }

  if (state.status === LIFECYCLE_STATUS.FAILED) {
    return err(
      "INTERVIEW_FAILED",
      "Cannot complete a failed interview session."
    );
  }

  const completionStatus = getCompletionStatus(state);
  if (!completionStatus.eligible) {
    return err(
      "COMPLETION_INELIGIBLE",
      `Interview completion requirement not met: ${completionStatus.reasons.join(" ")}`,
      { completionStatus }
    );
  }

  const nextState: InterviewState = {
    ...state,
    status: LIFECYCLE_STATUS.COMPLETED,
    completedAt: new Date().toISOString(),
    currentQuestion: null,
  };

  return ok(nextState);
}

export function failInterview(
  state: InterviewState,
  reason: string
): Result<InterviewState> {
  const nextState: InterviewState = {
    ...state,
    status: LIFECYCLE_STATUS.FAILED,
    failureReason: reason,
    completedAt: new Date().toISOString(),
    currentQuestion: null,
  };

  return ok(nextState);
}
