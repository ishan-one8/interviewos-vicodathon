import {
  CurriculumTopic,
  SkillHypothesis,
  InterviewState,
  SelectionMode,
} from "@/types/interview";

export interface TopicScoreResult {
  topic: CurriculumTopic;
  hypothesis: SkillHypothesis;
  priorityScore: number;
  selectionMode: SelectionMode;
  reasons: string[];
}

export function scoreTopicForSelection(
  topic: CurriculumTopic,
  hypothesis: SkillHypothesis,
  state: InterviewState,
  isCoverageRescue: boolean
): TopicScoreResult {
  let score = 0;
  const reasons: string[] = [];
  let selectionMode: SelectionMode = "diversity";

  const coveredDays = state.coveredCurriculumDays;
  const coveredTopics = state.coveredTopics;
  const lastTurn = state.turns.length > 0 ? state.turns[state.turns.length - 1] : null;

  const isDayCovered = coveredDays.includes(topic.day);
  const isTopicCovered = coveredTopics.includes(topic.topic);
  const isLastTurnTopic = lastTurn ? lastTurn.question.topic === topic.topic : false;

  // Fairness Check 1: Skipped topics penalized heavily
  if (hypothesis.isSkipped) {
    score -= 100;
    reasons.push("Candidate skipped topic (fairness penalty applied).");
  }

  // Factor 1: Candidate familiarity / completed day
  if (candidateCompletedDay(state, topic.day)) {
    score += 30;
    reasons.push("Candidate completed this curriculum day.");
  }

  // Factor 2: Verification Value (Retry-heavy topic)
  if (hypothesis.attemptsCount >= 3) {
    score += 40;
    selectionMode = "verification";
    reasons.push(`Verification priority: required ${hypothesis.attemptsCount} attempts on mission.`);
  }

  // Factor 3: High Strength Mastery Opportunity
  if (hypothesis.estimatedStrength >= 0.78 && !isTopicCovered) {
    score += 25;
    if (selectionMode !== "verification") {
      selectionMode = "candidate_strength";
    }
    reasons.push("Demonstrated high baseline mastery opportunity.");
  }

  // Factor 4: Coverage Rescue Priority
  if (!isDayCovered && isCoverageRescue) {
    score += 85;
    selectionMode = "coverage_rescue";
    reasons.push("Coverage Rescue: Uncovered curriculum day required to satisfy MIN_CURRICULUM_DAYS.");
  } else if (!isDayCovered && state.turns.length >= 3) {
    score += 20;
    reasons.push("Uncovered curriculum day adds to unique day count.");
  }

  // Factor 5: Calibration Suggestions (Early interview turns 1-3)
  if (state.turns.length < 3) {
    const isSuggested = state.suggestedStartingTopics.some(
      (s) => s.curriculumDay === topic.day || s.topic === topic.topic
    );
    if (isSuggested) {
      score += 25;
      reasons.push("Milestone 5 candidate intelligence starting topic recommendation.");
    }
  }

  // Factor 6: Module Diversity
  const isModuleCovered = state.turns.some(
    (t) => t.question.topic && t.question.topic.includes(topic.module)
  );
  if (!isModuleCovered && !isTopicCovered) {
    score += 15;
    reasons.push("Module diversity bonus (new module area).");
  }

  // Factor 7: Repetition Penalties
  if (isLastTurnTopic) {
    score -= 40;
    reasons.push("Recently covered in previous turn (repetition penalty).");
  } else if (isTopicCovered) {
    score -= 25;
    reasons.push("Topic already previously asked in interview.");
  }

  return {
    topic,
    hypothesis,
    priorityScore: score,
    selectionMode,
    reasons,
  };
}

function candidateCompletedDay(state: InterviewState, day: number): boolean {
  return state.candidate.completedDays.includes(day);
}

/**
 * Deterministically sort scored topics using strict tie-breaker order.
 */
export function rankScoredTopics(scoredList: TopicScoreResult[]): TopicScoreResult[] {
  return [...scoredList].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    if (b.hypothesis.confidence !== a.hypothesis.confidence) {
      return b.hypothesis.confidence - a.hypothesis.confidence;
    }
    if (a.topic.day !== b.topic.day) {
      return a.topic.day - b.topic.day; // Day asc
    }
    return a.topic.topic.localeCompare(b.topic.topic); // Alphabetical asc
  });
}
