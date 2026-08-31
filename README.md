# Jargonator

Turn raw, unfiltered venting — in Hindi, English, or a mix of both — into polished, strategically-toned professional messages.

Jargonator is a private utility that takes what you *actually* want to say and rewrites it into something you can safely send: diplomatic when you need to be careful, firm when you need an answer, executive when you need it to just get done.

---

## How it works

**1. Unlock with your access key**

<img src="/.github/assets/lock.png" alt="Jargonator API key gate screen" width="480" />

Jargonator is a private, single-user tool gated behind a shared secret key. Enter it once — it's checked against the backend and stored locally so you won't need to re-enter it on future visits.

**2. Write, configure, transform**

<img src="/.github/assets/landing.png" alt="Jargonator two-column landing UI" width="720" />

- **What I actually think** — dump your raw, unfiltered message exactly as it comes to you
- **Tone** — Diplomatic, Firm, Assertive, or Executive
- **Relationship** — Peer, Senior, Client, or Junior — controls formality and how much pressure is appropriate
- **Context** *(optional)* — e.g. "3rd follow-up on this" — helps the model justify pressure honestly instead of inventing a reason
- **What I should send** — the rewritten, ready-to-copy result appears on the right

---

## Features

- 🎭 **Tone-aware rewriting** — four distinct communication registers, not just "make it nicer"
- 🤝 **Relationship-aware framing** — same message reads differently to a client vs. a peer, and Jargonator adjusts accordingly
- 🌐 **Native Hindi/English code-switch support** — no pre-translation step; raw mixed-language input goes straight to the model
- 🔒 **Private by design** — single shared-secret access key, no accounts, no tracking
- ⚡ **Edge-deployed** — runs on Cloudflare Workers with Workers AI, no cold starts, no servers to manage
- 🚦 **Rate limited** — 5 requests/minute per client, enforced at the edge via KV

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend framework | [Hono](https://hono.dev) |
| Runtime | Cloudflare Workers |
| Inference | Cloudflare Workers AI (`@cf/google/gemma-4-26b-a4b-it-external`) |
| Rate limiting | Cloudflare KV (fixed-window counter) |
| Frontend | React |

---

## API

### `GET /`

Health/auth check. Returns `200` if the supplied key is valid, `401` otherwise. Used by the frontend to validate a key before storing it.

```bash
curl https://jargonator.devxoshakya.workers.dev/ \
  -H "X-Jargonator-Key: your-key"
```

### `POST /api/jargonate`

Transforms a raw message into a polished one.

```bash
curl -X POST https://jargonator.devxoshakya.workers.dev/api/jargonate \
  -H "Content-Type: application/json" \
  -H "X-Jargonator-Key: your-key" \
  -d '{
    "raw": "bhai seriously 3 baar bol chuka hu, ab bardaash nahi hota",
    "tone": "firm",
    "relationship": "peer",
    "context": "3rd follow-up on the same request"
  }'
```

**Request body**

| Field | Type | Required | Values |
|---|---|---|---|
| `raw` | `string` | ✅ | Your raw message (max 2000 chars) |
| `tone` | `string` | ✅ | `diplomatic` \| `firm` \| `assertive` \| `executive` |
| `relationship` | `string` | ✅ | `peer` \| `senior` \| `client` \| `junior` |
| `context` | `string` | ❌ | Extra situational context (max 500 chars) |

**Response**

```json
{ "jargon": "Hi Rahul, following up on this once more..." }
```

| Status | Meaning |
|---|---|
| `200` | Success |
| `400` | Invalid or missing fields |
| `401` | Missing/invalid `X-Jargonator-Key` |
| `429` | Rate limit exceeded (5/min) |
| `502` | Model generation or parsing failure |

---

## Local development

```bash
npm install

# .dev.vars (gitignored) — required for local secret access
echo 'JARGONATOR_KEY=your-local-test-key' > .dev.vars

npm run dev -- --remote   # Workers AI requires --remote, local sim won't work
```

## Deployment

```bash
wrangler kv:namespace create RATE_LIMIT   # paste the returned id into wrangler.toml
wrangler secret put JARGONATOR_KEY
npm run deploy
```

---

## Cost

Each call costs roughly **~5 Neurons** (Cloudflare's compute unit) at typical prompt lengths. The Workers Free plan includes **10,000 Neurons/day**, which comfortably covers personal use well before the built-in 5/min rate limiter becomes the binding constraint.

---

## Disclaimer

Jargonator is a personal productivity tool for reframing your own words before you send them — not a way to misrepresent facts or manufacture false urgency. Use it to communicate more clearly under pressure, not to manipulate people in bad faith.