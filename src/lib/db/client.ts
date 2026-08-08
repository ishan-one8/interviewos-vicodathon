import { neon } from "@neondatabase/serverless";

/**
 * Server-only Postgres access. Uses the Neon serverless (HTTP) driver, which is
 * ideal for Next.js / Vercel serverless & cold starts (no pooling to manage).
 *
 * The repository talks to a provider-neutral `SqlExecutor` — parameterized
 * `(text, params) => rows` — so moving to any other Postgres provider later is a
 * one-line change here, with no engine or repository changes.
 *
 * `DATABASE_URL` is read from a non-`NEXT_PUBLIC_` env var and this module is
 * imported only by the server-side repository factory, so credentials never
 * reach the browser. Returns null when unconfigured → graceful in-memory fallback.
 */

export type SqlExecutor = (
  text: string,
  params?: unknown[]
) => Promise<Record<string, unknown>[]>;

const DATABASE_URL = process.env.DATABASE_URL;

let cached: SqlExecutor | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(DATABASE_URL);
}

export function getSqlExecutor(): SqlExecutor | null {
  if (!isDatabaseConfigured()) return null;
  if (cached) return cached;
  const sql = neon(DATABASE_URL as string);
  cached = (text, params = []) =>
    sql.query(text, params) as Promise<Record<string, unknown>[]>;
  return cached;
}
