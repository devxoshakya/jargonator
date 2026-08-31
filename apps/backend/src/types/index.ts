export type Tone = "diplomatic" | "firm" | "assertive" | "executive";
export type Relationship = "peer" | "senior" | "client" | "junior";

export interface JargonateRequest {
  raw: string;
  tone: Tone;
  relationship: Relationship;
  context?: string;
}

export interface JargonateResponse {
  jargon: string;
}

export interface Env {
  AI: Ai;
  JARGONATOR_KEY: string;
  RATE_LIMIT: KVNamespace;
}

// Hono's generic expects a `Bindings` shape — alias so route files can
// do `Hono<{ Bindings: Bindings }>` without re-declaring the env shape.
export type Bindings = Env;

// Values middleware attaches to the request context via c.set()/c.get()
export interface Variables {
  rateLimitRemaining: number;
}


