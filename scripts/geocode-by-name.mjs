#!/usr/bin/env node
/**
 * Second pass for records the address pass could only place at a town centre.
 *
 * geocode.mjs asks Nominatim for the street address, and Nominatim's US
 * house-number coverage is patchy — eight dog parks fell back to town
 * centroids, five of them onto the IDENTICAL Wilmington point, where five
 * stacked markers render as one. But these are public parks, and public parks
 * are usually IN OpenStreetMap as parks. Asking by name finds the park
 * polygon itself, which is better than any street address: the centroid of
 * the park is the park.
 *
 * Same conditions as the first pass: one request per second, identified
 * User-Agent, disk cache, Delaware bounding box or rejection. Stricter in one
 * way — a result only counts if Nominatim says it is a leisure/park-ish
 * feature whose name overlaps what we asked for. A plausible point that is
 * secretly a road or a shop is exactly the wrong-pin failure the first pass
 * guards against.
 *
 * Only records currently at "town" precision are touched. An upgraded hit is
 * recorded as "site": the matched park boundary IS the place, which is what
 * site has always meant here.
 *
 *   node scripts/geocode-by-name.mjs src/data/parks.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const FILE = process.argv[2];
if (!FILE) {
  console.error("usage: node scripts/geocode-by-name.mjs <data-file.json>");
  process.exit(1);
}

const CACHE = ".cache/geocode";
mkdirSync(CACHE, { recursive: true });

const BOUNDS = { minLat: 38.4, maxLat: 39.9, minLon: -75.85, maxLon: -74.95 };
const inDelaware = (lat, lon) =>
  lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lon >= BOUNDS.minLon && lon <= BOUNDS.maxLon;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* "Rockford Park off-leash area" is not a name OSM knows; "Rockford Park" is.
   Strip the site's own qualifiers down to the park the thing lives in. */
const parkName = (name) =>
  name
    .replace(/\s*[—–-]\s.*$/, "")            // "… — West 18th Street"
    .replace(/^Dog Park @ /i, "")
    .replace(/\b(off-leash( area)?|bark park|dog park)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/\bPark\b.*$/i, "Park");        // "Carousel Park <anything>" → "Carousel Park"

const PARKISH = new Set(["park", "dog_park", "recreation_ground", "nature_reserve", "garden", "pitch"]);

async function lookup(q) {
  const key = join(CACHE, `name-${Buffer.from(q).toString("base64url").slice(0, 100)}.json`);
  if (existsSync(key)) return JSON.parse(readFileSync(key, "utf8"));
  await sleep(1100);
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=us&q=" +
    encodeURIComponent(q);
  const res = await fetch(url, {
    headers: {
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
let upgraded = 0;
const skipped = [];

for (const r of rows) {
  if (!r || typeof r !== "object" || !r.coords) continue;
  if (r.coords.precision !== "town") continue;

  const base = parkName(r.name);
  const town = r.town ?? (r.address ?? "").split(",").slice(-2, -1).join("").trim();
  const q = `${base}, ${town}, Delaware`;

  let hits;
  try {
    hits = await lookup(q);
  } catch (e) {
    skipped.push(`${r.name}: ${e.message}`);
    continue;
  }

  /* The hit must BE a park-ish thing and CARRY the name we asked about.
     Anything else keeps its honest town-centre dot. */
  const nameWords = base.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const hit = (hits ?? []).find(
    (h) =>
      PARKISH.has(h.type) &&
      inDelaware(Number(h.lat), Number(h.lon)) &&
      nameWords.some((w) => (h.display_name ?? "").toLowerCase().includes(w)),
  );
  if (!hit) {
    skipped.push(`${r.name}: no park named like "${base}" near ${town} — keeping town centre`);
    continue;
  }

  r.coords = {
    lat: Number(Number(hit.lat).toFixed(5)),
    lon: Number(Number(hit.lon).toFixed(5)),
    precision: "site",
  };
  upgraded++;
  console.log(`  ${r.name}`);
  console.log(`    → ${r.coords.lat},${r.coords.lon}  (${hit.type}: ${hit.display_name?.slice(0, 70)})`);
}

writeFileSync(FILE, JSON.stringify(rows, null, 2) + "\n");
console.log(`\n  upgraded ${upgraded} to site precision`);
for (const s of skipped) console.log(`  kept: ${s}`);
