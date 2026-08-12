/**
 * Validates a proposed extension to leadIsSafe().
 *
 * The shipped guard checks /\d+/ only, so "Forty-seven places" walks straight
 * past a check that stops "47 places". Models spell small numbers by default,
 * so this is the common path, not the exotic one.
 *
 * Tested here before touching ask.astro: the fix has to stop the inflated
 * counts WITHOUT rejecting sentences the site would legitimately want.
 */
import { loadAsk } from "./harness.mjs";
const { match, leadIsSafe } = loadAsk();

/* ---- proposed addition -------------------------------------------------- */
const WORD_NUM = {
  zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8,
  nine:9, ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
  sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20, thirty:30,
  forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90,
};
/* Quantifiers that assert a magnitude no one counted. There is no number to
   check them against, which is exactly why they cannot be allowed. */
const VAGUE = /\b(dozens?|scores?|many|several|numerous|plenty|loads|lots|handful|couple|few)\b/i;

function numGuard(lead, r) {
  if (VAGUE.test(lead)) return false;
  const ok = new Set([r.matches.length, r.unconfirmed.length, r.matches.length + r.unconfirmed.length]);
  // Hyphenated compounds ("forty-seven") are split so both halves are seen.
  for (const w of lead.toLowerCase().split(/[^a-z]+/)) {
    if (w in WORD_NUM && !ok.has(WORD_NUM[w])) return false;
  }
  return true;
}
const patched = (lead, r) => leadIsSafe(lead, r) && numGuard(lead, r);

/* ---- cases -------------------------------------------------------------- */
const r = match("fenced dog park near Wilmington");     // 3 confirmed, 1 unconfirmed
console.log(`REALITY: confirmed=${r.matches.length} unconfirmed=${r.unconfirmed.length} (allowed: 3, 1, 4)\n`);

const MUST_REJECT = [
  ["digit, wrong count",      "47 places match today."],
  ["word, wrong count",       "Forty-seven places match today."],
  ["word, wrong count 2",     "Twelve places confirm dogs today."],
  ["word, wrong count 3",     "Nine spots are ready for your dog."],
  ["vague: dozens",           "Dozens of places match today."],
  ["vague: many",             "Many places across the state confirm dogs today."],
  ["vague: several",          "Several parks near Wilmington fit."],
  ["vague: a few",            "A few spots should work for you."],
];
const MUST_ACCEPT = [
  ["digit, correct",          "3 places match today."],
  ["word, correct confirmed", "Three places near Wilmington confirm a fenced dog area."],
  ["word, correct unconfirmed","One more may work but has not been checked."],
  ["word, correct total",     "Four places came back for that."],
  ["no number at all",        "These confirm a fenced dog area near Wilmington."],
  ["refusal, no number",      "Not there — the ones below allow dogs instead."],
];

let bad = 0;
console.log("MUST REJECT");
for (const [label, lead] of MUST_REJECT) {
  const before = leadIsSafe(lead, r), after = patched(lead, r);
  if (after) bad++;
  console.log(`  shipped:${before ? "PASS" : "fail"}  patched:${after ? "PASS <-- STILL LEAKS" : "fail"}   ${label}`);
}
console.log("\nMUST ACCEPT  (false positives here would break legitimate leads)");
for (const [label, lead] of MUST_ACCEPT) {
  const before = leadIsSafe(lead, r), after = patched(lead, r);
  if (!after) bad++;
  console.log(`  shipped:${before ? "PASS" : "fail"}  patched:${after ? "PASS" : "fail <-- REGRESSION"}   ${label}`);
}
console.log(`\n${bad === 0 ? "OK — patch stops every inflated count and breaks nothing above." : `${bad} case(s) wrong`}`);
