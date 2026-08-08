/**
 * Dog parks and lodging.
 *
 * The eight fields on a park — fenced, size split, water, shade, surface,
 * restrooms, fee, hours — are not an arbitrary schema. They are the things
 * reviewers complain about across every state in the region, plus hours.
 * Nobody publishes them together, which is the entire reason this section
 * exists.
 *
 * RESTROOMS WAS THE EIGHTH, AND IT HAS FOUR STATES RATHER THAN TWO. A
 * verification pass turned up the distinction: River Road's dog run has no
 * toilet beside it and the parent park officially does; Carousel's county
 * profile says Bathrooms: No for the Bark Park while the wider park has them
 * elsewhere. Collapsing those into "yes" sends somebody with a three-year-old
 * to a building half a mile away, and collapsing them into "no" is simply
 * wrong. So the field says which.
 *
 * `null` means UNVERIFIED, never "no". A park with `water: null` has not been
 * checked; it does not lack water. Rendering those as "No" would invent facts
 * seventeen at a time.
 */

export interface Park {
  slug: string;
  name: string;
  address: string;
  county: "New Castle" | "Kent" | "Sussex";
  lat: number | null;
  lng: number | null;
  fenced: boolean | null;
  sizeSplit: boolean | null;
  water: boolean | null;
  waterNote: string | null;
  shade: string | null;
  surface: string | null;
  /**
   * "at-dog-park"    — a toilet beside the run itself
   * "elsewhere-in-park" — the parent park has them; not next to the dogs
   * "none"           — checked, and there aren't any
   * null             — nobody has checked
   */
  restrooms: "at-dog-park" | "elsewhere-in-park" | "none" | null;
  restroomsNote?: string | null;
  fee: number | null;
  feeNote?: string | null;
  hours: string | null;
  hoursNote: string | null;
  notes: string | null;
  photos: string[];
  verifiedDate: string | null;
  verifiedSource: string | null;
  outstanding?: string[];
}

export interface Lodging {
  name: string;
  town: string;
  phone: string | null;
  petFee: { amount: number | null; unit: string | null; notes: string };
  weightLimitLbs: number | null;
  maxDogs: number | null;
  unattendedAllowed: boolean | null;
  breedRestrictions: string | null;
  confirmedDogFriendly: boolean;
  evidenceType: "review" | "phone" | "website";
  evidenceNote: string;
  verifiedDate: string | null;
  affiliateUrl: string | null;
  guestQuestionsHeard: string | null;
}

/* ------------------------------------------------------------- rendering -- */

/** The three-state renderer. Unknown is a real answer and says so. */
export type Tri = { text: string; state: "yes" | "no" | "unknown" };

export function tri(value: boolean | null, yes: string, no: string): Tri {
  if (value === null || value === undefined) return { text: "Not confirmed", state: "unknown" };
  return value ? { text: yes, state: "yes" } : { text: no, state: "no" };
}

export function text(value: string | null | undefined): Tri {
  if (!value) return { text: "Not confirmed", state: "unknown" };
  return { text: value, state: "yes" };
}

export function feeText(park: Park): Tri {
  if (park.feeNote) return { text: park.feeNote, state: park.fee ? "no" : "yes" };
  if (park.fee === null || park.fee === undefined) return { text: "Not confirmed", state: "unknown" };
  return park.fee === 0 ? { text: "Free", state: "yes" } : { text: `$${park.fee}`, state: "no" };
}

/** "07:00-20:00" → "7am – 8pm" */
export function formatHours(hours: string | null): Tri {
  if (!hours) return { text: "Not confirmed", state: "unknown" };
  if (!hours.includes("-")) return { text: hours, state: "yes" };
  const pretty = hours
    .split("-")
    .map((t) => {
      const [h, m] = t.split(":").map(Number);
      const ap = h >= 12 ? "pm" : "am";
      const hr = h % 12 === 0 ? 12 : h % 12;
      return m === 0 ? `${hr}${ap}` : `${hr}:${String(m).padStart(2, "0")}${ap}`;
    })
    .join(" – ");
  return { text: pretty, state: "yes" };
}

/**
 * How much of a park's record is actually confirmed. Shown on each card so a
 * reader can see the difference between "we checked and it has no water" and
 * "we haven't been yet".
 */
export function completeness(park: Park): { known: number; total: number } {
  const fields = [park.fenced, park.sizeSplit, park.water, park.shade, park.surface, park.restrooms, park.fee, park.hours];
  return { known: fields.filter((f) => f !== null && f !== undefined).length, total: fields.length };
}

export const COUNTY_ORDER: Park["county"][] = ["Sussex", "Kent", "New Castle"];

/** How the four restroom states read on a page. */
export const RESTROOMS_SAYS: Record<string, string> = {
  "at-dog-park": "Yes, at the dog park",
  "elsewhere-in-park": "Elsewhere in the park, not at the run",
  none: "No",
};
