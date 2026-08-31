import { createMiddleware } from "hono/factory";
import type { Bindings } from "../types";

const LIMIT = 5;
const WINDOW_SECONDS = 60;

/**
 * Fixed-window counter in KV. Keyed by client IP + current minute bucket,
 * so it naturally resets every 60s without a cron job.
 * Good enough for a single-user private tool; swap for a Durable Object
 * if this ever needs to be precise under real concurrency.
 */
export const rateLimiter = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const bucket = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const key = `ratelimit:${ip}:${bucket}`;

  const current = await c.env.RATE_LIMIT.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= LIMIT) {
    return c.json({ error: "Rate limit exceeded. Try again in a moment." }, 429, {
      "X-RateLimit-Remaining": "0",
    });
  }

  await c.env.RATE_LIMIT.put(key, String(count + 1), {
    expirationTtl: WINDOW_SECONDS * 2,
  });

  c.set("rateLimitRemaining", LIMIT - count - 1);
  await next();
});
