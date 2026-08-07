import { EvidenceLedger, InterviewState, TopicResult } from "@/types/interview";
import { getCurriculum } from "@/lib/data";
import { DIFFICULTY_WEIGHTS } from "./constants";

export function calculateTopicResults(
  ledger: EvidenceLedger,
  state: InterviewState
): TopicResult[] {
  const { topics } = getCurriculum();
  const testedTopics = state.coveredTopics || [];
  const results: TopicResult[] = [];

  for (const topicDetail of topics) {
    const isTested = testedTopics.includes(topicDetail.topic);

    if (!isTested) {
      results.push({
        topic: topicDetail.topic,
        curriculumDays: [topicDetail.day],
        score: null,
        normalizedScore: null,
        confidence: 0.0,
        status: "not_assessed",
        strengths: [],
        gaps: [],
        evidenceIds: [],
      });
      continue;
    }

    const topicEntries = ledger.entries.filter(
      (e) => e.topic === topicDetail.topic
    );

    if (topicEntries.length === 0) {
      results.push({
        topic: topicDetail.topic,
        curriculumDays: [topicDetail.day],
        score: null,
        normalizedScore: null,
        confidence: 0.0,
        status: "insufficient_evidence",
        strengths: [],
        gaps: [],
        evidenceIds: [],
      });
      continue;
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    const strengths: string[] = [];
    const gaps: string[] = [];

    for (const entry of topicEntries) {
      const entryScore = entry.score ?? 2.0;
      const diffWeight = DIFFICULTY_WEIGHTS[entry.difficulty] || 1.0;
      const weight = entry.confidence * diffWeight;
      totalWeightedScore += entryScore * weight;
      totalWeight += weight;

      if (entryScore >= 3.0) {
        strengths.push(entry.observation);
      } else if (entryScore < 2.0) {
        gaps.push(entry.observation);
      }
    }

    const rawScore = totalWeight > 0 ? Math.min(4, Math.max(0, totalWeightedScore / totalWeight)) : 0;
    const normalizedScore = Math.min(100, Math.max(0, Math.round((rawScore / 4) * 100)));
    const avgConfidence = topicEntries.reduce((acc, e) => acc + e.confidence, 0) / topicEntries.length;

    results.push({
      topic: topicDetail.topic,
      curriculumDays: [topicDetail.day],
      score: Number(rawScore.toFixed(2)),
      normalizedScore,
      confidence: Number(avgConfidence.toFixed(2)),
      status: "assessed",
      strengths: Array.from(new Set(strengths)),
      gaps: Array.from(new Set(gaps)),
      evidenceIds: topicEntries.map((e) => e.id),
    });
  }

  return results;
}
