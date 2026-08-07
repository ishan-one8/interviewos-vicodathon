import { InterviewState } from "@/types/interview";

export interface SessionRepository {
  createSession(session: InterviewState): Promise<InterviewState>;
  getSession(sessionId: string): Promise<InterviewState | null>;
  saveSession(session: InterviewState): Promise<InterviewState>;
  deleteSession(sessionId: string): Promise<boolean>;
}

export class InMemorySessionRepository implements SessionRepository {
  private sessions = new Map<string, InterviewState>();

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
    return this.sessions.delete(sessionId);
  }

  clearAll(): void {
    this.sessions.clear();
  }
}

// Default global repository instance
export const defaultSessionRepository = new InMemorySessionRepository();
