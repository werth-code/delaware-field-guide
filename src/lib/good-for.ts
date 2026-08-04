/**
 * Situation tags.
 *
 * The filters here were attributes: fenced, water, shade, paved. People don't
 * search in attributes, they search in situations. "Somewhere shady to walk
 * the dog for twenty minutes" is the real query; `shade: true` is our shape
 * for part of it.
 *
 * DERIVED, never authored. Each tag is a rule over fields that already exist,
 * so it appears the moment a fact is confirmed and disappears if the fact turns
 * out wrong. A tag can never claim something the facts table contradicts.
 *
 * TWO RULES THAT COST US TAGS, BOTH ON PURPOSE
 *
 * 1. A tag is only awarded on a CONFIRMED true. An unknown never earns one,
 *    because a situation tag is a promise you can drive on.
 *
 * 2. A record that isn't publishable can't appear on a list. That one bites
 *    hard here: all seventeen dog parks are `reported`, because their details
 *    came off review sites rather than from anyone who stood in them. So the
 *    dog-park situations — actually fenced, a separate small-dog side, water in
 *    August — are the most useful tags this site could carry and none of them
 *    can ship yet. Confirm the parks and they appear on their own.
 */
import { isPublishable } from "./verification";

export interface TagRow {
  slug: string;
  label: string;
  lede: string;
  parks: { name: string; href: string; kind: string; town: string }[];
}

type Rule = {
  slug: string;
  label: string;
  lede: string;
  state?: (p: any) => boolean;
  community?: (p: any) => boolean;
};

const RULES: Rule[] = [
  {
    slug: "restrooms-that-exist",
    lede: "Confirmed, not assumed. A blank in my data means nobody checked, so those aren't here.",
    label: "Restrooms that exist",
    community: (p) => p.restrooms?.present === true,
  },
  {
    slug: "lifeguards-on-duty",
    label: "Lifeguards on duty",
    lede: "Guarded swimming, confirmed. Worth knowing which beaches aren't.",
    state: (p) => p.features?.guardedSwimming === true,
  },
  {
    slug: "stay-the-night",
    label: "Stay the night",
    lede: "Camping or cabins on site.",
    state: (p) => p.features?.camping === true || p.features?.cabins === true,
  },
  {
    slug: "fish-from-the-beach",
    label: "Fish from the beach",
    lede: "Surf fishing from the sand. Check the permit page before you drive on it.",
    state: (p) => p.features?.surfFishing === true,
  },
  {
    slug: "stroller-friendly",
    label: "Stroller-friendly",
    lede: "A paved path you can actually push a stroller along.",
    community: (p) => p.facilities?.pavedPath === true,
  },
  {
    slug: "shade-in-august",
    label: "Shade in August",
    lede: "Confirmed shade. In a Delaware July that decides the afternoon.",
    community: (p) => p.facilities?.shade === true,
  },
  {
    slug: "somewhere-to-sit",
    label: "Somewhere to sit",
    lede: "A pavilion you can get under. Some can be booked, some are first come.",
    community: (p) => p.facilities?.pavilion === true,
  },
  {
    slug: "water-you-can-drink",
    label: "Water you can drink",
    lede: "A working fountain or spigot, confirmed. Rarer than it should be.",
    community: (p) => p.facilities?.water === true,
  },
  {
    slug: "burn-off-an-hour",
    label: "Burn off an hour",
    lede: "Trails, a playground or courts. Somewhere to let everyone run about.",
    state: (p) => p.features?.trails === true,
    community: (p) => p.facilities?.playground === true || p.facilities?.sports === true,
  },
  {
    slug: "get-on-the-water",
    label: "Get on the water",
    lede: "A boat launch or a pier, confirmed.",
    state: (p) => p.features?.boatLaunch === true || p.features?.pier === true,
  },
];

export function allGoodFor(state: any[], community: any[]): TagRow[] {
  const s = state.filter(isPublishable);
  const c = community.filter(isPublishable);
  return RULES.map((r) => ({
    slug: r.slug,
    label: r.label,
    lede: r.lede,
    parks: [
      ...s.filter((p) => r.state?.(p)).map((p) => ({
        name: p.name, href: `/parks/${p.slug}/`, kind: "State park", town: p.town,
      })),
      ...c.filter((p) => r.community?.(p)).map((p) => ({
        name: p.name, href: `/parks/community/${p.slug}/`, kind: "County park", town: p.town,
      })),
    ],
  })).filter((t) => t.parks.length > 0);
}
