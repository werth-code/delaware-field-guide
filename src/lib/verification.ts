/**
 * The verification gate.
 *
 * The convention is "a fact without both verifiedDate and verifiedSource does
 * not ship." That promise is worthless if it relies on remembering to keep it,
 * so it is enforced here rather than by discipline:
 *
 *   - No verifiedDate + verifiedSource  →  no verification stamp. Not possible.
 *   - No verifiedDate + verifiedSource  →  the page is `noindex`, and is
 *     dropped from sitemap.xml (see astro.config.mjs). An unfinished draft can
 *     never become the thing Google or an AI crawler cites.
 *   - Filling both fields in the JSON is the single switch that publishes it.
 *
 * Confirm the fact, fill in the two fields, done.
 */

import { formatStampDate } from "./rules";

export interface Verifiable {
  verifiedDate: string | null;
  verifiedSource: string | null;
}

export const isVerified = (v: Verifiable): boolean =>
  Boolean(v.verifiedDate) && Boolean(v.verifiedSource);

/** Unverified pages are never indexed. Not configurable per page. */
export const robotsFor = (v: Verifiable): string =>
  isVerified(v) ? "index, follow, max-snippet:-1, max-image-preview:large" : "noindex, nofollow";

/** "Verified 6 Aug 2026 · City of Rehoboth Beach, by phone" */
export function stampText(v: Verifiable): string | null {
  if (!isVerified(v)) return null;
  return `Verified ${formatStampDate(v.verifiedDate!)} · ${v.verifiedSource}`;
}

/** `null` means unverified, never "no". Spec convention, used across renderers. */
export const orNotConfirmed = (value: unknown): string =>
  value === null || value === undefined || value === "" ? "Not confirmed" : String(value);

/* ------------------------------------------------------------ build gate -- */

const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’\-–—.,/]*/gu;
export const countWords = (s: string): number => (s.match(WORD) ?? []).length;

/**
 * Every answer page must lead with the answer in under 40 words, and it must
 * be extractable standalone. Checked at build time so it can't quietly rot
 * into a paragraph three pages from now.
 */
/**
 * Print what's still outstanding on an unverified page, at build time.
 *
 * This used to render into the page as a red block, which put a work tracker
 * in front of readers. The console is where the person who has to make the
 * call actually is, and it means `npm run build` doubles as the to-do list.
 */
export function reportOutstanding(
  slug: string,
  item: Verifiable & { callTo?: { name: string; phone: string } | null; outstanding?: string[] },
): void {
  if (isVerified(item)) return;

  const lines = [
    ``,
    `  ⚑ /dogs/${slug}/ is UNVERIFIED — noindex, not in the sitemap, hidden from /dogs/.`,
  ];
  if (item.callTo) lines.push(`    Call ${item.callTo.name} on ${item.callTo.phone}:`);
  for (const [i, o] of (item.outstanding ?? []).entries()) {
    lines.push(`      ${i + 1}. ${o}`);
  }
  lines.push(`    Then set verifiedDate + verifiedSource in src/data/towns.json.`, ``);
  console.warn(lines.join("\n"));
}

export function assertAnswerLength(slug: string, answer: string): void {
  const n = countWords(answer);
  if (n > 40) {
    throw new Error(
      `[${slug}] The answer is ${n} words. The limit is 40.\n` +
        `Cut the answer — do not raise the limit. The 40-word answer is the format:\n` +
        `it's what gets extracted into an AI response, and it's the whole page for\n` +
        `someone reading on a phone in the sun.`,
    );
  }
}
