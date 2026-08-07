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
  | "active"
  | "completed"
  | "failed";

export type InterviewPriority =
  | "high"
  | "medium"
  | "low"
  | "avoid";

export type SeniorityTier =
  | "junior"
  | "mid"
  | "senior"
  | "principal";

export type PerformanceSignal =
  | "strong"
  | "partial"
  | "weak"
  | "unclear"
  | "contradictory";

export type InterviewPhase =
  | "calibration"
  | "deepening"
  | "coverage"
  | "closing";

export type SelectionMode =
  | "candidate_strength"
  | "verification"
  | "coverage_rescue"
  | "adaptive_followup"
  | "diversity";

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
  moduleTitle: string;
  exposure: "none" | "low" | "medium" | "high";
  estimatedStrength: number; // 0..1
  confidence: number; // 0..1
  interviewPriority: InterviewPriority;
  recommendedDifficulty: DifficultyLevel;
  isSkipped: boolean;
  attemptsCount: number;
  evidence: string[];
};

export type CandidateIntelligenceReport = {
  candidate: CandidateProfile;
  skillMap: SkillHypothesis[];
  overallSkillEstimate: number; // 0..1
  overallConfidence: number; // 0..1
  seniorityTier: SeniorityTier;
  recommendedStartingDifficulty: DifficultyLevel;
  strongestTopics: SkillHypothesis[];
  topicsToVerify: SkillHypothesis[];
  lowExposureTopics: SkillHypothesis[];
  skippedTopics: SkillHypothesis[];
  suggestedStartingTopics: SkillHypothesis[];
  summaryNotes: string[];
};

export type QuestionPlan = {
  topicId: string;
  topic: string;
  curriculumDay: number;
  moduleTitle: string;
  difficulty: DifficultyLevel;
  action: QuestionAction;
  objective: string;
  reasonForSelection: string;
  candidateEvidence: string[];
  plannerSignals: string[];
  basedOnQuestionId?: string;
  coverageImpact: {
    addsNewCurriculumDay: boolean;
    uniqueDaysAfterQuestion: number;
  };
  priorityScore: number;
  phase: InterviewPhase;
  selectionMode: SelectionMode;
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
  createdAt: string;
};

export const GeneratedQuestionSchema = z.object({
  question: z.string(),
  shortIntent: z.string(),
  expectedCompetency: z.string().optional(),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

export type QuestionGenerationOutput = {
  question: string;
  shortIntent: string;
  expectedCompetency?: string;
  source: "gemini" | "fallback";
  model: string;
  generatedAt: string;
  durationMs: number;
  plan: {
    topic: string;
    curriculumDay: number;
    difficulty: DifficultyLevel;
    action: QuestionAction;
  };
  fallbackReason?: string;
};

export const CompetencyScoreSchema = z.object({
  correctness: z.number().min(0).max(4),
  depth: z.number().min(0).max(4),
  reasoning: z.number().min(0).max(4),
  practicalUnderstanding: z.number().min(0).max(4),
  tradeoffAwareness: z.number().min(0).max(4),
});

export const AnswerAssessmentSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
  performanceSignal: z.enum(["strong", "partial", "weak", "unclear"]),
  scores: CompetencyScoreSchema,
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  contradictions: z.array(z.string()).default([]),
  evidence: z.array(z.string()).default([]),
  summary: z.string(),
  recommendedAction: z.enum(["new_topic", "follow_up", "clarify", "challenge", "deepen", "finish"]),
  recommendedDifficulty: z.enum(["foundation", "intermediate", "advanced", "debugging", "architecture", "tradeoff"]),
  confidence: z.number().min(0).max(1).default(0.8),
});

export type AnswerAssessment = z.infer<typeof AnswerAssessmentSchema>;

export type AnswerEvaluationOutput = AnswerAssessment & {
  source: "gemini" | "fallback";
  model: string;
  generatedAt: string;
  durationMs: number;
  fallbackReason?: string;
};


export type InterviewTurn = {
  question: InterviewQuestion;
  answer?: string;
  submittedAt?: string;
  assessment?: AnswerAssessment;
};

export type CompletionStatus = {
  eligible: boolean;
  questionsAsked: number;
  questionsRemaining: number;
  uniqueCurriculumDays: number;
  curriculumDaysRemaining: number;
  maxQuestionsReached: boolean;
  reasons: string[];
};

export type ClaimType =
  | "concept"
  | "preference"
  | "design_choice"
  | "tradeoff"
  | "process"
  | "experience";

export type ClaimPolarity = "supports" | "rejects" | "neutral";

export const CandidateClaimSchema = z.object({
  id: z.string(),
  turnId: z.string(),
  questionId: z.string(),
  topic: z.string(),
  curriculumDay: z.number(),
  statement: z.string(),
  claimType: z.enum(["concept", "preference", "design_choice", "tradeoff", "process", "experience"]),
  polarity: z.enum(["supports", "rejects", "neutral"]).optional(),
  confidence: z.number().min(0).max(1).default(0.85),
  source: z.literal("candidate_answer").default("candidate_answer"),
  createdAt: z.string(),
});

export type CandidateClaim = z.infer<typeof CandidateClaimSchema>;

export type ContradictionStatus =
  | "consistent"
  | "possibly_contradictory"
  | "contradictory"
  | "context_changed"
  | "insufficient_context";

export const ContradictionSignalSchema = z.object({
  id: z.string(),
  earlierClaimId: z.string(),
  laterClaimId: z.string(),
  status: z.enum(["consistent", "possibly_contradictory", "contradictory", "context_changed", "insufficient_context"]),
  topic: z.string(),
  explanation: z.string(),
  confidence: z.number().min(0).max(1).default(0.8),
  recommendedAction: z.enum(["clarify", "challenge", "ignore"]),
  probedCount: z.number().default(0),
  resolved: z.boolean().default(false),
});

export type ContradictionSignal = z.infer<typeof ContradictionSignalSchema>;

export type TopicMemory = {
  topic: string;
  turnIds: string[];
  claimIds: string[];
  demonstratedStrengths: string[];
  unresolvedGaps: string[];
  lastPerformanceSignal: PerformanceSignal;
  probeCount: number;
};

export type MemoryIssue = {
  id: string;
  topic: string;
  reason: string;
  recommendedAction: "clarify" | "challenge";
  sourceTurnIds: string[];
  resolved: boolean;
};

export type InterviewMemory = {
  claims: CandidateClaim[];
  topicSummaries: TopicMemory[];
  unresolvedQuestions: MemoryIssue[];
  contradictionSignals: ContradictionSignal[];
};

export type PlannerMemorySignal = {
  unresolvedContradiction: boolean;
  topic?: string;
  contradictionId?: string;
  issueId?: string;
  recommendedAction: "clarify" | "challenge" | "none";
  reason: string;
};

export type CompetencyDimension =
  | "correctness"
  | "depth"
  | "reasoning"
  | "practicalUnderstanding"
  | "tradeoffAwareness";

export type EvidenceType =
  | "strength"
  | "gap"
  | "contradiction"
  | "clarification"
  | "refinement";

export type Provenance = {
  questionId: string;
  turnId: string;
  curriculumDay: number;
  topic: string;
};

export const EvidenceEntrySchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  turnId: z.string(),
  questionId: z.string(),
  topic: z.string(),
  curriculumDay: z.number(),
  competency: z.enum(["correctness", "depth", "reasoning", "practicalUnderstanding", "tradeoffAwareness"]),
  type: z.enum(["strength", "gap", "contradiction", "clarification", "refinement"]),
  observation: z.string(),
  score: z.number().min(0).max(4).optional(),
  difficulty: z.enum(["foundation", "intermediate", "advanced", "debugging", "architecture", "tradeoff"]),
  confidence: z.number().min(0).max(1).default(0.85),
  source: z.enum(["answer_assessment", "memory", "contradiction_analysis"]),
  provenance: z.object({
    questionId: z.string(),
    turnId: z.string(),
    curriculumDay: z.number(),
    topic: z.string(),
  }),
  weight: z.number().min(0).max(1).default(0.5),
  createdAt: z.string(),
});

export type EvidenceEntry = z.infer<typeof EvidenceEntrySchema>;

export type CompetencyCoverageItem = {
  competency: CompetencyDimension;
  strengthCount: number;
  gapCount: number;
  totalEvidenceCount: number;
};

export type TopicEvidenceMatrix = {
  topic: string;
  curriculumDay: number;
  competencies: Record<CompetencyDimension, CompetencyCoverageItem>;
};

export type EvidenceGapSignal = {
  hasGap: boolean;
  topic?: string;
  missingCompetencies: CompetencyDimension[];
  evidenceCount: number;
  confidence: number;
  reason: string;
};

export type EvidenceLedger = {
  sessionId: string;
  entries: EvidenceEntry[];
  matrix: TopicEvidenceMatrix[];
};

export type InterviewState = {
  sessionId: string;
  candidate: CandidateProfile;
  intelligenceReport: CandidateIntelligenceReport;
  skillMap: SkillHypothesis[];
  status: InterviewStatus;
  startedAt: string;
  completedAt: string | null;
  turns: InterviewTurn[];
  currentQuestion: InterviewQuestion | null;
  questionCount: number;
  coveredCurriculumDays: number[];
  coveredTopics: string[];
  followUpCount: number;
  currentDifficulty: DifficultyLevel;
  suggestedStartingTopics: SkillHypothesis[];
  failureReason: string | null;
  memory?: InterviewMemory;
  ledger?: EvidenceLedger;
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