import type { FieldNote, Photo } from "./state-parks";

/**
 * Community parks — county and town parks, as opposed to the 17 state parks.
 *
 * RESTROOMS ARE MODELLED SEPARATELY AND ON PURPOSE.
 * A boolean is the wrong shape for the question people actually ask. "Are
 * there toilets" has at least five useful answers — permanent block, portable
 * unit, seasonal only, locked outside programmed hours, or none — and the
 * difference between "yes" and "yes, from Memorial Day" is a whole ruined
 * outing with a four-year-old. So restrooms get their own type, and a park
 * with `present: null` says "not confirmed" rather than guessing.
 *
 * Same `null` convention as everywhere else: unverified, never "no".
 */

export type County = "New Castle" | "Kent" | "Sussex";

export interface Restrooms {
  present: boolean | null;
  /** Permanent block, or portable units. */
  type: "permanent" | "portable" | null;
  /** Open only part of the year. The fact that ruins an April trip. */
  seasonal: boolean | null;
  note: string | null;
  /**
   * Field-level provenance. Restrooms get confirmed one at a time, by someone
   * who was standing there, long before the other twelve fields on a record
   * are done — so this field carries its own date and source rather than
   * waiting on the record-level gate. Confirming a toilet does not verify a
   * park.
   */
  confirmedOn?: string | null;
  confirmedBy?: string | null;
}

export interface Facilities {
  playground: boolean | null;
  water: boolean | null;
  shade: boolean | null;
  pavilion: boolean | null;
  grills: boolean | null;
  trails: boolean | null;
  pavedPath: boolean | null;
  sports: boolean | null;
  fishing: boolean | null;
  discGolf: boolean | null;
  skate: boolean | null;
  dogPark: boolean | null;
}

export interface CommunityPark {
  slug: string;
  name: string;
  operator: string;
  county: County;
  town: string;
  address: string;
  acres: number | null;
  blurb: string;
  restrooms: Restrooms;
  facilities: Facilities;
  accessibility: string | null;
  /** Links into the dog section where a dog park sits inside this park. */
  dogParkSlug: string | null;
  hours: string | null;
  hoursNote: string | null;
  phone: string | null;
  /**
   * Whose number that is.
   *
   * Almost none of these parks has a line of its own — the number reaches
   * New Castle County's permit office, Kent County Parks, or Dover City Hall.
   * The record page labels the row "Phone", and without this a county
   * switchboard reads as the number for the gate. Two parks (Carousel and
   * Rockwood) genuinely do have their own, and this is how the page can say
   * which is which.
   */
  phoneNote?: string | null;
  warnings: string[];
  verifiedDate: string | null;
  verifiedSource: string | null;
  outstanding?: string[];
  /** Same shape the state parks use. Imported rather than redeclared so the
      caption and crop rules can never drift apart between the two datasets. */
  photos?: Photo[];
  /**
   * First-hand observations, dated and attributed.
   *
   * State parks have had these since the beginning and community parks never
   * did, which is backwards: these are the records where the agency publishes
   * least and standing in the place is worth most. Valley Garden's only toilet
   * is a portable unit that appears on no official list anywhere.
   */
  fieldNotes?: FieldNote[];
}

/** Ordered by how often they decide whether a trip works. */
export const FACILITY_LABELS: [keyof Facilities, string][] = [
  ["playground", "Playground"],
  ["water", "Drinking water"],
  ["shade", "Shade"],
  ["pavilion", "Pavilion"],
  ["grills", "Grills"],
  ["trails", "Trails"],
  ["pavedPath", "Paved path"],
  ["sports", "Courts / fields"],
  ["fishing", "Fishing"],
  ["discGolf", "Disc golf"],
  ["skate", "Skate park"],
  ["dogPark", "Dog park"],
];

export type Answer = { text: string; state: "yes" | "no" | "unknown" };

export function tri(v: boolean | null, yes = "Yes", no = "No"): Answer {
  if (v === null || v === undefined) return { text: "Not confirmed", state: "unknown" };
  return v ? { text: yes, state: "yes" } : { text: no, state: "no" };
}

/**
 * The restroom answer, in the words someone actually needs — not "true".
 */
export function restroomAnswer(r: Restrooms): Answer {
  if (r.present === null || r.present === undefined) {
    return { text: "Not confirmed", state: "unknown" };
  }
  if (!r.present) return { text: "None", state: "no" };

  const bits = [r.type === "portable" ? "Portable units" : "Yes"];
  if (r.seasonal === true) bits.push("seasonal only");
  if (r.seasonal === null) bits.push("season not confirmed");
  return { text: bits.join(" — "), state: "yes" };
}

const EMPHASIS = new Set(["restrooms", "water", "showers"]);

export interface Tag {
  key: string;
  label: string;
  emphasis: boolean;
}

export function present(park: CommunityPark): Tag[] {
  const out: Tag[] = [];

  /*
   * Restrooms first, and restrooms AT ALL.
   *
   * They live outside `facilities` because the answer is richer than a
   * boolean, and the side effect was that the one question this site leads
   * with everywhere was the one thing you could not filter a park list by. It
   * was already counted in completeness; it just never became a chip.
   */
  if (park.restrooms.present === true) {
    out.push({ key: "restrooms", label: "Restrooms", emphasis: true });
  }
  /* Free text, so its presence is the claim — somebody wrote down what the
     access is actually like here. */
  if (park.accessibility) {
    out.push({ key: "accessible", label: "Accessibility noted", emphasis: false });
  }

  out.push(
    ...FACILITY_LABELS.filter(([k]) => park.facilities[k] === true)
      .map(([key, label]) => ({ key, label, emphasis: EMPHASIS.has(key) })),
  );
  return out;
}

/** Restrooms count as one of the fields, because it's the one people ask about. */
export function completeness(park: CommunityPark): { known: number; total: number } {
  const vals: (boolean | null)[] = [
    park.restrooms.present,
    ...FACILITY_LABELS.map(([k]) => park.facilities[k]),
  ];
  return { known: vals.filter((v) => v !== null && v !== undefined).length, total: vals.length };
}

export const COUNTY_ORDER: County[] = ["New Castle", "Kent", "Sussex"];

/**
 * Every dogParkSlug must name a real dog park, and a park that names one must
 * say it has one.
 *
 * TWO WAYS THIS BROKE ON THE SAME DAY, WHICH IS WHY IT IS NOW ENFORCED.
 *
 * Renaming `new-castle-county-bark-park` to `glasgow-bark-park` and merging
 * two Carousel records into `carousel-bark-park` left both parent parks
 * pointing at slugs that no longer existed. The detail template does a `.find()`
 * and renders the "this park contains…" block only on a hit, so a dangling
 * pointer doesn't throw or warn — the link just quietly stops appearing. It had
 * already stopped appearing on Glasgow before anyone noticed.
 *
 * Banning was the other direction: `dogParkSlug` pointed at a real record
 * sourced to New Castle County's own dog-parks page, while `facilities.dogPark`
 * sat at null and the blurb told readers not to drive out for a dog park "other
 * guides list". Two files, one fact, two answers, and the one on the busier page
 * was the wrong one.
 *
 * So the boolean is derived from the link, and the link is checked at build
 * time. The pair can no longer disagree, and a rename fails loudly.
 */
export function linkDogParks(parks: CommunityPark[], dogParks: { slug: string }[]): CommunityPark[] {
  const known = new Set(dogParks.map((d) => d.slug));
  const dangling = parks
    .filter((p) => p.dogParkSlug && !known.has(p.dogParkSlug))
    .map((p) => `${p.slug} → ${p.dogParkSlug}`);
  if (dangling.length) {
    throw new Error(
      `Community park points at a dog park that doesn't exist:\n  ${dangling.join("\n  ")}\n` +
        `Fix the slug in community-parks.json or restore the record in parks.json. ` +
        `A dangling link renders as nothing at all, so this can't be left to a code review.`,
    );
  }
  return parks.map((p) =>
    p.dogParkSlug
      ? { ...p, facilities: { ...p.facilities, dogPark: true } }
      : p,
  );
}
