/**
 * Intent pages — the /good-for/ routes, rebuilt.
 *
 * WHY THESE CAME BACK
 *
 * They were deleted when the listing filters landed, on the reasoning that a
 * chip on /parks/ does the same job as a page. It doesn't, for one reason: a
 * filter is something you use once you have arrived, and this is what people
 * type before they arrive. "Delaware playgrounds with restrooms" is a search.
 * "facilities.playground === true" is not.
 *
 * Deleting them also stranded URLs that search engines still hand out, so the
 * few people who did find their way here got a 404. Bringing the pages back is
 * a better answer than redirecting the intent away.
 *
 * WHAT MAKES THESE DIFFERENT FROM PROGRAMMATIC SEO SLOP
 *
 * Google's own guidance warns against generating a page per query permutation,
 * and it is right to. The line this file holds:
 *
 *   1. Every intent is HAND-WRITTEN — its question, its answer, its caveat.
 *      The data fills a list; it does not invent a page. There is no
 *      "shade AND dogs AND restrooms near Wilmington open Sunday" because
 *      nobody wrote one, and the combinatorial explosion is exactly the thing
 *      being avoided.
 *
 *   2. A page only enters the sitemap with MIN_TO_INDEX real results. A thin
 *      list is still built and still reachable — an old link should land
 *      somewhere honest — but it is noindexed until it earns its place.
 *
 *   3. Matches are on CONFIRMED TRUE only. An unknown never counts. A page
 *      called "playgrounds with restrooms" that lists a park whose restrooms
 *      nobody checked is worse than no page, because the whole promise is that
 *      somebody checked.
 *
 * Rule 3 costs a lot here and is the reason several of these lists are short.
 * That is the correct trade: the list is the argument.
 */
import { isPublishable } from "./verification";
import { closedDays, isIndoors } from "./indoor";

/** Below this, the page is built but kept out of the index. */
export const MIN_TO_INDEX = 4;

export interface Hit {
  name: string;
  href: string;
  kind: string;
  town: string | null;
  county: string | null;
  /**
   * Where it is, so the page can be sorted by distance.
   *
   * Delaware is a hundred miles long and these lists cross the whole state.
   * "Playgrounds with restrooms" grouped by county still asks a parent in
   * Newark to read past six Sussex entries — and nobody drives two hours for a
   * playground. Null where the record has no coordinates: NearMe leaves those
   * where they are rather than guessing them to the end of the state.
   */
  lat?: number | null;
  lon?: number | null;
  /** The reason this record is on this list, in its own words where possible. */
  note?: string | null;
}

export interface Intent {
  slug: string;
  /** Literal search language. Carries the query. */
  title: string;
  /** Human. Carries the voice. Never the same string as the title. */
  h1: string;
  /** The answer, before any explanation. */
  answer: string;
  /** What the reader should know about how this list was built. */
  caveat: string;
  description: string;
  match: (d: Data) => Hit[];
}

export interface Data {
  state: any[];
  community: any[];
  indoor: any[];
  drink: any[];
}

const town = (r: any) => r.town ?? null;
const county = (r: any) => r.county ?? null;
const at = (r: any) => ({ lat: r.coords?.lat ?? null, lon: r.coords?.lon ?? null });

const fromState = (rows: any[], f: (p: any) => boolean, note?: (p: any) => string | null): Hit[] =>
  rows.filter(isPublishable).filter(f).map((p) => ({
    name: p.name, href: `/parks/${p.slug}/`, kind: "State park", town: town(p), county: county(p),
    ...at(p), note: note?.(p) ?? null,
  }));

const fromCommunity = (rows: any[], f: (p: any) => boolean, note?: (p: any) => string | null): Hit[] =>
  rows.filter(isPublishable).filter(f).map((p) => ({
    name: p.name, href: `/parks/community/${p.slug}/`, kind: p.operator ?? "Community park",
    town: town(p), county: county(p), ...at(p), note: note?.(p) ?? null,
  }));

const fromIndoor = (rows: any[], f: (p: any) => boolean, note?: (p: any) => string | null): Hit[] =>
  rows.filter(isPublishable).filter(f).map((p) => ({
    name: p.name,
    href: `${isIndoors(p) ? "/indoors" : "/attractions"}/${p.slug}/`,
    kind: p.kind, town: town(p), county: county(p), ...at(p), note: note?.(p) ?? null,
  }));

const fromDrink = (rows: any[], f: (p: any) => boolean, note?: (p: any) => string | null): Hit[] =>
  rows.filter(isPublishable).filter(f).map((p) => ({
    name: p.name, href: `/wineries-and-breweries/${p.slug}/`, kind: p.kind,
    town: town(p), county: county(p), ...at(p), note: note?.(p) ?? null,
  }));

export const INTENTS: Intent[] = [
  {
    slug: "rainy-day",
    title: "Rainy-Day Things to Do in Delaware With Kids",
    h1: "Somewhere dry when it rains",
    answer:
      "Delaware's indoor options are museums, historic sites and public libraries. " +
      "Most of them shut two or three days a week, which is the part that wastes the drive.",
    caveat:
      "Hours are the first thing to check and the first thing to go stale. Each entry " +
      "carries the day I last read them off the operator.",
    description:
      "Indoor places to take kids in Delaware when it rains: museums, historic sites and libraries, with current hours, admission and closures.",
    match: (d) => fromIndoor(d.indoor, (p) => isIndoors(p)),
  },
  {
    slug: "playground-restrooms",
    title: "Delaware Playgrounds With Restrooms",
    h1: "A playground with a bathroom",
    answer:
      "A playground without a bathroom is a different outing. These are the parks " +
      "where both are confirmed present.",
    caveat:
      "Confirmed true on both counts, not assumed. Plenty of parks have restrooms " +
      "nobody has checked — they are missing from this list rather than guessed onto it.",
    description:
      "Delaware parks with both a playground and confirmed restrooms, across state and county parks. Checked, not assumed.",
    match: (d) => [
      ...fromState(d.state, (p) => p.features?.playground === true && p.features?.restrooms === true),
      ...fromCommunity(d.community, (p) =>
        p.facilities?.playground === true && p.restrooms?.present === true,
        (p) => p.restrooms?.note ?? null),
    ],
  },
  {
    slug: "free",
    title: "Free Things to Do in Delaware",
    h1: "Go somewhere without buying a ticket",
    answer:
      "These publish free admission. Not discounted, not free-on-a-Thursday — no ticket at all.",
    caveat:
      "Only places whose operator publishes free entry. A park with no published fee " +
      "is not the same as a park confirmed free, so county parks are absent until " +
      "somebody says so on the record.",
    description:
      "Delaware museums, historic sites and libraries with free admission published by the operator. No ticket required.",
    match: (d) => fromIndoor(d.indoor, (p) => p.admission?.free === true,
      (p) => p.admission?.note ?? null),
  },
  {
    slug: "open-sunday",
    title: "Things to Do in Delaware on Sunday",
    h1: "Actually open on Sunday",
    answer:
      "Sunday is the day Delaware's museums are most likely to be shut. These ones aren't.",
    caveat:
      "Worked out from the opening days each place publishes, so a place whose hours " +
      "I have not got is absent rather than assumed open. Holiday weekends are their own problem.",
    description:
      "Delaware museums, attractions and indoor places open on Sunday, worked out from each operator's published opening days.",
    match: (d) =>
      fromIndoor(d.indoor, (p) => {
        const shut = closedDays(p);
        return shut !== null && !shut.includes("Sunday");
      }),
  },
  {
    slug: "toddlers",
    title: "Things to Do in Delaware With Toddlers",
    h1: "Somewhere that works with a small child",
    answer:
      "A playground, a confirmed bathroom, and a paved path you can push a stroller along. " +
      "All three, in the same place.",
    caveat:
      "Three confirmed facts per park, which is why the list is short. Any park missing " +
      "one of the three is left off rather than half-recommended.",
    description:
      "Delaware parks that work with a toddler: playground, confirmed restrooms and a paved stroller-friendly path, all in one place.",
    match: (d) =>
      fromCommunity(d.community, (p) =>
        p.facilities?.playground === true &&
        p.restrooms?.present === true &&
        p.facilities?.pavedPath === true),
  },
  {
    slug: "shade",
    title: "Delaware Parks With Shade",
    h1: "Shade in August",
    answer: "Confirmed tree cover or shelter. In a Delaware July it decides the afternoon.",
    caveat:
      "Shade is recorded where I have seen it or the operator describes it. Absence " +
      "here means unchecked, not treeless.",
    description:
      "Delaware community parks with confirmed shade — tree cover or shelter — for hot days when an open field is not an option.",
    match: (d) => fromCommunity(d.community, (p) => p.facilities?.shade === true),
  },
  {
    slug: "dog-friendly-drinks",
    title: "Dog-Friendly Breweries & Wineries in Delaware",
    h1: "A drink where the dog can come",
    answer:
      "These say so themselves. Every entry here is the business's own published policy, " +
      "not a review site's tag or somebody's photo of a dog on a patio.",
    caveat:
      "Most Delaware breweries and wineries publish no dog policy at all. They are not on " +
      "this list, which does not mean the answer is no — it means nobody has said. " +
      "Ring before you drive.",
    description:
      "Delaware breweries, wineries, cideries and meaderies that publish their own dog policy — inside, patio or both. Operator-stated, not crowd-sourced.",
    match: (d) =>
      fromDrink(d.drink, (p) =>
        p.dogs?.source === "operator" && (p.dogs?.outdoor === true || p.dogs?.indoor === true),
        (p) => p.dogs?.note ?? null),
  },
];

export const intentBySlug = (slug: string) => INTENTS.find((i) => i.slug === slug);
