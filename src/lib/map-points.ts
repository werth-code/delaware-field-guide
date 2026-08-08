/**
 * Everything on this site that has coordinates, in one list.
 *
 * This lived in the front page until the map got a page of its own. Moving it
 * here fixed a bug in passing: the front page split indoor places from
 * attractions with `kind === "Zoo"`, which stopped being the rule the day a
 * record was allowed to overrule its kind. Ashland Nature Center is an
 * outdoor place filed under an indoor kind, so the map was still dropping its
 * marker into "Museums & libraries" after both listing pages had been
 * corrected. It goes through isIndoors now, like everything else.
 *
 * THE MARKERS USE THE SITUATION ICONS where the section is really a
 * situation. Museums and libraries carried the "free" mark, which is a fact
 * about admission and not about the section — they wear the umbrella now,
 * because "somewhere dry when it rains" is what that group of pins is for.
 * Attractions carried the dog mark for no reason at all and now carry the
 * kid-friendly one.
 *
 * THE KINDS ARE SECTIONS, not facilities. A marker's colour and glyph say
 * which part of the site it belongs to, so the filter row reads the way the
 * navigation does rather than introducing a second vocabulary for the same
 * places.
 */
import { colorFor, COUNTY_COLOR } from "./feature-colors";
import { isIndoors, type IndoorPlace } from "./indoor";

import townsData from "../data/towns.json";
import stateParksData from "../data/state-parks.json";
import communityParksData from "../data/community-parks.json";
import indoorData from "../data/indoor.json";
import drinkData from "../data/drink.json";
import dogParksData from "../data/parks.json";
import eventsData from "../data/events.json";

type Geo = {
  slug: string;
  name: string;
  town?: string;
  county?: string;
  kind?: string;
  blurb?: string;
  answer?: string;
  photos?: { file: string; focus?: string | null }[];
  coords?: { lat: number; lon: number; precision: "site" | "town" };
};

/** One line each, trimmed at a sentence so the popup card stays a card. */
const oneLine = (t: string | undefined) => {
  if (!t) return "";
  const stop = t.indexOf(". ");
  const line = stop > 40 ? t.slice(0, stop + 1) : t;
  return line.length > 160 ? line.slice(0, 157).trimEnd() + "…" : line;
};

const pin = (rows: unknown[], kind: string, href: (r: any) => string) =>
  (rows as Geo[])
    .filter((r) => r.coords)
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      href: href(r),
      kind,
      lat: r.coords!.lat,
      lon: r.coords!.lon,
      precision: r.coords!.precision,
      blurb: oneLine(r.blurb ?? r.answer),
      where: [r.town, r.county ? `${r.county} County` : null].filter(Boolean).join(", "),
      photo: r.photos?.[0]?.file ?? null,
      focus: r.photos?.[0]?.focus ?? null,
      county: r.county ?? "",
    }));

export function buildMapPoints() {
  const indoorAll = indoorData as unknown as IndoorPlace[];
  return [
    ...pin(stateParksData as unknown[], "trails", (r) => `/parks/${r.slug}/`),
    ...pin(communityParksData as unknown[], "playground", (r) => `/parks/community/${r.slug}/`),
    ...pin(indoorAll.filter(isIndoors) as unknown[], "rainyDay", (r) => `/indoors/${r.slug}/`),
    ...pin(indoorAll.filter((p) => !isIndoors(p)) as unknown[], "kidFriendly", (r) => `/attractions/${r.slug}/`),
    ...pin(drinkData as unknown[], "giftShop", (r) => `/wineries-and-breweries/${r.slug}/`),
    ...pin(townsData as unknown[], "beach", (r) => `/dogs/${r.slug}/`),
    ...pin(dogParksData as unknown[], "dogPark", (r) => `/dogs/dog-parks/${r.slug}/`),
    ...pin(eventsData as unknown[], "pavilion", (r) => `/events/${r.slug}/`),
  ];
}

export const MAP_KINDS = [
  { key: "trails", label: "State parks", color: colorFor("trails") },
  { key: "playground", label: "Community parks", color: colorFor("playground") },
  { key: "beach", label: "Dog beaches", color: colorFor("beach") },
  { key: "rainyDay", label: "Museums & libraries", color: colorFor("rainyDay") },
  { key: "giftShop", label: "Wine & beer", color: colorFor("giftShop") },
  { key: "kidFriendly", label: "Places to go", color: colorFor("kidFriendly") },
  { key: "dogPark", label: "Dog parks", color: colorFor("dogPark") },
  { key: "pavilion", label: "Events", color: colorFor("pavilion") },
];

export const MAP_COUNTIES = ["New Castle", "Kent", "Sussex"].map((c) => ({
  key: c,
  label: c,
  color: COUNTY_COLOR[c],
}));
