import type { DifficultyLevel } from "./interview";

export type DemoCandidateCard = {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
};

export type SafeAdaptiveContext = {
  action: string;
  label: string;
  safeReason: string;
  topicChanged: boolean;
  previousTopic: string | null;
};

export type InterviewSessionDTO = {
  sessionId: string;
  candidateName: string;
  candidateRole: string;
  status: "active" | "completed";
  turnCount: number;
  currentQuestion: {
    id: string;
    text: string;
    topic: string;
    curriculumDay: number;
    difficulty: DifficultyLevel;
  } | null;
  coveredTopics: string[];
  questionsAnswered: number;
  minimumQuestions: number;
  coveredCurriculumDaysCount: number;
  minimumCurriculumDays: number;
  canComplete: boolean;
  isComplete: boolean;
  adaptiveContext: SafeAdaptiveContext | null;
};
