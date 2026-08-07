import {
  EvidenceLedger,
  InterviewState,
  CompetencyDimension,
  ScoreExplanation,
} from "@/types/interview";
import { calculateCompetencyResults } from "./scoring";
import { DIFFICULTY_WEIGHTS } from "./constants";

export function getScoreExplanation(
  ledger: EvidenceLedger,
  dimension: CompetencyDimension,
  state: InterviewState
): ScoreExplanation {
  const competencyResults = calculateCompetencyResults(ledger, state);
  const comp = competencyResults[dimension];

  const entries = ledger.entries.filter((e) => e.competency === dimension);
  const sortedEntries = [...entries].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );

  const supportingEvidence: Array<{
    evidenceId: string;
    statement: string;
    score: number;
    weight: number;
  }> = [];

  const gapEvidence: Array<{
    evidenceId: string;
    statement: string;
    score: number;
    weight: number;
  }> = [];

  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    const scoreVal = entry.score ?? 2.0;
    const diffWeight = DIFFICULTY_WEIGHTS[entry.difficulty] || 1.0;
    const recencyMultiplier = 1.0 + i * 0.05;
    const weight = Number((entry.confidence * diffWeight * recencyMultiplier).toFixed(2));

    const item = {
      evidenceId: entry.id,
      statement: entry.observation,
      score: scoreVal,
      weight,
    };

    if (scoreVal >= 2.5) {
      supportingEvidence.push(item);
    } else {
      gapEvidence.push(item);
    }
  }

  const weightingSummary = entries.length === 0
    ? `No evidence entries recorded for ${dimension}. Status is marked insufficient_evidence.`
    : `Score computed from ${entries.length} evidence entry/entries using formula: WeightedAverage = Sum(score * confidence * difficultyWeight) / Sum(weights). Difficulty multipliers applied: ${Array.from(new Set(entries.map((e) => `${e.difficulty}:${DIFFICULTY_WEIGHTS[e.difficulty] || 1.0}`))).join(", ")}.`;

  return {
    competency: dimension,
    rawScore: comp.score,
    normalizedScore: comp.normalizedScore,
    confidence: comp.confidence,
    status: comp.status,
    evidenceCount: comp.evidenceCount,
    supportingEvidence,
    gapEvidence,
    weightingSummary,
  };
}
