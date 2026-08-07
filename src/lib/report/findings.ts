import {
  EvidenceLedger,
  InterviewMemory,
  ReportFinding,
  ReportContradictionSummary,
} from "@/types/interview";

export function buildEvidenceBackedFindings(ledger: EvidenceLedger): {
  strengths: ReportFinding[];
  developmentAreas: ReportFinding[];
} {
  const strongEntries = ledger.entries.filter((e) => (e.score ?? 2.0) >= 3.0);
  const gapEntries = ledger.entries.filter((e) => (e.score ?? 2.0) < 2.5);

  // Group strong entries by topic
  const strongTopicMap = new Map<string, typeof strongEntries>();
  for (const e of strongEntries) {
    const topic = e.provenance?.topic || e.topic;
    const list = strongTopicMap.get(topic) || [];
    list.push(e);
    strongTopicMap.set(topic, list);
  }

  const strengths: ReportFinding[] = [];
  let sCount = 1;
  for (const [topic, entries] of strongTopicMap.entries()) {
    const mainEntry = entries[0];
    const avgConfidence = entries.reduce((acc, item) => acc + item.confidence, 0) / entries.length;

    strengths.push({
      id: `str_${sCount++}_${Date.now().toString(36)}`,
      title: `Strong ${topic} reasoning & execution`,
      description: `Candidate demonstrated solid technical understanding of ${topic}: "${mainEntry.observation}"`,
      evidenceIds: entries.map((e) => e.id),
      topics: [topic],
      confidence: Number(avgConfidence.toFixed(2)),
    });
  }

  // Fallback strength if none scored >= 3.0 but candidate answered questions
  if (strengths.length === 0 && ledger.entries.length > 0) {
    const highestScoreEntry = [...ledger.entries].sort(
      (a, b) => (b.score ?? 2.0) - (a.score ?? 2.0)
    )[0];
    const topic = highestScoreEntry.provenance?.topic || highestScoreEntry.topic;
    strengths.push({
      id: `str_fb_1`,
      title: `Demonstrated technical communication on ${topic}`,
      description: `Candidate engaged constructively with questions regarding ${topic}: "${highestScoreEntry.observation}"`,
      evidenceIds: [highestScoreEntry.id],
      topics: [topic],
      confidence: highestScoreEntry.confidence,
    });
  }

  // Group gap entries by topic
  const gapTopicMap = new Map<string, typeof gapEntries>();
  for (const e of gapEntries) {
    const topic = e.provenance?.topic || e.topic;
    const list = gapTopicMap.get(topic) || [];
    list.push(e);
    gapTopicMap.set(topic, list);
  }

  const developmentAreas: ReportFinding[] = [];
  let gCount = 1;
  for (const [topic, entries] of gapTopicMap.entries()) {
    const mainEntry = entries[0];
    const avgConfidence = entries.reduce((acc, item) => acc + item.confidence, 0) / entries.length;

    let recommendation = `Review production trade-offs and edge-case handling for ${topic}.`;
    if (mainEntry.competency === "tradeoffAwareness") {
      recommendation = `Practice comparing latency, recall, memory, and cost constraints when configuring ${topic}.`;
    } else if (mainEntry.competency === "practicalUnderstanding") {
      recommendation = `Practice step-by-step failure isolation and debugging in production ${topic} pipelines.`;
    } else if (mainEntry.competency === "depth") {
      recommendation = `Deepen architectural understanding of internal algorithms and parameters behind ${topic}.`;
    }

    developmentAreas.push({
      id: `dev_${gCount++}_${Date.now().toString(36)}`,
      title: `Refine ${topic} technical depth & constraints`,
      description: `${recommendation} Demonstrated gap: "${mainEntry.observation}"`,
      evidenceIds: entries.map((e) => e.id),
      topics: [topic],
      confidence: Number(avgConfidence.toFixed(2)),
    });
  }

  return { strengths, developmentAreas };
}

export function summarizeContradictions(
  memory?: InterviewMemory
): ReportContradictionSummary[] {
  if (!memory || !memory.contradictionSignals || memory.contradictionSignals.length === 0) {
    return [];
  }

  return memory.contradictionSignals.map((c, idx) => {
    let explanation = `Candidate made conflicting statements regarding ${c.topic}. Needs technical clarification under production constraints.`;
    const status: "unresolved" | "clarified" | "resolved" = c.resolved
      ? "resolved"
      : c.status === "context_changed"
      ? "clarified"
      : "unresolved";

    if (c.resolved) {
      explanation = `Candidate initially had conflicting statements regarding ${c.topic}, but successfully refined their position in a subsequent turn.`;
    }

    return {
      id: c.id || `rep_cnt_${idx + 1}`,
      topic: c.topic,
      statementA: `Earlier claim (${c.earlierClaimId || "c1"})`,
      statementB: `Later claim (${c.laterClaimId || "c2"})`,
      status,
      explanation,
    };
  });
}
