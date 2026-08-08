/**
 * Wineries and breweries.
 *
 * WHY DOGS LEAD EVERY CARD
 *
 * Because that is the question, and because every other guide gets it wrong in
 * the same way. Search "dog friendly Delaware brewery" and you get magazines,
 * an inn's blog, a dog trainer's marketing page — all of them stating a policy
 * confidently, none of them the business whose policy it is.
 *
 * So this section is built the way the dog-rules section is: the answer comes
 * from the operator or it doesn't publish. Of the first four records here, one
 * states a policy on its own site. The other three say nothing, and the page
 * says nothing on their behalf.
 *
 * That is not a weakness of the dataset. It is the finding. A reader who turns
 * up at three of these with a dog is relying on a stranger's blog post, and
 * this is the only page that will tell them so.
 *
 * DOGS IS NOT A BOOLEAN
 *
 * "Dogs allowed" is almost never true of a whole site. It is true of a patio,
 * a beer garden, a lawn — and false three feet away inside. A boolean would
 * send someone through the wrong door, so the shape carries indoors and
 * outdoors separately and a note for the caveat.
 */
import type { FieldNote, Photo } from "./state-parks";
import type { FieldReport, Verdict } from "./indoor";

/* Meadery joined the list when Brimming Horn and Liquid Alchemy did. Delaware
   has more mead than it has wineries, which is not what I expected. */
export type DrinkKind = "Winery" | "Brewery" | "Brewpub" | "Cidery" | "Meadery" | "Distillery";

/**
 * Where a dog may actually be.
 *
 * `null` on either half means the operator does not publish it. It never means
 * no — the difference matters here more than anywhere else on the site,
 * because the downside of guessing is being turned away at the door with a dog
 * in the car and an hour's drive home.
 */
export interface DogPolicy {
  /** Patio, beer garden, lawn. */
  outdoor: boolean | null;
  /** Taproom, tasting room. Almost always the stricter of the two. */
  indoor: boolean | null;
  /** The operator's own wording, quoted where there is any. */
  note: string | null;
  /** Where the policy came from, so a reader can weigh it. */
  source: "operator" | null;
}

export interface DrinkPlace {
  slug: string;
  name: string;
  kind: DrinkKind;
  town: string;
  county: string;
  address: string | null;
  blurb: string;
  dogs: DogPolicy;
  /** Day-by-day, the way these publish them. */
  hours: { days: string; text: string }[] | null;
  hoursNote: string | null;
  /** Tasting fees, flights, tour prices. */
  tasting: string | null;
  phone: string | null;
  website: { label: string; url: string } | null;
  /** Located facts: the beer garden, the fire pit, whether there is food. */
  onSite?: { label: string; note: string }[] | null;
  warnings: string[];
  sources: { label: string; url: string; note?: string | null; primary?: boolean }[];
  sourcedOn: string | null;
  verifiedDate: string | null;
  verifiedSource: string | null;
  outstanding?: string[];
  photos?: Photo[];
  reports?: FieldReport[];
  fieldNotes?: FieldNote[];
  verdict?: Verdict;
}

/* ------------------------------------------------------------- readers -- */

export interface Answer {
  text: string;
  state: "yes" | "no" | "unknown";
}

/**
 * The dog answer, in the words someone with a dog in the car needs.
 *
 * Deliberately refuses to summarise an unpublished policy as anything. "Not
 * confirmed" is the honest output and it is also the useful one: it tells the
 * reader to ring rather than to assume, which is what every other guide fails
 * to do.
 */
export function dogAnswer(d: DogPolicy): Answer {
  if (d.outdoor === true && d.indoor === true) return { text: "Yes, inside and out", state: "yes" };
  if (d.outdoor === true && d.indoor === false) return { text: "Outside only", state: "yes" };
  if (d.outdoor === true) return { text: "Yes outside — inside not confirmed", state: "yes" };
  /* INSIDE-ONLY WAS MISSING and fell through to "not confirmed", which
     understated a published yes. Brew Works North found it: leashed dogs are
     welcome in the taproom and there is no licensed outdoor area at all, so
     `outdoor: false, indoor: true` is a real and unusual combination rather
     than a data error. */
  if (d.outdoor === false && d.indoor === true) return { text: "Inside only", state: "yes" };
  if (d.indoor === true) return { text: "Yes inside — outside not confirmed", state: "yes" };
  if (d.outdoor === false && d.indoor === false) return { text: "No", state: "no" };
  return { text: "Not confirmed — ring first", state: "unknown" };
}

export const COUNTY_ORDER = ["New Castle", "Kent", "Sussex"];

/** Chips for a card. Only confirmed-true things appear. */
export function present(p: DrinkPlace): { key: string; label: string; emphasis: boolean }[] {
  const out: { key: string; label: string; emphasis: boolean }[] = [];
  if (p.dogs.outdoor === true) out.push({ key: "petsAllowed", label: "Dogs outside", emphasis: true });
  else if (p.dogs.indoor === true) out.push({ key: "petsAllowed", label: "Dogs inside", emphasis: true });
  if (p.tasting) out.push({ key: "free", label: "Tastings", emphasis: false });
  if (p.hours) out.push({ key: "branches", label: "Hours published", emphasis: false });
  return out;
}

/** How much of a record is known. Same visible-gap principle as the parks. */
export function completeness(p: DrinkPlace): { known: number; total: number } {
  const f: unknown[] = [p.dogs.outdoor, p.dogs.indoor, p.hours, p.tasting, p.phone, p.address];
  return { known: f.filter((x) => x !== null && x !== undefined).length, total: f.length };
}
