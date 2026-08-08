/**
 * Post-build guard.
 *
 * The verification gate sets `noindex` from the data, and astro.config builds
 * the sitemap exclusion list from the same data. Those are two lists derived
 * separately, which means they can drift — and they did: adding /dogs/dog-parks/
 * and /dogs/pet-fees/ set them noindex but left them in the sitemap, because
 * the config only knew about towns.
 *
 * Rather than trusting them to stay in step, this checks the built output,
 * which is the only thing a crawler actually sees. Submitting a noindex URL in
 * a sitemap is a crawl-budget own goal and a contradictory signal.
 *
 * Runs automatically after `npm run build`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );

const files = walk(DIST);
const problems = [];

/* ---- 1. noindex pages must not appear in the sitemap -------------------- */

const sitemaps = files.filter((f) => /sitemap-\d+\.xml$/.test(f));
const listed = new Set(
  sitemaps.flatMap((f) =>
    [...readFileSync(f, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      new URL(m[1]).pathname,
    ),
  ),
);

for (const file of files.filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  const path = "/" + relative(DIST, file).replace(/index\.html$/, "");
  const noindex = /<meta name="robots" content="noindex/.test(html);

  if (noindex && listed.has(path)) {
    problems.push(`${path} is noindex but IS in the sitemap`);
  }

  // A noindex page must not ship structured data either — don't hand a crawler
  // rich results for something it's been told to ignore.
  if (noindex && html.includes("application/ld+json")) {
    problems.push(`${path} is noindex but emits JSON-LD`);
  }

  // Every indexable page needs the basics.
  if (!noindex) {
    if (!/rel="canonical"/.test(html)) problems.push(`${path} has no canonical`);
    if (!/<meta name="description"/.test(html)) problems.push(`${path} has no description`);
    if (!/property="og:title"/.test(html)) problems.push(`${path} has no og:title`);
  }
}

/* ---- 2. report ---------------------------------------------------------- */

const indexable = files.filter(
  (f) => f.endsWith(".html") && !/content="noindex/.test(readFileSync(f, "utf8")),
).length;

/* ---------------------------------------------------------- US English -- */

/*
 * British spellings and idioms, caught in the rendered HTML.
 *
 * This has now shipped three separate times: "at weekends" on a badge,
 * "pushchair" in a URL slug, "car park" in the share pitch. Each time it was
 * found by a reader rather than by me, and each time I fixed the instances and
 * not the cause. A guard is the cause.
 *
 * It reads the built pages, not the source, so it catches the string a visitor
 * would actually see regardless of which file it came from.
 */
const BRITISH = [
  [/\bat weekends\b/i, "at weekends → on weekends"],
  [/\bat the weekend\b/i, "at the weekend → on the weekend"],
  [/\bcentres?\b/i, "centre → center"],
  /* NOT /colou?rs?/ — the optional u makes it match the correct American
     "color" too, and it did: it failed a build over the word "tea-colored".
     A guard that fires on the right spelling trains you to ignore it. */
  [/\bcolours?\b/i, "colour → color"],
  [/\bcoloured\b/i, "coloured → colored"],
  [/\borganis(e|ed|ing|ation)\b/i, "organise → organize"],
  [/\bmodelled\b/i, "modelled → modeled"],
  [/\bcar parks?\b/i, "car park → parking lot"],
  [/\bpushchairs?\b/i, "pushchair → stroller"],
  [/\blicences?\b/i, "licence → license"],
  [/\bgrey\b/i, "grey → gray"],
  [/\bstoreys?\b/i, "storey → story"],
  [/\blabelled\b/i, "labelled → labeled"],
  [/\bbehaviours?\b/i, "behaviour → behavior"],
  [/\bneighbours?\b/i, "neighbour → neighbor"],
  [/\bdefences?\b/i, "defence → defense"],
  [/\boffences?\b/i, "offence → offense"],
  [/\brecognis(e|ed|able)\b/i, "recognise → recognize"],
  [/\bwhilst\b/i, "whilst → while"],
  [/\bamongst\b/i, "amongst → among"],
  [/\bfavourite\b/i, "favourite → favorite"],
  [/\btravelled\b/i, "travelled → traveled"],
  [/\bcancelled\b/i, "cancelled → canceled"],
];

for (const f of files.filter((x) => x.endsWith(".html"))) {
  /* Strip tags first: aria-labelledby is correct HTML and must not trip the
     `labelled` rule, and class names carry colour tokens. */
  const text = readFileSync(f, "utf8")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  for (const [re, fix] of BRITISH) {
    if (re.test(text)) problems.push(`${relative(DIST, f)}: ${fix}`);
  }
}

/* ------------------------------------------- unverified safety claims -- */

/*
 * Nothing from emergency.json may reach a built page while its verifiedDate is
 * null.
 *
 * WHY THIS IS A BUILD GATE AND NOT A NOTE
 *
 * emergency.json has carried a comment since the day it was created saying
 * every number needs a first-party confirmation call before verifiedDate is
 * set. The comment was correct, prominent, and completely ineffective: the
 * headline "There is no 24-hour emergency vet in Sussex County" shipped on six
 * pages, styled as the most important line on each, with verifiedDate null the
 * entire time.
 *
 * A categorical negative about a whole county's provision is the hardest claim
 * on this site to support and the most expensive to get wrong, because the
 * failure mode is somebody driving past a practice that would have taken the
 * dog. An instruction to be careful had already been tried. This is the same
 * lesson as the sitemap and US-English gates: if it matters, the build enforces
 * it, because I will otherwise talk myself past it at midnight.
 */
/*
 * SCOPED TO THE HEADLINE, DELIBERATELY.
 *
 * The first version of this gate also blocked every vet's hours, and blocking
 * those is wrong. A practice publishing "Mon–Thu 6pm–8am" on its own site is a
 * sourced fact — the same tier as a DNREC fee — and withholding it until I've
 * rung them leaves somebody with less information at 11pm, not more.
 *
 * The headline is a different animal. Nobody published it: I wrote it, about a
 * whole county, in the negative. That is the class of claim that has to earn
 * its way onto the page. Unconfirmed hours publish with a visible marker
 * instead — see TownContacts.astro.
 */
const emergency = JSON.parse(readFileSync("src/data/emergency.json", "utf8"));
const guarded = [["headline.fact", emergency.headline?.fact, emergency.headline?.verifiedDate]];

for (const [label, claim, verifiedDate] of guarded) {
  if (!claim || verifiedDate) continue;
  /* Long claims are matched on a distinctive opening rather than in full —
     the renderer wraps and entity-escapes, so exact matching would silently
     never fire, which is the failure mode this gate exists to prevent. */
  const needle = String(claim).slice(0, 42).replace(/\s+/g, " ").trim();
  if (needle.length < 12) continue;
  for (const f of files.filter((x) => x.endsWith(".html"))) {
    const text = readFileSync(f, "utf8")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ");
    if (text.includes(needle)) {
      problems.push(
        `${relative(DIST, f)}: publishes unverified emergency claim (${label}) — ` +
          `set verifiedDate in emergency.json after a first-party call, or keep it unpublished`,
      );
    }
  }
}

if (problems.length) {
  console.error(`\n  ✗ Build check failed:\n${problems.map((p) => `      ${p}`).join("\n")}\n`);
  process.exit(1);
}

console.log(
  `  ✓ Build check: ${listed.size} URLs in sitemap, ${indexable} indexable pages, no contradictions.\n`,
);
