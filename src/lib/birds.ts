/**
 * Feature species.
 *
 * TWO LISTS, AND THEY MEAN DIFFERENT THINGS.
 *
 * `ebird-delaware.json` is the checklist — 460 species with an accepted eBird
 * record for Delaware, plus 28 hybrids kept separately. It is complete and it
 * is thin: a name, a family, a code.
 *
 * `birds.json` is the small set with something Delaware-specific worth saying.
 * A species earns a page by having a fact behind it, not by existing. The
 * alternative is four hundred and sixty near-empty "American Robin in Delaware"
 * pages, which is the exact scaled-content pattern Google warns about and which
 * would be worthless to a reader regardless of what Google thought.
 *
 * WHY SEASON CHIPS SAY "AT BOMBAY HOOK" AND NOT "IN DELAWARE"
 *
 * The only per-species seasonality anyone publishes for this state is the
 * USFWS refuge checklist, and a refuge checklist describes one refuge. Prime
 * Hook's brochure would not parse to an accuracy worth shipping; Cape Henlopen
 * publishes no checklist at all.
 *
 * So the chips are scoped to the place the data came from. "Abundant at Bombay
 * Hook in spring" is true and checkable. "Abundant in Delaware in spring" is a
 * generalisation from one refuge across an entire state, and nobody published
 * it. The narrower claim is also the more useful one — a birder is going
 * somewhere, not to Delaware in the abstract.
 */
import type { RecordStatus } from "./birding-taxonomy";

export type Abundance = "abundant" | "common" | "uncommon" | "occasional" | "rare";

export interface Bird {
  /** eBird species code — the join key to the generated checklist. */
  code: string;
  slug: string;
  name: string;
  scientific: string;
  /** Editorial. Never the same field as a records committee's status. */
  interest: "everyday" | "specialty" | "bucketList" | "chase";
  habitats: string[];
  /** Birds whose location managers limit on purpose. */
  sensitive?: boolean;
  sensitiveNote?: string | null;
  lede: string;
  /** What is actually known about it here, with a source behind it. */
  delaware: string;
  whereToLook?: string | null;
  /**
   * Seasonal abundance AT BOMBAY HOOK, from the refuge's own checklist.
   * Null where the refuge doesn't list the bird — which is not the same as
   * the bird being absent from Delaware.
   */
  bombayHook?: Partial<Record<"spring" | "summer" | "fall" | "winter", Abundance>> | null;
  recordStatus?: RecordStatus | null;
  /** Slug of a Field Mark, where one exists. */
  fieldMark?: string | null;
  sources: { label: string; url: string; note?: string | null; primary?: boolean }[];
  sourcedOn: string | null;
  verifiedDate?: string | null;
  verifiedSource?: string | null;
}

export const SEASON_ORDER = ["spring", "summer", "fall", "winter"] as const;

/** "Abundant in spring, occasional in summer and fall" — for prose. */
export function seasonSentence(b: Bird): string | null {
  const s = b.bombayHook;
  if (!s) return null;
  const by = new Map<string, string[]>();
  for (const k of SEASON_ORDER) {
    const v = s[k];
    if (v) by.set(v, [...(by.get(v) ?? []), k]);
  }
  const parts = [...by.entries()].map(([abund, seasons]) => {
    const list =
      seasons.length === 1
        ? seasons[0]
        : `${seasons.slice(0, -1).join(", ")} and ${seasons[seasons.length - 1]}`;
    return `${abund} in ${list}`;
  });
  return parts.length ? parts.join(", ") : null;
}

export const birdBySlug = (birds: Bird[], slug: string) => birds.find((b) => b.slug === slug);
