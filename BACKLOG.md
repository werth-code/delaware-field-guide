# Backlog

Deferred work, with the reasoning attached so a decision doesn't have to be
re-made from scratch. Nothing here is a commitment — it's what's been parked
and why.

---

## Revenue

### Donations — decided, not built

Accept donations. Noted 1 Aug 2026.

**Why it fits:** the thing this site sells is that someone actually calls the
City of Rehoboth and drives to Millsboro to photograph a broken fountain. That
is unfunded labour with no ad model behind it, and it's exactly the kind of
work a reader will chip in for once they've been saved a wasted trip. The ask
writes itself and doesn't require pretending to be something else.

**How, given the constraints:** static site, no backend, no custom form
endpoints. So a hosted link, not an integration:

| Option | Fit |
|---|---|
| **Stripe Payment Link** | Cleanest. A hosted URL, no backend, no platform branding, lowest fees. Probably the answer. |
| Buy Me a Coffee / Ko-fi | Fastest to stand up, recognisable, but takes a cut and puts someone else's brand on the ask. |
| GitHub Sponsors | Wrong audience entirely — dog owners at the beach don't have GitHub accounts. |
| PayPal.me | Works, looks dated next to the rest of this. |

**Placement:** not a banner and not a modal. The moment a reader feels the
value is *after* the answer — so the footer, plus a line at the end of a page
that just saved them a drive. It must never sit above an answer.

**The thing to get right — disclosure.** `/how-we-verify/` currently promises
"We don't take payment to change or soften a listing." Donations don't conflict
with that, but the page has to say so explicitly and unprompted: who can donate,
that it buys nothing, and that a donor's business gets no different treatment
than anyone else's. A verification site that quietly starts taking money is
worth less than one that never claimed independence. Write the disclosure
*before* the button goes live, not after.

**Open question:** whether to take donations from the local businesses in the
Werth Design prospect list. Probably not — the same money is worth more as a
client conversation, and a groomer's donation next to a groomer listing is a
conflict the site can't afford. Decide before launching, not when the first
one arrives.

### Also parked

- **Lodging affiliate** — Booking.com / VRBO. Applications not submitted. Worth
  roughly $120/booking versus $0.04/visitor for gear affiliate, so this is the
  one that matters. Gate: the pet-fee page needs the twelve calls first, because
  the fees are what earns the click.
- **Display ads** — ruled out in the spec and still ruled out. Pennies, and they
  look cheap to the businesses being pitched.

---

## Content not yet written

- `/dogs/the-drive/` — rest stops by origin city. Smyrna Rest Area is the hero
  and is genuinely uncontested from the Delaware side; i95fun.com covers the
  interstate, nobody covers the Route 1 / US-13 / Bay Bridge approaches.
- `/dogs/rainy-day/` — self-serve washes, covered patios, Salty Paws. Highest
  value-to-effort ratio in the research: a parent with a wet dog and two kids at
  8am on a rainy Tuesday is the most panicked, least-served moment in the whole
  journey.
- `/dogs/no-dog-park-in-rehoboth/` — a query with no correct answer today.
- Cape May–Lewes Ferry — dogs ride free, no paperwork. Nobody on the Delaware
  side has written it, and it turns two states into one dog itinerary.

## Product

- **The date checker** on `/dogs/` — the one interactive piece, and the only
  place React gets added. All the date logic already exists in `src/lib/rules.ts`
  including the floating-holiday anchors, so this is UI over solved logic.
  Must render a usable static list with JS off.
- **Sortable fee table** on `/dogs/pet-fees/` — blocked on the twelve calls.

## Operations

- **Beehiiv publication** — set `PUBLIC_BEEHIIV_EMBED_URL` as a repo variable.
- **Formspree endpoint** for field reports — set `PUBLIC_REPORT_ENDPOINT`.
- **Cloudflare DNS** — the only thing between this and being live. See README.
- **Search Console + Bing Webmaster** — submit once DNS resolves.
**Every outstanding call is now generated into [`CALL-SHEET.md`](CALL-SHEET.md) by `npm run calls`** — ordered by consequence, ticked off by verifying the record rather than editing the file.

- **Verify every emergency number in `src/data/emergency.json`.** Highest-priority
  call list on the site: a stale vet number is the one error here that does real
  harm. Also missing: Lewes and Fenwick police non-emergency lines, the Delaware
  SPCA Sussex intake number, and Rehoboth Beach Animal Hospital's number and
  actual urgent-care hours. Re-check all vet hours each season.

## Event leads from the Wilmington visitor guide

Read from the Greater Wilmington & Brandywine Valley Visitors Guide 2026/27
(Today Media Custom Communications, digital edition, pages 30–32) on
8 August 2026.

**None of this is a source and none of it can be published as read.** It is a
visitor bureau's promotional guide — an aggregator, and the front of the book
says so itself: "Information in this publication is as accurate as possible at
press time but is subject to change. Please call ahead to verify information
before traveling." It also lists months and never dates. So it is worth exactly
one thing, which is knowing what exists. Every one of these has to be taken to
the organizer's own page or phone before a word of it goes on the site, the
same way Arden and Rockwood were.

Three from this list are already done: the Ice Cream Festival, the Arden Fair,
and the Brandywine Festival of the Arts — which turned out to be the second
event on the site whose organizer publishes a rule rather than a date.

Ranked by how well they fit a guide about being outdoors in Delaware:

- **Separation Day**, New Castle, June. Delaware's own state holiday, with
  fireworks over the river. The most obviously in-scope thing on the list.
- **Wilmington Flower Market**, May. Rides, a beer garden, and it raises money
  for children's charities.
- **Ladybug Festival**, Wilmington, May. Free, outdoors, all female-fronted
  music.
- **Art on the Green**, New Castle, September. Over 200 artists in Battery
  Park — a park this site already covers.
- **Wildflower Weekend at Mt. Cuba**, April. Three days, native spring flowers
  at peak bloom.
- **Delaware Marathon Running Festival**, Wilmington, April. The first 13 miles
  run through Brandywine Park.
- **Delaware Saengerbund Oktoberfest**, Newark, September.
- **Hagley Car Show** (September) and **Hagley Craft Fair** (October).
- **Historic Odessa Brewfest**, September.
- **Delaware Shakespeare Summer Festival**, July — at Rockwood Park, which is
  already a record here.
- **Holidays in Odessa**, **Noel at Nemours**, **A Longwood Christmas**,
  **A Brandywine Christmas**, November–January. Indoor and ticketed; these
  belong to /indoors/ more than to /events/ if they land anywhere.
- Food and drink, lowest priority and possibly out of scope entirely: Celebrity
  Chefs Brunch, City Restaurant Week, Brandywine Valley Restaurant Week,
  Downtown Newark Food and Brew Fest, Belgian Beer Fest, Clifford Brown Jazz
  Festival, Holy Trinity Greek Festival, St. Anthony's Italian Festival,
  Artisan Market at Winterthur, Wilmington Grand Prix.

## Photographs the indoors section still needs

Eight of the twelve images in the August 2026 batch went up. Four did not, and
the reason is worth keeping: they were labelled "representative" in the
attribution file, and on this site a photograph is a claim.

- **New Castle County Libraries**, **Kent County Libraries** and **Sussex
  County Libraries** were all the same building — Briarcliff Manor Public
  Library, in New York. Three records, one library, none of them in Delaware.
- **Johnson Victrola Museum** was a 1920 Victrola photographed at the Kanazawa
  Phonograph Museum in Japan.

All four are correctly licensed and could legally have gone up. That isn't the
problem. A picture on a record says "this is what this place looks like", and
three library records showing a library in another state would be the same
class of error as the file I once captioned as the Ninja Fit course when it was
a picture of a pavilion.

What would fix it: a photograph of any actual Delaware branch, and one of the
Victrola museum's own gallery or its building on S. New Street. The museum is
shut for renovation until October 2026, so its exterior is the realistic one
for now.
