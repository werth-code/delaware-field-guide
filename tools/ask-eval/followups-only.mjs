/**
 * The matrix showed followUps are the only model job that adds value the page
 * can't produce itself (lead: deterministic wins; order: matcher's is already
 * optimal). This measures a prompt built for THAT job alone:
 *
 *   - ask for 5, page filter keeps up to 3 -> headroom against attrition
 *   - hand the model the vocabulary the matcher actually parses, so its
 *     suggestions survive the parse() filter instead of dying on phrasing
 *   - no lead, no order -> smaller output, faster, nothing to guard
 *
 * A followUp is structurally safe: the page discards anything parse() cannot
 * turn into filters, so a suggestion can never assert a fact — the worst it
 * can be is useless. This eval measures whether they are.
 *
 *   node tools/ask-eval/followups-only.mjs [repsPerSeed]
 */
import { loadAsk } from "./harness.mjs";

const ENDPOINT = process.env.LOCAL_LLM ?? "http://127.0.0.1:1234/v1/chat/completions";
const MODEL = process.env.LOCAL_MODEL ?? "qwen3.6-35b-a3b-mlx";
const { match, parse, NEED_SAYS } = loadAsk();

const SEEDS = [
  "Can the dog come to the beach?",
  "dogs on rehoboth beach in july",
  "fenced dog park near Wilmington",
  "a playground with restrooms and drinking water",
  "somewhere dry when it rains",
  "free beach with parking",
  "somewhere shady for a toddler on a hot day",
  "is there camping with showers",
  "dog friendly brewery outdoors",
  "a park in Dover with tennis courts and a water fountain",
  "wheelchair accessible trail near Lewes",
  "dog park in Middletown",
];

const SYSTEM = `You suggest next questions for a Delaware outdoor reference site.

Given a visitor's question and the places that answered it, offer 5 short
follow-up questions they might ask next. Rules:
- Each must be answerable by filtering on: ${Object.values(NEED_SAYS ?? {}).join(", ")}, dogs allowed, a town name, or a place type (park, beach, trail, dog park, brewery).
- Plain language a visitor would type, under 60 characters.
- Vary them: a different amenity, a nearby town, a season or weather angle.
- Never suggest the question you were given.
Return JSON only: {"followUps": ["...", "...", "...", "...", "..."]}`;

function payload(question, r) {
  const all = [...r.matches, ...r.unconfirmed].slice(0, 24);
  return {
    question,
    places: all.map((s) => ({ name: s.p.name, kind: s.p.kind, town: s.p.town })),
  };
}

const REPS = Number(process.argv[2] ?? 3);
let offered = 0, survived = 0, calls = 0, errors = 0;
const seen = new Set(), samples = [];
const t0 = Date.now();

for (let rep = 0; rep < REPS; rep++) {
  for (const q of SEEDS) {
    const r = match(q);
    let reply;
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: JSON.stringify(payload(q, r)) },
            { role: "assistant", content: "<think>\n\n</think>\n\n" },
          ],
          max_tokens: 220, temperature: 0.6,
          response_format: { type: "json_schema", json_schema: { name: "fu", strict: true,
            schema: { type: "object", properties: { followUps: { type: "array", items: { type: "string" } } },
                      required: ["followUps"] } } },
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      reply = JSON.parse((await res.json()).choices[0].message.content);
    } catch { errors++; continue; }
    calls++;
    const list = Array.isArray(reply.followUps) ? reply.followUps : [];
    offered += list.length;
    // the page's real filter
    const ok = list
      .filter((f) => typeof f === "string" && f.length > 2 && f.length < 80)
      .filter((f) => { const p = parse(f); return p.needs.length || p.wantsDog || p.kind || p.county || p.town; })
      .filter((f) => f.toLowerCase().trim() !== q.toLowerCase().trim());
    survived += Math.min(ok.length, 3); // page shows at most 3
    for (const f of ok.slice(0, 3)) if (!seen.has(f) && samples.length < 12) { seen.add(f); samples.push(`[${q.slice(0, 30)}] ${f}`); }
  }
}

const secs = ((Date.now() - t0) / 1000).toFixed(0);
console.log(`calls ${calls}  errors ${errors}  (${secs}s, ${(secs / Math.max(calls, 1)).toFixed(1)}s/call)`);
console.log(`offered ${offered}  usable-after-filter ${survived}  -> ${(survived / Math.max(calls, 1)).toFixed(1)} shown per question (page cap: 3)`);
console.log(`\nsamples:`);
for (const s of samples) console.log(`  ${s}`);
