import { z } from "zod";

// ==========================================
// 1. Difficulty & Action Enums
// ==========================================

export type DifficultyLevel =
  | "foundation"
  | "intermediate"
  | "advanced"
  | "debugging"
  | "architecture"
  | "tradeoff";

export type QuestionAction =
  | "new_topic"
  | "follow_up"
  | "clarify"
  | "challenge"
  | "deepen"
  | "finish";

export type InterviewStatus =
  | "planning"
  | "interviewing"
  | "completed";

// ==========================================
// 2. Raw Organizer JSON Schemas (Zod)
// ==========================================

export const RawCurriculumModuleSchema = z.object({
  n: z.number(),
  title: z.string(),
  days: z.array(z.number()),
});

export const RawCurriculumDaySchema = z.object({
  day: z.number(),
  title: z.string(),
  type: z.string().optional().default("BUILD"),
  tools: z.array(z.string()).optional().default([]),
  objectives: z.array(z.string()).optional().default([]),
});

export const RawCurriculumSchema = z.object({
  cohort: z.string().optional().default("AI Cohort"),
  modules: z.array(RawCurriculumModuleSchema).optional().default([]),
  days: z.array(RawCurriculumDaySchema).optional().default([]),
});

export const RawCandidateMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  jobRole: z.string(),
  yearsExperience: z.number(),
  education: z.string(),
  status: z.string().optional().default("COMPLETED"),
});

export const RawCandidateMissionSchema = z.object({
  day: z.number(),
  title: z.string(),
  passed: z.boolean().optional().default(false),
  skipped: z.boolean().optional().default(false),
  attempts: z.number().optional().default(0),
});

export const RawCandidateSignalsSchema = z.object({
  commitDays: z.number().optional().default(0),
  missionsCompleted: z.number().optional().default(0),
  missionsFirstTry: z.number().optional().default(0),
});

export const RawCandidateSchema = z.object({
  member: RawCandidateMemberSchema,
  missions: z.array(RawCandidateMissionSchema).optional().default([]),
  signals: RawCandidateSignalsSchema.optional().default({
    commitDays: 0,
    missionsCompleted: 0,
    missionsFirstTry: 0,
  }),
});

export const RawCandidateDatasetSchema = z.object({
  candidates: z.array(RawCandidateSchema),
});

export type RawCurriculum = z.infer<typeof RawCurriculumSchema>;
export type RawCandidate = z.infer<typeof RawCandidateSchema>;
export type RawCandidateDataset = z.infer<typeof RawCandidateDatasetSchema>;

// ==========================================
// 3. Normalized Internal Domain Models
// ==========================================

export type CurriculumTopic = {
  id: string;
  day: number;
  module: string;
  moduleNumber: number;
  topic: string;
  type: string;
  learningObjectives: string[];
  tools: string[];
};

export type LearningSignal = {
  topicId?: string;
  signal: string;
  strength?: number;
};

export type CandidateMission = {
  day: number;
  title: string;
  passed: boolean;
  skipped: boolean;
  attempts: number;
};

export type CandidateSignals = {
  commitDays: number;
  missionsCompleted: number;
  missionsFirstTry: number;
};

export type CandidateProfile = {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: string;
  completedDays: number[];
  completedMissions: string[];
  attempts: Record<string, number>;
  skippedTopics: string[];
  learningSignals: LearningSignal[];
  signals: CandidateSignals;
  missions: CandidateMission[];
};

export type SkillHypothesis = {
  topic: string;
  curriculumDay: number;
  exposure: "none" | "low" | "medium" | "high";
  estimatedStrength: number; // 0..1
  confidence: number; // 0..1
  evidence: string[];
};

export type CompetencyScore = {
  correctness: number;
  depth: number;
  reasoning: number;
  practicalUnderstanding: number;
  tradeoffAwareness: number;
};

export type InterviewQuestion = {
  id: string;
  text: string;
  topic: string;
  curriculumDay: number;
  difficulty: DifficultyLevel;
  action: QuestionAction;
  reasonForQuestion: string;
  basedOnQuestionId?: string;
};

export type AnswerAssessment = {
  questionId: string;
  answer: string;
  scores: CompetencyScore;
  strengths: string[];
  gaps: string[];
  contradictions: string[];
  evidence: string[];
  summary: string;
  recommendedAction: QuestionAction;
  recommendedDifficulty: DifficultyLevel;
};

export type EvidenceEntry = {
  id: string;
  topic: string;
  claim: string;
  supportingEvidence: string[];
  counterEvidence: string[];
  confidence: number;
};

export type InterviewTurn = {
  question: InterviewQuestion;
  answer?: string;
  assessment?: AnswerAssessment;
};

export type InterviewState = {
  sessionId: string;
  candidate: CandidateProfile;
  skillMap: SkillHypothesis[];
  turns: InterviewTurn[];
  evidenceLedger: EvidenceEntry[];
  coveredDays: number[];
  startedAt: string;
  status: InterviewStatus;
  overallConfidence: number;
};

export type FinalTopicScore = {
  topic: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  evidence: string[];
};

export type FinalInterviewReport = {
  sessionId: string;
  candidateId: string;
  candidateName: string;
  overallScore: number;
  topicScores: FinalTopicScore[];
  strongestAreas: string[];
  improvementAreas: string[];
  recommendedNextSteps: string[];
  interviewSummary: string;
};