import { EvidenceEntry, DifficultyLevel, EvidenceType } from "@/types/interview";

const DIFFICULTY_FACTORS: Record<DifficultyLevel, number> = {
  foundation: 0.6,
  intermediate: 0.8,
  advanced: 1.0,
  debugging: 1.1,
  architecture: 1.2,
  tradeoff: 1.3,
};

const TYPE_FACTORS: Record<EvidenceType, number> = {
  strength: 1.0,
  gap: 0.95,
  contradiction: 1.1,
  clarification: 1.0,
  refinement: 1.05,
};

export function getEvidenceWeight(entry: Partial<EvidenceEntry>): number {
  const difficulty = entry.difficulty || "intermediate";
  const confidence = typeof entry.confidence === "number" ? entry.confidence : 0.85;
  const type = entry.type || "strength";

  const diffFactor = DIFFICULTY_FACTORS[difficulty] || 0.8;
  const typeFactor = TYPE_FACTORS[type] || 1.0;

  const rawWeight = (confidence * diffFactor * typeFactor) / 1.3;
  return Math.min(1.0, Math.max(0.0, Math.round(rawWeight * 100) / 100));
}
