/**
 * Local PUBLIC_CHAT_ENDPOINT for testing /ask against a model on this machine.
 *
 * Implements the contract ask.astro POSTs — and deliberately returns
 * followUps ONLY. The matrix eval settled the other two jobs: the
 * deterministic lead beats the model's sentence (which drops the date
 * qualifier), and the matcher's order is already optimal. The page falls back
 * for both on its own, so omitting them here exercises exactly the
 * architecture the production Worker should ship.
 *
 *   node tools/ask-eval/dev-endpoint.mjs        # listens on 8787
 *   # .env: PUBLIC_CHAT_ENDPOINT=http://127.0.0.1:8787/ask
 *
 * CORS is wide open because this binds to localhost and serves suggestions,
 * not data. Do not lift this file into the Worker without replacing that.
 */
import { createServer } from "node:http";

const LLM = process.env.LOCAL_LLM ?? "http://127.0.0.1:1234/v1/chat/completions";
const MODEL = process.env.LOCAL_MODEL ?? "qwen3.6-35b-a3b-mlx";
const PORT = Number(process.env.PORT ?? 8787);

const SYSTEM = (attributes) => `You suggest next questions for a Delaware outdoor reference site.

Given a visitor's question and the places that answered it, offer 5 short
follow-up questions they might ask next. Rules:
- Each must be answerable by filtering on: ${attributes.join(", ")}, a town name, or a place type (park, beach, trail, dog park, brewery).
- Plain language a visitor would type, under 60 characters.
- Vary them: a different amenity, a nearby town, a season or weather angle.
- Never suggest the question you were given.
Return JSON only: {"followUps": ["...", "...", "...", "...", "..."]}`;

async function followUps(body) {
  const attributes = Array.isArray(body.attributes) ? body.attributes : [];
  const places = (body.candidates ?? []).map((c) => ({ name: c.name, kind: c.kind, town: c.town }));
  const res = await fetch(LLM, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM(attributes) },
        { role: "user", content: JSON.stringify({ question: body.question, places }) },
        { role: "assistant", content: "<think>\n\n</think>\n\n" },
      ],
      max_tokens: 220,
      temperature: 0.6,
      response_format: { type: "json_schema", json_schema: { name: "fu", strict: true,
        schema: { type: "object", properties: { followUps: { type: "array", items: { type: "string" } } },
                  required: ["followUps"] } } },
    }),
  });
  if (!res.ok) throw new Error(`llm status ${res.status}`);
  const d = await res.json();
  return JSON.parse(d.choices[0].message.content).followUps ?? [];
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
  if (req.method !== "POST") { res.writeHead(405, CORS); return res.end(); }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    const body = JSON.parse(raw);
    const fus = await followUps(body);
    console.log(`[ask] "${(body.question ?? "").slice(0, 60)}" -> ${fus.length} followups`);
    res.writeHead(200, { ...CORS, "content-type": "application/json" });
    res.end(JSON.stringify({ followUps: fus }));
  } catch (e) {
    console.error(`[ask] error: ${e.message}`);
    res.writeHead(502, { ...CORS, "content-type": "application/json" });
    res.end(JSON.stringify({ error: "model unavailable" }));
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`ask dev endpoint on http://127.0.0.1:${PORT}  (model: ${MODEL})`);
});
