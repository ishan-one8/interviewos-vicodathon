import {
  EvidenceLedger,
  EvidenceEntry,
  CompetencyDimension,
  TopicEvidenceMatrix,
  EvidenceGapSignal,
  CurriculumTopic,
  InterviewState,
  CompetencyCoverageItem,
} from "@/types/interview";

export function getEvidenceForTopic(ledger: EvidenceLedger, topic: string): EvidenceEntry[] {
  const normTopic = topic.toLowerCase();
  return ledger.entries.filter((e) => e.topic.toLowerCase() === normTopic);
}

export function getEvidenceForCompetency(
  ledger: EvidenceLedger,
  competency: CompetencyDimension
): EvidenceEntry[] {
  return ledger.entries.filter((e) => e.competency === competency);
}

export function getEvidenceForTurn(ledger: EvidenceLedger, turnId: string): EvidenceEntry[] {
  return ledger.entries.filter((e) => e.turnId === turnId);
}

export function getStrengthEvidence(ledger: EvidenceLedger): EvidenceEntry[] {
  return ledger.entries.filter((e) => e.type === "strength");
}

export function getGapEvidence(ledger: EvidenceLedger): EvidenceEntry[] {
  return ledger.entries.filter((e) => e.type === "gap");
}

export function getContradictionEvidence(ledger: EvidenceLedger): EvidenceEntry[] {
  return ledger.entries.filter((e) => e.type === "contradiction");
}

export function getHighestConfidenceEvidence(ledger: EvidenceLedger, limit = 5): EvidenceEntry[] {
  return [...ledger.entries].sort((a, b) => b.confidence * b.weight - a.confidence * a.weight).slice(0, limit);
}

export function getEvidenceCoverageMatrix(
  ledger: EvidenceLedger,
  curriculum: CurriculumTopic[]
): TopicEvidenceMatrix[] {
  const dims: CompetencyDimension[] = [
    "correctness",
    "depth",
    "reasoning",
    "practicalUnderstanding",
    "tradeoffAwareness",
  ];

  return curriculum.map((topicItem) => {
    const topicEntries = getEvidenceForTopic(ledger, topicItem.topic);

    const compRecord = {} as Record<CompetencyDimension, CompetencyCoverageItem>;

    for (const d of dims) {
      const compEntries = topicEntries.filter((e) => e.competency === d);
      compRecord[d] = {
        competency: d,
        strengthCount: compEntries.filter((e) => e.type === "strength").length,
        gapCount: compEntries.filter((e) => e.type === "gap").length,
        totalEvidenceCount: compEntries.length,
      };
    }

    return {
      topic: topicItem.topic,
      curriculumDay: topicItem.day,
      competencies: compRecord,
    };
  });
}

export function getEvidenceGapSignalForPlanner(
  ledger?: EvidenceLedger,
  state?: InterviewState
): EvidenceGapSignal {
  if (!ledger || ledger.entries.length === 0 || !state) {
    return {
      hasGap: false,
      missingCompetencies: [],
      evidenceCount: 0,
      confidence: 0.5,
      reason: "No observed evidence available yet.",
    };
  }

  // Find covered topics that have evidence but miss practical understanding or tradeoff awareness
  const coveredTopics = state.coveredTopics || [];
  const dims: CompetencyDimension[] = ["practicalUnderstanding", "tradeoffAwareness"];

  for (const topic of coveredTopics) {
    const entries = getEvidenceForTopic(ledger, topic);
    if (entries.length === 0) continue;

    const missingCompetencies: CompetencyDimension[] = [];
    for (const d of dims) {
      const hasDim = entries.some((e) => e.competency === d);
      if (!hasDim) {
        missingCompetencies.push(d);
      }
    }

    if (missingCompetencies.length > 0) {
      return {
        hasGap: true,
        topic,
        missingCompetencies,
        evidenceCount: entries.length,
        confidence: 0.8,
        reason: `Topic '${topic}' has ${entries.length} observed evidence item(s) but lacks demonstrated evidence for: ${missingCompetencies.join(", ")}.`,
      };
    }
  }

  return {
    hasGap: false,
    missingCompetencies: [],
    evidenceCount: ledger.entries.length,
    confidence: 0.85,
    reason: "Sufficient evidence coverage present for tested topics.",
  };
}
