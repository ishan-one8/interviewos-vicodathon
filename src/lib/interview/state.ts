import {
  CandidateProfile,
  CandidateIntelligenceReport,
  InterviewState,
} from "@/types/interview";
import { LIFECYCLE_STATUS } from "@/lib/interview/constants";

export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,?!'"`;:-]/g, " ")
    .replace(/\s+/g, " ");
}

export function isDuplicateQuestionText(
  existingTexts: string[],
  newText: string
): boolean {
  const normalizedNew = normalizeQuestionText(newText);
  if (!normalizedNew) return false;
  return existingTexts.some(
    (existing) => normalizeQuestionText(existing) === normalizedNew
  );
}

export function createInterviewSession(
  candidate: CandidateProfile,
  intelligenceReport: CandidateIntelligenceReport,
  customSessionId?: string
): InterviewState {
  const sessionId =
    customSessionId ||
    `session_${candidate.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    sessionId,
    candidate,
    intelligenceReport,
    skillMap: intelligenceReport.skillMap,
    status: LIFECYCLE_STATUS.ACTIVE,
    startedAt: new Date().toISOString(),
    completedAt: null,
    turns: [],
    currentQuestion: null,
    questionCount: 0,
    coveredCurriculumDays: [],
    coveredTopics: [],
    followUpCount: 0,
    currentDifficulty: intelligenceReport.recommendedStartingDifficulty,
    suggestedStartingTopics: intelligenceReport.suggestedStartingTopics,
    failureReason: null,
  };
}
