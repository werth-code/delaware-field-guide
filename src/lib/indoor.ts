/**
 * Museums, science centers and libraries — the indoor section.
 *
 * WHY THESE THREE THINGS SHARE ONE DATASET
 *
 * They have almost nothing in common as institutions. A county historical
 * society, a natural history museum and a fifteen-branch county library system are
 * different animals with different funders and different reasons to exist.
 *
 * They are one section because of the question that brings people here, which
 * is not "what museums are there" but "it's raining and I have a seven-year-old
 * in a rental house." Everything in this file is somewhere warm and dry that
 * you can walk into. The rest of the site answers where to go when the weather
 * is good; this answers the other half, and the other half is roughly a third
 * of the days in a Delaware year.
 *
 * WHY HOURS ARE THE HEADLINE FIELD
 *
 * Parks are open. These are not. Every record here can be closed on the day
 * you drive to it, and the failure is total — you arrive, the door is locked,
 * the trip is over. So `hours` leads every card the way `restrooms` leads a
 * town park, and a null renders as "Not confirmed" with the phone number
 * beside it rather than as an implied welcome.
 *
 * Closure is the specific trap here, and in Delaware it is renovation rather
 * than season. The Johnson Victrola Museum is shut until autumn 2026 and the
 * Newark Free Library is shut for construction; both still show as open on
 * every aggregator and map listing I checked.
 */
import type { FieldNote, Photo } from "./state-parks";

/**
 * Deep Creek grew these three first and this site never needed them until now.
 * Declared here rather than back-ported into state-parks.ts, because widening
 * a type that seventeen live park records already validate against is not a
 * change to make in passing.
 */
export interface Correction {
  /** What the wrong version said. */
  was: string;
  /** What it says now. */
  now: string;
  /** Why it changed, and who settled it. */
  why: string;
  /** ISO date the correction was made. */
  on: string;
}
export interface FieldReport {
  receivedOn: string;
  /** null when they didn't say — and it renders as "visit date not given". */
  visitedOn: string | null;
  from: string;
  what: string;
  affects?: string[];
}
export interface Verdict {
  text: string;
  on: string;
}

/** What kind of thing it is. Shown to the reader, so it reads as English. */
export type IndoorKind =
  | "Museum"
  | "Nature center"
  | "Library"
  | "Historic site"
  | "Gallery";

/**
 * Opening hours, in the two shapes these actually come in.
 *
 * `lines` is a day-by-day list because that is how every one of these bodies
 * publishes them, and flattening "Mon & Wed 9:15–8, Tue/Thu/Fri 9:15–5:30,
 * Sat 9–4" into one sentence loses the thing you needed. `note` carries what
 * doesn't fit a grid: holiday closures, festival closures, volunteer-dependent
 * opening.
 */
export interface Hours {
  /** e.g. { days: "Wed – Sat", text: "10:00am – 3:00pm" } */
  lines: { days: string; text: string }[] | null;
  /** Season, when the place has one. null means open year round, as published. */
  season: string | null;
  /** Anything that qualifies the grid above. */
  note: string | null;
}

/**
 * A library branch.
 *
 * Branches are not separate records. Five pages that each say "part of the
 * New Castle County Libraries" would bury the one fact a reader wants — which
 * of these is open right now — under fifteen sets of identical boilerplate
 * about the system. One record, one table, one row per branch.
 */
export interface Branch {
  name: string;
  town: string;
  address: string;
  phone: string | null;
  hours: Hours;
  /** Where the branch isn't where the address says. Renovations, temporary sites. */
  note: string | null;
}

export interface IndoorPlace {
  slug: string;
  name: string;
  kind: IndoorKind;
  /** Who runs it. A historical society and a state agency keep hours differently. */
  operator: string;
  town: string;
  /** New Castle, Kent or Sussex. Every section on this site sorts by county. */
  county: string;
  address: string | null;
  blurb: string;
  hours: Hours;
  /** `free: true` is a real claim and needs a source like any other. */
  admission: { note: string; free: boolean | null; amount: number | null };
  phone: string | null;
  website: { label: string; url: string } | null;

  /* The indoor equivalents of the park facility questions. `null` is
     unconfirmed everywhere and never renders as "no". */
  restrooms: boolean | null;
  giftShop: boolean | null;
  /** Free-text: "step-free entrance, ADA restrooms" beats a boolean here. */
  accessibility: string | null;
  parking: string | null;
  /** What is actually inside. The reason to drive there. */
  inside: string[];

  /** Libraries only. Everything else leaves this null. */
  branches?: Branch[] | null;

  warnings: string[];
  sources: { label: string; url: string; note?: string | null; primary?: boolean }[];
  sourcedOn: string | null;
  verifiedDate: string | null;
  verifiedSource: string | null;
  outstanding?: string[];
  photos?: Photo[];
  corrections?: Correction[];
  reports?: FieldReport[];
  fieldNotes?: FieldNote[];
  verdict?: Verdict;
}

/* ------------------------------------------------------------- readers -- */

export interface Answer {
  text: string;
  state: "yes" | "no" | "unknown";
}

/** The one-line hours answer for a card. Deliberately refuses to guess. */
export function hoursAnswer(h: Hours): Answer {
  if (!h.lines || h.lines.length === 0) {
    return { text: "Not confirmed — call first", state: "unknown" };
  }
  const first = h.lines.map((l) => `${l.days} ${l.text}`).join(" · ");
  return { text: first, state: "yes" };
}

export function admissionAnswer(a: IndoorPlace["admission"]): Answer {
  if (a.free === true) return { text: a.note || "Free", state: "yes" };
  if (a.free === false) return { text: a.note, state: "no" };
  return { text: a.note || "Not confirmed", state: "unknown" };
}

const YES_NO = (v: boolean | null | undefined, yes: string, no: string): Answer =>
  v === true ? { text: yes, state: "yes" }
    : v === false ? { text: no, state: "no" }
      : { text: "Not confirmed", state: "unknown" };

export const restroomAnswer = (p: IndoorPlace) => YES_NO(p.restrooms, "Yes", "None");
export const giftShopAnswer = (p: IndoorPlace) => YES_NO(p.giftShop, "Yes", "None");

/**
 * How much of a record is actually known, shown as n/total on every card.
 *
 * Same reasoning as the parks table: a visible 4/9 is a real gap someone can
 * close, where a page that just omits the unknown fields looks complete
 * and quietly isn't.
 */
export function completeness(p: IndoorPlace): { known: number; total: number } {
  const fields: unknown[] = [
    p.hours.lines,
    p.admission.free,
    p.address,
    p.phone,
    p.restrooms,
    p.giftShop,
    p.accessibility,
    p.parking,
    p.inside.length > 0 ? true : null,
  ];
  return {
    known: fields.filter((f) => f !== null && f !== undefined).length,
    total: fields.length,
  };
}

/** Feature chips for a card. Only true things appear — never "no restrooms". */
export function present(p: IndoorPlace): string[] {
  const out: string[] = [];
  if (p.admission.free === true) out.push("Free");
  if (p.restrooms === true) out.push("Restrooms");
  if (p.giftShop === true) out.push("Gift shop");
  if (p.accessibility) out.push("Accessibility noted");
  if (p.branches && p.branches.length > 1) out.push(`${p.branches.length} branches`);
  return out;
}

/**
 * The reader-facing open questions, derived from what's null.
 *
 * Not hand-written per record. A list someone maintains by hand goes stale the
 * moment a field gets filled and then lies about what's missing.
 */
/** Grouped by county, in the order this site always uses. */
export const COUNTY_ORDER = ["New Castle", "Kent", "Sussex"];

export function asks(p: IndoorPlace): string[] {
  const q: string[] = [];
  if (!p.hours.lines) q.push("What days and hours is it actually open?");
  if (p.admission.free === null) q.push("Does it cost anything to get in?");
  if (p.restrooms === null) q.push("Are there restrooms?");
  if (p.parking === null) q.push("Where do you park?");
  if (!p.accessibility) q.push("Is it step-free, and are the restrooms accessible?");
  if (p.admission.free === false && p.admission.amount === null) {
    q.push("What does a ticket actually cost?");
  }
  return q;
}
