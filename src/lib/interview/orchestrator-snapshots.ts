import {
  InterviewState,
  CandidateInterviewSnapshot,
  InterviewEvent,
  OrchestrationEventType,
} from "@/types/interview";
import { MIN_QUESTIONS, MIN_CURRICULUM_DAYS } from "@/lib/interview/constants";
import { canCompleteInterview } from "@/lib/interview/selectors";

export function buildSafeCandidateSnapshot(state: InterviewState): CandidateInterviewSnapshot {
  const canComplete = canCompleteInterview(state);
  const isComplete = state.status === "completed";
  const questionNumber = state.questionCount;
  const coveredCurriculumDaysCount = state.coveredCurriculumDays.length;

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

  // Calculate progress 0..100
  const qProgress = Math.min(100, Math.round((state.turns.length / MIN_QUESTIONS) * 70));
  const dayProgress = Math.min(30, Math.round((coveredCurriculumDaysCount / MIN_CURRICULUM_DAYS) * 30));
  const progress = isComplete ? 100 : Math.min(100, qProgress + dayProgress);

  return {
    sessionId: state.sessionId,
    candidateName: state.candidate.name,
    status: state.status,
    currentQuestion: safeCurrentQuestion,
    questionNumber,
    coveredCurriculumDaysCount,
    minimumQuestions: MIN_QUESTIONS,
    minimumCurriculumDays: MIN_CURRICULUM_DAYS,
    canComplete,
    isComplete,
    progress,
  };
}

export function createEvent(
  sessionId: string,
  type: OrchestrationEventType,
  payload: Record<string, unknown>
): InterviewEvent {
  return {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    sessionId,
    type,
    timestamp: new Date().toISOString(),
    payload,
  };
}
