import {
  EvidenceLedger,
  InterviewState,
  InterviewMemory,
  CompetencyDimension,
  CompetencyResult,
  CompetencyStatus,
  ReportLevel,
} from "@/types/interview";
import {
  DIFFICULTY_WEIGHTS,
  getReportLevel,
} from "./constants";

const ALL_COMPETENCIES: CompetencyDimension[] = [
  "correctness",
  "depth",
  "reasoning",
  "practicalUnderstanding",
  "tradeoffAwareness",
];

export function calculateCompetencyResults(
  ledger: EvidenceLedger,
  state: InterviewState
): Record<CompetencyDimension, CompetencyResult> {
  const results = {} as Record<CompetencyDimension, CompetencyResult>;

  for (const dimension of ALL_COMPETENCIES) {
    const entries = ledger.entries.filter((e) => e.competency === dimension);

    if (entries.length === 0) {
      results[dimension] = {
        dimension,
        score: 0,
        normalizedScore: 0,
        confidence: 0.0,
        evidenceCount: 0,
        evidenceIds: [],
        status: "insufficient_evidence",
        summary: `Insufficient interview evidence to assess ${formatDimensionName(dimension)} reliably.`,
      };
      continue;
    }

    // Sort entries by turn creation time / id order to handle refinement
    const sortedEntries = [...entries].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (let i = 0; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      const entryScore = entry.score ?? 2.0;
      const diffWeight = DIFFICULTY_WEIGHTS[entry.difficulty] || 1.0;
      // Refinement bonus: later evidence on same topic gets slightly higher weight
      const recencyMultiplier = 1.0 + i * 0.05;
      const weight = entry.confidence * diffWeight * recencyMultiplier;

      totalWeightedScore += entryScore * weight;
      totalWeight += weight;
    }

    const rawScore = totalWeight > 0 ? Math.min(4, Math.max(0, totalWeightedScore / totalWeight)) : 0;
    const normalizedScore = Math.min(100, Math.max(0, Math.round((rawScore / 4) * 100)));

    // Confidence calculation: based on entry count, average entry confidence, and topic diversity
    const avgConfidence = entries.reduce((acc, e) => acc + e.confidence, 0) / entries.length;
    const countFactor = Math.min(1.0, entries.length / 3);
    const confidence = Math.min(1.0, Math.max(0.1, Number((avgConfidence * 0.6 + countFactor * 0.4).toFixed(2))));

    const status = getCompetencyStatus(normalizedScore, entries.length);
    const summary = generateCompetencySummary(dimension, status, normalizedScore, entries.length);

    results[dimension] = {
      dimension,
      score: Number(rawScore.toFixed(2)),
      normalizedScore,
      confidence,
      evidenceCount: entries.length,
      evidenceIds: entries.map((e) => e.id),
      status,
      summary,
    };
  }

  return results;
}

export function calculateOverallResult(
  competencies: Record<CompetencyDimension, CompetencyResult>,
  state: InterviewState,
  memory?: InterviewMemory
): { score: number; confidence: number; level: ReportLevel } {
  const validCompetencies = Object.values(competencies).filter(
    (c) => c.status !== "insufficient_evidence"
  );

  if (validCompetencies.length === 0) {
    return {
      score: 0,
      confidence: 0.0,
      level: "needs_development",
    };
  }

  // Weight competencies evenly among those evaluated
  const totalScore = validCompetencies.reduce((acc, c) => acc + c.normalizedScore, 0);
  const rawOverallScore = totalScore / validCompetencies.length;
  const overallScore = Math.min(100, Math.max(0, Math.round(rawOverallScore)));

  // Compute confidence
  const avgCompConfidence =
    validCompetencies.reduce((acc, c) => acc + c.confidence, 0) / validCompetencies.length;

  // Coverage penalty if some competencies were not tested
  const coverageRatio = validCompetencies.length / ALL_COMPETENCIES.length;
  let overallConfidence = avgCompConfidence * (0.5 + 0.5 * coverageRatio);

  // Unresolved contradiction penalty
  if (memory && memory.contradictionSignals) {
    const unresolvedCount = memory.contradictionSignals.filter(
      (c) => !c.resolved
    ).length;
    if (unresolvedCount > 0) {
      overallConfidence = Math.max(0.1, overallConfidence - unresolvedCount * 0.08);
    }
  }

  const finalConfidence = Math.min(1.0, Math.max(0.0, Number(overallConfidence.toFixed(2))));
  const level = getReportLevel(overallScore);

  return {
    score: overallScore,
    confidence: finalConfidence,
    level,
  };
}

function getCompetencyStatus(normalizedScore: number, evidenceCount: number): CompetencyStatus {
  if (evidenceCount === 0) return "insufficient_evidence";
  if (normalizedScore < 50) return "developing";
  if (normalizedScore < 75) return "competent";
  return "strong";
}

function generateCompetencySummary(
  dimension: CompetencyDimension,
  status: CompetencyStatus,
  score: number,
  count: number
): string {
  const dimName = formatDimensionName(dimension);
  if (status === "insufficient_evidence") {
    return `Insufficient interview evidence to assess ${dimName} reliably.`;
  }
  if (status === "developing") {
    return `Demonstrates developing capability in ${dimName} (Score: ${score}/100 based on ${count} evidence item${count > 1 ? "s" : ""}).`;
  }
  if (status === "competent") {
    return `Demonstrates solid competence in ${dimName} (Score: ${score}/100 based on ${count} evidence item${count > 1 ? "s" : ""}).`;
  }
  return `Demonstrates strong mastery in ${dimName} (Score: ${score}/100 based on ${count} evidence item${count > 1 ? "s" : ""}).`;
}

function formatDimensionName(dimension: CompetencyDimension): string {
  switch (dimension) {
    case "correctness":
      return "Technical Correctness";
    case "depth":
      return "Engineering Depth";
    case "reasoning":
      return "Architectural Reasoning";
    case "practicalUnderstanding":
      return "Practical Implementation Understanding";
    case "tradeoffAwareness":
      return "Trade-off & Constraint Awareness";
  }
}
