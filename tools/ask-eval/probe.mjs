import { loadAsk } from "./harness.mjs";
const { match, leadIsSafe, deterministicLead, NEED_SAYS } = loadAsk();
console.log("loaded fns:", ["match","leadIsSafe","deterministicLead"].filter(k=>typeof ({match,leadIsSafe,deterministicLead})[k]==="function"));
console.log("NEED_SAYS present:", !!NEED_SAYS);
for (const q of ["Can the dog come to the beach?", "A fenced dog park near Wilmington", "dogs on rehoboth beach in july"]) {
  const r = match(q);
  console.log(`\nQ: ${q}`);
  console.log(`   matches=${r.matches.length} unconfirmed=${r.unconfirmed.length} blocked=${r.blocked?.length ?? 0}`);
  console.log(`   deterministic lead: ${deterministicLead(r).slice(0,110)}`);
}
