import { InterviewState } from "@/types/interview";

export interface SessionRepository {
  createSession(session: InterviewState): Promise<InterviewState>;
  getSession(sessionId: string): Promise<InterviewState | null>;
  saveSession(session: InterviewState): Promise<InterviewState>;
  deleteSession(sessionId: string): Promise<boolean>;
  /**
   * Optional completed-report cache. When present, a generated report DTO is
   * persisted once and served back verbatim (no regeneration on every load).
   * Typed as `unknown` to avoid coupling the repository to the report DTO type.
   */
  saveReport?(sessionId: string, report: unknown): Promise<void>;
  getReport?(sessionId: string): Promise<unknown | null>;
}

export class InMemorySessionRepository implements SessionRepository {
  private sessions = new Map<string, InterviewState>();
  private reports = new Map<string, unknown>();

  async createSession(session: InterviewState): Promise<InterviewState> {
    const clone = JSON.parse(JSON.stringify(session)) as InterviewState;
    this.sessions.set(clone.sessionId, clone);
    return JSON.parse(JSON.stringify(clone)) as InterviewState;
  }

  async getSession(sessionId: string): Promise<InterviewState | null> {
    const found = this.sessions.get(sessionId);
    if (!found) return null;
    return JSON.parse(JSON.stringify(found)) as InterviewState;
  }

  async saveSession(session: InterviewState): Promise<InterviewState> {
    const clone = JSON.parse(JSON.stringify(session)) as InterviewState;
    this.sessions.set(clone.sessionId, clone);
    return JSON.parse(JSON.stringify(clone)) as InterviewState;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    this.reports.delete(sessionId);
    return this.sessions.delete(sessionId);
  }

  async saveReport(sessionId: string, report: unknown): Promise<void> {
    this.reports.set(sessionId, JSON.parse(JSON.stringify(report)));
  }

  async getReport(sessionId: string): Promise<unknown | null> {
    const found = this.reports.get(sessionId);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  clearAll(): void {
    this.sessions.clear();
    this.reports.clear();
  }
}

// Default global repository instance (in-memory). Used by unit tests and as the
// graceful fallback when persistence is not configured.
export const defaultSessionRepository = new InMemorySessionRepository();
