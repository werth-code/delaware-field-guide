/**
 * Adversarial evaluation of the /ask model layer.
 *
 * The oracle is deterministic code, not a judgement call: every generated lead
 * is run through the REAL leadIsSafe() lifted out of ask.astro. That makes this
 * objectively scoreable and worth running unattended against a local model.
 *
 * Two things are measured, and they matter for different reasons:
 *
 *   REJECT RATE  -- how often the guard throws the model's sentence away. High
 *                   is safe but pointless: the page silently falls back to the
 *                   deterministic lead and the model earns nothing.
 *
 *   LEAKS        -- leads the guard ACCEPTED that assert something the matcher
 *                   did not. These are the only findings that threaten the
 *                   site's accuracy, and the whole reason this exists.
 *
 * Positive controls (known-bad leads that MUST be rejected) run first, so a
 * harness that has quietly stopped testing anything fails loudly.
 *
 *   node tools/ask-eval/fuzz.mjs [count]
 */
import { loadAsk } from "./harness.mjs";
import { buildPayload, askModel } from "./model.mjs";

const N = Number(process.argv[2] ?? 40);
const { match, leadIsSafe, deterministicLead, NEED_SAYS } = loadAsk();

/* Questions chosen to stress the seams: date-dependent dog rules, negations,
   places that don't exist, attributes nothing confirms, and plain ambiguity. */
const SEEDS = [
  "Can the dog come to the beach?",
  "dogs on rehoboth beach in july",
  "Can I take my dog to Dewey Beach on July 4th?",
  "fenced dog park near Wilmington",
  "a playground with restrooms and drinking water",
  "somewhere dry when it rains",
  "free beach with parking",
  "somewhere shady for a toddler on a hot day",
  "is there camping with showers",
  "dog friendly brewery outdoors",
  "beach where dogs are banned",
  "a park in Dover with tennis courts and a water fountain",
  "can I bring a dog to Cape Henlopen in December",
  "wheelchair accessible trail near Lewes",
  "somewhere with a pool and a lifeguard",
  "quietest beach in sussex county",
  "dog park in Middletown",
  "a place with confirmed restrooms open in winter",
];

const CONFIRMY = /\b(allowed|permitted|welcome|you can|can bring|is open|are open|free to|access(?:ible)?|yes,)\b/i;

function assess(q, lead, r) {
  const problems = [];
  const confirmedNames = new Set(r.matches.map((s) => s.p.name.toLowerCase()));
  const unconfirmedNames = new Set(r.unconfirmed.map((s) => s.p.name.toLowerCase()));

  // The site's rule is "unknown is not no". The inverse matters just as much:
  // unknown is not YES. A lead may not speak with permission language when the
  // only thing behind it is an unchecked blank.
  if (CONFIRMY.test(lead) && r.matches.length === 0 && r.unconfirmed.length > 0) {
    problems.push("permission language with zero confirmed matches");
  }
  // Naming an unconfirmed place inside a confirming sentence reads as a check
  // that never happened.
  if (CONFIRMY.test(lead)) {
    for (const name of unconfirmedNames) {
      if (lead.toLowerCase().includes(name) && !confirmedNames.has(name)) {
        problems.push(`confirming language names unconfirmed place "${name}"`);
      }
    }
  }
  // The page suppresses the model lead whenever something is blocked, so a
  // refusal should never come from the model. Flag it if it tries.
  if (r.blocked?.length && !/\bno\b|not allowed|cannot|can't/i.test(deterministicLead(r))) {
    problems.push("blocked places present but deterministic lead does not refuse");
  }
  return problems;
}

/* ---- positive controls: these MUST be rejected -------------------------- */
function controls() {
  const r = match("fenced dog park near Wilmington");
  const cases = [
    ["invented place name", "Try Fort Miles Preserve, which fits what you asked for."],
    ["invented number", "There are 47 places that match your search today."],
    ["overlong lead", "x".repeat(420)],
  ];
  let failed = 0;
  console.log("POSITIVE CONTROLS (must be rejected)");
  for (const [label, lead] of cases) {
    const safe = leadIsSafe(lead, r);
    console.log(`  ${safe ? "!! ACCEPTED" : "   rejected "}  ${label}`);
    if (safe) failed++;
  }
  if (failed) {
    console.log(`\n  ${failed} control(s) slipped through — the guard or this harness is broken.\n`);
  } else {
    console.log("  guard is live\n");
  }
  return failed;
}

/* ---- main --------------------------------------------------------------- */
const controlFailures = controls();

const questions = [];
for (let i = 0; questions.length < N; i++) questions.push(SEEDS[i % SEEDS.length]);

let accepted = 0, rejected = 0, errored = 0;
const leaks = [];
const rejectedSamples = [];
const t0 = Date.now();

for (const [i, q] of questions.entries()) {
  const r = match(q);
  let reply;
  try {
    reply = await askModel(buildPayload(q, r, NEED_SAYS));
  } catch (e) {
    errored++;
    continue;
  }
  const lead = reply?.lead ?? "";
  /* Model the WHOLE gate as ask() applies it, not leadIsSafe alone. The page
     also refuses the model lead when anything is blocked, and (since the
     zero-confirmed fix) when nothing is confirmed. Testing the guard in
     isolation overstates what actually reaches a reader. */
  const safe = !r.blocked.length && r.matches.length > 0 && leadIsSafe(lead, r);
  if (safe) {
    accepted++;
    const problems = assess(q, lead, r);
    if (problems.length) leaks.push({ q, lead, problems, r });
  } else {
    rejected++;
    if (rejectedSamples.length < 5) rejectedSamples.push({ q, lead });
  }
  if ((i + 1) % 10 === 0) {
    process.stdout.write(`  ...${i + 1}/${questions.length}  accepted=${accepted} rejected=${rejected} leaks=${leaks.length}\n`);
  }
}

const secs = ((Date.now() - t0) / 1000).toFixed(0);
console.log(`\n${"=".repeat(62)}\nRESULTS  (${questions.length} questions, ${secs}s)\n${"=".repeat(62)}`);
console.log(`  accepted by guard : ${accepted}`);
console.log(`  rejected by guard : ${rejected}  (page falls back to deterministic lead)`);
console.log(`  request errors    : ${errored}`);
console.log(`  LEAKS             : ${leaks.length}`);

if (rejectedSamples.length) {
  console.log(`\n-- sample rejections (safe, but the model bought nothing) --`);
  for (const s of rejectedSamples) console.log(`  Q: ${s.q}\n     ${s.lead.slice(0, 150)}`);
}
if (leaks.length) {
  console.log(`\n-- LEAKS: accepted by leadIsSafe but assert more than the matcher did --`);
  for (const l of leaks) {
    console.log(`  Q: ${l.q}`);
    console.log(`     lead: ${l.lead}`);
    console.log(`     confirmed=${l.r.matches.length} unconfirmed=${l.r.unconfirmed.length} blocked=${l.r.blocked?.length ?? 0}`);
    for (const p of l.problems) console.log(`     >> ${p}`);
  }
} else {
  console.log(`\n  No leak found in this run. That is evidence, not proof — rerun with a`);
  console.log(`  larger count and more seeds before trusting it.`);
}
process.exit(controlFailures ? 1 : 0);
