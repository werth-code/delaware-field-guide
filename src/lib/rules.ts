/**
 * Rule types + the date math.
 *
 * This module is the single source of truth for "is a dog legal here on this
 * date." The town pages use it today; the week-4 date checker will use the
 * same functions, so the checker and the pages can never disagree about what
 * a rule says.
 */

import type { Photo } from "./state-parks";

export type Status = "allowed" | "restricted" | "prohibited";
export type Area = "beach" | "boardwalk";

/**
 * Anchors for rules that hang off a floating holiday rather than a calendar
 * date. Dewey's beach hours run "the Saturday of Memorial Day weekend through
 * the Sunday following Labor Day", which lands on different dates every year.
 *
 * Hard-coding one year's dates would publish a wrong answer every following
 * year, silently, on a site whose entire claim is that the dates are right.
 * So they're computed.
 */
export type Anchor = "memorial-day-saturday" | "labor-day-sunday-after";

/** nth weekday of a month. `nth = -1` means the last one. */
function nthWeekday(year: number, month: number, weekday: number, nth: number): Date {
  if (nth > 0) {
    const first = new Date(year, month - 1, 1);
    const shift = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month - 1, 1 + shift + (nth - 1) * 7);
  }
  const last = new Date(year, month, 0);
  const shift = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month, 0 - shift);
}

export function resolveAnchor(anchor: Anchor, year: number): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${p(d.getMonth() + 1)}-${p(d.getDate())}`;

  if (anchor === "memorial-day-saturday") {
    // Memorial Day is the last Monday in May; the weekend starts two days before.
    const memorial = nthWeekday(year, 5, 1, -1);
    return fmt(new Date(year, 4, memorial.getDate() - 2));
  }
  // Labor Day is the first Monday in September; "the Sunday following" is +6.
  const labor = nthWeekday(year, 9, 1, 1);
  return fmt(new Date(year, 8, labor.getDate() + 6));
}

/** `null` means UNVERIFIED, not absent. Render it as "not confirmed". */
export interface Rule {
  area: Area;
  status: Status;
  /** "MM-DD", inclusive. A window may wrap the year end. Ignored if an anchor is set. */
  startDate: string;
  endDate: string;
  /** Floating-holiday anchors. When present they win over startDate/endDate. */
  startAnchor?: Anchor | null;
  endAnchor?: Anchor | null;
  /**
   * Days to shift an anchor by. The off-season rule is the complement of the
   * summer one, so it runs from the day AFTER the summer window ends to the
   * day BEFORE it starts — +1 and −1. Without these the two rules overlap on
   * the boundary days and the table prints a range that's a day wrong.
   */
  startOffsetDays?: number | null;
  endOffsetDays?: number | null;
  /** How the rule is worded in the ordinance, when dates alone don't say it. */
  dateNote?: string | null;
  timeWindow: { before?: string; after?: string } | null;
  leashRequired: boolean;
  maxLeashFeet: number | null;
  note: string | null;
}

/** Shift an "MM-DD" by n days within a year, wrapping month boundaries. */
function shiftMonthDay(mmdd: string, days: number, year: number): string {
  if (!days) return mmdd;
  const [m, d] = mmdd.split("-").map(Number);
  const shifted = new Date(year, m - 1, d + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(shifted.getMonth() + 1)}-${p(shifted.getDate())}`;
}

/** The rule's effective MM-DD bounds for a given year. */
export function resolveRule(rule: Rule, year: number): { start: string; end: string } {
  const start = rule.startAnchor
    ? shiftMonthDay(resolveAnchor(rule.startAnchor, year), rule.startOffsetDays ?? 0, year)
    : rule.startDate;
  const end = rule.endAnchor
    ? shiftMonthDay(resolveAnchor(rule.endAnchor, year), rule.endOffsetDays ?? 0, year)
    : rule.endDate;
  return { start, end };
}

export interface Town {
  slug: string;
  name: string;
  county: string;
  question: string;
  answer: string;
  title: string;
  metaDescription: string;
  rules: Rule[];
  licenseRequired: boolean;
  licenseDetail: string | null;
  /**
   * WHERE you actually buy it, and what it costs.
   *
   * "You need a license" without this is half an answer — it tells someone
   * they have a problem and not how to solve it. Dewey sells three ways, one
   * of which is a kiosk in the Town Hall parking lot that appears on no map,
   * and the prices differ by a factor of ten depending on which option fits
   * the trip.
   */
  license?: {
    /** Ordered cheapest-trip-first, because most readers are visiting. */
    options: { label: string; price: string }[];
    /** Each place you can buy one, with a link where there is one. */
    where: { label: string; url?: string | null; note?: string | null }[];
    /** What you have to bring or know at the point of purchase. */
    needed: string | null;
    /** Anything that bites afterwards. */
    note: string | null;
  } | null;
  alsoTrue: { label: string; value: string }[];
  correction: { heading: string; body: string } | null;
  alternatives: { name: string; detail: string; href: string | null; verified: boolean }[];
  sources: { label: string; url: string; note: string | null }[];
  /** Both must be present or the page does not ship. Enforced in verification.ts. */
  verifiedDate: string | null;
  verifiedSource: string | null;
  callTo: { name: string; phone: string } | null;
  outstanding: string[];
  /**
   * Pictures of the beach the rule applies to.
   *
   * These pages have been pure text since they were built, which suited a page
   * whose job is to answer one question about a leash. It is still a page about
   * a beach, and a reader deciding where to take a dog on a Tuesday in October
   * is better served seeing what the place looks like out of season than not.
   */
  photos?: Photo[];
}

/* ---------------------------------------------------------------- dates -- */

/** Ordinal position of MM-DD within the year. Leap day is irrelevant here. */
const ord = (mmdd: string): number => {
  const [m, d] = mmdd.split("-").map(Number);
  return m * 100 + d;
};

const ordOf = (date: Date): number => (date.getMonth() + 1) * 100 + date.getDate();

/**
 * Does `date` fall inside the rule's window? Handles year-wrapping windows,
 * and resolves floating-holiday anchors against the year being asked about —
 * not against the build year, so a rule stays correct across New Year.
 */
export function ruleCoversDate(rule: Rule, date: Date): boolean {
  const { start, end } = resolveRule(rule, date.getFullYear());
  const t = ordOf(date);
  const a = ord(start);
  const b = ord(end);
  return a <= b ? t >= a && t <= b : t >= a || t <= b;
}

/** The rule in force for one area on one date, or null if nothing covers it. */
export function ruleFor(town: Town, area: Area, date: Date): Rule | null {
  return town.rules.find((r) => r.area === area && ruleCoversDate(r, date)) ?? null;
}

/**
 * The town's overall standing on a date — the strictest status across areas.
 * "Can I bring the dog" is answered by the worst case, not the best.
 */
export function statusOn(town: Town, date: Date): Status {
  const rank: Record<Status, number> = { allowed: 0, restricted: 1, prohibited: 2 };
  const found = (["beach", "boardwalk"] as Area[])
    .map((a) => ruleFor(town, a, date)?.status)
    .filter((s): s is Status => Boolean(s));
  if (found.length === 0) return "restricted";
  return found.reduce((worst, s) => (rank[s] > rank[worst] ? s : worst), found[0]);
}

/* -------------------------------------------------------------- display -- */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MON = MONTHS.map((m) => m.slice(0, 3));

/** "05-15" → "May 15" */
export function formatMonthDay(mmdd: string): string {
  const [m, d] = mmdd.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

/**
 * "May 15 – September 15". Anchored rules resolve against `year` and are
 * rendered with the year attached, because "23 May" is only this year's answer
 * to a rule that actually reads "the Saturday of Memorial Day weekend".
 */
export function formatRange(rule: Rule, year?: number): string {
  const y = year ?? new Date().getFullYear();
  const { start, end } = resolveRule(rule, y);
  if (!rule.startAnchor && !rule.endAnchor) {
    return `${formatMonthDay(start)} – ${formatMonthDay(end)}`;
  }
  // A wrapping anchored range spans two years — printing one would misread as
  // "September 14 to May 23 of the same year", which is nine months backwards.
  const wraps = ord(start) > ord(end);
  return wraps
    ? `${formatMonthDay(start)} ${y} – ${formatMonthDay(end)} ${y + 1}`
    : `${formatMonthDay(start)} – ${formatMonthDay(end)} ${y}`;
}

/** "before 8:00 am" / "after 6:30 pm" / both. */
export function formatWindow(w: Rule["timeWindow"]): string | null {
  if (!w) return null;
  const t = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const ap = h >= 12 ? "pm" : "am";
    const hr = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${hr} ${ap}` : `${hr}:${String(m).padStart(2, "0")} ${ap}`;
  };
  const parts: string[] = [];
  if (w.before) parts.push(`before ${t(w.before)}`);
  if (w.after) parts.push(`after ${t(w.after)}`);
  return parts.join(" and ");
}

/** Spec display format: "6 Aug 2026". Parsed by hand to avoid timezone drift. */
export function formatStampDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MON[m - 1]} ${y}`;
}

/** "1 August 2026" — for prose, where the abbreviation reads as clipped. */
export function formatLongDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** ISO "YYYY-MM-DD" for a Date, in local time. */
export function toISODate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/* --------------------------------------------------------------- status -- */

/** Status is never color alone: every status carries an icon and a word. */
export const STATUS_META: Record<Status, { flag: string; word: string; icon: string }> = {
  allowed: { flag: "green", word: "Dogs allowed", icon: "check" },
  restricted: { flag: "yellow", word: "Dogs allowed, with limits", icon: "alert" },
  prohibited: { flag: "red", word: "No dogs", icon: "cross" },
};
