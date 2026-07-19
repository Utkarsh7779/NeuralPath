// Vercel Serverless Function — the AI proxy.
// The browser calls /api/messages; this function adds your secret key and
// forwards the request to Anthropic. The key NEVER reaches the client.
//
// Set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.
//
// Runs on the Node.js runtime (default). No dependencies needed — uses global fetch.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

// Only allow the small set of models this app actually uses, and clamp token
// counts, so a leaked endpoint can't be turned into a general-purpose meter.
const ALLOWED_MODELS = new Set(["claude-sonnet-4-6"]);
const MAX_TOKENS_CAP = 1500;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY. Add it in Vercel project settings." });
    return;
  }

  try {
    // Vercel parses JSON bodies automatically; guard anyway.
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const model = ALLOWED_MODELS.has(body.model) ? body.model : "claude-sonnet-4-6";
    const max_tokens = Math.min(Number(body.max_tokens) || 1000, MAX_TOKENS_CAP);
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const system = typeof body.system === "string" ? body.system : undefined;

    if (!messages.length) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    const upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens, system, messages }),
    });

    const data = await upstream.json();
    // Pass Anthropic's status through so the client's error handling still works.
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Upstream request failed", detail: String(err && err.message ? err.message : err) });
  }
}
