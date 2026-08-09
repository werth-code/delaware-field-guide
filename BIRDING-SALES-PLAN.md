# Birding sales strategy — plan

Source: document supplied Aug 9, 2026. Operational detail preserved. Reads with
[BIRDING-PLAN.md](BIRDING-PLAN.md), [FIELD-MARKS-PLAN.md](FIELD-MARKS-PLAN.md),
[MONETIZATION-PLAN.md](MONETIZATION-PLAN.md), [SEO-PLAN.md](SEO-PLAN.md).

**Core idea: a utility-first ladder, not a bird-themed store.**
Free content → free starter checklist (email) → $5 Field Marks → $9 digital guide →
$10–14 field card → affiliate gear → local sponsors → trip/lodging referrals →
Passport later.

**Two businesses inside one section.** *Destination birding* ("where should I go
today?") sells trip guides, Field Marks, optics, tours, lodging. *Backyard birding*
("how do I get more birds at home?") sells seed, feeders, natives, and local
retail sponsorship — and may produce more recurring revenue.

---

## The rule that governs all of it

> **The answer comes first. The product comes after it.**

Never between "is this bird here?" and the answer. Never inside conservation
warnings, nest guidance, seasonal closures, rare-bird ethics or wildlife emergency
information.

**Advertisers buy visibility. They do not buy** bird status, rarity classification,
rankings, hotspot inclusion, verification, recommendations, or species-location
disclosure.

*(This is already enforced in code — `SAFETY_PAGES` in `src/lib/field-marks.ts`
plus the build gate in `check-build.mjs`. Birding conservation pages must be added
to that list before any birding product module ships.)*

---

## Product ladder

| # | Product | Price | Status |
|---|---|---|---|
| 1 | Free Delaware Birding Starter Checklist → `/birding/start/` | free (email) | ◻ |
| 2 | Bird Field Marks, 4 designs | $5 · 3/$12 · 4/$16 | ◻ |
| 3 | *Delaware Birding — 12 Places Worth the Drive* → `/guides/delaware-birding/` | $9 (test before $12) | ◻ |
| 4 | *Bird Delaware by Season* field card | $10–14 | ◻ later |
| 5 | Birding Passport | $18–24 | ◻ much later |

### The four first bird Field Marks — 100-series

Numbering fits what's built: 001–099 places, **100–199 birds**, 200–299 later.

| # | SKU | Bird | Tests | eBird code |
|---|---|---|---|---|
| 101 | BFM-001-FLAM | **American Flamingo** | novelty, social reach, general public | `grefla2` ✅ on the DE list |
| 102 | BFM-002-RKNT | **Red Knot** | serious birding identity, Delaware Bay, conservation | `redkno` ✅ |
| 103 | BFM-003-PROW | **Prothonotary Warbler** | color, southern/inland specialty | `prowar` ✅ |
| 104 | BFM-004-BNST | **Black-necked Stilt** | Bombay Hook identity, photographers | `bknsti` ✅ |

All four verified present on Delaware's eBird list. *The Flamingo gets attention;
the Red Knot gives the collection credibility.*

**Second wave, only on demand:** Black Rail, American Avocet, Piping Plover (careful
conservation messaging), Snow Goose, American Oystercatcher, Short-eared Owl.

**Production:** 50 × 4 = 200 stickers, ~$144 printing, **~$190–225 total test.**
Verify StickerApp pricing immediately before ordering.

---

## Copy that carries the brand

**Deck for the bird series:** *Birds worth looking up.*

**Use:** "Yes, this happened." · "One of the birds that makes May worth the drive." ·
"The bathroom is at the visitor center. The bird may be a mile away. Know both." ·
"Sometimes the scope is worth carrying." · "For the bird that made you stop the car."

**Never:** *Perfect gift for bird lovers · Must-have birder accessory · Premium
birdwatching merchandise · Ultimate Delaware birding gift.*

**CTAs:** Get the Birding Guide · Get the Field Mark · See all Bird Field Marks ·
Visit the sponsor · See the binoculars · Plan the birding trip.
Not *Shop now*, *Buy now*, *Learn more*, *Click here*.

---

## Sponsors — one at a time, and not until the section looks real

| # | Prospect | Product | Price |
|---|---|---|---|
| 1 | **Wild Birds Unlimited Hockessin** — 7411 Lancaster Pike, 302-239-9071 | Founding Birding Partner | ask $750, close at $500 / 90d |
| 2 | **Gateway Garden Center** (after backyard/native content is live) | Backyard Habitat Partner | $400–600 / 90d |
| 3 | **Newark Camera Shop** (family-owned since 1935) | Bird Photography Partner | $400–600 / 90d |

Sponsor unit is labeled `SPONSOR`, factual, one line, one link. **Never** "Delaware's
best bird store" unless independently established and editorially chosen.

Delmarva Birding Weekends is a referral/experience partner, not a banner buyer.
Lodging comes only after traveling-birder traffic is visible.

---

## Affiliate — questions, not listicles

- `/birding/gear/binoculars/` — *"You do not need expensive binoculars to start."* 8× is enough; the real question is fast focus, steady hold, wide field.
- `/birding/gear/scope/` — *"Sometimes. Bombay Hook is why."* Far better than "Best Spotting Scopes 2026".
- `/birding/photography/` — supports the camera sponsor.

Commercial links appear **after** the explanation.

---

## SEO structure

| Route | Title | H1 |
|---|---|---|
| `/birding/` | Birding in Delaware — Where to Go, When & What to Know | Birding in Delaware |
| `/birding/birds/` | Birds of Delaware — 432 Accepted Species, Seasons & Where to Look | Birds recorded in Delaware |
| `/birding/places/` | Best Birding Places in Delaware — Refuges, Parks & Marshes | Where to bird in Delaware |
| `/birding/birds/worth-the-drive/` | Delaware Birds Worth Traveling For — Bucket-List & Rare Species | Birds worth the drive |
| `/birding/birds/american-flamingo/` | American Flamingo in Delaware — Yes, It Has Been Recorded | American Flamingo |
| `/birding/start/` | Birding for Beginners in Delaware — Free Starter Guide | Start with the bird you can actually see |
| `/birding/backyard/` | Backyard Birds in Delaware — Feeders, Native Plants & What to Expect | Bring the birds closer |

Seasonal: Spring migration (shorebirds/warblers) · Summer (breeding/coastal) ·
Fall (hawk watches) · Winter (snow geese, ducks, raptors).

**Structured data:** Product + Offer, price, currency, availability, image, brand,
SKU. **No fake ratings.**

**Alt text stays literal:** "American Flamingo Delaware Field Mark vinyl sticker",
not "best Delaware bird gift birder sticker wildlife gift".

---

## Page order (commerce never leads)

**Birding hub:** intro → start here → places → seasonal → worth the drive →
beginner → backyard → sponsor → Field Marks → guide → newsletter.

**Species page:** identity/status → season/habitat → occurrence → where to look →
sensitive-location guidance → sightings link → Field Mark → related.

**Place page:** why go → logistics → season → route → signature birds → eBird →
sponsor → product → nearby.

**Backyard page** may surface commerce earlier — the visitor is explicitly looking
for ways to create habitat.

---

## 90 days

**1–30** publish hub, birds list, places, Bombay Hook, Prime Hook, Cape Henlopen,
beginner, the four species pages, backyard; launch the free checklist.
**31–45** print 50 × 4; sell on site, email, social, Etsy.
**46–60** ship the $9 guide.
**61–75** approach WBU, Gateway, Newark Camera — one package each.
**76–90** measure.

**Then build more stickers if** 25%+ of orders contain multiple designs, two SKUs
need reorder, species pages convert, users request birds.

---

## Do not paywall

Bird status, destinations, access, closures, conservation information, beginner
guidance and current sources stay free. Products package or extend the utility;
they never withhold it.

> The useful information stays free on the Field Guide. These are the physical and
> downloadable things that make it easier to take the guide with you — or remember
> the bird afterward.

---

# What this plan needs before it can run

### 1. Two of its headline numbers need care

**"432 accepted species"** is correct **for the DOS state list** and the page must
say so by name. eBird's Delaware list is **460 species** (plus 28 hybrids). Both are
right; they answer different questions. Citing 432 while the site's own dataset says
460 without explaining the difference would be the kind of quiet contradiction the
build gates exist to catch.

**"American Flamingo added in 2025"** is a factual claim that becomes a *product
page headline and a sticker*. I have confirmed the species is on the eBird Delaware
list. **I have not confirmed the 2025 acceptance date.** That needs reading off the
DOS Bird Records Committee page before anything is printed — a sticker cannot be
corrected.

### 2. Season chips can only say what one refuge supports

Seasonality exists for **Bombay Hook only** — 267 species from the USFWS checklist.
Prime Hook's brochure parses at 3/14 accuracy and is not published. Cape Henlopen
has no checklist at all.

So a species page cannot yet carry "Spring · Fall" as a *Delaware* claim. It can
carry "Common at Bombay Hook in spring", which is arguably better and is what the
data actually supports.

### 3. Checkout is still unresolved
Same blocker as the place Field Marks. Static site, no server. See
[FIELD-MARKS-PLAN.md](FIELD-MARKS-PLAN.md).

### 4. Birding conservation pages must join the safety blocklist
`SAFETY_PAGES` currently covers pond safety, pet fees and contacts. Before any
birding product module ships, add the nesting-closure and sensitive-species routes —
the plan's own rule, enforced where it can't be forgotten.
