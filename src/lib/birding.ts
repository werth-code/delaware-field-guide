/**
 * Birding.
 *
 * A LENS OVER PLACES, NOT A SECOND SET OF PLACES.
 *
 * Eleven of the Delaware Birding Trail's 27 sites already have records here —
 * White Clay, Cape Henlopen, Brandywine Creek, Trap Pond, Ashland and the rest
 * are state parks and nature centers this site has covered for months. Giving
 * them second homes under /birding/ would mean two records for one place, two
 * sets of hours, and two answers the day one of them changes.
 *
 * That is precisely the bug Banning had this morning: /parks/community/ calling
 * a dog park unconfirmed while parks.json carried it sourced to the county. One
 * fact, two files, two answers, and the wrong one on the busier page.
 *
 * So: a place already on the site gets a `birding` block on its own record and
 * the hub links to it. Only genuinely new sites — the federal refuges, the
 * state wildlife areas, the bay beaches — get records of their own here.
 *
 * WHAT THIS SECTION IS FOR, AND WHAT IT ISN'T
 *
 * eBird already holds sightings, checklists, hotspots and live reports, and
 * does it far better than this ever could. Rebuilding that would be worthless.
 * The gap is the trip around the birds: what it costs, when the gate opens,
 * whether a scope earns its weight, whether it works from the car, where the
 * bathroom is at 6am, and which three days in autumn the roads shut entirely.
 *
 * Sightings link out. Logistics stay here.
 */
import { isPublishable } from "./verification";

export type Habitat =
  | "Tidal marsh" | "Freshwater marsh" | "Ocean beach" | "Bay beach"
  | "Piedmont forest" | "Cypress swamp" | "Farm fields" | "Millpond" | "Urban marsh";

export interface BirdingInfo {
  /** Why a birder drives here, in one line. */
  why: string;
  habitats: Habitat[];
  /** Season notes. Null where I have nothing sourced. */
  seasons?: { spring?: string; summer?: string; fall?: string; winter?: string } | null;
  /** Does a scope earn its weight here? */
  scope: boolean | null;
  scopeNote?: string | null;
  /** Can you bird it from the car? The single most useful access fact. */
  fromCar: boolean | null;
  fromCarNote?: string | null;
  beginnerFriendly: boolean | null;
  /** Towers, platforms, blinds. */
  structures?: string[] | null;
  /** Dated, sourced closures. The thing nothing else tells you. */
  closures?: { what: string; when: string; why?: string | null }[] | null;
  /** eBird hotspot. Sightings live there, not here. */
  ebird?: string | null;
  /**
   * Set when the site holds nesting or roosting birds whose location managers
   * are deliberately limiting. Suppresses precise coordinates — see below.
   */
  sensitive?: boolean;
  sensitiveNote?: string | null;
}

export interface BirdingSite {
  slug: string;
  name: string;
  town: string | null;
  county: string;
  operator: string;
  /** Where the full record lives if this place is already on the site. */
  existingRecord?: string | null;
  address?: string | null;
  fee: { note: string; amount: number | null };
  hours: string | null;
  restrooms: boolean | null;
  parking?: string | null;
  birding: BirdingInfo;
  coords?: { lat: number; lon: number; precision: "site" | "town" } | null;
  warnings?: string[];
  sources: { label: string; url: string; note?: string | null; primary?: boolean }[];
  sourcedOn: string | null;
  verifiedDate: string | null;
  verifiedSource: string | null;
  outstanding?: string[];
}

/**
 * A site holding birds that managers are protecting does not get a pin.
 *
 * Birding is the one subject on this site where being more helpful can do
 * harm. A precise location for an active nest, a rare breeder or a roost is
 * exactly what a disturbance needs, and the agencies withhold those on purpose.
 * A site that publishes fees and restrooms has no business second-guessing
 * that judgement to win a search result.
 *
 * Throws rather than warns, because the cost of getting this wrong is not
 * mine to absorb.
 */
export function assertNoSensitiveCoords(sites: BirdingSite[]): BirdingSite[] {
  const bad = sites
    .filter((s) => s.birding.sensitive && s.coords && s.coords.precision === "site")
    .map((s) => s.slug);
  if (bad.length) {
    throw new Error(
      `Birding site flagged sensitive but carrying site-precision coordinates: ${bad.join(", ")}.\n` +
        `Drop the coords or set precision to "town". Managers withhold these locations on ` +
        `purpose and this site does not overrule them to win a search result.`,
    );
  }
  return sites;
}

/** Sites worth publishing: sourced, and with something birding-specific to say. */
export const publishableSites = (sites: BirdingSite[]) =>
  sites.filter((s) => isPublishable(s) && s.birding.why);

/** The trail's 27, so the hub can say honestly how far along it is. */
export const TRAIL_SITE_COUNT = 27;
