import {
  InterviewState,
  InterviewReport,
} from "@/types/interview";
import { canCompleteInterview } from "@/lib/interview/selectors";
import { createEmptyLedger } from "@/lib/interview/evidence";
import { createEmptyMemory } from "@/lib/interview/memory";
import {
  calculateCompetencyResults,
  calculateOverallResult,
} from "./scoring";
import { calculateTopicResults } from "./topics";
import {
  buildEvidenceBackedFindings,
  summarizeContradictions,
} from "./findings";
import { generateReportFeedback } from "./feedback";

export async function buildInterviewReport(input: {
  state: InterviewState;
  candidateName?: string;
  forceFallbackFeedback?: boolean;
}): Promise<InterviewReport> {
  const { state, forceFallbackFeedback } = input;
  const candidateId = state.candidate ? state.candidate.id : "CAND-001";
  const candidateName = input.candidateName || state.candidate?.name || "Candidate";

  const isFinal = canCompleteInterview(state);
  const reportStatus = isFinal ? "final" : "provisional";

  const completion = {
    questionsAnswered: state.questionCount,
    curriculumDaysCovered: state.coveredCurriculumDays,
    requirementsSatisfied: isFinal,
  };

  const ledger = state.ledger || createEmptyLedger(state.sessionId);
  const memory = state.memory || createEmptyMemory();

  const competencies = calculateCompetencyResults(ledger);
  const overall = calculateOverallResult(competencies, state, memory);
  const topicResults = calculateTopicResults(ledger, state);

  const { strengths, developmentAreas } = buildEvidenceBackedFindings(
    ledger
  );

  const contradictions = summarizeContradictions(memory);

  const feedback = await generateReportFeedback({
    candidateName,
    overallScore: overall.score,
    overallLevel: overall.level,
    overallConfidence: overall.confidence,
    competencies,
    strengths,
    developmentAreas,
    topicResults,
    forceFallback: forceFallbackFeedback,
  });

  return {
    sessionId: state.sessionId,
    candidateId,
    candidateName,
    reportStatus,
    completion,
    overall,
    competencies,
    topicResults,
    strengths,
    developmentAreas,
    contradictions,
    feedback,
    generatedAt: new Date().toISOString(),
  };
}
