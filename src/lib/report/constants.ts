import { DifficultyLevel, ReportLevel } from "@/types/interview";

export const DIFFICULTY_WEIGHTS: Record<DifficultyLevel, number> = {
  foundation: 1.0,
  intermediate: 1.05,
  advanced: 1.1,
  debugging: 1.12,
  architecture: 1.15,
  tradeoff: 1.15,
};

export const LEVEL_THRESHOLDS: Array<{
  maxScore: number;
  level: ReportLevel;
  label: string;
}> = [
  { maxScore: 39, level: "needs_development", label: "Needs Development" },
  { maxScore: 54, level: "developing", label: "Developing" },
  { maxScore: 69, level: "competent", label: "Competent" },
  { maxScore: 84, level: "strong", label: "Strong" },
  { maxScore: 100, level: "advanced", label: "Advanced" },
];

export const MIN_EVIDENCE_COUNT_FOR_SUFFICIENT = 1;
export const MIN_EVIDENCE_COUNT_FOR_HIGH_CONFIDENCE = 3;

export function getReportLevel(normalizedScore: number): ReportLevel {
  const score = Math.min(100, Math.max(0, Math.round(normalizedScore)));
  for (const t of LEVEL_THRESHOLDS) {
    if (score <= t.maxScore) {
      return t.level;
    }
  }
  return "advanced";
}
