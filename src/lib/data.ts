import rawCurriculumJson from "@/data/curriculum.json";
import rawCandidatesJson from "@/data/candidates.json";
import { normalizeCurriculum } from "@/lib/curriculum/normalizer";
import { normalizeCandidateDataset } from "@/lib/candidate/normalizer";
import { CurriculumTopic, CandidateProfile } from "@/types/interview";

// Cache normalized data in memory for fast performance
let cachedCurriculum: { topics: CurriculumTopic[]; cohort: string; errors: string[] } | null = null;
let cachedCandidates: { candidates: CandidateProfile[]; errors: string[] } | null = null;

export function getCurriculum() {
  if (!cachedCurriculum) {
    cachedCurriculum = normalizeCurriculum(rawCurriculumJson);
  }
  return cachedCurriculum;
}

export function getCandidates() {
  if (!cachedCandidates) {
    cachedCandidates = normalizeCandidateDataset(rawCandidatesJson);
  }
  return cachedCandidates;
}

export function getCandidateById(id: string): CandidateProfile | undefined {
  const { candidates } = getCandidates();
  return candidates.find((c) => c.id.toLowerCase() === id.toLowerCase());
}

export function getCurriculumTopicByDay(day: number): CurriculumTopic | undefined {
  const { topics } = getCurriculum();
  return topics.find((t) => t.day === day);
}
