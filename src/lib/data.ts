import rawCurriculumJson from "@/data/curriculum.json";
import rawCandidatesJson from "@/data/candidates.json";
import { normalizeCurriculum } from "@/lib/curriculum/normalizer";
import { normalizeCandidateDataset } from "@/lib/candidate/normalizer";
import { profileCandidate } from "@/lib/candidate/profiler";
import { CurriculumTopic, CandidateProfile, CandidateIntelligenceReport } from "@/types/interview";

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

export function getCandidateIntelligence(candidateId: string): CandidateIntelligenceReport | null {
  const candidate = getCandidateById(candidateId);
  if (!candidate) return null;
  const { topics } = getCurriculum();
  return profileCandidate(candidate, topics);
}
