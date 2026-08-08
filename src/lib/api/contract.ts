import { z } from "zod";

export const OfficialApiRequestSchema = z
  .object({
    candidateId: z.string().trim().optional(),
    sessionId: z.string().trim().optional(),
    questionId: z.string().trim().optional(),
    answer: z
      .string()
      .trim()
      .max(5000, "Answer exceeds maximum length of 5000 characters")
      .optional(),
  })
  .refine((data) => Boolean(data.candidateId || data.sessionId), {
    message:
      "Either 'candidateId' (to initialize an interview) or 'sessionId' (to continue an interview) must be provided.",
    path: ["candidateId"],
  });

export type OfficialApiRequest = z.infer<typeof OfficialApiRequestSchema>;

export const OfficialQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  topic: z.string(),
  curriculumDay: z.number(),
  difficulty: z.enum([
    "foundation",
    "intermediate",
    "advanced",
    "debugging",
    "architecture",
    "tradeoff",
  ]),
});

export type OfficialQuestion = z.infer<typeof OfficialQuestionSchema>;

export const OfficialCompetencyResultSchema = z.object({
  score: z.number().min(0).max(4),
  normalizedScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  status: z.enum([
    "insufficient_evidence",
    "developing",
    "competent",
    "strong",
  ]),
  summary: z.string(),
  evidenceIds: z.array(z.string()),
});

export const OfficialReportFindingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  topics: z.array(z.string()),
  evidenceIds: z.array(z.string()),
});

export const OfficialReportFeedbackSchema = z.object({
  summary: z.string(),
  strongestAreas: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export const OfficialReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  level: z.enum([
    "needs_development",
    "developing",
    "competent",
    "strong",
    "advanced",
  ]),
  confidence: z.number().min(0).max(1),
  competencies: z.record(z.string(), OfficialCompetencyResultSchema),
  strengths: z.array(OfficialReportFindingSchema),
  developmentAreas: z.array(OfficialReportFindingSchema),
  feedback: OfficialReportFeedbackSchema,
});

export type OfficialReport = z.infer<typeof OfficialReportSchema>;

export const OfficialApiResponseSchema = z.object({
  sessionId: z.string(),
  status: z.enum(["active", "completed"]),
  turnCount: z.number().min(0),
  coveredCurriculumDays: z.array(z.number()),
  coveredTopics: z.array(z.string()),
  question: OfficialQuestionSchema.nullable(),
  report: OfficialReportSchema.nullable(),
});

export type OfficialApiResponse = z.infer<typeof OfficialApiResponseSchema>;
