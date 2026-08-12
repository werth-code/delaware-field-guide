/**
 * Full evaluation matrix for the /ask model layer.
 *
 * The earlier fuzz runs established one fact: asked to count a list, the model
 * gets it wrong about half the time, and no phrasing of "please count
 * correctly" fixed it. This matrix tests the two strategies that REMOVE the
 * counting job instead of nagging about it, and scores the two low-risk jobs
 * (order, followUps) that the fuzz never measured.
 *
 *   Lead strategies
 *     baseline  — the original prompt (control)
 *     counts    — confirmedCount/unconfirmedCount precomputed in the payload;
 *                 model told to copy those digits verbatim or use none
 *     nonumber  — numbers banned outright; the deterministic lead already
 *                 gives counts, so the model's sentence doesn't need any
 *
 *   Order metric (within the unconfirmed bucket, which is where ranking can
 *   help a reader): fewer unknown attributes should rank higher. Score is the
 *   fraction of adjacent pairs in non-decreasing unknowns. Baseline is the
 *   matcher's own order. r.matches/r.unconfirmed sort separately in ask.astro,
 *   so the model cannot mix buckets — usefulness is the only question here.
 *
 *   FollowUps metric: survival through the page's REAL filter (length 2-80 and
 *   parseable by the matcher), plus novelty (not just echoing the question).
 *
 *   node tools/ask-eval/matrix.mjs [repsPerSeed]
 */
import { loadAsk } from "./harness.mjs";

const ENDPOINT = process.env.LOCAL_LLM ?? "http://127.0.0.1:1234/v1/chat/completions";
const { match, leadIsSafe, parse, NEED_SAYS } = loadAsk();

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

const BASE_RULES = `You write one sentence for a Delaware outdoor reference site.
You are given a question and candidate places a deterministic matcher ALREADY
decided are valid. Presentation only.
- Name ONLY places from the candidate list. Never introduce a place name.
- Never state that something is allowed, permitted, open, free, or accessible.
- Never say "matcher", "candidates", "data", "criteria" or "results".
- One sentence, under 200 characters, plain and calm.
Return JSON only: {"lead": "...", "order": ["<slug>",...], "followUps": ["...",...]}
"order" ranks ALL given slugs best-first. "followUps": up to 3 short plain
questions a visitor might ask next.`;

const STRATEGIES = {
  baseline: {
    system: BASE_RULES + `\n- If you mention a count, use the count of candidates you were given.`,
    counts: false,
  },
  counts: {
    system: BASE_RULES + `\n- The payload includes confirmedCount and unconfirmedCount, already
computed. If your sentence mentions a count, copy one of those digits EXACTLY
as written (e.g. "3"). Never write a number as a word. Never do arithmetic.`,
    counts: true,
  },
  nonumber: {
    system: BASE_RULES + `\n- Your sentence must contain NO numbers at all — no digits, no number
words ("three"), no quantity words ("several", "many", "few", "dozens"). Name
one or two standout places instead.`,
    counts: false,
  },
};

function buildPayload(question, r, withCounts) {
  const all = [...r.matches, ...r.unconfirmed].slice(0, 24);
  const p = {
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
  if (withCounts) {
    p.confirmedCount = r.matches.length;
    p.unconfirmedCount = r.unconfirmed.length;
  }
  return p;
}

async function callModel(model, system, payload, noThink) {
  const messages = [
    { role: "system", content: system },
    { role: "user", content: JSON.stringify(payload) },
  ];
  if (noThink) messages.push({ role: "assistant", content: "<think>\n\n</think>\n\n" });
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model, messages, max_tokens: 400, temperature: 0.2,
      response_format: { type: "json_schema", json_schema: { name: "ask_reply", strict: true,
        schema: { type: "object", properties: {
          lead: { type: "string" },
          order: { type: "array", items: { type: "string" } },
          followUps: { type: "array", items: { type: "string" } },
        }, required: ["lead", "order", "followUps"] } } },
    }),
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const d = await res.json();
  return { reply: JSON.parse(d.choices[0].message.content),
           ms: 0, usage: d.usage };
}

/* ---- job scorers --------------------------------------------------------- */
function scoreLead(lead, r) {
  // The whole gate as ask() applies it post-fix.
  return Boolean(!r.blocked?.length && r.matches.length > 0 && leadIsSafe(lead, r));
}

function monotonicity(slugs, r) {
  // fraction of adjacent unconfirmed pairs with non-decreasing unknown-count
  const un = new Map(r.unconfirmed.map((s) => [s.p.id, s.unknown.length + (s.dogUnknown ? 1 : 0)]));
  const seq = slugs.filter((s) => un.has(s)).map((s) => un.get(s));
  if (seq.length < 2) return null;
  let ok = 0;
  for (let i = 1; i < seq.length; i++) if (seq[i] >= seq[i - 1]) ok++;
  return ok / (seq.length - 1);
}

function scoreOrder(order, r) {
  const all = [...r.matches, ...r.unconfirmed].slice(0, 24);
  const valid = new Set(all.map((s) => s.p.id));
  const filtered = (order ?? []).filter((s) => valid.has(s));
  const coverage = all.length ? filtered.length / all.length : null;
  return {
    coverage,
    modelMono: monotonicity(filtered, r),
    baseMono: monotonicity(all.map((s) => s.p.id), r),
  };
}

function scoreFollowUps(fus, question) {
  const list = Array.isArray(fus) ? fus : [];
  // the page's real filter
  const survivors = list
    .filter((f) => typeof f === "string" && f.length > 2 && f.length < 80)
    .filter((f) => { const p = parse(f); return p.needs.length || p.wantsDog || p.kind || p.county || p.town; });
  const novel = survivors.filter((f) => f.toLowerCase().trim() !== question.toLowerCase().trim());
  return { offered: list.length, survived: survivors.length, novel: novel.length, samples: novel.slice(0, 2) };
}

/* ---- run ------------------------------------------------------------------ */
const REPS = Number(process.argv[2] ?? 2);
const MODELS = (process.env.MODELS ?? "qwen3.6-35b-a3b-mlx").split(",");

for (const model of MODELS) {
  const noThink = model.includes("3.6"); // reasoning family only
  console.log(`\n${"#".repeat(66)}\n# MODEL: ${model}\n${"#".repeat(66)}`);
  for (const [name, strat] of Object.entries(STRATEGIES)) {
    let leadPass = 0, leadTotal = 0, errors = 0;
    let covSum = 0, covN = 0, mmSum = 0, mmN = 0, bmSum = 0, bmN = 0;
    let fuOffered = 0, fuSurvived = 0, fuNovel = 0;
    const acceptedSamples = [], fuSamples = [];
    const t0 = Date.now();
    for (let rep = 0; rep < REPS; rep++) {
      for (const q of SEEDS) {
        const r = match(q);
        let reply;
        try {
          ({ reply } = await callModel(model, strat.system, buildPayload(q, r, strat.counts), noThink));
        } catch { errors++; continue; }
        leadTotal++;
        if (scoreLead(reply.lead, r)) {
          leadPass++;
          if (acceptedSamples.length < 3) acceptedSamples.push(`[${q.slice(0,32)}] ${reply.lead}`);
        }
        const o = scoreOrder(reply.order, r);
        if (o.coverage != null) { covSum += o.coverage; covN++; }
        if (o.modelMono != null) { mmSum += o.modelMono; mmN++; }
        if (o.baseMono != null) { bmSum += o.baseMono; bmN++; }
        const f = scoreFollowUps(reply.followUps, q);
        fuOffered += f.offered; fuSurvived += f.survived; fuNovel += f.novel;
        if (fuSamples.length < 3 && f.samples.length) fuSamples.push(...f.samples.slice(0, 1));
      }
    }
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`\n--- strategy: ${name}  (${secs}s, errors ${errors}) ---`);
    console.log(`  LEAD      pass ${leadPass}/${leadTotal}  (${leadTotal ? Math.round(100 * leadPass / leadTotal) : 0}%)`);
    console.log(`  ORDER     coverage ${covN ? (covSum / covN).toFixed(2) : "-"}  quality ${mmN ? (mmSum / mmN).toFixed(2) : "-"} vs matcher's own ${bmN ? (bmSum / bmN).toFixed(2) : "-"}`);
    console.log(`  FOLLOWUPS offered ${fuOffered}  survived filter ${fuSurvived}  novel ${fuNovel}`);
    for (const s of acceptedSamples) console.log(`    lead ok: ${s.slice(0, 110)}`);
    for (const s of fuSamples) console.log(`    followup: ${s.slice(0, 80)}`);
  }
}
