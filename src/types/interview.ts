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

export type CompetencyScore = {
  correctness: number;
  depth: number;
  reasoning: number;
  practicalUnderstanding: number;
  tradeoffAwareness: number;
};

export type CurriculumTopic = {
  id: string;
  day: number;
  module: string;
  topic: string;
  learningObjectives: string[];
  tools: string[];
};

export type LearningSignal = {
  topicId?: string;
  signal: string;
  strength?: number;
};

export type CandidateProfile = {
  id: string;
  name: string;

  completedDays: number[];

  completedMissions: string[];

  attempts: Record<string, number>;

  skippedTopics: string[];

  learningSignals: LearningSignal[];
};

export type SkillHypothesis = {
  topic: string;

  curriculumDay: number;

  exposure:
    | "none"
    | "low"
    | "medium"
    | "high";

  estimatedStrength: number;

  confidence: number;

  evidence: string[];
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