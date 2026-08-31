import { createMiddleware } from "hono/factory";
import type { Bindings } from "../types";

export const authMiddleware = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const suppliedKey = c.req.header("X-Jargonator-Key");
  if (!c.env.JARGONATOR_KEY || suppliedKey !== c.env.JARGONATOR_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});
