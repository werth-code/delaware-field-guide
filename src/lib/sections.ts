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
  /** Shown in the masthead. */
  nav: NavItem[];
}

const towns = townsData as { slug: string; name: string }[];
const stateParks = stateParksData as { slug: string; name: string; county: string }[];
const communityParks = communityParksData as { slug: string; name: string }[];

export const SECTIONS: Section[] = [
  {
    slug: "events",
    label: "Events",
    nav: [{ href: "/events/", label: "Fairs and events" }],
  },
  {
    slug: "nearby",
    label: "Nearby",
    nav: [{ href: "/nearby/", label: "Just over the line" }],
  },
  {
    slug: "indoors",
    label: "Indoors",
    nav: [{ href: "/indoors/", label: "Museums, science centers and libraries" }],
  },
  {
    slug: "good-for",
    label: "Good for",
    nav: [{ href: "/good-for/", label: "Pick the afternoon" }],
  },
  {
    slug: "dogs",
    label: "Dogs",
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
    /*
      Two entries, not nineteen. The dog nav lists towns because those ARE the
      answer pages and there are five. Parks has 33 records across two kinds,
      so the nav points at the two indexes and the card grids do the drilling.
    */
    nav: [
      { href: "/parks/", label: "State parks" },
      { href: "/parks/community/", label: "Community parks" },
    ],
  },
  {
    slug: "surf-fishing",
    label: "Surf fishing",
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
