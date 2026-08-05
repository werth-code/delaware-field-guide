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

if (problems.length) {
  console.error(`\n  ✗ Build check failed:\n${problems.map((p) => `      ${p}`).join("\n")}\n`);
  process.exit(1);
}

console.log(
  `  ✓ Build check: ${listed.size} URLs in sitemap, ${indexable} indexable pages, no contradictions.\n`,
);
