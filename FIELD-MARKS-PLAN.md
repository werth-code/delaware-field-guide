# Field Marks — launch plan

Source: playbook supplied Aug 8, 2026 ("Field Marks Sticker Launch, Site Placement,
SEO & Sales Playbook"). Operational detail preserved. Sits alongside
[MONETIZATION-PLAN.md](MONETIZATION-PLAN.md) and [SEO-PLAN.md](SEO-PLAN.md).

**Product:** *Field Marks — places you've actually been.* Place stickers tied to
Field Guide destination pages. The place is the product; the Field Guide is the maker.

---

## ✅ Built Aug 8 — and switched off

Everything on the site side exists and is **noindex** until stickers physically do.

| Piece | Where |
|---|---|
| Data + rules | `src/lib/field-marks.ts`, `src/data/field-marks.json` |
| Hub | `/field-marks/` |
| Product pages | `/field-marks/<slug>/` × 8 |
| Placement module | `src/components/FieldMarkModule.astro` |
| QR redirects | `/go/fm001/` … `/go/fm008/` → the **guide page**, not the shop |
| Footer link | "Field Marks" (not "Shop"), no nav item |
| Publish gate | mirrored in `astro.config.mjs` sitemap filter |
| Safety gate | `scripts/check-build.mjs` |

**Verified end to end:** flipping one record to `available` + priced + photographed
makes the module appear on exactly one page, indexes the product page, emits Product
schema and adds two sitemap URLs. Flipping it back withdraws all of it.

**Verified both safety locks:** the component refuses on its own; bypassing the
component makes the build fail with the offending page named.

### The three rules, in code not judgment
1. **Nothing publishes before it exists.** `isPublishableMark()` = available + priced + photographed.
2. **Whitelist placement, safety blocklist overrides.** Never on `/dogs/pond-safety/`, `/dogs/pet-fees/`, `/contacts/`. One module per page, lowest number wins.
3. **Every product page links back to its guide page.** `guide` is a required field.

---

## ◻ Yours, not mine

I can't do these, and shouldn't:

- **Artwork** — eight illustrations, one unified system (type, border logic, locality line, mark number, small DFG mark). Vary illustration and palette by place; keep the family recognizable.
- **Ordering** — StickerApp die-cut vinyl, gloss laminate, ~3in. **Verify pricing before ordering; the figures below are from Aug 8 research and move.**
- **Photography** — five shots per SKU: clean product, water bottle, cooler/gear, car, place context. Real photos, not mockups.
- **Wholesale** — samples in hand first; stickers are tactile and a PDF pitch won't land.
- **Checkout** — undecided, see below.

---

## ⚠ The blocker: there is no way to take money

Static Astro on GitHub Pages, no third-party JavaScript. That rule is what keeps
the no-trackers promise, and checkout is the one thing that can't be built around.

**Decision deferred Aug 8** — pages built with an honest "not made yet" state.
Options as they stood:

| Option | Cost |
|---|---|
| **Etsy, link out** | Zero JS, no PCI surface, doubles as discovery. Lose in-page cart + bundle pricing. |
| **Stripe Payment Links** | Still just a link, no script. Keeps the customer and the post-purchase question. Bundles need their own links. You'd set up Stripe; I never touch keys. |
| **Shopify / Snipcart embed** | Real cart and bundles as the playbook describes. Requires third-party JS — reverses the standing rule, adds their tracking. |

Whatever's chosen, `/go/fm###/` already gives first-party QR scan counts through
Cloudflare without a beacon, consistent with the analytics approach in
[MONETIZATION-PLAN.md](MONETIZATION-PLAN.md).

---

## The eight

| # | SKU | Place | Guide page | Tests |
|---|---|---|---|---|
| 001 | FM-001-CAPE | Cape Henlopen | `/parks/cape-henlopen/` | The anchor — highest visitation, widest overlap |
| 002 | FM-002-REHO | Rehoboth Beach | `/dogs/rehoboth-beach/` | Best-known town identity |
| 003 | FM-003-IRI | Indian River Inlet | `/parks/delaware-seashore/` | Named for the inlet, not the park — that's what people picture |
| 004 | FM-004-BETH | Bethany Beach | `/dogs/bethany-beach/` | Repeat-family identity |
| 005 | FM-005-DEWEY | Dewey Beach | `/dogs/dewey-beach/` | Bay/ocean duality; dog crossover |
| 006 | FM-006-LEWES | Lewes | `/dogs/lewes/` | "Delaware" stays in the title — Lewes is ambiguous |
| 007 | FM-007-WCC | White Clay Creek | `/parks/white-clay-creek/` | **Does inland convert like coastal?** |
| 008 | FM-008-DEWEYDOG | Dewey — The Dog Goes Too | `/dogs/dewey-beach/` | **Does the dog audience buy?** |

**No dates or hours on any sticker.** They change; a sticker can't be corrected.
Rules live on the site, which is what the QR is for.

**Not first:** individual dog parks (a dog park is somewhere you *use*, not somewhere
you *belong*), and the full 17-park line (don't manufacture 17 before knowing whether
stickers convert at all).

---

## Numbers

| | |
|---|---|
| First run | 50 × 6 designs = 300 |
| Manufacturing | ~$216 (~$0.72/unit) |
| Total test budget | **$275–$330. Don't exceed ~$350.** |
| Retail | $5 · any 3 $12 · six-pack $22 |
| Shipping | $1.50 flat, free over $15 |
| Wholesale | $2.50 (50% retailer margin) |
| Starter pack | 36 pieces / $90 (retail value $180) |

**Why 50 and not 100:** the first question isn't how cheaply stickers can be bought,
it's *which places people buy*. 50 shows the difference without trapping money in
weak SKUs.

---

## Copy rules

**Say:** Places you've actually been · Is this one of your places? · For the water
bottle that keeps ending up there too · A small mark for a place that keeps making
the weekend plan · You know the place. Now mark it · Going back? Check what's changed.

**Never:** Best Delaware stickers · Premium high-quality · Must-have souvenir ·
Ultimate gift · Show your Delaware pride · Collect them all.

Soft collection, not gamified obligation: *"There is no requirement to finish the
set. One place can matter enough."*

### SEO split
- **Editorial pages** rank for information intent (Cape Henlopen fees, dog rules).
- **Product pages** rank for purchase intent (Cape Henlopen sticker).
- Never blur them. Title formula `[Place] Sticker — Delaware Field Guide Field Mark`; H1 `[Place] Field Mark`.

---

## Placement rules (hard)

1. Never above the page's answer.
2. Never inside safety, legal, emergency or fee explanation. *(Enforced at build.)*
3. At most one primary module per editorial page. *(Enforced by `markFor()`.)*
4. Related-product grids at the bottom.
5. Product availability never changes editorial ranking.
6. Don't create merchandise for a place just to justify a module — the place earns a product because readers identify with it.

Homepage: **not** in the hero, low on the page. Dogs hub: one small module only.

---

## Legal

No official park logos, no state seals, no protected business marks, no implied
Delaware State Parks affiliation. Original or properly licensed artwork only.
Bethany's totem pole is a specific commissioned artwork — check before using it.
Where clarification is warranted: *"Designed by Delaware Field Guide. Not affiliated
with Delaware State Parks."*

---

## After 100–200 orders

Measure sales share by SKU · attachment (module clicks ÷ editorial pageviews) ·
conversion · bundle behavior (unique SKUs per order) · post-purchase place requests ·
wholesale SKU preference.

**Then decide the next collection:** the 17 parks if Cape outperforms towns and White
Clay converts; more beaches if the towns win; a "dog goes too" line across places if
008 beats 005.

### 90-day success signals
- 2–3 SKUs clearly stronger rather than random
- 25–35% of orders contain 2+ unique marks
- Editorial pages generate measurable product clicks
- 2 local retailers take test inventory
- Some buyers return for a new release

### First wholesale targets
Old Inlet Bait & Tackle (Indian River) · Atlantic Cycles (Cape/Rehoboth) · Dewey
Beach Watersports · Fur Baby Pet Resort (Dewey dog + beach assortment). Local assortments
beat forcing all six on every retailer: *"Stickers for the places your customers already visit."*

---

## The loop this is built around

Find a place → trust the guide → go there → attach to it → mark it → **the sticker
sends you back to the current guide.**

Commerce never interrupts the answer. It rewards attachment to the place.
