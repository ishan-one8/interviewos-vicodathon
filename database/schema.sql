-- InterviewOS — persistent session storage (M19, provider-neutral PostgreSQL)
-- Run once against your Postgres database (e.g. the Neon SQL editor, or:
--   psql "$DATABASE_URL" -f database/schema.sql
-- Works on any standard PostgreSQL; no provider-specific extensions required.

CREATE TABLE IF NOT EXISTS interview_sessions (
  id             UUID PRIMARY KEY,
  candidate_id   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active',
  schema_version INTEGER NOT NULL DEFAULT 1,
  version        INTEGER NOT NULL DEFAULT 1,   -- optimistic concurrency token
  state_json     JSONB NOT NULL,               -- full resumable InterviewState
  report_json    JSONB,                         -- cached completed report DTO
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS interview_sessions_status_idx
  ON interview_sessions (status);

-- Credentials stay server-side (DATABASE_URL). Access this table only via the
-- server-side repository; never expose the connection string to the browser.
