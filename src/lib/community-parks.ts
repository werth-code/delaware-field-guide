import type { Photo } from "./state-parks";

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
  warnings: string[];
  verifiedDate: string | null;
  verifiedSource: string | null;
  outstanding?: string[];
  /** Same shape the state parks use. Imported rather than redeclared so the
      caption and crop rules can never drift apart between the two datasets. */
  photos?: Photo[];
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

export function present(park: CommunityPark): string[] {
  return FACILITY_LABELS.filter(([k]) => park.facilities[k] === true).map(([, l]) => l);
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
