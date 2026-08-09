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

/* ------------------------------------------ commerce off safety pages -- */

/*
 * No product module may reach a page about getting hurt or overcharged.
 *
 * The component already refuses to render on these paths. This is the second
 * lock, because the first one is a condition inside a file somebody can edit,
 * and the emergency-vet headline proved this week that a rule which lives only
 * in a comment or a condition is a rule that eventually doesn't hold.
 *
 * A sticker between "is the water safe for the dog" and the answer would be
 * the single fastest way to spend the trust the rest of this site is built on.
 */
const SAFETY_PAGES = ["/dogs/pond-safety/", "/dogs/pet-fees/", "/contacts/"];

for (const f of files.filter((x) => x.endsWith(".html"))) {
  const path = "/" + relative(DIST, f).replace(/index\.html$/, "");
  if (!SAFETY_PAGES.some((p) => path.startsWith(p))) continue;
  if (/data-field-mark=/.test(readFileSync(f, "utf8"))) {
    problems.push(
      `${relative(DIST, f)}: product module on a safety page — ` +
        `remove the placement, or remove the page from SAFETY_PAGES only if it stopped being one`,
    );
  }
}

/* --------------------------------------------- palette: contrast + meaning -- */

/*
 * Two rules both palettes claim in their comments and neither enforced.
 *
 * 1. CONTRAST. feature-colors.ts says every value clears 7:1 filled, and it
 *    does — because it was solved numerically once, by hand, and then trusted
 *    forever. The birding vocabulary added sixteen more, and all four season
 *    accents as first drafted came in between 5.30:1 and 6.15:1. They looked
 *    completely fine. That is the entire problem with checking colour by eye.
 *
 * 2. ONE SEMANTIC COLOUR, ONE MEANING. Spring green must not later become
 *    "verified", and habitat blue must not become "beginner". Two keys sharing
 *    an exact hex across the two palettes means one of them has quietly
 *    stopped carrying information.
 *
 * Near-neighbours are allowed and intentional — beach and swimming sit two
 * hex digits apart because they are the same family. Exact collisions are not.
 */
const CREAM = "#fbf5e9";
const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
};
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const palettes = [
  ["feature-colors", "src/lib/feature-colors.ts"],
  ["birding-taxonomy", "src/lib/birding-taxonomy.ts"],
];

/*
 * Deliberate aliases: one colour, two names for the same thing, documented at
 * the declaration. `paved` and `pavedPath` are the same surface; `coast` is the
 * habitat name for `beach`. These must NOT read as two things, so sharing a hex
 * is the point rather than the bug.
 */
const ALIASES = new Set(["paved", "indoors", "rainyDay", "coast"]);
const seen = new Map();

for (const [name, path] of palettes) {
  const src = readFileSync(path, "utf8");
  const entries = [
    /* Plain `key: "#rrggbb"` maps. */
    ...src.matchAll(/(?:^|\n)\s{2}(\w+):\s*"(#[0-9a-fA-F]{6})"/g),
    /* Tag objects: the key is `key:`, the colour is `color:`, `fill` is the
       ground it sits on rather than a colour in its own right. */
    ...src.matchAll(/key:\s*"(\w+)",[^}]*?color:\s*"(#[0-9a-fA-F]{6})"(?:,\s*fill:\s*"(#[0-9a-fA-F]{6})")?/g),
  ];
  for (const m of entries) {
    const [, key, color, fill] = m;
    /* `color` and `fill` are property names, not feature keys. */
    if (!key || !color || key === "color" || key === "fill") continue;
    const ground = fill ?? CREAM;
    const ratio = contrast(color, ground);
    if (ratio < 7) {
      problems.push(
        `${name}: ${key} ${color} on ${ground} is ${ratio.toFixed(2)}:1 — needs 7:1. ` +
          `Darken it in steps rather than picking a new one by eye.`,
      );
    }
    const prior = seen.get(color);
    if (prior && prior !== key && !ALIASES.has(key) && !ALIASES.has(prior)) {
      problems.push(
        `${name}: ${key} reuses ${color}, already meaning "${prior}". ` +
          `One semantic colour, one meaning — pick a distinct value.`,
      );
    }
    seen.set(color, key);
  }
}

if (problems.length) {
  console.error(`\n  ✗ Build check failed:\n${problems.map((p) => `      ${p}`).join("\n")}\n`);
  process.exit(1);
}

console.log(
  `  ✓ Build check: ${listed.size} URLs in sitemap, ${indexable} indexable pages, no contradictions.\n`,
);
