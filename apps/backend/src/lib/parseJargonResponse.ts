import type { JargonateResponse } from "../types";

/**
 * Gemma occasionally wraps JSON in ```json fences, adds a stray leading/trailing
 * sentence, or uses smart quotes. This strips the common cases before parsing.
 */
export function parseJargonResponse(raw: string): JargonateResponse {
  let cleaned = raw.trim();

  cleaned = cleaned.replace(/```json|```/gi, "").trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  cleaned = cleaned.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.jargon !== "string" || !parsed.jargon.trim()) {
      throw new Error("Missing or empty 'jargon' field");
    }
    return { jargon: parsed.jargon.trim() };
  } catch (err) {
    throw new Error(
      `Failed to parse model output as JSON: ${(err as Error).message}. Raw: ${raw.slice(0, 200)}`
    );
  }
}
