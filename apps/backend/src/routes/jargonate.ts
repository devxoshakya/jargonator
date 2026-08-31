import { Hono } from "hono";
import type { Bindings, Variables, Tone, Relationship, JargonateRequest } from "../types";
import { buildSystemPrompt } from "../prompts/buildSystemPrompt";
import { runJargonModel } from "../lib/ai";
import { parseJargonResponse } from "../lib/parseJargonResponse";
import { rateLimiter } from "../middleware/rateLimiter";
import { authMiddleware } from "../middleware/auth";

const VALID_TONES: Tone[] = ["diplomatic", "firm", "assertive", "executive"];
const VALID_RELATIONSHIPS: Relationship[] = ["peer", "senior", "client", "junior"];

function validate(body: unknown): JargonateRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;

  if (typeof b.raw !== "string" || !b.raw.trim()) return null;
  if (typeof b.tone !== "string" || !VALID_TONES.includes(b.tone as Tone)) return null;
  if (
    typeof b.relationship !== "string" ||
    !VALID_RELATIONSHIPS.includes(b.relationship as Relationship)
  )
    return null;
  if (b.context !== undefined && typeof b.context !== "string") return null;

  return {
    raw: b.raw.trim().slice(0, 2000),
    tone: b.tone as Tone,
    relationship: b.relationship as Relationship,
    context: (b.context as string | undefined)?.slice(0, 500),
  };
}

const jargonate = new Hono<{ Bindings: Bindings; Variables: Variables }>();

jargonate.use("/*", authMiddleware, rateLimiter);

jargonate.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const validated = validate(body);
  if (!validated) {
    return c.json(
      {
        error:
          "Expected { raw: string, tone: diplomatic|firm|assertive|executive, relationship: peer|senior|client|junior, context?: string }",
      },
      400
    );
  }

  try {
    const systemPrompt = buildSystemPrompt(validated);
    const rawModelOutput = await runJargonModel(c.env, systemPrompt);
    const { jargon } = parseJargonResponse(rawModelOutput);

    return c.json({ jargon }, 200, {
      "X-RateLimit-Remaining": String(c.get("rateLimitRemaining")),
    });
  } catch (err) {
    return c.json({ error: "Generation failed", detail: (err as Error).message }, 502);
  }
});

export default jargonate;
