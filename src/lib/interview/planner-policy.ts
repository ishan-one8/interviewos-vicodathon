import {
  DifficultyLevel,
  QuestionAction,
  SkillHypothesis,
  CurriculumTopic,
  InterviewPhase,
  PerformanceSignal,
} from "@/types/interview";

export function determineInterviewPhase(
  questionsAsked: number,
  uniqueDays: number
): InterviewPhase {
  if (questionsAsked < 3) {
    return "calibration";
  }
  if (questionsAsked < 7) {
    return "deepening";
  }
  if (uniqueDays < 4 || questionsAsked < 10) {
    return "coverage";
  }
  return "closing";
}

export function recommendDifficulty(
  hypothesis: SkillHypothesis,
  phase: InterviewPhase,
  performanceSignal?: PerformanceSignal
): DifficultyLevel {
  // Performance signal overrides
  if (performanceSignal === "weak") {
    return "foundation";
  }
  if (performanceSignal === "strong") {
    if (hypothesis.recommendedDifficulty === "foundation") return "intermediate";
    if (hypothesis.recommendedDifficulty === "intermediate") return "advanced";
    if (hypothesis.recommendedDifficulty === "advanced") return "architecture";
    return "tradeoff";
  }
  if (performanceSignal === "contradictory") {
    return "challenge" as unknown as DifficultyLevel === ("challenge" as unknown) ? "debugging" : "debugging";
  }

  if (hypothesis.isSkipped || hypothesis.exposure === "none") {
    return "foundation";
  }

  if (hypothesis.attemptsCount >= 3) {
    return "debugging";
  }

  if (phase === "calibration") {
    return hypothesis.recommendedDifficulty;
  }

  if (phase === "deepening" && hypothesis.estimatedStrength >= 0.75) {
    return hypothesis.recommendedDifficulty === "intermediate"
      ? "advanced"
      : hypothesis.recommendedDifficulty;
  }

  return hypothesis.recommendedDifficulty;
}

export function determineQuestionAction(
  hypothesis: SkillHypothesis,
  isSameTopicAsLast: boolean,
  performanceSignal?: PerformanceSignal
): QuestionAction {
  if (performanceSignal === "contradictory") {
    return "challenge";
  }
  if (performanceSignal === "partial" || performanceSignal === "unclear") {
    return "clarify";
  }
  if (isSameTopicAsLast || performanceSignal === "strong") {
    return hypothesis.estimatedStrength >= 0.75 ? "deepen" : "follow_up";
  }
  return "new_topic";
}

export function generateObjective(
  topic: CurriculumTopic,
  difficulty: DifficultyLevel,
  action: QuestionAction
): string {
  const primaryObjective =
    topic.learningObjectives.length > 0
      ? topic.learningObjectives[0]
      : `Understand ${topic.topic}`;

  switch (action) {
    case "challenge":
      return `Challenge candidate on potential contradiction regarding ${topic.topic} (${primaryObjective}).`;
    case "clarify":
      return `Clarify candidate's incomplete answer on ${topic.topic} (${primaryObjective}).`;
    case "deepen":
      return `Evaluate ${difficulty} architectural and design trade-offs in ${topic.topic}.`;
    case "follow_up":
      return `Probe deeper into practical implementation of ${topic.topic}.`;
    case "new_topic":
    default:
      return `Assess core candidate understanding of ${topic.topic} (${primaryObjective}) at a ${difficulty} level.`;
  }
}
