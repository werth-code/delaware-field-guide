# Birding vertical — plan

Source: research document supplied Aug 8, 2026. Operational detail preserved.
Read with [SEO-PLAN.md](SEO-PLAN.md), [MONETIZATION-PLAN.md](MONETIZATION-PLAN.md),
[FIELD-MARKS-PLAN.md](FIELD-MARKS-PLAN.md).

**Verdict: build it.** Birding is the best-matched vertical proposed so far, for one
reason the others don't share — *the reader buys equipment in order to do the activity
better*. A dog-beach visitor might buy a hotel room. A park visitor often buys nothing.
A birder buys binoculars, a scope, a camera, a tripod, seed, feeders, native plants, a
guided trip. That makes it commercially valuable at a much smaller audience size.

Market context: USFWS puts US birders at **96 million** (16+), ~91M backyard, ~43M
traveling, **$107.6bn** total spend of which ~$14bn is trip-related.

---

## ✅ Built Aug 9

| Piece | Where |
|---|---|
| Data model + conservation guard | `src/lib/birding.ts` |
| New-site records | `src/data/birding-sites.json` |
| Birding block on existing records | `state-parks.json`, `indoor.json` |
| Hub | `/birding/` |
| Site pages | `/birding/bombay-hook/`, `/birding/prime-hook/` |
| Nav | Days out → Birding |

**Live count: 7 of 27 trail sites.** Two new refuge pages + five existing records
given a birding block (Cape Henlopen, White Clay Creek, Brandywine Creek, Trap Pond,
Ashland). The hub names the twenty it hasn't done.

### The architecture decision
**Birding is a lens over places, not a second set of places.** 11 of the 27 trail
sites already had records. A place keeps one record; birding notes attach to it. Only
refuges and wildlife areas get their own pages. This is the Banning lesson —
one fact in two files eventually disagrees.

### The conservation guard
A site flagged `sensitive: true` **cannot carry site-precision coordinates** — the
build throws with the slug named. Verified by pinning Prime Hook and watching it fail.
Managers withhold nest and roost locations on purpose; this site doesn't overrule that
to win a search result.

### Facts worth having that were found in the sourcing
- **Bombay Hook closes every road and trail on 9 Oct, 13 Nov and 16 Dec 2026** for refuge hunts. Visitor center stays open.
- **Prime Hook's Fowler Beach is shut until 1 Oct 2026** for piping plovers and least terns.
- **Prime Hook's canoe trail is silted east** — the refuge says go west from Foord's Landing only.
- Both entrance fees: **unconfirmed.** Bombay Hook's own fees page 404s.

---

## ◻ Next content, in order

1. `/birding/beginners/` — *"Start with the bird you can actually see."* The doc rates this 10/10 on audience, SEO, monetization and brand fit, and it's the biggest information gap. Experts already have eBird and the clubs; a curious resident searching "where can I go see birds" has nobody.
2. `/birding/backyard/` — the largest commercial audience (~91M nationally) and the sponsor magnet.
3. Seasonal: `/birding/spring-shorebirds/` (red knots + horseshoe crabs), `/birding/snow-geese/`, `/birding/hawk-watch/`.
4. `/birding/wilmington/` — Ashland, Brandywine, White Clay, DEEC.
5. More trail sites: Slaughter Beach, Little Creek, DEEC/Peterson, Fort Delaware heronry, Woodland Beach, Assawoman, Great Cypress Swamp.

**Do not build a species encyclopedia.** The doc scores it *"do not build"* and it's right — eBird and Merlin own it, and it's the one thing here with no Field Guide angle.

### Per-site fields still to fill
Habitat · best season · best time of day · fee · hours · parking · restrooms ·
accessible · trail surface · observation structures · scope? · from car? · beginner? ·
kids? · seasonal closure · hunting impact · dogs · eBird link · last checked.

---

## Monetization

Sequenced **after** content, per the doc's own Phase 1.

| # | Prospect | Product | Test price |
|---|---|---|---|
| 1 | **Wild Birds Unlimited, Hockessin** — 7411 Lancaster Pike, 302-239-9071 | Founding Birding Partner | $500–750 / 90d |
| 2 | **Gateway Garden Center**, Hockessin | Backyard Habitat Partner (native plants) | $400–600 / 90d |
| 3 | **Newark Camera Shop** (family-owned since 1935) | Bird Photography Partner | $400–600 / 90d |
| 4 | **Delmarva Birding Weekends** | Referral / experience partner, not a banner buyer | — |

**Partners, not advertisers:** Delaware Audubon, Delaware Ornithological Society,
Delaware Nature Society, USFWS, DNREC, tourism bodies. Link prominently, don't pitch.

**Affiliate:** binoculars (authorities favor 7× or 8× for beginners — brightness and
field of view), scope-or-not-by-location, harness, tripod, repellent, notebook.
Rule: *gear is recommended because it solves the trip, not because the commission is higher.*

**Products:** $9–12 Delaware Birding Quick Guide (a trip guide, not a species guide) ·
seasonal pocket checklist · Birding Passport later · Birding Field Marks (Bombay Hook,
Cape Henlopen) **only after ordinary Field Marks have real sales data.**

### Never monetize
No sponsor inside nesting closures, ethical-birding warnings, threatened-species
notices or emergency wildlife guidance. No "verified hotspot" badges, no paid rankings,
no sponsored species reports. **Sponsor buys visibility, not truth.**

---

## Voice

> Bring binoculars. A scope helps here, but you don't need one to make the drive worthwhile.

> This is one of the rare Delaware outings that works better from the car.

> May is the reason to come. The mosquitoes are the reason to bring repellent.

Never: *"Embark on an unforgettable avian adventure through Delaware's breathtaking ecosystems."*

**Never promise a species.** "Look for" and "most associated with" — not "you will see."

---

## The product rule, internal only

**eBird tells you what people saw. The Field Guide tells you whether the trip works.**

Don't use it as a public comparison. Use it to decide what goes on a page.
