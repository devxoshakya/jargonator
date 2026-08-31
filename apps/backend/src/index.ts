import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings, Variables } from "./types";
import jargonate from "./routes/jargonate";
import { authMiddleware } from "./middleware/auth";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Jargonator-Key"],
  })
);

app.route("/api/jargonate", jargonate);
app.get("/",authMiddleware, (c) => c.text(`Hello Bhunduu!`, 200));
app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;
