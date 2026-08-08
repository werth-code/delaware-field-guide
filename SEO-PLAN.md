# SEO plan — reference

Source: research document supplied Aug 8, 2026 ("Exact SEO Writing Updates: Keyword
Balance + Human Readability"). Saved with all operational detail — titles, metas,
H1s, openings, templates, checklists. Read with [AUDIT-PLAN.md](AUDIT-PLAN.md) and
[MONETIZATION-PLAN.md](MONETIZATION-PLAN.md).

**Status note (Aug 8):** its Priority-1 list overlaps heavily with audit work
already shipped. Current state of each is marked ✅ / ◻ below.

---

## The core rule

> **One clear search intent in the title → one clear answer near the top → normal
> Field Guide writing underneath.**

No keyword-density target. No counting phrase repetitions. Google's own guidance:
titles clear/concise/unique, no stuffing or boilerplate, descriptive anchor text,
no need for per-query-variation pages, no ideal page length.

- Title: primary search topic, **once**.
- H1: may be brand voice when the title supplies the query. Don't force them equal.
- First 100 words: what the page is · Delaware/town/county · the direct answer ·
  2–4 decision details.
- H2s: actual follow-up questions.
- Body: normal writing. Synonyms are fine and understood (fee/admission,
  restroom/bathroom, dog-friendly/dogs allowed, kids/children).

### The model, twice

| | Disc golf | Dog parks |
|---|---|---|
| **Title** | Delaware Disc Golf Courses — All 9 & What Entry Costs | Delaware Dog Parks — Fencing, Water, Shade, Restrooms & Fees |
| **H1** | The round is free. The gate isn't. | Delaware dog parks and off-leash areas |
| **Open** | 9 courses in public parks, 7 in state parks. Free at all nine, but 7 sit behind a park entrance fee. | Fenced? Small-dog area? Water? Shade? Surface? Restrooms? Fee? Hours? Those eight details decide whether it's worth the drive. |

---

## Priority 1 — factual trust fixes (SEO makes errors more visible)

| Fix | Status |
|---|---|
| 1. Winterthur admission — adult $29, senior/student $27, child 3–12 $12, under-2 free, valid 2 consecutive days, Museums for All $2 for SNAP up to 4 people | ✅ shipped (add the 2-day validity + Museums for All detail) |
| 2. Homepage/Indoors counts from one source | ✅ shipped — now 12 and 2, via `isIndoors()` |
| 3. Dog-parks intro says 8 fields, names 7 | ✅ already fixed earlier |
| 4. Disc-golf `including7` + "0 hole counts confirmed" | ✅ typo fixed. The 0 is **correct** — it means 0 *confirmed-tier*; counts came from state PDFs (`sourced`). Needs clearer labeling, not a new number. Move the long postmortem to /changed/. ◻ |
| 5. **Rehoboth Beach Animal Hospital publishes urgent care** Mon–Fri curbside, Mon–Thu 8am–6:30pm, Fri 8am–5:30pm, closed weekends | ✅ shipped — I had read the wrong domain |
| 6. Attribute the 24/7 claim to BluePearl rather than asserting a statewide negative | ◻ **blocked** — bluepearlvet.com 403s me. Headline stays held back. This is the right shape when it verifies. |
| 7. Lewes "rule under review" is 8 months old — call the city, drop it from the title | ◻ needs your call: **302-645-7777** |
| 8. Dogs hub "Coming" for live pages | ✅ shipped |
| 9. Banning dog-park conflict across datasets | ◻ |
| 10. Kesselring duplicate locality | ✅ shipped (data was the cause, not the formatter) |
| 11. Homepage eyebrow "outdoor Delaware" → "A practical reference for Delaware" | ◻ |
| 12. About photography claim | ✅ shipped |
| 13. Nearby population claim | ✅ shipped |
| 14. Attractions category definition too rigid for Ashland | ◻ |
| 15. Pet-fees internal research language | ◻ — note it is **already** `noindex, nofollow` and out of the sitemap; the copy still needs cleaning |

---

## Page-by-page

### Homepage
- **Title:** Delaware Field Guide — Dog Rules, Parks & Things to Do
- **H1:** keep *Find the right place in Delaware*
- **Eyebrow:** A practical reference for Delaware
- **Meta:** Current Delaware dog rules, parks, indoor places, surf fishing, events and local drinks. Check hours, fees, restrooms and sources before you drive.
- **Opening:** "Looking for somewhere to take the dog, a park with a restroom and playground, or an indoor place when it rains? Delaware Field Guide checks the details that decide whether the trip works: current dog rules, hours, entrance fees, parking and useful facilities. / Each factual listing shows when I checked it and where the answer came from, so you can see how old the information is before you drive on it."
- Card labels: Indoors → "Indoor things to do when the weather changes…"; Places to go → "Zoos, nature centers and other Delaware attractions…"; Wine and beer → **Beer, wine, cider & mead**

### Ask
- **Title:** Ask Delaware Field Guide — Find Parks, Dog Rules & Days Out
- **H1:** Ask what you need
- **Opening:** "Describe the Delaware outing you need in normal language… Ask searches the Field Guide's checked data and shows the places that match. / If a fact has not been checked, the answer should say so."
- **Examples:** Can I take the dog to Dewey Beach in July? · Indoor things to do with kids near Wilmington · A playground with restrooms · A fenced dog park near Wilmington · A free place to take a 3-year-old on a hot day · A Delaware park with shade and a bathroom

### Dogs hub
- **Title:** Dog-Friendly Beaches in Delaware — 2026 Rules by Town
- **H1:** Delaware beach dog rules, by town — then keep *Five towns. Twenty-five miles of coast.* as deck
- **Meta:** Compare 2026 dog rules for Rehoboth, Dewey, Bethany, Lewes and Fenwick Island. See today's status, summer dates, hours, leash rules and licenses.

### Beach-town pages

| Page | Title | Answer |
|---|---|---|
| Rehoboth | Can Dogs Go on Rehoboth Beach? 2026 Rules & Dates | Banned beach + boardwalk **May 15 – Sept 15**; leashed rest of year. Dates changed Jan 2026; older pages show May 1 – Sept 30. |
| Dewey | Can Dogs Go on Dewey Beach? 2026 Hours & Dog License | Year-round. Memorial Day weekend→Sunday after Labor Day: before 9:30am, after 5:30pm. **Town license required, visitors included.** "The catch is the license, not a summer closure." |
| Bethany | Can Dogs Go on Bethany Beach? 2026 Rules & Dates | Banned **May 15 – Sept 30**; leashed Oct 1 – May 14. Two weeks longer than Rehoboth in September. |
| Lewes | Can Dogs Go on Lewes Beach? 2026 Hours & Dog Rules | Leashed before 8am / after 6:30pm, May 1 – Sept 30; all day Oct 1 – Apr 30. 2025 review unresolved — call before making it a landing page. |
| Fenwick | Can Dogs Go on Fenwick Island Beach? 2026 Rules & Dates | Town beach banned **May 1 – Sept 30**; leashed Oct 1 – Apr 30. State park immediately north follows separate rules. |

Standard H2s per town: rules by date · boardwalk · where to go instead in summer ·
what changed · dog emergency care · other beach rules.

### Summer dogs
Title: Where Can I Take My Dog to the Beach in Delaware in Summer? · H2 "Why
everyone tells you no" → **Why Delaware beach dog rules depend on the beach**

### Dog parks
Title: Delaware Dog Parks — Fencing, Water, Shade, Restrooms & Fees ·
H1: Delaware dog parks and off-leash areas · **Separate review-derived claims into
a labeled "Recent visitor reports:" module** — never state "highest-rated" or
"highest-traffic" in the same voice as county rules.

### Pet fees
`noindex` until hotel policies are collected from primary sources. Relaunch as
*Pet-Friendly Hotels in Delaware — Dog Fees, Limits & Rules*, keeping H1 *What
Delaware hotels actually charge for a dog*.

### Pond safety
Title: Blue-Green Algae and Dogs in Delaware Ponds — What to Know. Source quality
beats SEO here. **No sponsor positioned as an emergency recommendation.**

### Hubs

| Page | Title | H1 |
|---|---|---|
| State parks | keep *All 17 Delaware state parks — fees and facilities* | keep *Every Delaware state park* |
| Community parks | keep current | **Find a Delaware park with what you need** |
| Surf fishing | keep current | **Which Delaware surf-fishing beaches need a reservation?** |
| Indoors | **Indoor Things to Do in Delaware — Museums & Libraries** | **Indoor things to do in Delaware** (old H1 becomes deck) |
| Attractions | **Delaware Attractions — Zoos, Nature Centers, Hours & Admission** | **Delaware attractions for an afternoon out** |
| Drinks | **Delaware Breweries & Wineries — Dog Rules, Hours & Food** | keep *Where to drink what Delaware makes* + SEO deck |
| Disc golf | keep both | keep both |
| Events | **Delaware Events & Fairs 2026 — Confirmed Dates** | **Delaware fairs and events with confirmed dates** |
| Nearby | **Day Trips Near Delaware — Places Just Over the State Line** | **Day trips just over the Delaware state line** |
| Changed | **What Changed in Delaware — Rules, Prices, Openings & Closures** | **What changed in Delaware** |
| Verified | keep both | keep both — fix *our to-do list* → **my recheck list** |
| About | keep both | keep both |

### Detail templates
- **State park:** `[Park] — 2026 Fees, Dogs & Facilities`. H2 order: Before you go · 2026 entrance fee · Hours · Dogs · Restrooms and facilities · park-specific feature · Parking · Where it is · Source and last checked · Other parks nearby. **No empty headings for unknown data.**
- **Community park:** `[Park] — Restrooms, Playground & Facilities` — only when a playground actually exists, else `— Restrooms & Facilities`.
- **Museum:** keep existing titles. Lead with location + indoor/outdoor reality + hours/admission limit.
- **Drinks:** `[Business] — Dog Policy, Hours & Food`, or keep the question form.

---

## Sitewide standards

**Anchor text** — replace generic: `Details →` → `See [Place] details →` ·
`The full rule` → `See the full Delaware beach dog rule →` · `The state parks` →
`All 17 Delaware state parks →` · `Just ask it` → `Ask Delaware Field Guide →`

**Related module:** 3–5 links, each answering the next likely decision.

**Alt text:** describe what the photograph proves, not keywords.
"Fenced large-dog area at Glasgow Regional Park Bark Park in Newark, Delaware" —
not "Delaware park playground family kids best park".

**Vocabulary:** dog · kids · bathroom/restroom · fee · parking · open · closed ·
today · summer · fenced · free · inside/outside · drive · call first.
Avoid: destination · amenity-rich · recreational opportunity · family-centric ·
pet-inclusive · experiential · premier attraction.

**"Dog-friendly"** for choosing among places; **"dogs allowed / dog rules"** for
legal-rule pages. *Dog-friendly* is commercial and subjective; *"Dogs allowed
October 1 – May 14"* is a fact.

**"2026"** only where the answer genuinely changes by year — dog dates, park fees,
events, surf-fishing rules, seasonal closures. Not on evergreen park pages.

---

## Intent pages — build after the core rewrite

Priority order, each only if it produces a genuinely useful result set:

1. `/good-for/rainy-day/` — Rainy-Day Things to Do in Delaware With Kids
2. `/good-for/playground-restrooms/` — Delaware Playgrounds With Restrooms
3. `/good-for/free/` — Free Things to Do in Delaware
4. `/good-for/open-sunday/` — Things to Do in Delaware on Sunday
5. `/good-for/toddlers/` — Things to Do in Delaware With Toddlers
6. `/good-for/shade/` — Delaware Parks With Shade / H1 *Shade in August*
7. `/good-for/dog-friendly-drinks/` — only once enough of the 44 drink records have verified dog policies

**Index a generated page only if** it has a meaningful result list, unique
explanatory copy, a clear answer, useful decision info, and links to the records.
Google warns explicitly against scaled query-variation pages.

**This resolves the /good-for/ 404 question.** The old URLs are still indexed and
currently dead. Rebuilding these as generated intent pages satisfies both the
audit and open task #2 — the URLs come back as something better rather than being
redirected away.

---

## Don't

Keyword-stuffed paragraphs · meta keywords · near-identical pages for query
variants · "2026" on evergreen pages · generic tourism prose replacing Field Guide
lines · rewriting already-strong titles for novelty.

**Keep these titles as they are:** All 17 Delaware state parks · Delaware community
parks: restrooms, playgrounds, facilities · Delaware surf fishing: which beaches
need a reservation · Delaware disc golf courses — all 9 · Delaware Art Museum —
hours and admission · Harvest Ridge Winery — can you bring a dog?

---

## Six-question test before publishing

1. Could a stranger identify the exact subject from the title?
2. Can the reader get the important answer without scrolling past an intro?
3. Is Delaware/town/county early enough to remove ambiguity?
4. Are the H2s things a real person would scan for?
5. Did I repeat a phrase because it was useful, or because I thought Google needed to see it again? *(If the latter: delete it.)*
6. Is the page more useful than Google's knowledge panel, the Maps listing, or the operator's own page? *(If not, it needs another field, observation, comparison or source — not another keyword.)*

---

## The voice, demonstrated

> **Can dogs go on Dewey Beach?**
>
> Yes. Dewey allows dogs year-round. In summer, they can use the beach before
> 9:30am and after 5:30pm. A town dog license is required, including for visitors.
>
> **The catch is the license, not the hours.**

Not *"Discover the ultimate dog-friendly Dewey Beach experience"* and not
*"Dewey Beach dogs dog-friendly Delaware dog beach summer rules"*.

**Literal title. Direct answer. Specific facts. Human voice. Visible source.**
