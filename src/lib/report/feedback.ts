import { z } from "zod";
import {
  CompetencyResult,
  ReportFinding,
  ReportLevel,
  TopicResult,
} from "@/types/interview";
import {
  generateTextWithGemini,
  isGeminiConfigured,
  getGeminiModelName,
  Type,
} from "@/lib/ai/gemini";

export const FeedbackOutputSchema = z.object({
  summary: z.string().describe("Concise 2-3 sentence executive summary of candidate performance."),
  strongestAreas: z.array(z.string()).describe("List of 2-4 key technical strengths demonstrated."),
  nextSteps: z.array(z.string()).describe("List of 2-5 specific, actionable technical study recommendations."),
});

export type FeedbackOutput = z.infer<typeof FeedbackOutputSchema>;

export interface FeedbackGenerationInput {
  candidateName: string;
  overallScore: number;
  overallLevel: ReportLevel;
  overallConfidence: number;
  competencies: Record<string, CompetencyResult>;
  strengths: ReportFinding[];
  developmentAreas: ReportFinding[];
  topicResults: TopicResult[];
  forceFallback?: boolean;
}

const FEEDBACK_SYSTEM_INSTRUCTION = `You are a Senior AI Systems Engineering Interviewer writing candidate evaluation feedback.

RULES:
- You are polishing wording ONLY based on the provided deterministic interview evaluation.
- Do NOT alter scores, levels, or performance claims.
- Provide clear, professional, constructive feedback.
- Provide specific, actionable technical next steps (e.g. "Practice evaluating latency/cost trade-offs in vector search", NOT generic "Study harder").
- Do NOT use generic filler or empty praise.`;

export async function generateReportFeedback(
  input: FeedbackGenerationInput
): Promise<FeedbackOutput> {
  const { forceFallback } = input;

  if (forceFallback || !isGeminiConfigured()) {
    return generateDeterministicFeedback(input);
  }

  const prompt = `INTERVIEW PERFORMANCE SUMMARY FOR WRITING FEEDBACK:
- Candidate Name: ${input.candidateName}
- Overall Score: ${input.overallScore}/100 (${input.overallLevel})
- Evaluated Strengths:
${input.strengths.map((s) => `  * ${s.title}: ${s.description}`).join("\n")}
- Development Areas:
${input.developmentAreas.map((d) => `  * ${d.title}: ${d.description}`).join("\n")}

Write a concise executive summary, list the 2-4 strongest technical areas demonstrated, and provide 2-5 actionable next steps for professional growth.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      strongestAreas: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      nextSteps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: ["summary", "strongestAreas", "nextSteps"],
  };

  try {
    const result = await generateTextWithGemini({
      systemInstruction: FEEDBACK_SYSTEM_INSTRUCTION,
      prompt,
      responseSchema,
      temperature: 0.3,
      maxOutputTokens: 1000,
      timeoutMs: 12000,
    });

    if (!result.ok) {
      return generateDeterministicFeedback(input);
    }

    const rawJson = JSON.parse(result.value.text);
    const parsed = FeedbackOutputSchema.safeParse(rawJson);

    if (parsed.success) {
      return parsed.data;
    }

    return generateDeterministicFeedback(input);
  } catch {
    return generateDeterministicFeedback(input);
  }
}

export function generateDeterministicFeedback(
  input: FeedbackGenerationInput
): FeedbackOutput {
  const levelLabels: Record<ReportLevel, string> = {
    needs_development: "Needs Development",
    developing: "Developing",
    competent: "Competent",
    strong: "Strong",
    advanced: "Advanced",
  };

  const summary = `${input.candidateName} completed the technical evaluation with an overall score of ${input.overallScore}/100 (${levelLabels[input.overallLevel]}). Demonstrated solid engineering engagement across tested AI systems curriculum topics, with an overall evaluation confidence of ${(input.overallConfidence * 100).toFixed(0)}%.`;

  const strongestAreas = input.strengths.length > 0
    ? input.strengths.slice(0, 4).map((s) => s.title)
    : ["Technical communication and structured problem solving"];

  const nextSteps: string[] = [];

  if (input.developmentAreas.length > 0) {
    for (const d of input.developmentAreas.slice(0, 4)) {
      nextSteps.push(d.description);
    }
  }

  // Ensure 2-5 next steps
  if (nextSteps.length < 2) {
    nextSteps.push(
      "Practice comparing vector index algorithms (HNSW vs IVF) under latency, recall, and memory constraints."
    );
    nextSteps.push(
      "Practice end-to-end RAG failure isolation separating retrieval failures from generation hallucination."
    );
  }

  return {
    summary,
    strongestAreas,
    nextSteps: nextSteps.slice(0, 5),
  };
}
