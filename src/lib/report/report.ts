import {
  InterviewState,
  InterviewReport,
} from "@/types/interview";
import { canCompleteInterview } from "@/lib/interview/selectors";
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
  const candidateName = input.candidateName || state.candidateId || "Candidate";

  const isFinal = canCompleteInterview(state);
  const reportStatus = isFinal ? "final" : "provisional";

  const completion = {
    questionsAnswered: state.questionCount,
    curriculumDaysCovered: state.coveredCurriculumDays,
    requirementsSatisfied: isFinal,
  };

  const competencies = calculateCompetencyResults(state.ledger, state);
  const overall = calculateOverallResult(competencies, state, state.memory);
  const topicResults = calculateTopicResults(state.ledger, state);

  const { strengths, developmentAreas } = buildEvidenceBackedFindings(
    state.ledger,
    state
  );

  const contradictions = summarizeContradictions(state.memory);

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
    candidateId: state.candidateId,
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
