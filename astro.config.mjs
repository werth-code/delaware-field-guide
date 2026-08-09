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
const events = read('./src/data/events.json');
const communityParks = read('./src/data/community-parks.json');
const surf = read('./src/data/surf-fishing.json');
const lodging = read('./src/data/lodging.json').filter((l) => typeof l.name === 'string');
const fieldMarks = read('./src/data/field-marks.json');

/*
 * Mirrors tierOf() in src/lib/verification.ts. A record publishes if it was
 * confirmed first-hand OR read from a named primary source. Records whose only
 * origin is an aggregator stay out of the sitemap, same as they stay noindex.
 */
const confirmed = (r) =>
  Boolean((r.verifiedDate && r.verifiedSource) || (r.sources?.length && r.sourcedOn));
const placeOf = (slug) => places.find((p) => p.slug === slug);

const unverified = [
  ...events.filter((e) => !confirmed(e)).map((e) => `/events/${e.slug}/`),
  ...(events.some(confirmed) ? [] : ['/events/']),
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

  /*
   * Field Marks. Mirrors isPublishableMark() in src/lib/field-marks.ts: a
   * sticker is indexable only once it is priced, in stock and photographed.
   * Right now that is none of them, so the whole section stays out — including
   * the hub, because a collection page for a collection that doesn't exist is
   * the merchandise version of publishing an unchecked fact.
   */
  ...fieldMarks
    .filter((m) => !(m.status === 'available' && m.price !== null && m.photos?.length))
    .map((m) => `/field-marks/${m.slug}/`),
  ...(fieldMarks.some((m) => m.status === 'available' && m.price !== null && m.photos?.length)
    ? []
    : ['/field-marks/']),
];

// https://astro.build/config
export default defineConfig({
  site: 'https://delawarefieldguide.com',

  // Trailing-slash directory URLs: /dogs/rehoboth-beach/
  // This is THE URL structure decision. It is fixed. See README.
  build: { format: 'directory' },

  // /map/ existed for one afternoon before the map moved onto /ask/, which is
  // now the one page for "where should I go". Redirecting rather than deleting,
  // because a URL that has been public at all may have been linked, and a 404
  // is a worse answer than the page the visitor actually wanted.
  // Two pages that have been public and must not 404 for anyone holding a
  // link: the map folded into /ask/, and /how-we-verify/ came down with its
  // two irreplaceable parts — the corrections anchor and the AI disclosure —
  // moved onto /about/.
  //
  // THE OLD /good-for/ SLUGS.
  //
  // These ten were public, got indexed, and then 404'd for months after the
  // section was deleted in favour of filter chips on the listings. The chips
  // were the wrong replacement — a filter is for someone who has already
  // arrived, and these URLs are what people type before they arrive — so the
  // section is back, rebuilt from confirmed facts.
  //
  // The new slugs are written for what people search rather than for the
  // internal field name, so every old one needs a home. Where an intent
  // survived it goes to its successor; where it didn't, it goes to the listing
  // that can actually answer it. Nothing gets swept to the homepage, which is
  // the redirect that tells a visitor their link was worthless.
  redirects: {
    '/map/': '/ask/',
    '/how-we-verify/': '/about/',

    // Survived, renamed.
    '/good-for/shade-in-august/': '/good-for/shade/',
    '/good-for/stroller-friendly/': '/good-for/toddlers/',
    '/good-for/restrooms-that-exist/': '/good-for/playground-restrooms/',

    // No successor intent. Sent to the page holding those facts.
    '/good-for/lifeguards-on-duty/': '/parks/',
    '/good-for/stay-the-night/': '/parks/',
    '/good-for/get-on-the-water/': '/parks/',
    '/good-for/fish-from-the-beach/': '/surf-fishing/',
    '/good-for/burn-off-an-hour/': '/parks/community/',
    '/good-for/somewhere-to-sit/': '/parks/community/',
    '/good-for/water-you-can-drink/': '/parks/community/',

    // FIELD MARK QR CODES.
    //
    // The QR on a sticker's backing card points here, and here forwards to the
    // guide page for that place — NOT to the product page. Whoever scans it
    // already bought the sticker; selling it to them again is the most obvious
    // possible misread of why they scanned.
    //
    // Indirection is the point: the printed card can never be edited, so the
    // destination has to be changeable. If a park page moves, this line moves.
    '/go/fm001/': '/parks/cape-henlopen/',
    '/go/fm002/': '/dogs/rehoboth-beach/',
    '/go/fm003/': '/parks/delaware-seashore/',
    '/go/fm004/': '/dogs/bethany-beach/',
    '/go/fm005/': '/dogs/dewey-beach/',
    '/go/fm006/': '/dogs/lewes/',
    '/go/fm007/': '/parks/white-clay-creek/',
    '/go/fm008/': '/dogs/dewey-beach/',
  },

  integrations: [
    sitemap({
      filter: (page) =>
        !unverified.some((path) => page.endsWith(path)) &&
        /* Submission outcome pages. They exist so a no-JavaScript form post has
           somewhere to land, and they are noindex — listing them would be the
           same contradiction the build check exists to catch. */
        !/\/report\/(thanks|problem)\/$/.test(page),
      serialize: (item) => ({ ...item, changefreq: undefined, priority: undefined }),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
