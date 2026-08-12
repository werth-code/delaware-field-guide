/**
 * The model half of the /ask contract, against a local LM Studio endpoint.
 *
 * The request shape mirrors exactly what src/pages/ask.astro POSTs:
 *   { question, site, attributes, candidates[] }  ->  { lead, order[], followUps[] }
 *
 * The model is given candidate NAMES and which attributes each one met or is
 * unknown on. It is never given a fact, a date rule, or a blocked place. It
 * cannot answer the question; it can only phrase an answer already decided.
 */
const ENDPOINT = process.env.LOCAL_LLM ?? "http://127.0.0.1:1234/v1/chat/completions";
const MODEL = process.env.LOCAL_MODEL ?? "qwen3.6-35b-a3b-mlx";

/* Qwen3.6 is a reasoning model and will burn ~1000 tokens deliberating over a
   one-sentence summary. Prefilling a closed think block skips it entirely --
   measured at ~55x fewer tokens for identical output. */
const NO_THINK = { role: "assistant", content: "<think>\n\n</think>\n\n" };

export const SYSTEM = `You write one sentence for a Delaware outdoor reference site.

You are given a question and a list of candidate places that a deterministic
matcher has ALREADY decided are valid answers. Your job is presentation only.

RULES — these exist because the site's only asset is being correct:
- Name ONLY places from the candidate list. Never introduce a place name.
- Write any count as a DIGIT ("3 places"), never as a word ("three places").
- Use ONLY these numbers: the count of candidates given to you. No other digits.
- Never say "matcher", "candidates", "data", "criteria" or "results" — a visitor
  is reading this, not an engineer. Say "places", or name them.
- Never state that something is allowed, permitted, open, free, or accessible.
  The matcher decided that. You are summarising, not ruling.
- If a candidate is listed as unknown on an attribute, do not imply it is known.
- One sentence. Under 200 characters. Plain, calm, no marketing tone.

Return JSON only:
{"lead": "<one sentence>", "order": ["<slug>", ...], "followUps": ["<short question>", ...]}

"order" ranks the slugs you were given, best first. "followUps" is up to 3 short
questions a visitor might ask next, phrased in plain language.`;

export function buildPayload(question, r, NEED_SAYS) {
  const all = [...r.matches, ...r.unconfirmed].slice(0, 24);
  return {
    question: question.slice(0, 200),
    site: "delaware",
    attributes: [...Object.values(NEED_SAYS ?? {}), "dogs allowed"],
    candidates: all.map((s) => ({
      slug: s.p.id, name: s.p.name, kind: s.p.kind, town: s.p.town,
      met: [...s.met, ...(s.dog && s.dog.ok === true ? ["dogs"] : [])],
      unknown: [...s.unknown, ...(s.dogUnknown ? ["dogs"] : [])],
      confirmed: s.p.verified,
    })),
  };
}

export async function askModel(payload, { timeoutMs = 120000 } = {}) {
  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: JSON.stringify(payload) },
      NO_THINK,
    ],
    max_tokens: 400,
    temperature: 0.4,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ask_reply", strict: true,
        schema: {
          type: "object",
          properties: {
            lead: { type: "string" },
            order: { type: "array", items: { type: "string" } },
            followUps: { type: "array", items: { type: "string" } },
          },
          required: ["lead", "order", "followUps"],
        },
      },
    },
  };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const d = await res.json();
    return JSON.parse(d.choices[0].message.content);
  } finally {
    clearTimeout(t);
  }
}
