/**
 * The birding tag vocabulary.
 *
 * FOUR SYSTEMS, DELIBERATELY NOT ONE.
 *
 * A reader looking at a bird card for three seconds should get three separate
 * answers — is it here when I'm going, where do I look, is it worth a detour —
 * and one warning. Throwing all of that into a single row of colored pills
 * makes them compete, so each question keeps its own visual language:
 *
 *   SEASON      pale fill, dark text, four fixed hues. Reads as a calendar.
 *   HABITAT     solid chip, same family as the existing facility tags, because
 *               it answers the same kind of question and already has a look.
 *   INTEREST    editorial. Gold star earns attention; everything else recedes.
 *   SENSITIVE   breaks the system on purpose. It is not a category.
 *
 * PRACTICAL ICONS STAY NEUTRAL. Scope, car, tower, restroom, fee, accessibility
 * all render in the site's ink, never in a hue. Color here means season,
 * habitat or significance and nothing else — the moment a bathroom is blue,
 * blue stops meaning water and the whole page becomes a bag of Skittles.
 *
 * EVERY VALUE WAS COMPUTED, NOT PICKED.
 *
 * All four season accents as first drafted failed the 7:1 this palette holds
 * itself to — 5.30, 6.05, 6.15 and 5.72 against their own pale fills. So did
 * five of the habitat and interest colors. Each was darkened in 0.5% lightness
 * steps, hue and saturation preserved, until it cleared. Worst case in the set
 * is now 7.01:1. This is the same method feature-colors.ts used, and the same
 * reason: choosing these by eye ships them at 5:1 and nobody notices.
 *
 * ONE SEMANTIC COLOR, ONE MEANING. Spring is this green on the card, in the
 * filter, on the species page, on the place page and in the seasonal guide.
 * Blue never later means "verified". scripts/check-build.mjs enforces that no
 * two entries collide, across BOTH palettes — and it caught four here on its
 * first run: forest wearing the trails green, backyard wearing sports purple,
 * chase wearing tennis, and Delaware-specialty wearing the salt-marsh teal.
 * That last one was the worst of them, an editorial interest label dressed as
 * a habitat. It also found `stables` and `picnic` sharing a brown in the
 * older palette, which had been shipping on the same park cards for months.
 *
 * NEVER COLOR ALONE. Every tag ships icon + word + color, so the set works for
 * a reader who cannot separate the spring green from the winter blue.
 */

export interface Tag {
  key: string;
  label: string;
  icon: string;
  /** Text/stroke color. >= 7:1 on `fill` where filled, else on cream. */
  color: string;
  /** Pale ground for season chips. Null for solid chips. */
  fill?: string | null;
}

/**
 * WHEN IS IT HERE?
 *
 * "Seasonally possible", never "here now". A season tag says the species
 * normally occurs in Delaware in that window — it is not a sighting, and this
 * site does not infer one. Live reports belong to eBird.
 */
export const SEASONS: Tag[] = [
  { key: "spring", label: "Spring", icon: "seasonSpring", color: "#265a3f", fill: "#e8f4ec" },
  { key: "summer", label: "Summer", icon: "seasonSummer", color: "#674d00", fill: "#fff4d6" },
  { key: "fall", label: "Fall", icon: "seasonFall", color: "#75401f", fill: "#f8e8de" },
  { key: "winter", label: "Winter", icon: "seasonWinter", color: "#35506d", fill: "#e8eff7" },
];

/**
 * WHERE DO I LOOK?
 *
 * The same tags appear on birds and on places, which is what makes the pair
 * navigable: tap salt marsh and get both the birds and the places.
 */
export const HABITATS: Tag[] = [
  { key: "saltMarsh", label: "Salt marsh", icon: "habitatReeds", color: "#0f5d5a" },
  { key: "freshMarsh", label: "Freshwater marsh", icon: "habitatCattail", color: "#115c55" },
  { key: "coast", label: "Coast", icon: "habitatWave", color: "#0a5a72" },
  { key: "openWater", label: "Open water", icon: "habitatRipple", color: "#1b5786" },
  { key: "forest", label: "Forest", icon: "habitatTrees", color: "#1c4526" },
  { key: "field", label: "Field", icon: "habitatGrasses", color: "#515720" },
  { key: "swamp", label: "Swamp", icon: "habitatCypress", color: "#134f4a" },
  { key: "backyard", label: "Backyard", icon: "habitatHouse", color: "#67428c" },
];

/**
 * IS IT SOMETHING SPECIAL? — EDITORIAL, AND LABELLED AS SUCH.
 *
 * Kept strictly apart from `recordStatus` below. "Rare" is a records fact the
 * Delaware Ornithological Society decides. "Birders travel for this" is my
 * opinion, and conflating the two would let an opinion wear the authority of a
 * state records committee.
 */
export const INTEREST: Tag[] = [
  { key: "everyday", label: "Everyday bird", icon: "interestEye", color: "#4a4f55" },
  { key: "specialty", label: "Delaware specialty", icon: "interestFeather", color: "#0b3a42" },
  { key: "bucketList", label: "Bucket-list bird", icon: "interestStar", color: "#704b00" },
  { key: "chase", label: "Chase rarity", icon: "interestSparkle", color: "#843377" },
];

export const INTEREST_DISCLAIMER =
  "Field Guide interest labels are editorial, not official rarity classifications.";

/**
 * OCCURRENCE — NOT MINE, AND STYLED SO IT DOESN'T LOOK LIKE IT IS.
 *
 * Neutral throughout. No color, no icon, no emphasis. It comes from the state
 * list and it should read as a citation rather than a badge. Deliberately not
 * red for rare: a page that visually excites people about a scarce bird is
 * a page nudging them toward a bird that does not need the attention.
 */
export const RECORD_STATUS = ["Regular", "Uncommon", "Rare", "Review species"] as const;
export type RecordStatus = (typeof RECORD_STATUS)[number];

/**
 * THE ONE THAT BREAKS THE SYSTEM ON PURPOSE.
 *
 * Amber, shield, and it is not a category — it is a limit on what this site
 * will publish. Where it appears, location detail is deliberately coarse.
 */
export const SENSITIVE: Tag = {
  key: "sensitive",
  label: "Sensitive bird",
  icon: "shield",
  color: "#6a4500",
  fill: "#fdf1dc",
};

export const SENSITIVE_NOTE =
  "Location information is limited here to protect nesting, roosting or otherwise sensitive birds.";

/**
 * Practical fields. NO COLOR — these render in the site's ink like every other
 * utility mark, which is the whole reason the colored tags above still mean
 * something.
 */
export const PRACTICAL = [
  { key: "birdingSite", label: "Birding destination", icon: "binoculars" },
  { key: "scope", label: "Scope helpful", icon: "scope" },
  { key: "fromCar", label: "Bird from the car", icon: "car" },
  { key: "tower", label: "Observation tower", icon: "tower" },
  { key: "walking", label: "Walking required", icon: "footprints" },
  { key: "beginner", label: "Beginner-friendly", icon: "beginner" },
] as const;

const ALL: Tag[] = [...SEASONS, ...HABITATS, ...INTEREST, SENSITIVE];

export const tagByKey = (key: string): Tag | undefined => ALL.find((t) => t.key === key);
export const tagsFor = (keys: string[] | null | undefined, set: Tag[]): Tag[] =>
  (keys ?? []).map((k) => set.find((t) => t.key === k)).filter((t): t is Tag => !!t);

/** Every color in the birding vocabulary, for the build-time collision check. */
export const ALL_BIRDING_COLORS: Record<string, string> = Object.fromEntries(
  ALL.map((t) => [t.key, t.color]),
);
