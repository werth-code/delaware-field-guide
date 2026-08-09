/**
 * Field Marks — place stickers.
 *
 * The first thing on this site that is sold rather than published, which makes
 * it the first thing that can corrupt the rest of it. Three rules are enforced
 * here rather than trusted to my judgement on a Friday:
 *
 * 1. NOTHING PUBLISHES BEFORE IT EXISTS.
 *    A product page for a sticker nobody has printed is the same failure as a
 *    park page for a restroom nobody has checked. Status drives it: only
 *    `available` gets indexed and offered for sale. Everything else builds,
 *    stays out of the sitemap, and says plainly that it isn't ready.
 *
 * 2. A MODULE APPEARS ONLY WHERE IT IS NAMED, AND NEVER ON A SAFETY PAGE.
 *    `placements` is a whitelist. SAFETY_PAGES is a blocklist that overrides
 *    it, and scripts/check-build.mjs fails the build if a product module
 *    reaches one. Emergency vet numbers, blue-green algae, pet fees and the
 *    permit pages are where somebody is trying not to get hurt or overcharged,
 *    and a sticker has no business in the middle of that.
 *
 * 3. THE PLACE IS THE PRODUCT; THE GUIDE IS THE MAKER.
 *    Every product page has to link back to the editorial page it came from.
 *    A sticker that doesn't send you back to the current rules is just merch.
 */

export type MarkStatus = "design" | "proof" | "available" | "sold-out";

export interface FieldMark {
  /** 001, 002 — the collection number. Soft cue, not a trading card. */
  number: string;
  slug: string;
  /** The place, as it reads on the sticker. */
  name: string;
  /** Second line on the sticker. */
  locality: string;
  sku: string;
  status: MarkStatus;
  /** Retail, in dollars. Null until priced. */
  price: number | null;
  /** The Field Guide page this place lives on. Required — see rule 3. */
  guide: string;
  /** Editorial pages this mark's module may appear on. Whitelist. */
  placements: string[];
  /** One line of sales copy. Field Guide voice, not merchandise voice. */
  pitch: string;
  /** What the place actually is, for the product page. */
  about: string;
  /** Art direction — notes for the illustration, not customer-facing. */
  art: string;
  photos?: { file: string; alt: string }[];
}

/**
 * Pages a product module may never appear on, whatever a placement says.
 *
 * Prefix match, so `/dogs/pond-safety/` covers the page and anything under it.
 * This list only ever grows.
 */
export const SAFETY_PAGES = [
  "/dogs/pond-safety/",
  "/dogs/pet-fees/",
  "/contacts/",
  /* Birding. A nesting closure exists because being found is the problem, and
     a $5 sticker beside it would be the fastest way to spend the trust the
     rest of this site is built on. Added before any bird product shipped
     rather than after, because the plan's own rule says so and a rule that
     lives only in a plan is not a rule. */
  "/birding/birds/red-knot/",
  "/birding/prime-hook/",
];

/** Section of a page a module must never precede. Enforced by placement, not code. */
export const NEVER_ABOVE = "the page's answer";

export const isSellable = (m: FieldMark) => m.status === "available" && m.price !== null;

/** Only a real, priced, photographed product earns a place in the index. */
export const isPublishableMark = (m: FieldMark) =>
  isSellable(m) && (m.photos?.length ?? 0) > 0;

/**
 * Whether this mark's module may render on a given path.
 *
 * Safety blocklist beats the whitelist, always. A module also never renders
 * for a mark that isn't actually for sale — a "buy" box on a sticker that
 * doesn't exist is worse than no box.
 */
export function mayPlace(mark: FieldMark, path: string): boolean {
  if (!isSellable(mark)) return false;
  if (SAFETY_PAGES.some((p) => path.startsWith(p))) return false;
  return mark.placements.includes(path);
}

export const bySlug = (marks: FieldMark[], slug: string) =>
  marks.find((m) => m.slug === slug);

/**
 * The one mark that may appear on this page, or null.
 *
 * Lowest number wins when two marks both list a path, which enforces the
 * playbook's "at most one primary product module per editorial page" in code
 * rather than in a reviewer's memory. Dewey's page names both the plain Dewey
 * mark and the dog variant; only 005 renders, and choosing between them is a
 * deliberate edit to the data rather than an accident of import order.
 */
export function markFor(marks: FieldMark[], path: string): FieldMark | null {
  const eligible = marks
    .filter((m) => mayPlace(m, path))
    .sort((a, b) => a.number.localeCompare(b.number));
  return eligible[0] ?? null;
}

/** "Any 3 · $12" style bundles. Null price until the line is real. */
export const BUNDLES = [
  { label: "Any three", count: 3, price: 12 },
  { label: "The first six", count: 6, price: 22 },
];
