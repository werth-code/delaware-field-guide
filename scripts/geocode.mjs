#!/usr/bin/env node
/**
 * Turn street addresses into coordinates, via OpenStreetMap's Nominatim.
 *
 *   node scripts/geocode.mjs src/data/drink.json
 *
 * WHY THIS IS A SCRIPT AND NOT A SPREADSHEET PASTE
 *
 * Forty drink records carried a street address and no coordinates, which meant
 * the biggest commercial section on the site could not be sorted by distance or
 * fully pinned on the map. That is mechanical work, and mechanical work done by
 * hand forty times is where transcription errors come from.
 *
 * NOMINATIM'S RULES, WHICH ARE CONDITIONS AND NOT SUGGESTIONS
 *
 * One request per second, absolute maximum. A User-Agent that identifies the
 * application and a way to contact whoever runs it. No bulk geocoding of large
 * datasets — forty addresses once is fine; forty thousand on a loop is abuse of
 * a service funded by donations. Results are cached to disk so a re-run costs
 * nothing.
 *
 * IT VALIDATES RATHER THAN TRUSTS
 *
 * A geocoder always returns something. Ask it for a Delaware brewery and a bad
 * match can hand back a plausible-looking point in Ohio, and a wrong pin is
 * worse than no pin — it sends somebody driving. So every result is checked
 * against Delaware's bounding box and anything outside is REJECTED and reported
 * rather than written. Suite and unit numbers are stripped first, because they
 * are the commonest cause of a miss.
 *
 * Precision is recorded as "site" only where Nominatim returned a house-number
 * match. Anything vaguer is stored as "town", because claiming street-level
 * accuracy the source didn't give is the same lie as inventing the number.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const FILE = process.argv[2];
if (!FILE) {
  console.error("usage: node scripts/geocode.mjs <data-file.json>");
  process.exit(1);
}

const CACHE = ".cache/geocode";
mkdirSync(CACHE, { recursive: true });

/* Delaware, generously. Anything outside is a bad match, not a discovery. */
const BOUNDS = { minLat: 38.4, maxLat: 39.9, minLon: -75.85, maxLon: -74.95 };
const inDelaware = (lat, lon) =>
  lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lon >= BOUNDS.minLon && lon <= BOUNDS.maxLon;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* "2703 Philadelphia Pike, Suite A, Claymont, DE 19703" → drop "Suite A".
   Unit designators are the single commonest reason a good address misses. */
const clean = (addr) =>
  addr
    .replace(/,?\s*(suite|ste\.?|unit|#|bldg\.?|building|floor|fl\.?)\s*[\w-]+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

async function geocode(address) {
  const key = join(CACHE, `${Buffer.from(address).toString("base64url").slice(0, 100)}.json`);
  if (existsSync(key)) return JSON.parse(readFileSync(key, "utf8"));

  await sleep(1100);
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=" +
    encodeURIComponent(address);
  const res = await fetch(url, {
    headers: {
      /* Identifies the application and how to reach its owner, as required. */
      "User-Agent": "DelawareFieldGuide/1.0 (https://delawarefieldguide.com)",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const body = await res.json();
  writeFileSync(key, JSON.stringify(body));
  return body;
}

const rows = JSON.parse(readFileSync(FILE, "utf8"));
let done = 0,
  rejected = [],
  missed = [];

for (const r of rows) {
  if (!r || typeof r !== "object") continue;
  if (r.coords?.lat || !r.address) continue;

  const query = clean(r.address);
  let hit;
  try {
    hit = (await geocode(query))[0];
  } catch (e) {
    missed.push(`${r.name}: ${e.message}`);
    continue;
  }
  /* FALLBACK: town and postcode, which always resolves where a street address
     may not — Nominatim's US house-number coverage is patchy and a rural road
     often simply isn't in it. The result is a town centroid and is recorded as
     one. A town-precision point is honest and still sorts by distance usefully;
     it just must never be dressed up as a street address. */
  if (!hit) {
    const town = r.address.split(",").slice(-2).join(",").trim();
    try {
      hit = (await geocode(town))[0];
      if (hit) hit.__fallback = true;
    } catch {}
  }
  if (!hit) {
    missed.push(`${r.name}: no match for "${query}"`);
    continue;
  }

  const lat = Number(hit.lat),
    lon = Number(hit.lon);
  if (!inDelaware(lat, lon)) {
    rejected.push(`${r.name}: ${lat.toFixed(3)},${lon.toFixed(3)} is outside Delaware — "${hit.display_name?.slice(0, 60)}"`);
    continue;
  }

  /* Only a house-number match earns "site". Everything else is a town. */
  const precise =
    !hit.__fallback &&
    (hit.addresstype === "building" ||
      (hit.category === "place" && hit.type === "house") ||
      /^\d/.test(hit.display_name ?? ""));
  r.coords = { lat: Number(lat.toFixed(5)), lon: Number(lon.toFixed(5)), precision: precise ? "site" : "town" };
  r.outstanding = (r.outstanding ?? []).filter((o) => !/coordinate/i.test(o));
  done++;
  console.log(`  ${r.name.slice(0, 34).padEnd(36)} ${r.coords.lat}, ${r.coords.lon}  (${r.coords.precision})`);
}

writeFileSync(FILE, JSON.stringify(rows, null, 2) + "\n");
console.log(`\n  geocoded ${done}`);
if (rejected.length) {
  console.log(`\n  REJECTED — outside Delaware, left blank rather than written:`);
  rejected.forEach((r) => console.log(`    ${r}`));
}
if (missed.length) {
  console.log(`\n  no match:`);
  missed.forEach((m) => console.log(`    ${m}`));
}
