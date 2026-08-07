import {
  InterviewState,
  InterviewTurn,
  CurriculumTopic,
  CompletionStatus,
  DifficultyLevel,
} from "@/types/interview";
import {
  MIN_QUESTIONS,
  MIN_CURRICULUM_DAYS,
  MAX_QUESTIONS,
  LIFECYCLE_STATUS,
} from "@/lib/interview/constants";

export function getCompletionStatus(state: InterviewState): CompletionStatus {
  const questionsAsked = state.turns.length;
  const questionsRemaining = Math.max(0, MIN_QUESTIONS - questionsAsked);

  const uniqueCurriculumDays = state.coveredCurriculumDays.length;
  const curriculumDaysRemaining = Math.max(
    0,
    MIN_CURRICULUM_DAYS - uniqueCurriculumDays
  );

  const maxQuestionsReached = questionsAsked >= MAX_QUESTIONS;
  const reasons: string[] = [];

  if (state.status === LIFECYCLE_STATUS.FAILED) {
    reasons.push("Cannot complete a failed interview session.");
  }

  if (questionsAsked < MIN_QUESTIONS) {
    reasons.push(
      `Minimum question requirement not satisfied (${questionsAsked}/${MIN_QUESTIONS}).`
    );
  }

  if (uniqueCurriculumDays < MIN_CURRICULUM_DAYS) {
    reasons.push(
      `Minimum curriculum coverage not satisfied (${uniqueCurriculumDays}/${MIN_CURRICULUM_DAYS} unique days).`
    );
  }

  const eligible =
    questionsAsked >= MIN_QUESTIONS &&
    uniqueCurriculumDays >= MIN_CURRICULUM_DAYS &&
    state.status !== LIFECYCLE_STATUS.FAILED;

  return {
    eligible,
    questionsAsked,
    questionsRemaining,
    uniqueCurriculumDays,
    curriculumDaysRemaining,
    maxQuestionsReached,
    reasons,
  };
}

export function canCompleteInterview(state: InterviewState): boolean {
  return getCompletionStatus(state).eligible;
}

export function getLastTurn(state: InterviewState): InterviewTurn | null {
  if (state.turns.length === 0) return null;
  return state.turns[state.turns.length - 1];
}

export function getAskedQuestionIds(state: InterviewState): string[] {
  return state.turns.map((t) => t.question.id);
}

export function getAskedQuestionTexts(state: InterviewState): string[] {
  return state.turns.map((t) => t.question.text);
}

export function getCoveredCurriculumDays(state: InterviewState): number[] {
  return [...state.coveredCurriculumDays];
}

export function getCoveredTopics(state: InterviewState): string[] {
  return [...state.coveredTopics];
}

export function getUncoveredCurriculumDays(
  state: InterviewState,
  curriculum: CurriculumTopic[]
): number[] {
  const coveredSet = new Set(state.coveredCurriculumDays);
  const allDays = curriculum.map((c) => c.day);
  return Array.from(new Set(allDays)).filter((day) => !coveredSet.has(day));
}

export function getRemainingCoverageRequirements(state: InterviewState) {
  const status = getCompletionStatus(state);
  return {
    questionsNeeded: status.questionsRemaining,
    uniqueDaysNeeded: status.curriculumDaysRemaining,
  };
}

export function getCurrentDifficulty(state: InterviewState): DifficultyLevel {
  return state.currentDifficulty;
}

export function getFollowUpCount(state: InterviewState): number {
  return state.followUpCount;
}
