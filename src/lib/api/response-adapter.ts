import {
  OrchestrationResult,
  CandidateInterviewSnapshot,
  InterviewReport,
} from "@/types/interview";
import {
  OfficialApiResponse,
  OfficialApiResponseSchema,
  OfficialReport,
} from "@/lib/api/contract";

export function mapReportToOfficialReport(
  report: InterviewReport
): OfficialReport {
  return {
    overallScore: report.overall.score,
    level: report.overall.level,
    confidence: report.overall.confidence,
    competencies: report.competencies,
    strengths: report.strengths,
    developmentAreas: report.developmentAreas,
    feedback: report.feedback,
  };
}

export function buildOfficialResponse(
  orchestrationResult: OrchestrationResult,
  snapshotOverride?: CandidateInterviewSnapshot | null,
  reportOverride?: InterviewReport | null
): OfficialApiResponse {
  const snapshot = snapshotOverride || orchestrationResult.snapshot;
  const state = orchestrationResult.internalSnapshot?.state;
  const report = reportOverride || orchestrationResult.report || null;

  const isCompleted =
    snapshot.status === "completed" ||
    (report !== null && report.reportStatus === "final");

  const status = isCompleted ? "completed" : "active";

  const currentQ = snapshot.currentQuestion || state?.currentQuestion || null;

  const question =
    isCompleted || !currentQ
      ? null
      : {
          id: currentQ.id,
          text: currentQ.text,
          topic: currentQ.topic,
          curriculumDay: currentQ.curriculumDay,
          difficulty: currentQ.difficulty || ("intermediate" as const),
        };

  const officialReportPayload = report ? mapReportToOfficialReport(report) : null;

  const coveredCurriculumDays = state?.coveredCurriculumDays || [];
  const coveredTopics = state?.coveredTopics || [];
  const turnCount = state ? state.questionCount : snapshot.questionNumber;

  const responsePayload: OfficialApiResponse = {
    sessionId: snapshot.sessionId,
    status,
    turnCount,
    coveredCurriculumDays,
    coveredTopics,
    question,
    report: officialReportPayload,
  };

  // Internal validation guarantees 100% schema compliance & zero internal leakage
  return OfficialApiResponseSchema.parse(responsePayload);
}
