import type { SessionRepository } from "./session-repository";
import { defaultSessionRepository } from "./session-repository";
import { getSqlExecutor, isDatabaseConfigured } from "@/lib/db/client";
import { PostgresSessionRepository } from "./postgres-session-repository";

/**
 * Chooses the active session repository for server-side (route) code.
 *
 * - Postgres (persistent) when DATABASE_URL is set — Neon in production, but any
 *   Postgres works since the repository uses generic parameterized SQL.
 * - In-memory otherwise (local dev without a DB, and unit tests).
 *
 * This module is the ONLY place that wires a database into the request path; the
 * engine (orchestrator, dto-builder) stays storage-agnostic and defaults to the
 * in-memory repository, so tests never touch a database.
 */

let cached: SessionRepository | null = null;

export function isPersistenceEnabled(): boolean {
  return isDatabaseConfigured();
}

export function getSessionRepository(): SessionRepository {
  if (cached) return cached;
  const sql = getSqlExecutor();
  cached = sql ? new PostgresSessionRepository(sql) : defaultSessionRepository;
  return cached;
}
