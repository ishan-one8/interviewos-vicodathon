import {
  EvidenceEntry,
  EvidenceLedger,
  InterviewTurn,
  ContradictionSignal,
  CompetencyDimension,
  EvidenceType,
  EvidenceEntrySchema,
} from "@/types/interview";
import { getEvidenceWeight } from "@/lib/interview/evidence-weight";

export function createEmptyLedger(sessionId: string): EvidenceLedger {
  return {
    sessionId,
    entries: [],
    matrix: [],
  };
}

export function createEvidenceFromTurn(
  turn: InterviewTurn,
  sessionId: string
): EvidenceEntry[] {
  if (!turn.assessment) return [];

  const { question, assessment } = turn;
  const turnId = `turn_${question.id}`;
  const now = new Date().toISOString();
  const entries: EvidenceEntry[] = [];

  // 1. Process Strengths
  for (let i = 0; i < assessment.strengths.length; i++) {
    const obs = assessment.strengths[i].trim();
    if (!obs) continue;

    const competency = inferCompetencyFromObservation(obs, assessment.scores);
    const entryObj: EvidenceEntry = {
      id: `ev_str_${question.id}_${i + 1}_${Date.now().toString(36)}`,
      sessionId,
      turnId,
      questionId: question.id,
      topic: question.topic,
      curriculumDay: question.curriculumDay,
      competency,
      type: "strength",
      observation: obs,
      score: assessment.scores[competency] ?? assessment.scores.correctness,
      difficulty: question.difficulty,
      confidence: assessment.confidence,
      source: "answer_assessment",
      provenance: {
        questionId: question.id,
        turnId,
        curriculumDay: question.curriculumDay,
        topic: question.topic,
      },
      weight: getEvidenceWeight({
        difficulty: question.difficulty,
        confidence: assessment.confidence,
        type: "strength",
      }),
      createdAt: now,
    };

    const parsed = EvidenceEntrySchema.safeParse(entryObj);
    if (parsed.success) entries.push(parsed.data);
  }

  // 2. Process Gaps
  for (let i = 0; i < assessment.gaps.length; i++) {
    const obs = assessment.gaps[i].trim();
    if (!obs) continue;

    const competency = inferCompetencyFromObservation(obs, assessment.scores);
    const entryObj: EvidenceEntry = {
      id: `ev_gap_${question.id}_${i + 1}_${Date.now().toString(36)}`,
      sessionId,
      turnId,
      questionId: question.id,
      topic: question.topic,
      curriculumDay: question.curriculumDay,
      competency,
      type: "gap",
      observation: obs,
      score: Math.min(1, assessment.scores[competency] ?? 1),
      difficulty: question.difficulty,
      confidence: assessment.confidence,
      source: "answer_assessment",
      provenance: {
        questionId: question.id,
        turnId,
        curriculumDay: question.curriculumDay,
        topic: question.topic,
      },
      weight: getEvidenceWeight({
        difficulty: question.difficulty,
        confidence: assessment.confidence,
        type: "gap",
      }),
      createdAt: now,
    };

    const parsed = EvidenceEntrySchema.safeParse(entryObj);
    if (parsed.success) entries.push(parsed.data);
  }

  return entries;
}

export function addTurnEvidenceToLedger(
  existingLedger: EvidenceLedger,
  turn: InterviewTurn
): EvidenceLedger {
  const newEntries = createEvidenceFromTurn(turn, existingLedger.sessionId);
  if (newEntries.length === 0) return existingLedger;

  const existingKeys = new Set(
    existingLedger.entries.map(
      (e) => `${e.turnId}_${e.competency}_${e.type}_${e.observation.toLowerCase()}`
    )
  );

  const filteredNew = newEntries.filter((e) => {
    const key = `${e.turnId}_${e.competency}_${e.type}_${e.observation.toLowerCase()}`;
    if (existingKeys.has(key)) return false;
    existingKeys.add(key);
    return true;
  });

  return {
    ...existingLedger,
    entries: [...existingLedger.entries, ...filteredNew],
  };
}

export function addContradictionEvidenceToLedger(
  ledger: EvidenceLedger,
  signal: ContradictionSignal,
  earlierTurnId: string,
  laterTurnId: string,
  curriculumDay: number
): EvidenceLedger {
  const type: EvidenceType = signal.resolved ? "refinement" : "contradiction";

  const entry: EvidenceEntry = {
    id: `ev_contra_${signal.id}`,
    sessionId: ledger.sessionId,
    turnId: laterTurnId,
    questionId: laterTurnId,
    topic: signal.topic,
    curriculumDay,
    competency: "reasoning",
    type,
    observation: signal.explanation,
    score: signal.resolved ? 3 : 1,
    difficulty: "advanced",
    confidence: signal.confidence,
    source: "contradiction_analysis",
    provenance: {
      questionId: laterTurnId,
      turnId: earlierTurnId,
      curriculumDay,
      topic: signal.topic,
    },
    weight: getEvidenceWeight({
      difficulty: "advanced",
      confidence: signal.confidence,
      type,
    }),
    createdAt: new Date().toISOString(),
  };

  const parsed = EvidenceEntrySchema.safeParse(entry);
  if (!parsed.success) return ledger;

  return {
    ...ledger,
    entries: [...ledger.entries, parsed.data],
  };
}

function inferCompetencyFromObservation(
  obs: string,
  scores: Record<string, number>
): CompetencyDimension {
  const lower = obs.toLowerCase();

  if (lower.includes("trade-off") || lower.includes("tradeoff") || lower.includes("cost") || lower.includes("latency") || lower.includes("scale")) {
    return "tradeoffAwareness";
  }
  if (lower.includes("practical") || lower.includes("debug") || lower.includes("inspect") || lower.includes("deploy") || lower.includes("implement")) {
    return "practicalUnderstanding";
  }
  if (lower.includes("reasoning") || lower.includes("why") || lower.includes("because") || lower.includes("logic")) {
    return "reasoning";
  }
  if (lower.includes("depth") || lower.includes("deep") || lower.includes("internal") || lower.includes("architecture") || lower.includes("under-the-hood")) {
    return "depth";
  }

  // Fallback to lowest scoring dimension or correctness
  let minDim: CompetencyDimension = "correctness";
  let minScore = 5;

  const dims: CompetencyDimension[] = ["correctness", "depth", "reasoning", "practicalUnderstanding", "tradeoffAwareness"];
  for (const d of dims) {
    if (scores[d] !== undefined && scores[d] < minScore) {
      minScore = scores[d];
      minDim = d;
    }
  }

  return minDim;
}
