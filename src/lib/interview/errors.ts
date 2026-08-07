export type InterviewErrorCode =
  | "DUPLICATE_QUESTION_ID"
  | "DUPLICATE_QUESTION_TEXT"
  | "QUESTION_NOT_FOUND"
  | "QUESTION_ALREADY_ANSWERED"
  | "INTERVIEW_ALREADY_CLOSED"
  | "COMPLETION_INELIGIBLE"
  | "INVALID_CURRICULUM_DAY"
  | "EMPTY_ANSWER_TEXT"
  | "MAX_QUESTIONS_EXCEEDED"
  | "INTERVIEW_FAILED"
  | "INVALID_ASSESSMENT"
  | "GEMINI_KEY_MISSING"
  | "GEMINI_EMPTY_RESPONSE"
  | "GEMINI_API_ERROR";

export interface InterviewStateError {
  code: InterviewErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type Result<T, E = InterviewStateError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E = InterviewStateError>(
  code: InterviewErrorCode,
  message: string,
  details?: Record<string, unknown>
): Result<never, E> {
  return {
    ok: false,
    error: { code, message, details } as E,
  };
}
