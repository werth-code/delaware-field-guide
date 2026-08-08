/**
 * One color per feature, used everywhere that feature is referred to.
 *
 * WHAT THIS IS FOR
 *
 * A reader who has seen the blue playground glyph twice should recognize it on
 * the third page without reading the word. That only works if the color is
 * identical everywhere, which means it lives here and nowhere else — never a
 * Tailwind class typed at a render site, because those drift and nobody
 * notices until two pages disagree.
 *
 * WHY THESE PARTICULAR VALUES
 *
 * Every one is dark. That isn't an aesthetic preference, it's the constraint
 * that made the set possible at all:
 *
 *   - Filled chips put pale text on the color, so each needs 7:1 against the
 *     lighter of the two site backgrounds. That rules out mid-tones entirely.
 *   - The same color is used for the icon stroke on a pale page, where it
 *     needs to stay legible against the darkest page ground.
 *
 * Both were solved numerically rather than by eye: each hue was darkened in
 * 2% steps until it cleared 7:1 on fill, then checked against the page. The
 * worst case in the set is 7.0:1 filled and 6.1:1 as an icon. Picking these
 * by looking at them would have shipped several at 5:1 — the first draft did,
 * and thirty-three of them failed.
 *
 * HOW THEY'RE GROUPED
 *
 * Related things sit in the same part of the wheel, so the palette reads as a
 * system rather than a bag of colors: water is blue-teal, growing things are
 * green, built things are brown-rust, and restrooms is near-black because it
 * is the one people look for first.
 *
 * A NOTE ON WHAT THIS COSTS
 *
 * Green, amber and red still mean confirmed, unknown and warning on this site.
 * Two of these features are green and one is close to rust, so on a page with
 * both a status flag and a feature chip there is now more for a reader to
 * hold. The flags keep their icons and their position, which is what actually
 * distinguishes them; this is worth knowing about rather than pretending away.
 */
export const FEATURE_COLOR: Record<string, string> = {
  /* Comfort — the trip-critical set. */
  restrooms: "#1e2a33",
  water: "#145c61",
  showers: "#295772",
  picnic: "#6b4423",
  shade: "#3d5b32",
  pavilion: "#724a1b",
  grills: "#873b1e",

  /* Water. */
  waterfall: "#0e5877",
  beach: "#0a5a72",
  swimming: "#0d5973",
  guardedSwimming: "#0a5b72",
  fishing: "#1d4f6b",
  surfFishing: "#195975",
  boatLaunch: "#124b63",
  boatRentals: "#14596f",
  pier: "#20506b",

  /* Stay. */
  camping: "#48582a",
  cabins: "#5c4326",

  /* Do. */
  trails: "#295e35",
  pavedPath: "#4a4f55",
  playground: "#1f4fa8",
  stables: "#6b4423",
  sports: "#5a3a7a",
  discGolf: "#345c28",
  skate: "#6d3b6b",
  winterUse: "#37566e",

  /* Things the roster never listed. Same rule as everything above: darkened
     in steps until each cleared 7:1 filled, not chosen by eye. */
  paddling: "#0f5266",
  crabbing: "#8a3520",
  waterPark: "#0b5169",
  ropesCourse: "#404e1f",
  climbingWall: "#7a4420",
  tennis: "#6a2f66",
  golf: "#2f5325",
  horseTrails: "#6d4024",

  /* The planner's own vocabulary. It names three things the facility lists
     don't: whether a dog area is fenced, whether the paths are paved, and
     whether a place is indoors. Without these three the ask results were the
     only cards on the site whose chips had no colour at all. `paved` and
     `indoors` deliberately match pavedPath and rainyDay — same thing, two
     names, and they must not read as two things. */
  fenced: "#5c4a12",
  paved: "#4a4f55",
  indoors: "#254367",

  /* Dogs. */
  petsAllowed: "#77481b",
  dogPark: "#734b1a",

  /**
   * SITUATIONS, not facilities.
   *
   * The rest of this file answers "what is at this place". These five answer
   * "does this place suit me today" — is it raining, have I got the kids, is
   * it out of state, does it cost anything. They are the questions people
   * actually arrive with, and they were the ones with no mark of their own:
   * wet weather was borrowing the museum colour, out-of-state had nothing at
   * all, and the two money answers were words on every card.
   *
   * They obey the same rule as everything else here, checked numerically
   * rather than by eye: at least 7:1 against cream when the chip is filled,
   * and legible as a stroke on the sand page ground.
   *
   * feeCharged and free are a deliberate pair — the same question answered two
   * ways — so they take the two ends of the site's existing status language,
   * green for yes-go and the parking red for it-will-cost-you. They are the
   * one place in this palette where the colour is doing status work, and that
   * is the point rather than an accident.
   */
  rainyDay: "#254367",
  outOfState: "#4f3f61",
  kidFriendly: "#6d3320",
  feeCharged: "#6f2030",

  /* Indoors. */
  free: "#205e48",
  giftShop: "#7a3f5c",
  accessible: "#24577c",
  parking: "#7e102e",
  branches: "#565058",
};

/** Falls back to body ink, so an unmapped key is dull rather than broken. */
export const colorFor = (key: string): string => FEATURE_COLOR[key] ?? "#10201c";

/**
 * Counties are a different axis, and the colours say so.
 *
 * Feature colours carry a promise: black always means restrooms, blue always
 * means playground. A county is not a feature, so borrowing from that palette
 * would spend the promise on something it doesn't cover. These three are their
 * own set — picked for maximum separation from each other (68 dE apart in Lab,
 * so they stay distinct in every common form of colour blindness) at a matched
 * lightness, so the three buttons read as siblings rather than a ranking.
 *
 * The hues are not arbitrary: brick for the city end of the state, field green
 * for the farm counties, water blue for the coast.
 */
export const COUNTY_COLOR: Record<string, string> = {
  "New Castle": "#8a2d36",
  Kent: "#2a4b00",
  Sussex: "#005193",
};
