/**
 * The planner index.
 *
 * Flattens all five datasets into one shape the browser can match against.
 * Built at build time; the client does simple comparisons over it.
 *
 * TWO DESIGN RULES, BOTH LOAD-BEARING
 *
 * 1. NO LANGUAGE MODEL TOUCHES A FACT. The matching is deterministic — dates,
 *    flags, comparisons. A model that can phrase "dogs are allowed at Rehoboth
 *    in July" is an existential risk to a site whose only asset is being right,
 *    and a conversational surface hides the verification stamp that would
 *    otherwise catch it. Free text is parsed into filters; the filters do the
 *    work.
 *
 * 2. UNKNOWN IS NOT NO. Community park facilities are mostly unconfirmed —
 *    14 of 16 have no water answer. A matcher that treats null as false would
 *    return almost nothing and quietly assert a pile of facts we never checked.
 *    So results come back in two buckets: confirmed matches, and ones that may
 *    match but haven't been checked.
 *
 * Date rules are RESOLVED SERVER-SIDE into plain MM-DD ranges, per year, so the
 * client never re-implements the floating-holiday maths. One source of truth
 * for "is a dog legal on this date", shared with the town pages.
 */
import townsData from "../data/towns.json";
import stateParksData from "../data/state-parks.json";
import communityParksData from "../data/community-parks.json";
import dogParksData from "../data/parks.json";
import placesData from "../data/places.json";
import indoorData from "../data/indoor.json";
import nearbyData from "../data/nearby.json";
import drinkData from "../data/drink.json";

import { formatWindow, resolveRule, type Rule, type Status, type Town } from "./rules";
import { isPublishable, tierOf, type Tier } from "./verification";
import { isIndoors } from "./indoor";
import type { StatePark } from "./state-parks";
import type { CommunityPark } from "./community-parks";
import type { Park as DogPark } from "./parks";

export type Kind =
  | "beach town"
  | "state park"
  | "community park"
  | "dog park"
  | "summer beach"
  | "indoors"
  | "attraction"
  | "winery or brewery"
  | "nearby";

/** Tri-state. `null` means unconfirmed and must never be shown as "no". */
export type Tri = boolean | null;

export interface Facilities {
  restrooms: Tri;
  playground: Tri;
  water: Tri;
  shade: Tri;
  trails: Tri;
  beach: Tri;
  camping: Tri;
  fenced: Tri;
  free: Tri;
  paved: Tri;
  sports: Tri;
  dogPark: Tri;
  /** Somewhere to be when the weather rules the beach out. */
  indoors: Tri;
}

/** A dog rule window with its anchors already resolved for a given year. */
export interface ResolvedWindow {
  from: string;
  to: string;
  status: Status;
  /** "before 9:30 am and after 5:30 pm", or null. */
  hours: string | null;
}

export interface PlannerPlace {
  id: string;
  name: string;
  href: string;
  kind: Kind;
  county: string;
  town: string;
  blurb: string;
  verified: boolean;
  /**
   * The real tier, not a boolean.
   *
   * `verified` collapsed three states into two, and the page rendered the
   * false half as "Read from source — not phone-confirmed". Every dog park
   * carries no `sources` array at all, so that label was claiming a source
   * for seventeen records that have none — a false provenance claim on a site
   * whose entire promise is provenance.
   */
  tier: Tier;
  f: Facilities;
  /** Beach towns: resolved rule windows keyed by year. */
  dogWindows?: Record<string, ResolvedWindow[]>;
  /** Everywhere else: a flat answer, since the rule doesn't move with the date. */
  dogs?: { allowed: "yes" | "hours" | "no" | null; note: string };
}

const EMPTY: Facilities = {
  restrooms: null, playground: null, water: null, shade: null, trails: null, beach: null,
  camping: null, fenced: null, free: null, paved: null, sports: null, dogPark: null,
  indoors: null,
};

/* Resolve for this year and next — a trip booked in December lands in the
   following season, and the anchored windows shift between years. */
const YEARS = [new Date().getFullYear(), new Date().getFullYear() + 1];

function resolveWindows(rules: Rule[]): Record<string, ResolvedWindow[]> {
  const out: Record<string, ResolvedWindow[]> = {};
  for (const year of YEARS) {
    out[String(year)] = rules
      .filter((r) => r.area === "beach")
      .map((r) => {
        const { start, end } = resolveRule(r, year);
        return { from: start, to: end, status: r.status, hours: formatWindow(r.timeWindow) };
      });
  }
  return out;
}

export function buildIndex(): PlannerPlace[] {
  const places: PlannerPlace[] = [];

  for (const t of townsData as Town[]) {
    places.push({
      id: `town-${t.slug}`,
      name: t.name,
      href: `/dogs/${t.slug}/`,
      kind: "beach town",
      county: t.county,
      town: t.name,
      blurb: (t as any).profile?.blurb ?? t.answer,
      verified: isPublishable(t),
      tier: tierOf(t),
      f: { ...EMPTY, beach: true, restrooms: null, free: null },
      dogWindows: resolveWindows(t.rules),
    });
  }

  for (const p of stateParksData as StatePark[]) {
    places.push({
      id: `sp-${p.slug}`,
      name: p.name,
      href: `/parks/${p.slug}/`,
      kind: "state park",
      county: p.county,
      town: p.town,
      blurb: p.blurb,
      verified: isPublishable(p),
      tier: tierOf(p),
      f: {
        ...EMPTY,
        beach: p.features.beach,
        camping: p.features.camping,
        trails: p.features.trails,
        // Entry is charged at every fee-banded park, so a known band means not free.
        free: p.feeBand === null ? null : false,
      },
      dogs: { allowed: "yes", note: p.dogs.summary },
    });
  }

  for (const p of communityParksData as CommunityPark[]) {
    places.push({
      id: `cp-${p.slug}`,
      name: p.name,
      href: `/parks/community/${p.slug}/`,
      kind: "community park",
      county: p.county,
      town: p.town,
      blurb: p.blurb,
      verified: isPublishable(p),
      tier: tierOf(p),
      f: {
        ...EMPTY,
        restrooms: p.restrooms.present,
        playground: p.facilities.playground,
        water: p.facilities.water,
        shade: p.facilities.shade,
        trails: p.facilities.trails,
        paved: p.facilities.pavedPath,
        sports: p.facilities.sports,
        dogPark: p.facilities.dogPark,
        free: true,
      },
      dogs: {
        allowed: "yes",
        note: p.facilities.dogPark === true ? "Leashed, and there's a dog park here." : "Leashed.",
      },
    });
  }

  /*
   * The three sections the planner never knew about.
   *
   * It indexed beaches, state parks, community parks and dog parks, so asking
   * it for a museum, a brewery or anything over the state line returned
   * nothing — from a site with a section for each. A planner that silently
   * covers less than the site it plans for reads as "we don't have that".
   */
  for (const p of indoorData as any[]) {
    /*
     * THE ZOO IS NOT A WET-WEATHER ANSWER.
     *
     * The listing pages already split these — /indoors/ filters on isIndoors
     * and the outdoor kinds go to /attractions/ — because Brandywine Zoo is
     * almost entirely open-air and putting it under "when it rains" sends a
     * family out in the rain. The planner was indexing the same file without
     * the split, so the finder answered "somewhere dry" with the zoo: the
     * exact error the pages were corrected for, reappearing in search because
     * the rule lived in the page rather than in the data layer.
     */
    const dry = isIndoors(p);
    places.push({
      id: `in-${p.slug}`,
      name: p.name,
      href: dry ? `/indoors/${p.slug}/` : `/attractions/${p.slug}/`,
      kind: dry ? "indoors" : "attraction",
      county: p.county,
      town: p.town,
      blurb: p.blurb,
      verified: isPublishable(p),
      tier: tierOf(p),
      f: {
        ...EMPTY,
        indoors: dry,
        restrooms: p.restrooms ?? null,
        free: p.admission?.free ?? null,
        /*
         * NOT A BEACH — and this is a fact, not a default.
         *
         * The finder was telling people "Not checked here: a beach" against
         * Ashland Nature Center, which has a creek you can paddle in and no
         * beach at all. Every record in this file is a museum, a library, a
         * zoo or a nature center; not one of them is a beach, and saying
         * "nobody has checked" about something the dataset plainly knows is
         * the same overclaim as the reverse. Null is for unknown, not for
         * unasked.
         */
        beach: false,
      },
      /* Almost none of these take a dog, and the ones that might have never
         said so. Unknown, not no. */
      dogs: { allowed: null, note: "Not confirmed — ring before you bring a dog inside." },
    });
  }

  for (const p of drinkData as any[]) {
    places.push({
      id: `dr-${p.slug}`,
      name: p.name,
      href: `/wineries-and-breweries/${p.slug}/`,
      kind: "winery or brewery",
      county: p.county,
      town: p.town,
      blurb: p.blurb,
      verified: isPublishable(p),
      tier: tierOf(p),
      f: { ...EMPTY, indoors: true },
      dogs: {
        allowed: p.dogs?.outdoor === true ? "yes" : p.dogs?.outdoor === false ? "no" : null,
        note: p.dogs?.note ?? "No published dog policy.",
      },
    });
  }

  for (const p of nearbyData as any[]) {
    places.push({
      id: `nb-${p.slug}`,
      name: p.name,
      href: `/nearby/${p.slug}/`,
      kind: "nearby",
      county: p.county ?? p.state,
      town: p.town,
      blurb: p.blurb,
      verified: isPublishable(p),
      tier: tierOf(p),
      f: { ...EMPTY, free: p.admission?.amount === 0 ? true : null },
      dogs: { allowed: null, note: "Not confirmed." },
    });
  }

  for (const p of dogParksData as DogPark[]) {
    places.push({
      id: `dp-${p.slug}`,
      name: p.name,
      href: `/dogs/dog-parks/${p.slug}/`,
      kind: "dog park",
      county: p.county,
      town: p.address.split(",")[1]?.trim() ?? p.county,
      blurb: p.notes ?? "",
      verified: isPublishable(p),
      tier: tierOf(p),
      f: {
        ...EMPTY,
        water: p.water,
        shade: p.shade === null ? null : p.shade !== "minimal",
        fenced: p.fenced,
        free: p.fee === null ? null : p.fee === 0,
        dogPark: true,
      },
      dogs: { allowed: "yes", note: p.fenced === false ? "Off-leash but NOT fenced." : "Off-leash." },
    });
  }

  for (const p of placesData as any[]) {
    if (p.href?.startsWith("/dogs/") && p.href !== "/dogs/state-parks/") continue; // town dupes
    places.push({
      id: `pl-${p.slug}`,
      name: p.name,
      href: p.href ?? "/dogs/summer/",
      kind: "summer beach",
      county: p.county,
      town: p.county,
      blurb: p.headline,
      verified: isPublishable(p),
      tier: tierOf(p),
      f: { ...EMPTY, beach: true },
      dogs: {
        allowed: p.openInSummer === "yes" ? "yes" : "hours",
        note: p.detail.slice(0, 160),
      },
    });
  }

  return places;
}

/** Facility labels, in the words a person would use. */
export const NEED_LABELS: [keyof Facilities, string][] = [
  ["restrooms", "Restrooms"],
  ["playground", "Playground"],
  ["water", "Drinking water"],
  ["shade", "Shade"],
  ["trails", "Trails to walk"],
  ["beach", "A beach"],
  ["camping", "Camping"],
  ["fenced", "Fenced dog area"],
  ["free", "Free to get in"],
  ["paved", "Paved paths"],
  ["sports", "Courts or fields"],
  ["indoors", "Indoors, out of the weather"],
];
