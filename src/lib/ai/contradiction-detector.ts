import {
  CandidateClaim,
  ContradictionSignal,
  ContradictionSignalSchema,
  ContradictionStatus,
} from "@/types/interview";
import { generateTextWithGemini, isGeminiConfigured, Type } from "@/lib/ai/gemini";

export interface ContradictionAnalysisInput {
  earlierClaim: CandidateClaim;
  laterClaim: CandidateClaim;
  forceFallback?: boolean;
}

const CONTRADICTION_DETECTOR_SYSTEM_INSTRUCTION = `You are a Senior AI Systems Engineering Contradiction Analyzer.

GOAL:
Analyze two candidate technical claims made during an interview to evaluate whether they are consistent, contradictory, or represent a context change.

CLASSIFICATIONS:
- "consistent": Claims complement or align with each other.
- "possibly_contradictory": Claims appear in tension, but could be reconciled depending on context/assumptions.
- "contradictory": Claims directly contradict each other under the same operating conditions.
- "context_changed": Difference is explained by a change in scope, scale, deployment tier, or requirements (e.g. prototype vs production).
- "insufficient_context": Claims are too brief or vague to evaluate consistency reliably.

NEUTRAL & RESPECTFUL EXPLANATIONS:
- NEVER accuse the candidate of lying, faking, or cheating.
- Differences often stem from different assumptions, operating contexts, or refined thinking.
- Formulate neutral, objective technical explanations.`;

export function findComparableClaimPairs(
  existingClaims: CandidateClaim[],
  newClaims: CandidateClaim[]
): { earlier: CandidateClaim; later: CandidateClaim }[] {
  const pairs: { earlier: CandidateClaim; later: CandidateClaim }[] = [];

  for (const later of newClaims) {
    for (const earlier of existingClaims) {
      if (earlier.id === later.id || earlier.turnId === later.turnId) continue;

      // 1. Same topic OR related curriculum concept
      const sameTopic = normalizeString(earlier.topic) === normalizeString(later.topic);
      const sameDay = earlier.curriculumDay === later.curriculumDay;

      if (sameTopic || sameDay) {
        // Avoid comparing exact duplicate statements
        if (normalizeString(earlier.statement) !== normalizeString(later.statement)) {
          pairs.push({ earlier, later });
        }
      }
    }
  }

  return pairs;
}

export async function analyzeContradictions(
  input: ContradictionAnalysisInput
): Promise<ContradictionSignal | null> {
  const { earlierClaim, laterClaim, forceFallback } = input;

  if (forceFallback || !isGeminiConfigured()) {
    return analyzeContradictionsFallback(earlierClaim, laterClaim);
  }

  const prompt = `CONTRADICTION ANALYSIS REQUEST:
Compare the following two technical claims made by the candidate:

EARLIER CLAIM (Turn ${earlierClaim.turnId}, Topic: ${earlierClaim.topic}):
"${earlierClaim.statement}"

LATER CLAIM (Turn ${laterClaim.turnId}, Topic: ${laterClaim.topic}):
"${laterClaim.statement}"

INSTRUCTION: Output structured JSON classifying the relationship between these two claims according to the schema.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      status: {
        type: Type.STRING,
        description: "Classification: 'consistent', 'possibly_contradictory', 'contradictory', 'context_changed', or 'insufficient_context'.",
      },
      explanation: {
        type: Type.STRING,
        description: "Concise neutral technical explanation of the relationship (1-2 sentences).",
      },
      confidence: { type: Type.NUMBER, description: "Analysis confidence score (0.0 to 1.0)." },
      recommendedAction: {
        type: Type.STRING,
        description: "Recommended action: 'clarify', 'challenge', or 'ignore'.",
      },
    },
    required: ["status", "explanation", "recommendedAction"],
  };

  try {
    const result = await generateTextWithGemini({
      systemInstruction: CONTRADICTION_DETECTOR_SYSTEM_INSTRUCTION,
      prompt,
      responseSchema,
      temperature: 0.2,
      maxOutputTokens: 800,
      timeoutMs: 10000,
    });

    if (!result.ok) {
      return analyzeContradictionsFallback(earlierClaim, laterClaim);
    }

    const rawJson = JSON.parse(result.value.text);
    const status = validateStatus(rawJson.status);
    const recommendedAction = validateAction(rawJson.recommendedAction, status);
    const confidence = typeof rawJson.confidence === "number" ? Math.min(1.0, Math.max(0.0, rawJson.confidence)) : 0.8;

    const signalObj = {
      id: `contra_${earlierClaim.id}_${laterClaim.id}`,
      earlierClaimId: earlierClaim.id,
      laterClaimId: laterClaim.id,
      status,
      topic: laterClaim.topic,
      explanation: rawJson.explanation || `Comparison between Turn ${earlierClaim.turnId} and Turn ${laterClaim.turnId}.`,
      confidence,
      recommendedAction,
      probedCount: 0,
      resolved: status === "consistent" || status === "context_changed",
    };

    const parsed = ContradictionSignalSchema.safeParse(signalObj);
    return parsed.success ? parsed.data : null;
  } catch {
    return analyzeContradictionsFallback(earlierClaim, laterClaim);
  }
}

function analyzeContradictionsFallback(
  earlier: CandidateClaim,
  later: CandidateClaim
): ContradictionSignal {
  const normEarlier = normalizeString(earlier.statement);
  const normLater = normalizeString(later.statement);

  let status: ContradictionStatus = "consistent";
  let action: "clarify" | "challenge" | "ignore" = "ignore";
  let explanation = "Fallback analysis determined statements are consistent or compatible.";

  // Check simple explicit negation keywords
  const hasNegation =
    (normEarlier.includes("unnecessary") && normLater.includes("essential")) ||
    (normEarlier.includes("never") && normLater.includes("always")) ||
    (normEarlier.includes("avoid") && normLater.includes("prefer"));

  if (hasNegation) {
    status = "possibly_contradictory";
    action = "clarify";
    explanation = `Earlier statement suggested '${earlier.statement}', while later statement suggested '${later.statement}'. Further technical clarification may reconcile context constraints.`;
  }

  return {
    id: `contra_fb_${earlier.id}_${later.id}`,
    earlierClaimId: earlier.id,
    laterClaimId: later.id,
    status,
    topic: later.topic,
    explanation,
    confidence: 0.7,
    recommendedAction: action,
    probedCount: 0,
    resolved: status === "consistent",
  };
}

function validateStatus(val: unknown): ContradictionStatus {
  const allowed: ContradictionStatus[] = [
    "consistent",
    "possibly_contradictory",
    "contradictory",
    "context_changed",
    "insufficient_context",
  ];
  if (typeof val === "string" && allowed.includes(val as ContradictionStatus)) {
    return val as ContradictionStatus;
  }
  return "consistent";
}

function validateAction(val: unknown, status: ContradictionStatus): "clarify" | "challenge" | "ignore" {
  if (status === "consistent" || status === "context_changed" || status === "insufficient_context") {
    return "ignore";
  }
  if (typeof val === "string" && ["clarify", "challenge", "ignore"].includes(val)) {
    return val as "clarify" | "challenge" | "ignore";
  }
  return status === "contradictory" ? "challenge" : "clarify";
}

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}
