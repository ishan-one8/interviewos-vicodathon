import type { InterviewState } from "@/types/interview";
import type { SessionRepository } from "./session-repository";
import type { SqlExecutor } from "@/lib/db/client";
import {
  SCHEMA_VERSION,
  PersistenceError,
  validatePersistedState,
} from "./persistence";

const TABLE = "interview_sessions";

/** jsonb columns come back parsed by the driver, but tolerate a string too. */
function asJson(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

/**
 * Generic PostgreSQL session repository (Neon in production). Provider-neutral:
 * it depends only on a parameterized `SqlExecutor`, so it works against any
 * Postgres. Persists the full resumable InterviewState as JSONB plus an optional
 * completed-report cache, with simple optimistic concurrency via a `version`
 * column.
 *
 * Concurrency correctness relies on the atomic compare-and-swap
 * `UPDATE ... WHERE id AND version = expected RETURNING version`: of two
 * concurrent writers only one updates a row; the loser gets TURN_CONFLICT. The
 * in-process version map only avoids an extra read on the same-request path.
 */
export class PostgresSessionRepository implements SessionRepository {
  private versions = new Map<string, number>();

  constructor(private readonly sql: SqlExecutor) {}

  async createSession(session: InterviewState): Promise<InterviewState> {
    const now = new Date().toISOString();
    try {
      await this.sql(
        `INSERT INTO ${TABLE}
           (id, candidate_id, status, schema_version, version, state_json, report_json, created_at, updated_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)`,
        [
          session.sessionId,
          session.candidate?.id ?? null,
          session.status,
          SCHEMA_VERSION,
          1,
          JSON.stringify(session),
          null,
          now,
          now,
          session.completedAt ?? null,
        ]
      );
    } catch {
      throw new PersistenceError("SESSION_UNAVAILABLE", "Could not create session.");
    }
    this.versions.set(session.sessionId, 1);
    return session;
  }

  async getSession(sessionId: string): Promise<InterviewState | null> {
    let rows: Record<string, unknown>[];
    try {
      rows = await this.sql(
        `SELECT state_json, version FROM ${TABLE} WHERE id = $1`,
        [sessionId]
      );
    } catch {
      throw new PersistenceError("SESSION_UNAVAILABLE", "Could not load session.");
    }
    if (!rows.length) return null;

    try {
      const state = validatePersistedState(asJson(rows[0].state_json));
      this.versions.set(sessionId, Number(rows[0].version));
      return state;
    } catch {
      // Corrupt / out-of-schema payload — treat as unavailable, never crash.
      return null;
    }
  }

  async saveSession(session: InterviewState): Promise<InterviewState> {
    const id = session.sessionId;

    let expected = this.versions.get(id);
    if (expected === undefined) {
      let rows: Record<string, unknown>[];
      try {
        rows = await this.sql(`SELECT version FROM ${TABLE} WHERE id = $1`, [id]);
      } catch {
        throw new PersistenceError("SESSION_UNAVAILABLE", "Could not read session version.");
      }
      if (!rows.length) throw new PersistenceError("SESSION_NOT_FOUND", "Session no longer exists.");
      expected = Number(rows[0].version);
    }

    const next = expected + 1;
    const now = new Date().toISOString();

    let rows: Record<string, unknown>[];
    try {
      rows = await this.sql(
        `UPDATE ${TABLE}
            SET state_json = $1::jsonb, status = $2, version = $3, updated_at = $4, completed_at = $5
          WHERE id = $6 AND version = $7
          RETURNING version`,
        [
          JSON.stringify(session),
          session.status,
          next,
          now,
          session.completedAt ?? null,
          id,
          expected,
        ]
      );
    } catch {
      throw new PersistenceError("SESSION_UNAVAILABLE", "Could not save session.");
    }

    if (!rows.length) {
      // Version moved underneath us — a concurrent write won.
      this.versions.delete(id);
      throw new PersistenceError("TURN_CONFLICT", "Session was modified concurrently.");
    }

    this.versions.set(id, next);
    return session;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    this.versions.delete(sessionId);
    try {
      await this.sql(`DELETE FROM ${TABLE} WHERE id = $1`, [sessionId]);
      return true;
    } catch {
      return false;
    }
  }

  async saveReport(sessionId: string, report: unknown): Promise<void> {
    try {
      await this.sql(
        `UPDATE ${TABLE} SET report_json = $1::jsonb, updated_at = $2 WHERE id = $3`,
        [JSON.stringify(report), new Date().toISOString(), sessionId]
      );
    } catch {
      throw new PersistenceError("SESSION_UNAVAILABLE", "Could not persist report.");
    }
  }

  async getReport(sessionId: string): Promise<unknown | null> {
    let rows: Record<string, unknown>[];
    try {
      rows = await this.sql(`SELECT report_json FROM ${TABLE} WHERE id = $1`, [sessionId]);
    } catch {
      throw new PersistenceError("SESSION_UNAVAILABLE", "Could not load report.");
    }
    if (!rows.length || rows[0].report_json == null) return null;
    return asJson(rows[0].report_json);
  }
}
