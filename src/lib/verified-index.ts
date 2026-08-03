/**
 * The public verification index.
 *
 * Every record on the site, its tier, its source, and how old that source is —
 * generated from the JSON at build time, so it can never drift from what the
 * pages actually say.
 *
 * It earns its place three ways:
 *   · It states the differentiator as data rather than as a claim. Anyone can
 *     write "we verify everything"; almost nobody will publish the table.
 *   · Models weight provenance, and this is the provenance, machine-readable.
 *   · It doubles as the work queue — sort by age and the stalest facts float up.
 *
 * Staleness threshold is 180 days. A dog rule confirmed last spring is not a
 * dog rule confirmed today, and pretending otherwise is the exact failure this
 * site exists to correct.
 */
import townsData from "../data/towns.json";
import stateParksData from "../data/state-parks.json";
import communityParksData from "../data/community-parks.json";
import dogParksData from "../data/parks.json";
import placesData from "../data/places.json";
import surfData from "../data/surf-fishing.json";
import emergencyData from "../data/emergency.json";
import lodgingData from "../data/lodging.json";

import { tierOf, type Tier, type Verifiable } from "./verification";

export interface VerifiedRow {
  fact: string;
  section: string;
  href: string | null;
  tier: Tier;
  /** ISO date the fact was confirmed or the source was read. */
  date: string | null;
  source: string | null;
  /** Days since `date`, or null when there is no date at all. */
  ageDays: number | null;
  stale: boolean;
}

export const STALE_AFTER_DAYS = 180;

const DAY = 24 * 60 * 60 * 1000;

function ageOf(iso: string | null, today: Date): number | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return Math.max(0, Math.round((today.getTime() - new Date(y, m - 1, d).getTime()) / DAY));
}

function row(
  today: Date,
  fact: string,
  section: string,
  href: string | null,
  item: Verifiable,
): VerifiedRow {
  const tier = tierOf(item);
  const date = tier === "confirmed" ? item.verifiedDate : tier === "sourced" ? (item.sourcedOn ?? null) : null;
  const source =
    tier === "confirmed"
      ? item.verifiedSource
      : tier === "sourced"
        ? (item.sources?.[0]?.label ?? null)
        : null;
  const ageDays = ageOf(date, today);
  return {
    fact,
    section,
    href,
    tier,
    date,
    source,
    ageDays,
    // Reported records aren't stale, they're unstarted — don't flag them twice.
    stale: tier !== "reported" && ageDays !== null && ageDays > STALE_AFTER_DAYS,
  };
}

export function buildVerifiedIndex(today = new Date()): VerifiedRow[] {
  const r: VerifiedRow[] = [];
  const add = (f: string, s: string, h: string | null, i: Verifiable) => r.push(row(today, f, s, h, i));

  for (const t of townsData as any[])
    add(`${t.name} — beach and boardwalk dog rules`, "Dogs", `/dogs/${t.slug}/`, t);

  for (const p of placesData as any[])
    add(`${p.name} — summer dog access`, "Dogs", p.href, p);

  for (const p of dogParksData as any[])
    add(`${p.name} — the seven fields`, "Dogs", `/dogs/dog-parks/${p.slug}/`, p);

  for (const l of (lodgingData as any[]).filter((x) => typeof x.name === "string"))
    add(`${l.name} — pet fee and policy`, "Dogs", "/dogs/pet-fees/", l);

  for (const p of stateParksData as any[])
    add(`${p.name} State Park — facilities and fees`, "Parks", `/parks/${p.slug}/`, p);

  for (const p of communityParksData as any[])
    add(`${p.name} — restrooms and facilities`, "Parks", `/parks/community/${p.slug}/`, p);

  /* Surf fishing is keyed by rule block rather than by entity, because that's
     how the rules themselves are published and how they'll be re-confirmed. */
  const surf = surfData as any;
  const surfBlocks: [string, string, string][] = [
    ["headline", "Which crossings need a reservation", "/surf-fishing/"],
    ["reservations", "Reservation window, cost and release times", "/surf-fishing/"],
    ["afterFour", "The after-4pm no-reservation rule", "/surf-fishing/"],
    ["permits", "Surf fishing permit prices", "/surf-fishing/permits/"],
    ["offPeakEnding", "Off-peak permit discontinued in 2027", "/surf-fishing/permits/"],
    ["license", "Fishing licence tiers and the permit exemption", "/surf-fishing/permits/"],
    ["closures", "Nesting closures at The Point", "/surf-fishing/"],
    ["noResidentPriority", "Why residents get no reservation priority", "/surf-fishing/"],
  ];
  for (const [key, label, href] of surfBlocks)
    if (surf[key]) add(label, "Surf fishing", href, surf[key]);

  const em = emergencyData as any;
  add("No 24-hour emergency vet in Sussex County", "Emergency", "/dogs/pond-safety/", em.headline);
  for (const v of em.vets) add(`${v.name} — number and hours`, "Emergency", null, v);

  return r;
}

export function summarise(rows: VerifiedRow[]) {
  const by = (t: Tier) => rows.filter((x) => x.tier === t).length;
  return {
    total: rows.length,
    confirmed: by("confirmed"),
    sourced: by("sourced"),
    reported: by("reported"),
    stale: rows.filter((x) => x.stale).length,
    /** Median age of everything that has a date at all. */
    medianAge: (() => {
      const ages = rows.map((x) => x.ageDays).filter((a): a is number => a !== null).sort((a, b) => a - b);
      return ages.length ? ages[Math.floor(ages.length / 2)] : null;
    })(),
  };
}
