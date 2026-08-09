#!/usr/bin/env node
/**
 * Pull eBird REFERENCE data at build time.
 *
 * WHY BUILD TIME AND NOT THE BROWSER
 *
 * This site is static and has no server. A fetch from the page would need the
 * key in client JavaScript, where it is readable by anyone with dev tools open
 * — and it would be third-party JavaScript, which this site does not run. So
 * the key lives in CI, the data is fetched once during the build, and what
 * reaches a visitor is a plain JSON file with no key and no request.
 *
 * THE KEY IS NEVER IN THIS REPO AND NEVER IN THIS FILE.
 *
 * It arrives as EBIRD_API_KEY in the environment: a GitHub Actions secret in
 * CI, an exported shell variable locally. It is never logged, never echoed,
 * never written to disk, and never prefixed PUBLIC_ — that prefix is how Astro
 * decides what to inline into the browser bundle, and it would publish the key
 * on every page of the site.
 *
 * WHAT THIS IS ALLOWED TO FETCH, AND WHAT IT ISN'T
 *
 * eBird holds two different kinds of thing, and this site treats them
 * differently because its own rules require it to:
 *
 *   REFERENCE DATA — the taxonomy, and the hotspot registry. Curated by the
 *   Cornell Lab. This is the same class of source as DNREC's fee table: an
 *   authority publishing its own record. Fetched, cached, cited.
 *
 *   OBSERVATIONS — what people reported seeing, and when. Crowd-sourced, and
 *   therefore `reported` tier, which on this site NEVER PUBLISHES AS FACT. A
 *   sighting is somebody's word, unreviewed, and baking it into a static page
 *   would also make it wrong within hours. Those link out to eBird live,
 *   where they are current and correctly attributed.
 *
 * So this script deliberately does not touch /data/obs/. If a future version
 * needs live sightings, they belong in a link, not in this repo.
 *
 * RATE LIMITS
 *
 * eBird asks for considerate use rather than publishing a hard ceiling, so the
 * posture here is: cache everything to disk with a long TTL, sleep between
 * calls, and never fetch during an ordinary `npm run build`. A full refresh is
 * three requests. Running it daily would be rude and pointless — the state list
 * and the hotspot registry change on the order of weeks.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const KEY = process.env.EBIRD_API_KEY;
const OUT = "src/data/generated";
const CACHE = ".cache/ebird";
const REGION = "US-DE";
/* Reference data moves slowly. A week is generous and still keeps us honest. */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

if (!KEY) {
  console.error(
    "\n  EBIRD_API_KEY is not set.\n\n" +
      "  Local:  export EBIRD_API_KEY=...    (your shell, not a file in this repo)\n" +
      "  CI:     repository secret, referenced in deploy.yml as ${{ secrets.EBIRD_API_KEY }}\n\n" +
      "  Do NOT name it PUBLIC_EBIRD_API_KEY — Astro inlines PUBLIC_ vars into the\n" +
      "  browser bundle, which would publish the key on every page of the site.\n",
  );
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
mkdirSync(CACHE, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path, cacheName) {
  const cached = join(CACHE, cacheName);
  if (existsSync(cached) && Date.now() - statSync(cached).mtimeMs < TTL_MS) {
    console.log(`  cached   ${cacheName}`);
    return JSON.parse(readFileSync(cached, "utf8"));
  }
  /* One second between live calls. Nothing here is urgent. */
  await sleep(1000);
  const res = await fetch(`https://api.ebird.org/v2${path}`, {
    headers: { "X-eBirdApiToken": KEY },
  });
  if (!res.ok) {
    /* Never interpolate the key into an error. */
    throw new Error(`eBird ${path} → ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  writeFileSync(cached, JSON.stringify(body));
  console.log(`  fetched  ${cacheName}  (${Array.isArray(body) ? body.length : "?"} rows)`);
  return body;
}

const run = async () => {
  console.log("\n  eBird reference data — Delaware\n");

  /* 1. The species codes accepted for Delaware. This is the master checklist
        the birding section needs and the one thing I could not have written
        by hand: a state list is a records-committee artifact, not something to
        reconstruct from memory. */
  const codes = await get(`/product/spplist/${REGION}`, "spplist-us-de.json");

  /* 2. Names and taxonomy for those codes. Fetched for the whole taxonomy in
        one request rather than one request per species, which would be
        thousands of calls for the same information. */
  const taxonomy = await get(`/ref/taxonomy/ebird?fmt=json`, "taxonomy.json");

  /* 3. Hotspots, for matching eBird locations to places this site covers. */
  const hotspots = await get(`/ref/hotspot/${REGION}?fmt=json`, "hotspots-us-de.json");

  const byCode = new Map(taxonomy.map((t) => [t.speciesCode, t]));
  const species = codes
    .map((code) => {
      const t = byCode.get(code);
      if (!t) return null;
      return {
        code,
        commonName: t.comName,
        scientificName: t.sciName,
        family: t.familyComName ?? null,
        order: t.order ?? null,
        /* eBird hotspot/observation URLs are built from the code, so nothing
           needs storing beyond it. */
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.commonName.localeCompare(b.commonName));

  const payload = {
    _comment:
      "GENERATED by scripts/fetch-ebird.mjs. Do not edit by hand. The Delaware " +
      "species list and taxonomy come from the eBird API (Cornell Lab of " +
      "Ornithology) and are reference data, not sightings. Nothing in this file " +
      "asserts that a bird is present today — see /birding/ for how seasonality " +
      "is handled and why live observations link out instead.",
    source: {
      label: "eBird API 2.0 — Cornell Lab of Ornithology",
      url: "https://ebird.org/region/US-DE",
      region: REGION,
    },
    fetchedOn: new Date().toISOString().slice(0, 10),
    speciesCount: species.length,
    hotspotCount: hotspots.length,
    species,
  };
  writeFileSync(join(OUT, "ebird-delaware.json"), JSON.stringify(payload, null, 2));

  writeFileSync(
    join(OUT, "ebird-hotspots.json"),
    JSON.stringify(
      {
        _comment: "GENERATED. eBird hotspot registry for Delaware, for matching to Field Guide places.",
        fetchedOn: payload.fetchedOn,
        hotspots: hotspots.map((h) => ({
          id: h.locId,
          name: h.locName,
          county: h.subnational2Name ?? null,
          lat: h.lat,
          lon: h.lng,
        })),
      },
      null,
      2,
    ),
  );

  console.log(`\n  ✓ ${species.length} species, ${hotspots.length} hotspots → ${OUT}/\n`);
};

run().catch((e) => {
  console.error(`\n  ✗ ${e.message}\n`);
  process.exit(1);
});
