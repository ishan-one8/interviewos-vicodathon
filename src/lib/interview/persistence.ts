import { z } from "zod";
import type { InterviewState } from "@/types/interview";

/**
 * Persistence layer contracts — schema versioning, Zod validation of stored
 * JSON, and safe error codes. The engine's internal object shapes (candidate,
 * intelligenceReport, memory, ledger, turns) are validated at the envelope +
 * critical-field level and passed through loosely: we never blindly cast raw
 * database JSON, but we also do not re-declare the entire engine type here.
 */

export const SCHEMA_VERSION = 1;

/** Safe, client-facing error codes. Never leak SQL / stack traces. */
export type SafeErrorCode =
  | "SESSION_NOT_FOUND"
  | "SESSION_UNAVAILABLE"
  | "TURN_CONFLICT"
  | "INVALID_REQUEST";

export class PersistenceError extends Error {
  code: SafeErrorCode;
  constructor(code: SafeErrorCode, message?: string) {
    super(message || code);
    this.name = "PersistenceError";
    this.code = code;
  }
}

const InterviewStatusSchema = z.enum(["planning", "active", "completed", "failed"]);
const DifficultySchema = z.enum(["foundation", "intermediate", "advanced", "debugging"]);

/**
 * Envelope-level validation of a persisted InterviewState. Critical fields are
 * checked strictly; nested engine internals are accepted with `.passthrough()`
 * / loose objects so we don't couple persistence to the full engine type while
 * still rejecting structurally-broken payloads.
 */
const PersistedStateSchema = z
  .object({
    sessionId: z.string().min(1),
    status: InterviewStatusSchema,
    startedAt: z.string(),
    completedAt: z.string().nullable(),
    questionCount: z.number().int().nonnegative(),
    coveredCurriculumDays: z.array(z.number()),
    coveredTopics: z.array(z.string()),
    turns: z.array(z.object({}).passthrough()),
    currentQuestion: z
      .object({
        id: z.string(),
        text: z.string(),
        topic: z.string(),
        curriculumDay: z.number(),
        difficulty: DifficultySchema,
      })
      .passthrough()
      .nullable(),
    candidate: z.object({ id: z.string() }).passthrough(),
    intelligenceReport: z.object({}).passthrough(),
  })
  .passthrough();

/**
 * Validate raw DB JSON before restoring. Throws PersistenceError
 * SESSION_UNAVAILABLE on structural failure so callers surface a safe page.
 */
export function validatePersistedState(raw: unknown): InterviewState {
  const parsed = PersistedStateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new PersistenceError("SESSION_UNAVAILABLE", "Stored session failed schema validation.");
  }
  // Validated envelope; the engine produced the deep shape, so it is safe to
  // treat as InterviewState after the structural check above.
  return parsed.data as unknown as InterviewState;
}

/** Deep clone for storage boundaries (avoids sharing mutable references). */
export function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Generate an opaque, non-guessable session id that leaks no candidate info. */
export function generateSecureSessionId(): string {
  return globalThis.crypto.randomUUID();
}
