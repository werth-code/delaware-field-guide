/**
 * Rule types + the date math.
 *
 * This module is the single source of truth for "is a dog legal here on this
 * date." The town pages use it today; the week-4 date checker will use the
 * same functions, so the checker and the pages can never disagree about what
 * a rule says.
 */

export type Status = "allowed" | "restricted" | "prohibited";
export type Area = "beach" | "boardwalk";

/** `null` means UNVERIFIED, not absent. Render it as "not confirmed". */
export interface Rule {
  area: Area;
  status: Status;
  /** "MM-DD", inclusive. A window may wrap the year end. */
  startDate: string;
  endDate: string;
  timeWindow: { before?: string; after?: string } | null;
  leashRequired: boolean;
  maxLeashFeet: number | null;
  note: string | null;
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
  alsoTrue: { label: string; value: string }[];
  correction: { heading: string; body: string } | null;
  alternatives: { name: string; detail: string; href: string | null; verified: boolean }[];
  sources: { label: string; url: string; note: string | null }[];
  /** Both must be present or the page does not ship. Enforced in verification.ts. */
  verifiedDate: string | null;
  verifiedSource: string | null;
  callTo: { name: string; phone: string } | null;
  outstanding: string[];
}

/* ---------------------------------------------------------------- dates -- */

/** Ordinal position of MM-DD within the year. Leap day is irrelevant here. */
const ord = (mmdd: string): number => {
  const [m, d] = mmdd.split("-").map(Number);
  return m * 100 + d;
};

const ordOf = (date: Date): number => (date.getMonth() + 1) * 100 + date.getDate();

/** Does `date` fall inside [startDate, endDate]? Handles year-wrapping windows. */
export function ruleCoversDate(rule: Rule, date: Date): boolean {
  const t = ordOf(date);
  const a = ord(rule.startDate);
  const b = ord(rule.endDate);
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

/** "05-15" + "09-15" → "May 15 – September 15" */
export const formatRange = (rule: Rule): string =>
  `${formatMonthDay(rule.startDate)} – ${formatMonthDay(rule.endDate)}`;

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
