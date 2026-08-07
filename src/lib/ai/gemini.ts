import { GoogleGenAI, Type } from "@google/genai";
import { Result } from "@/lib/interview/errors";

export { Type };

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL || "gemini-3.6-flash";
}

export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(apiKey && apiKey.trim().length > 0);
}

let aiClientInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }
  if (!aiClientInstance) {
    aiClientInstance = new GoogleGenAI({ apiKey: apiKey.trim() });
  }
  return aiClientInstance;
}

export interface GenerateTextOptions {
  systemInstruction?: string;
  prompt: string;
  responseSchema?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

export interface GeminiResponse {
  text: string;
  model: string;
  durationMs: number;
}

export async function generateTextWithGemini(
  options: GenerateTextOptions
): Promise<Result<GeminiResponse>> {
  const startTime = Date.now();
  const modelName = getGeminiModelName();
  const client = getGeminiClient();

  if (!client) {
    return {
      ok: false,
      error: {
        code: "GEMINI_KEY_MISSING",
        message: "GEMINI_API_KEY is not configured in environment.",
      },
    };
  }

  try {
    const config: Record<string, unknown> = {
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxOutputTokens ?? 1000,
    };

    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }

    if (options.responseSchema) {
      config.responseMimeType = "application/json";
      config.responseSchema = options.responseSchema;
    }

    // Call generateContent synchronously (non-streaming for reliability) with timeout wrapper
    const generatePromise = client.models.generateContent({
      model: modelName,
      contents: options.prompt,
      config,
    });

    const timeoutMs = options.timeoutMs ?? 10000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    );

    const response = (await Promise.race([
      generatePromise,
      timeoutPromise,
    ])) as { text?: string | (() => string) };

    const responseText =
      typeof response.text === "function"
        ? response.text()
        : response.text || "";

    const durationMs = Date.now() - startTime;

    if (!responseText || responseText.trim().length === 0) {
      return {
        ok: false,
        error: {
          code: "GEMINI_EMPTY_RESPONSE",
          message: "Gemini returned an empty text response.",
        },
      };
    }

    return {
      ok: true,
      value: {
        text: responseText.trim(),
        model: modelName,
        durationMs,
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Gemini API error";

    return {
      ok: false,
      error: {
        code: "GEMINI_API_ERROR",
        message: `Gemini generation failed: ${errorMessage}`,
        details: { durationMs },
      },
    };
  }
}
