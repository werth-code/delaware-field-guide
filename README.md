# delawarefieldguide.com

**Repo:** https://github.com/werth-code/delaware-field-guide
**Deploy:** GitHub Actions → GitHub Pages, green. Rebuilds daily at 07:10 UTC.

> **Not reachable yet.** `public/CNAME` claims `delawarefieldguide.com` and
> `astro.config.mjs` has no `base` path, because this is an apex domain and not
> a project subpath. That's correct for production and it means the
> `werth-code.github.io/delaware-field-guide/` URL serves the home page but
> 404s on every internal link. **Point Cloudflare DNS and it goes live** — see
> Deploy below. Until then, `npm run dev` is the preview.

Reference site for outdoor Delaware. First section is dogs. Nine more sections planned — built so a
second section drops in without refactoring.

**The site's job:** answer "can my dog be here, on this date, and what does it cost" faster and more
accurately than anyone else. It is a reference tool, not a blog.

---

## URL structure — DECIDED, do not revisit

This is the one decision that is genuinely painful to change after indexing. It was made on
1 August 2026 and is recorded here so it doesn't get relitigated.

**Section folders, trailing slash, lowercase, hyphens. Section is always the first folder.**

```
/                              home
/dogs/                         section hub + date checker
/dogs/rehoboth-beach/          town pages
/dogs/state-parks/
/dogs/summer/
/dogs/pond-safety/
/dogs/pet-fees/
/dogs/dog-parks/               index
/dogs/dog-parks/[slug]/
/dogs/the-drive/
/dogs/rainy-day/
/how-we-verify/
```

Future sections are `/surf-fishing/`, `/crabbing/`, etc. Flat URLs would strangle this at ten
sections. `build.format: 'directory'` in `astro.config.mjs` is what produces the trailing slashes —
don't change it.

---

## The verification gate

The site's whole differentiator is that every fact carries a date and a source. That promise is
worthless if it depends on remembering to keep it, so it is enforced by the build rather than by
discipline. In `src/lib/verification.ts`:

- A record with `verifiedDate: null` **or** `verifiedSource: null` is unverified.
- An unverified page **cannot** render a verification stamp. There is no override.
- An unverified page is automatically `noindex, nofollow`, is excluded from `sitemap.xml`
  (see `astro.config.mjs`), emits no JSON-LD, and is hidden from the section list on `/dogs/`.
- Instead it renders a loud red block listing exactly what's outstanding and who to call.

**To publish a page: confirm the facts, then fill in `verifiedDate` and `verifiedSource` in the
JSON.** That is the whole publishing step. Nothing else to remember.

Two other build-time gates:

- **The 40-word answer.** `assertAnswerLength()` fails the build if any page's `answer` exceeds 40
  words. Cut the answer; do not raise the limit. That paragraph is what an AI assistant extracts and
  what a person reads on a phone in the sun.
- **`null` renders as "not confirmed"**, never as "no". An empty field on a park means we haven't
  checked it, not that the park lacks the thing.

---

## Stack

Astro (static), Tailwind v4, TypeScript. No backend, no database, no CMS, no React yet.

React gets added for exactly one thing — the date checker on `/dogs/` — and nothing else. Don't add
a UI kit, an animation library, or analytics beyond Cloudflare + Search Console.

### Local development

**The `node` on `PATH` is v12 and cannot run Astro.** Use the Homebrew node@26:

```bash
export PATH="/usr/local/opt/node@26/bin:$PATH" && cd ~/delaware-field-guide && npm run dev
```

The `npm` shim at `/usr/local/opt/node@26/bin/npm` resolves to system node unless node@26 is first
on `PATH` — prefixing `PATH` is what fixes it, not calling the binary by absolute path.

| Command | Does |
|---|---|
| `npm run dev` | Dev server on :4321 |
| `npm run build` | Static build to `dist/`, runs the verification and 40-word gates |
| `npm run preview` | Serve `dist/` |

`.claude/launch.json` runs the dev server on :8250 with the correct node.

---

## Data

All content lives in `src/data/` as JSON. Pages render from it. **Never hardcode a fact in a
template.**

| File | Holds | State |
|---|---|---|
| `towns.json` | Beach/boardwalk rules by town | Rehoboth drafted, unverified |
| `parks.json` | The 17 dog parks, seven fields each | Seeded from research, unverified |
| `lodging.json` | Review-confirmed dog-friendly properties | Seeded, pet fees not yet called |

`parks.json` and `lodging.json` are **call sheets**, not content. They carry the research-derived
draft values plus an `outstanding` list per record, so the week-2 phone calls are fill-in-the-blank.
Nothing in them renders anywhere yet.

### Adding a town (week 3)

Append a record to `src/data/towns.json`. That's it — `src/pages/dogs/[slug].astro` renders every
town through one template. Four more towns is four data records and zero new markup.

---

## Design — "Posted Notice"

Vernacular is **beach warning flags** and **state park signage**. Field guide, not puppy blog.
Explicitly not the cream / high-contrast-serif / terracotta look — that reads as templated, and the
whole competing category is soft pastels and golden retrievers in sun flare. Looking sober is a
credibility claim here.

The site is a public notice board, not a page. Content sits on enameled sign panels — hard 1px
edge, 2px radius, a hairline drop rule, never a blur — mounted on paper-grain ground. Type is set
like a routed park sign. Dates are rubber-stamped like a permit. The visual claim is "someone is
accountable for this," which is the same claim the content makes.

### Type

| Role | Face | Why |
|---|---|---|
| Body | **Public Sans** | The U.S. Web Design System face — what federal agencies set their own notices in. Exactly the register this site argues for, at no cost to legibility. |
| Display | **Zilla Slab** | Clarendon-adjacent; the slab lineage park and roadway signage actually descends from. |
| Mono | **IBM Plex Mono** | Stamps, dates, tabular data. Does the real work on the "reference document, not blog" claim. |

All self-hosted via `@fontsource`. No Google Fonts request.

### Status is encoded four ways

**Colour + icon + word + bar texture.** The flag bar is `bar-solid` when dogs are allowed,
`bar-dashed` when restricted, `bar-hazard` (diagonal stripes) when prohibited. Three of the four
channels survive grayscale and the fourth survives a bad screen in glare. Verified by actually
grayscaling the page, not by intending to. Roughly 1 in 12 men has a colour vision deficiency and
this audience skews that way.

**Flag colours appear only in status contexts.** Never in headers, links, or decoration. If it's
flag-coloured, it means something.

Two of the three flags fail 7:1 with text on them, so each has a `-bearing` variant used only as a
background behind text. The canonical hex stays the identity colour and is used for the bar, which
carries no text. See the comment block at the top of `src/styles/global.css`.

### Reading conditions drive everything

A phone, outdoors, bright sun, one-handed while holding a leash, in a hurry.

- 19px base, 1.6 line-height
- **7:1 minimum on body text** — audited across all 91 text nodes on the Rehoboth page, zero below
- No light gray on white, ever
- Tap targets ≥44px on standalone controls (`.tap`)
- **No entrance animation anywhere.** Someone opening this page wants to know if they can walk the
  dog in the next ten minutes; fading the answer in is an insult. Motion is confined to
  interaction, is under 150ms, and is removed on `prefers-reduced-motion`.
- No hero video, no carousel, no cookie banner, no dark mode in v1

### Composition

One column, one left edge — header, band, and prose all align. `.breakout` is the only deviation:
on ≥68rem, rule tables and stamps extend 3.5rem past the measure on both sides. Prose wants 64ch; a
schedule wants room, and the asymmetry stops the page reading as one undifferentiated column.

---

## Deploy — Cloudflare + GitHub Pages

1. `public/CNAME` contains `delawarefieldguide.com` ✅
2. `.github/workflows/deploy.yml` uses `withastro/action` + `actions/deploy-pages` ✅
   (pinned to Node 22 — the action defaults to 20 and Astro 7 needs ≥22.12)
3. Repo → Settings → Pages → Source: **GitHub Actions** ✅, HTTPS enforced ✅
4. **Remaining: Cloudflare DNS.** Four apex `A` records, plus `www`:

   ```
   A     @      185.199.108.153
   A     @      185.199.109.153
   A     @      185.199.110.153
   A     @      185.199.111.153
   CNAME www    werth-code.github.io
   ```

   Set these **DNS-only (grey cloud) first**. Let GitHub issue its certificate —
   Settings → Pages will show the custom domain going green — and only then turn
   the proxy orange.

### Gotchas that cost an afternoon

- **Cloudflare SSL/TLS must be Full (strict).** "Flexible" causes an infinite redirect loop with
  GitHub Pages. This is the single most common failure in this setup.
- Let GitHub Pages issue its certificate **before** turning the Cloudflare proxy orange.
- Cloudflare serves stale HTML after a deploy — purge on deploy, or add a cache rule bypassing cache
  for `*.html`. Hash-named assets can cache hard.
- Turn **off** Auto Minify and Rocket Loader; they break hydration on the date checker.

GitHub Pages can't do redirects or custom headers — use Cloudflare Bulk Redirects and Transform
Rules. Keep `robots.txt`, `llms.txt` and the sitemap as static files in `public/`.

### The daily rebuild is not optional

Status bands resolve "today" at build time. The workflow runs on a `07:10 UTC` cron for exactly this
reason — without it, every page's flag freezes on the date of the last commit. The band always
prints "as of {date}" so a stale build reads as out-of-date rather than as wrong.

---

## Email capture

Beehiiv embed, same provider used elsewhere. GitHub Pages can't handle form posts and we are not
building a custom endpoint.

Set `PUBLIC_BEEHIIV_EMBED_URL` — in `.env` locally, and as a **repository variable** for CI (the
workflow already passes it through). Until it's set, the footer renders a labelled placeholder
rather than a form that silently drops addresses.

---

## SEO / GEO

- `Article` on every page; `FAQPage` where there are Q&A blocks; `Place` on parks; `Table` on the
  fee page. Unverified pages emit **no** schema — don't hand a crawler structured data for something
  you've told it not to index.
- `robots.txt` explicitly allows GPTBot, PerplexityBot, ClaudeBot, Google-Extended, CCBot and the
  rest. Deliberate: for a new domain with no authority, citation is worth more than the click.
- `llms.txt` at root, stating the verification convention so a model knows how to weight the facts.
- Per page: unique title and description, canonical, OG tags, `dateModified` matching the
  verification date.

Expected timing: Perplexity days, ChatGPT/Bing 1–3 weeks, Google AI Overviews 4–8 weeks. That's why
the ship date matters more than the page count.

---

## Voice

Plainspoken, specific, a little dry. Match how the audience writes: *pup*, *off-season*, *fenced*,
*double-gated*, *recall*, *reactive*.

**Banned:** pawsome, tail-wagging, fur-ever, waggin', fetch-ing, any alliterative dog pun. The entire
competing category runs on these. Not using them is the positioning.

Errors and empty states give direction, not mood.

---

## Parked

See [`BACKLOG.md`](BACKLOG.md) for deferred work and the reasoning behind it —
donations, the lodging affiliate, the date checker, and the pages not yet
written.

---

## Do not build

Mobile app · user accounts · user reviews · comments · a map from scratch · a live water-quality
tracker (link to DNREC — don't own that liability) · display ads · custom form endpoints · a CMS ·
dark mode in v1.

---

## Definition of done, per page

- [ ] Question-shaped H1
- [ ] Answer in the first 40 words (build-enforced)
- [ ] Status band renders correctly for today
- [ ] Every fact traces to a `verifiedDate` + `verifiedSource`
- [ ] Schema validates
- [ ] Lighthouse: performance ≥ 95, accessibility 100
- [ ] Legible on a phone in sunlight
- [ ] Status readable in grayscale
- [ ] Internally linked from at least two other pages
