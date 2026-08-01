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
const towns = JSON.parse(
  readFileSync(fileURLToPath(new URL('./src/data/towns.json', import.meta.url)), 'utf8'),
);
const unverified = towns
  .filter((t) => t.verifiedDate === null || t.verifiedSource === null)
  .map((t) => `/dogs/${t.slug}/`);

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
