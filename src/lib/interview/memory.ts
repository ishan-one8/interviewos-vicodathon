import {
  InterviewMemory,
  CandidateClaim,
  ContradictionSignal,
  TopicMemory,
  MemoryIssue,
  InterviewTurn,
  PlannerMemorySignal,
} from "@/types/interview";

export function createEmptyMemory(): InterviewMemory {
  return {
    claims: [],
    topicSummaries: [],
    unresolvedQuestions: [],
    contradictionSignals: [],
  };
}

export function addTurnToMemory(
  existingMemory: InterviewMemory,
  turn: InterviewTurn,
  newClaims: CandidateClaim[],
  newContradictions: ContradictionSignal[]
): InterviewMemory {
  const claims = [...existingMemory.claims, ...newClaims];

  // Update or append topic summary
  const topic = turn.question.topic;
  const topicSummaries = [...existingMemory.topicSummaries];
  const topicIndex = topicSummaries.findIndex(
    (t) => t.topic.toLowerCase() === topic.toLowerCase()
  );

  const perfSignal = turn.assessment?.performanceSignal || "unclear";
  const strengths = turn.assessment?.strengths || [];
  const gaps = turn.assessment?.gaps || [];

  if (topicIndex >= 0) {
    const existing = topicSummaries[topicIndex];
    topicSummaries[topicIndex] = {
      ...existing,
      turnIds: Array.from(new Set([...existing.turnIds, turn.question.id])),
      claimIds: Array.from(new Set([...existing.claimIds, ...newClaims.map((c) => c.id)])),
      demonstratedStrengths: Array.from(new Set([...existing.demonstratedStrengths, ...strengths])),
      unresolvedGaps: Array.from(new Set([...existing.unresolvedGaps, ...gaps])),
      lastPerformanceSignal: perfSignal,
      probeCount: existing.probeCount + 1,
    };
  } else {
    topicSummaries.push({
      topic,
      turnIds: [turn.question.id],
      claimIds: newClaims.map((c) => c.id),
      demonstratedStrengths: strengths,
      unresolvedGaps: gaps,
      lastPerformanceSignal: perfSignal,
      probeCount: 1,
    });
  }

  // Update Contradiction Signals
  const contradictionSignals = [...existingMemory.contradictionSignals];
  const unresolvedQuestions = [...existingMemory.unresolvedQuestions];

  for (const signal of newContradictions) {
    const existingIndex = contradictionSignals.findIndex((c) => c.id === signal.id);
    if (existingIndex >= 0) {
      contradictionSignals[existingIndex] = signal;
    } else {
      contradictionSignals.push(signal);

      // Create MemoryIssue if actionable
      if (
        (signal.status === "contradictory" || signal.status === "possibly_contradictory") &&
        signal.recommendedAction !== "ignore"
      ) {
        unresolvedQuestions.push({
          id: `issue_${signal.id}`,
          topic: signal.topic,
          reason: signal.explanation,
          recommendedAction: signal.recommendedAction === "challenge" ? "challenge" : "clarify",
          sourceTurnIds: [turn.question.id],
          resolved: false,
        });
      }
    }
  }

  return {
    claims,
    topicSummaries,
    unresolvedQuestions,
    contradictionSignals,
  };
}

export function resolveMemoryIssue(
  memory: InterviewMemory,
  issueId: string
): InterviewMemory {
  return {
    ...memory,
    unresolvedQuestions: memory.unresolvedQuestions.map((issue) =>
      issue.id === issueId ? { ...issue, resolved: true } : issue
    ),
  };
}

export function resolveContradiction(
  memory: InterviewMemory,
  contradictionId: string
): InterviewMemory {
  return {
    ...memory,
    contradictionSignals: memory.contradictionSignals.map((c) =>
      c.id === contradictionId ? { ...c, resolved: true } : c
    ),
  };
}

// Selectors
export function getClaimsForTopic(memory: InterviewMemory, topic: string): CandidateClaim[] {
  const normTopic = topic.toLowerCase();
  return memory.claims.filter((c) => c.topic.toLowerCase() === normTopic);
}

export function getUnresolvedIssues(memory: InterviewMemory): MemoryIssue[] {
  return memory.unresolvedQuestions.filter((q) => !q.resolved);
}

export function getContradictions(memory: InterviewMemory): ContradictionSignal[] {
  return memory.contradictionSignals;
}

export function getUnresolvedContradictions(memory: InterviewMemory): ContradictionSignal[] {
  return memory.contradictionSignals.filter(
    (c) => !c.resolved && c.status !== "consistent" && c.status !== "context_changed"
  );
}

export function getLatestTopicMemory(memory: InterviewMemory, topic: string): TopicMemory | null {
  const normTopic = topic.toLowerCase();
  return memory.topicSummaries.find((t) => t.topic.toLowerCase() === normTopic) || null;
}

export function hasContradictionBeenProbed(memory: InterviewMemory, contradictionId: string): boolean {
  const signal = memory.contradictionSignals.find((c) => c.id === contradictionId);
  return Boolean(signal && (signal.probedCount || 0) > 0);
}

export function getMemorySignalsForPlanner(memory?: InterviewMemory): PlannerMemorySignal {
  if (!memory) {
    return {
      unresolvedContradiction: false,
      recommendedAction: "none",
      reason: "No memory available.",
    };
  }

  const unresolved = getUnresolvedContradictions(memory);
  if (unresolved.length === 0) {
    return {
      unresolvedContradiction: false,
      recommendedAction: "none",
      reason: "No unresolved contradictions detected in interview memory.",
    };
  }

  // Pick top unresolved contradiction with highest confidence and lowest probedCount
  const top = [...unresolved].sort((a, b) => {
    const probeA = a.probedCount || 0;
    const probeB = b.probedCount || 0;
    if (probeA !== probeB) return probeA - probeB;
    return b.confidence - a.confidence;
  })[0];

  if ((top.probedCount || 0) >= 2) {
    return {
      unresolvedContradiction: false,
      recommendedAction: "none",
      reason: `Contradiction on '${top.topic}' has already been probed ${top.probedCount} times. Guardrail active to prevent over-probing.`,
    };
  }

  return {
    unresolvedContradiction: true,
    topic: top.topic,
    contradictionId: top.id,
    recommendedAction: top.recommendedAction === "challenge" ? "challenge" : "clarify",
    reason: top.explanation,
  };
}
