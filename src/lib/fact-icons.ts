/**
 * Which glyph a fact-row label wears, if any.
 *
 * The record pages all carry the same kind of dl — Admission, Parking,
 * Getting there — and the labels read faster with the site's own marks next
 * to them, the way the facility grid and the map markers already work: the
 * glyph says WHICH, colour stays reserved for HOW SURE.
 *
 * ONE AUTHORITY, because four pages each keeping their own label→icon table
 * is how "Admission" ends up wearing three different marks. And HONEST
 * GLYPHS ONLY: a label with no truthful mark in the set gets null and renders
 * bare — "Organizer" with a decorative squiggle next to it is furniture, and
 * an icon that doesn't mean the thing beside it teaches readers to ignore
 * all of them.
 *
 * Matching is by keyword on the normalised label, so "Entry, 2026" and
 * "Admission" both land on the fee mark without every year needing a row.
 */
import type { FeatureKey } from "../components/FeatureIcon.astro";

const RULES: [RegExp, FeatureKey][] = [
  [/admission|entry|fee|annual pass|what it costs/, "feeCharged"],
  [/where to buy|gift shop/, "giftShop"],
  [/restroom|bathroom|toilet/, "restrooms"],
  [/getting around|accessib/, "accessible"],
  [/parking/, "parking"],
  [/getting there|directions/, "footprints"],
  [/website/, "link"],
  [/^where$|location/, "mapPin"],
  [/season/, "seasonSummer" as FeatureKey],
  [/years i.ve confirmed|verified|confirmed/, "shield" as FeatureKey],
  [/phone|call/, "phone"],
  [/dog|pets/, "petsAllowed"],
  [/playground/, "playground"],
  [/drinking water|fountain/, "water"],
  [/shade/, "shade"],
  [/trail/, "trails"],
  [/camping|campground/, "camping"],
  [/beach/, "beach"],
  [/pier/, "pier"],
  [/picnic/, "picnic"],
  [/shower/, "showers"],
  [/boat/, "boatLaunch"],
  [/fishing/, "fishing"],
  [/hours|open/, "seasonSummer" as FeatureKey],
];

export function factIcon(label: string): FeatureKey | null {
  const l = label.toLowerCase().trim();
  for (const [re, icon] of RULES) if (re.test(l)) return icon;
  return null;
}
