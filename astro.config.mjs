// @ts-check
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

/**
 * A page whose facts aren't verified is `noindex` (see src/lib/verification.ts).
 * Keep those same pages out of the sitemap, so the two signals can never
 * disagree — submitting a noindex URL is a crawl-budget own goal.
 */
const read = (p) => JSON.parse(readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8'));

const towns = read('./src/data/towns.json');
const parks = read('./src/data/parks.json');
const places = read('./src/data/places.json');
const stateParks = read('./src/data/state-parks.json');
const communityParks = read('./src/data/community-parks.json');
const surf = read('./src/data/surf-fishing.json');
const lodging = read('./src/data/lodging.json').filter((l) => typeof l.name === 'string');

const confirmed = (r) => r.verifiedDate !== null && r.verifiedSource !== null;
const placeOf = (slug) => places.find((p) => p.slug === slug);

const unverified = [
  ...towns.filter((t) => !confirmed(t)).map((t) => `/dogs/${t.slug}/`),
  ...parks.filter((p) => !confirmed(p)).map((p) => `/dogs/dog-parks/${p.slug}/`),
  ...stateParks.filter((p) => !confirmed(p)).map((p) => `/parks/${p.slug}/`),
  ...(stateParks.some(confirmed) ? [] : ['/parks/']),
  ...communityParks.filter((p) => !confirmed(p)).map((p) => `/parks/community/${p.slug}/`),
  ...(communityParks.some(confirmed) ? [] : ['/parks/community/']),
  // Aggregate pages are indexable only once at least one record is confirmed —
  // the same rule their `robots` meta uses, kept in step here.
  ...(parks.some(confirmed) ? [] : ['/dogs/dog-parks/']),
  ...(lodging.some((l) => l.petFee?.amount !== null) ? [] : ['/dogs/pet-fees/']),
  ...(places.some(confirmed) ? [] : ['/dogs/summer/']),
  ...(confirmed(surf.headline) ? [] : ['/surf-fishing/']),
  ...(confirmed(surf.permits) ? [] : ['/surf-fishing/permits/']),
  // The planner can only recommend what's been confirmed, so it stays out of
  // search until something, anywhere, has been.
  ...([...towns, ...parks, ...stateParks, ...communityParks, ...places].some(confirmed)
    ? []
    : ['/plan/']),
  ...(confirmed(placeOf('state-park-surf-fishing-beaches') ?? {}) ? [] : ['/dogs/state-parks/']),
];

// https://astro.build/config
export default defineConfig({
  site: 'https://delawarefieldguide.com',

  // Trailing-slash directory URLs: /dogs/rehoboth-beach/
  // This is THE URL structure decision. It is fixed. See README.
  build: { format: 'directory' },

  integrations: [
    sitemap({
      filter: (page) => !unverified.some((path) => page.endsWith(path)),
      serialize: (item) => ({ ...item, changefreq: undefined, priority: undefined }),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
