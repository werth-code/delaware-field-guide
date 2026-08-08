/**
 * Section registry.
 *
 * The whole site was built on the claim that a second section drops in without
 * refactoring. Mostly true — the layout, design system, verification gate,
 * build checks and share row all took `parks` with no changes at all. The one
 * thing that WAS hardcoded to dogs was the section nav, so it moved here.
 *
 * Adding section three means one entry in this file.
 */
import townsData from "../data/towns.json";
import stateParksData from "../data/state-parks.json";
import communityParksData from "../data/community-parks.json";

export interface NavItem {
  href: string;
  label: string;
}

export interface Section {
  /** First path segment, e.g. "dogs". */
  slug: string;
  label: string;
  /**
   * The section's mark, from the same set the map markers and the filter chips
   * use. One vocabulary: a reader who learns the umbrella means wet weather on
   * the map meets it again in the nav and on the front-page card, in the same
   * colour, and doesn't have to learn it twice.
   */
  icon: string;
  /** Shown in the masthead. */
  nav: NavItem[];
  /**
   * What to show for this section inside a masthead group, when the section's
   * own nav entries don't stand up out of context.
   *
   * Surf fishing's are "Reservations" and "Permits & licenses", which read
   * fine under a Surf fishing heading and read as nothing under Parks. Parks
   * has the opposite problem — "State parks" and "Community parks" are two
   * real destinations and collapsing them to "Parks" inside a group called
   * Parks would be worse than useless.
   *
   * Defaults to one entry: the section's label, pointing at its first page.
   */
  groupNav?: NavItem[];
}

const towns = townsData as { slug: string; name: string }[];
const stateParks = stateParksData as { slug: string; name: string; county: string }[];
const communityParks = communityParksData as { slug: string; name: string }[];

export const SECTIONS: Section[] = [
  {
    slug: "events",
    label: "Events",
    icon: "pavilion",
    nav: [{ href: "/events/", label: "Fairs and events" }],
  },
  {
    slug: "nearby",
    label: "Nearby",
    icon: "outOfState",
    nav: [{ href: "/nearby/", label: "Just over the line" }],
  },
  {
    slug: "indoors",
    label: "Indoors",
    icon: "rainyDay",
    nav: [{ href: "/indoors/", label: "Museums, science centers and libraries" }],
  },
  {
    slug: "wineries-and-breweries",
    label: "Wine & beer",
    icon: "giftShop",
    nav: [{ href: "/wineries-and-breweries/", label: "Wineries and breweries" }],
  },
  {
    slug: "attractions",
    label: "Places to go",
    icon: "kidFriendly",
    nav: [{ href: "/attractions/", label: "Places to go" }],
  },
  {
    slug: "disc-golf",
    label: "Disc golf",
    icon: "discGolf",
    nav: [{ href: "/disc-golf/", label: "Every course, and what entry costs" }],
  },
  {
    slug: "dogs",
    label: "Dogs",
    icon: "petsAllowed",
    nav: [
      { href: "/dogs/", label: "All towns" },
      ...towns.map((t) => ({ href: `/dogs/${t.slug}/`, label: t.name })),
      { href: "/dogs/summer/", label: "Summer" },
      { href: "/dogs/dog-parks/", label: "Dog parks" },
      { href: "/dogs/pet-fees/", label: "Pet fees" },
      { href: "/dogs/pond-safety/", label: "Pond safety" },
    ],
  },
  {
    slug: "parks",
    label: "Parks",
    icon: "trails",
    /*
      Two entries, not nineteen. The dog nav lists towns because those ARE the
      answer pages and there are five. Parks has 33 records across two kinds,
      so the nav points at the two indexes and the card grids do the drilling.
    */
    nav: [
      { href: "/parks/", label: "State parks" },
      { href: "/parks/community/", label: "Community parks" },
    ],
    groupNav: [
      { href: "/parks/", label: "State parks" },
      { href: "/parks/community/", label: "Community parks" },
    ],
  },
  {
    slug: "surf-fishing",
    label: "Surf fishing",
    icon: "surfFishing",
    nav: [
      { href: "/surf-fishing/", label: "Reservations" },
      { href: "/surf-fishing/permits/", label: "Permits & licenses" },
    ],
  },
];

/** The section a path belongs to, or null for home / how-we-verify. */
export function sectionFor(pathname: string): Section | null {
  const first = pathname.split("/").filter(Boolean)[0];
  return SECTIONS.find((s) => s.slug === first) ?? null;
}

/**
 * THE MASTHEAD, GROUPED.
 *
 * Thirteen top-level links — home, ask, contacts and ten sections — wrapped to
 * three rows on a desktop and made the phone menu a wall. A nav that long
 * stops being navigation and becomes a list you read.
 *
 * Six now. Dogs stays out on its own because it's the section this site is
 * best at and the one most people arrive for; the rest fall into two obvious
 * piles. "Days out" is the honest name for the pile that has a museum, a
 * brewery, a disc golf course and a county fair in it: the thing they share is
 * an afternoon, not a category.
 *
 * The groups reference SECTIONS by slug rather than restating labels and
 * hrefs, so a section that moves or gets renamed moves here too, and a section
 * added to the registry and forgotten here shows up in the build check below
 * rather than quietly vanishing from the nav.
 */
export interface NavGroup {
  label: string;
  /** Section slugs, in the order they should read. */
  slugs: string[];
}

export const NAV_GROUPS: NavGroup[] = [
  { label: "Parks", slugs: ["parks", "surf-fishing"] },
  { label: "Days out", slugs: ["indoors", "attractions", "wineries-and-breweries", "disc-golf", "events", "nearby"] },
];

/** Sections that sit at the top level rather than inside a group. */
export const NAV_TOP: string[] = ["dogs"];

/* A section in neither list would silently disappear from the masthead. This
   is the whole reason the groups hold slugs instead of their own copies of the
   labels — it makes the omission detectable. */
const placed = new Set([...NAV_GROUPS.flatMap((g) => g.slugs), ...NAV_TOP]);
const orphans = SECTIONS.filter((s) => !placed.has(s.slug)).map((s) => s.slug);
if (orphans.length) {
  throw new Error(
    `Section(s) missing from the masthead: ${orphans.join(", ")}.\n` +
      `Add each to NAV_GROUPS or NAV_TOP in src/lib/sections.ts. A section that\n` +
      `isn't in either is unreachable from the nav on every page of the site.`,
  );
}

/** The group a section belongs to, for marking the masthead. */
export const groupFor = (slug: string | null): NavGroup | null =>
  slug ? (NAV_GROUPS.find((g) => g.slugs.includes(slug)) ?? null) : null;

/** Look a section up by slug — the groups store slugs, the nav needs labels. */
export const sectionBySlug = (slug: string): Section | undefined =>
  SECTIONS.find((s) => s.slug === slug);

/** What a section contributes to a masthead group. */
export const groupNavFor = (s: Section): NavItem[] =>
  s.groupNav ?? [{ href: s.nav[0].href, label: s.label }];
