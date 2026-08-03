/**
 * Delaware's 17 state parks.
 *
 * Same conventions as everything else on this site: `null` means UNVERIFIED,
 * never "no". A park with `camping: null` hasn't been checked; it does not
 * lack a campground. Rendering those as "No" would invent facts seventeen at
 * a time.
 */

export type County = "New Castle" | "Kent" | "Sussex";

export interface StateParkFeatures {
  beach: boolean | null;
  guardedSwimming: boolean | null;
  surfFishing: boolean | null;
  camping: boolean | null;
  cabins: boolean | null;
  trails: boolean | null;
  boatLaunch: boolean | null;
  pier: boolean | null;
  discGolf: boolean | null;
}

export interface StatePark {
  slug: string;
  name: string;
  county: County;
  acres: number | null;
  kind: string;
  town: string;
  blurb: string;
  features: StateParkFeatures;
  /** Which 2026 fee band applies. `null` = not confirmed. */
  feeBand: "beach" | "inland" | null;
  dogs: { summary: string; href: string | null };
  warnings: string[];
  phone: string | null;
  hours: string | null;
  verifiedDate: string | null;
  verifiedSource: string | null;
  outstanding?: string[];
}

/** Fees effective 1 March 2026. Entry is charged 1 March – 30 November. */
export const FEES = {
  beach: { inState: 10, outState: 20, label: "Beach park" },
  inland: { inState: 5, outState: 10, label: "Inland park" },
} as const;

/** The window in which a day fee is charged at all. Outside it, entry is free. */
export const FEE_SEASON = "1 March – 30 November";

/**
 * Annual passes. Verified against the state's own fee-season announcement on
 * 3 August 2026 — the amounts roughly doubled in March 2026 and a great deal
 * of published guidance still quotes the old ones.
 */
export const PASSES = {
  resident: 50,
  nonResident: 100,
  note:
    "Discounted passes are available for active-duty military and veterans; the discounted amounts are not confirmed. " +
    "Deauville Beach has its own annual pass at $115.",
  where:
    "Online at destateparks.com, which issues a virtual pass usable for 30 days from purchase, or at a park office.",
  whereUrl: "https://www.destateparks.com/passes-permits-and-fees/",
} as const;

export function feeText(park: StatePark): { text: string; state: "yes" | "unknown" } {
  if (!park.feeBand) return { text: "Not confirmed", state: "unknown" };
  const f = FEES[park.feeBand];
  return { text: `$${f.inState} in-state · $${f.outState} out-of-state`, state: "yes" };
}

/** Human labels for the feature flags, in the order they're worth reading. */
export const FEATURE_LABELS: [keyof StateParkFeatures, string][] = [
  ["beach", "Beach"],
  ["guardedSwimming", "Guarded swimming"],
  ["surfFishing", "Surf fishing"],
  ["camping", "Camping"],
  ["cabins", "Cabins"],
  ["trails", "Trails"],
  ["boatLaunch", "Boat launch"],
  ["pier", "Pier"],
  ["discGolf", "Disc golf"],
];

/** Features that are confirmed present — the quick "what's here" line. */
export function present(park: StatePark): string[] {
  return FEATURE_LABELS.filter(([k]) => park.features[k] === true).map(([, label]) => label);
}

export function completeness(park: StatePark): { known: number; total: number } {
  const vals = FEATURE_LABELS.map(([k]) => park.features[k]);
  return { known: vals.filter((v) => v !== null && v !== undefined).length, total: vals.length };
}

export const COUNTY_ORDER: County[] = ["Sussex", "Kent", "New Castle"];
