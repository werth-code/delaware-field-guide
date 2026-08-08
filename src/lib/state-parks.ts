/**
 * Delaware's 17 state parks.
 *
 * Same conventions as everything else on this site: `null` means UNVERIFIED,
 * never "no". A park with `camping: null` hasn't been checked; it does not
 * lack a campground. Rendering those as "No" would invent facts seventeen at
 * a time.
 */

export type County = "New Castle" | "Kent" | "Sussex";

/** A photograph attached to a record. Shape mirrors Photo.astro's props. */
export interface Photo {
  file: string;
  alt: string;
  caption?: string | null;
  credit: string;
  /**
   * When it was taken: `YYYY-MM-DD`, `YYYY-MM`, or null.
   *
   * Null is here for the same reason it is everywhere else on this site: the
   * alternative is a guess that looks like a fact. These came off a phone via
   * an upload that stripped EXIF, so the capture date is gone and I am not
   * going to reconstruct one from what season the leaves look like. It renders
   * as "date not given", the same wording a field report gets when someone
   * doesn't say when they were there.
   *
   * `YYYY-MM` is the middle case and it earns its place: "July 2026" is what
   * a person actually remembers. Padding it to the first of the month would
   * manufacture a day nobody claimed, and once rendered an invented day looks
   * exactly like a checked one.
   */
  takenOn: string | null;
  portrait?: boolean;
  /**
   * Where to anchor the crop on a listing thumbnail, as a CSS object-position.
   * Defaults to center.
   *
   * Thumbnails are a fixed 16:9 box and most of these photos are 4:3, so a
   * center crop throws away the top and bottom eighth. Usually that is sky and
   * sand. Occasionally it is the thing the photo is of. Only set this when the
   * default actually loses the subject.
   */
  focus?: string;
}

/**
 * A field note. Not a fact and not a correction: one person, one day, the
 * things a database can't hold. Rendered distinctly so an impression can never
 * harden into a checked claim.
 *
 * `date` is required and is the date I was THERE, not the date I typed it up.
 * A note without one is worthless here, which is why the three the voice audit
 * quoted are not on the site yet.
 */
export interface FieldNote {
  date: string;
  author: string;
  body: string;
  photo?: string | null;
}

export interface StateParkFeatures {
  beach: boolean | null;
  guardedSwimming: boolean | null;
  surfFishing: boolean | null;
  camping: boolean | null;
  cabins: boolean | null;
  trails: boolean | null;
  boatLaunch: boolean | null;
  /**
   * Renting a boat AT the park. Fifth schema gap a field report has opened.
   *
   * Deep Creek's dataset grew this field months ago and this one never did,
   * which is the same failure in a new place: both were built from what the
   * agency publishes. A launch and a rental counter are not the same fact and
   * only one of them helps somebody who doesn't own a kayak.
   */
  boatRentals: boolean | null;
  pier: boolean | null;
  discGolf: boolean | null;
  /**
   * Tenth schema gap a field report has opened, and the most surprising one.
   *
   * "Is there a playground" is among the first things anyone asks about a
   * park, the community parks dataset has had the field since the beginning,
   * and the state parks type simply never did — because this one was modeled
   * on what DNREC lists on a park page, and DNREC does not list playgrounds
   * there. Alapocas Run has the Can-Do Playground, one of the largest
   * accessible playgrounds in the state, and this dataset had nowhere to say
   * so.
   */
  playground: boolean | null;
  /**
   * Added late, and that is the point.
   *
   * The other nine features are the ones DNREC publishes, which is why they
   * were here first — the dataset got modeled on what the agency lists rather
   * than on what anybody asks before loading a car. "Are there toilets" is the
   * single most-asked question about a park and it was not in this type at all.
   *
   * Every record starts null, which drops the completeness score across all
   * seventeen parks. That drop is real and it was always there; it just wasn't
   * being counted.
   */
  restrooms: boolean | null;
}

export interface StatePark {
  slug: string;
  name: string;
  county: County;
  acres: number | null;
  kind: string;
  town: string;
  /** Street address. The printed park maps carry one; the website mostly doesn't. */
  address?: string | null;
  blurb: string;
  features: StateParkFeatures;
  /** Which 2026 fee band applies. `null` = not confirmed. */
  feeBand: "beach" | "inland" | null;
  dogs: { summary: string; href: string | null };
  warnings: string[];
  phone: string | null;
  hours: string | null;
  /**
   * The season, which is a different question from the daily hours.
   *
   * "Open year round" and "8am to sunset" are both answers to "when can I go"
   * and neither substitutes for the other. Brandywine Creek is open all year
   * and its daily hours are still unchecked — without this field the page had
   * to render a flat "Not confirmed" and throw away a fact somebody gave me.
   */
  hoursNote?: string | null;
  verifiedDate: string | null;
  verifiedSource: string | null;
  outstanding?: string[];
  photos?: Photo[];
  fieldNotes?: FieldNote[];
  /**
   * Located facts — the ones whose answer is a place, not a yes.
   *
   * "Restrooms: yes" is true of Alapocas Run and useless on its own, because
   * they're in the Blue Ball Barn and the trail people come for starts across
   * the road from it. A boolean can say a thing exists; it can't say where to
   * put the car. Same shape the Deep Creek nearby records use.
   */
  onSite?: { label: string; note: string }[] | null;
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
  ["boatRentals", "Boat rentals"],
  ["pier", "Pier"],
  ["discGolf", "Disc golf"],
  ["playground", "Playground"],
  ["restrooms", "Restrooms"],
];


/**
 * The three that decide whether an outing works, and the reason this site
 * leads with restrooms everywhere. Marked in the data rather than at each
 * render site, so a chip can't be emphasised on one page and not another.
 */
const EMPHASIS = new Set(["restrooms", "water", "showers"]);

export interface Tag {
  key: string;
  label: string;
  emphasis: boolean;
}

const tag = ([key, label]: [string, string]): Tag => ({
  key,
  label,
  emphasis: EMPHASIS.has(key),
});

/** Features that are confirmed present — the quick "what's here" line. */
export function present(park: StatePark): Tag[] {
  return FEATURE_LABELS.filter(([k]) => park.features[k] === true).map((e) => tag(e as [string, string]));
}

export function completeness(park: StatePark): { known: number; total: number } {
  const vals = FEATURE_LABELS.map(([k]) => park.features[k]);
  return { known: vals.filter((v) => v !== null && v !== undefined).length, total: vals.length };
}

export const COUNTY_ORDER: County[] = ["Sussex", "Kent", "New Castle"];


/* ----------------------------------------------------------------- asks -- */

/**
 * Reader-facing questions for the report form, DERIVED FROM THE DATA.
 *
 * Never from `outstanding` — those are written for whoever makes the phone
 * calls ("PRIORITY: get the admission price") and putting that in front of a
 * visitor asks them to care about our workflow. They want the answer too.
 * Deriving from nulls also means a question disappears the moment it's
 * answered, with nobody having to remember to delete it.
 */
const PARK_ASKS: [keyof StateParkFeatures, string][] = [
  ["cabins", "Are there cabins?"],
  ["boatLaunch", "Is there a boat launch?"],
  ["camping", "Can you camp?"],
  ["pier", "Is there a pier?"],
  ["trails", "Are there trails?"],
  ["surfFishing", "Can you surf fish?"],
  ["beach", "Is there a beach?"],
  ["guardedSwimming", "Are there lifeguards?"],
];

/** Four at most. A wall of questions reads as a survey and gets nothing back. */
export function asksForStatePark(p: StatePark): string[] {
  const out: string[] = [];
  if (!p.hours) out.push("What are the hours?");
  if (!p.phone) out.push("What's the park office number?");
  for (const [k, q] of PARK_ASKS) {
    if (p.features[k] === null || p.features[k] === undefined) out.push(q);
  }
  return out.slice(0, 4);
}
