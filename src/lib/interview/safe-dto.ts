import type { InterviewState, QuestionAction } from "@/types/interview";
import type { InterviewSessionDTO, SafeAdaptiveContext } from "@/types/session-dto";
import { MIN_QUESTIONS, MIN_CURRICULUM_DAYS } from "@/lib/interview/constants";
import { canCompleteInterview } from "@/lib/interview/selectors";

const ADAPTIVE_LABELS: Record<string, { label: string; reason: (topic: string) => string }> = {
  follow_up: {
    label: "Follow-up",
    reason: (topic) => `Building on your previous response about ${topic}.`,
  },
  deepen: {
    label: "Deeper Probe",
    reason: () => "Exploring this concept in greater depth based on the interview so far.",
  },
  clarify: {
    label: "Clarification",
    reason: () => "Clarifying part of an earlier response before moving forward.",
  },
  challenge: {
    label: "Challenge",
    reason: () => "Testing the reasoning from a different technical perspective.",
  },
  new_topic: {
    label: "New Area",
    reason: () => "Broadening the interview into another curriculum area.",
  },
};

export function buildSafeAdaptiveContext(
  action: QuestionAction,
  topic: string,
  turnCount: number,
  previousTopic: string | null
): SafeAdaptiveContext | null {
  if (turnCount <= 1) {
    return {
      action: "personalized_start",
      label: "Personalized Start",
      safeReason: "Selected from the candidate's learning journey to establish an initial technical signal.",
      topicChanged: false,
      previousTopic: null,
    };
  }

  const mapping = ADAPTIVE_LABELS[action];
  if (!mapping) return null;

  return {
    action,
    label: mapping.label,
    safeReason: mapping.reason(topic),
    topicChanged: previousTopic !== null && previousTopic !== topic,
    previousTopic,
  };
}

export function buildInterviewSessionDTO(
  state: InterviewState,
  previousTopic?: string | null
): InterviewSessionDTO {
  const isComplete = state.status === "completed";
  const canComplete = canCompleteInterview(state);

  const currentQ = state.currentQuestion;
  const safeCurrentQuestion = currentQ
    ? {
        id: currentQ.id,
        text: currentQ.text,
        topic: currentQ.topic,
        curriculumDay: currentQ.curriculumDay,
        difficulty: currentQ.difficulty,
      }
    : null;

  let adaptiveContext: SafeAdaptiveContext | null = null;
  if (currentQ) {
    adaptiveContext = buildSafeAdaptiveContext(
      currentQ.action,
      currentQ.topic,
      state.questionCount,
      previousTopic ?? null
    );
  }

  const answeredCount = state.turns.filter((t) => t.answer).length;

  return {
    sessionId: state.sessionId,
    candidateName: state.candidate.name,
    candidateRole: state.candidate.jobRole,
    status: isComplete ? "completed" : "active",
    turnCount: state.questionCount,
    currentQuestion: safeCurrentQuestion,
    coveredTopics: [...state.coveredTopics],
    questionsAnswered: answeredCount,
    minimumQuestions: MIN_QUESTIONS,
    coveredCurriculumDaysCount: state.coveredCurriculumDays.length,
    minimumCurriculumDays: MIN_CURRICULUM_DAYS,
    canComplete,
    isComplete,
    adaptiveContext,
  };
}
