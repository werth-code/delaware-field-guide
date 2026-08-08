# Response to the August 8 editorial audit

I checked every concrete claim in Part IV against the live build before planning any
work. The audit is good — it found real problems, including one I'd call serious.
It also contains claims that are already fixed, three that are wrong, and a
strategy section that contradicts standing rules you gave me. Sorting those apart
is most of the value here, so that's what this document does first.

**Verdict: 21 of 29 Part IV items confirmed real. 3 wrong. 5 already fixed.**

---

## 1. Confirmed real — verified against the live build

### CRITICAL — an unverified categorical safety claim, published six times

`src/data/emergency.json` opens with this comment, which you wrote:

> "The most safety-critical data on this site — a wrong number here costs a dog.
> Nothing in this file may be inferred, rounded, or carried over from a listing
> site. **Every number needs a first-party confirmation call before verifiedDate
> is set.**"

Every `verifiedDate` in that file is `null`. Including the headline:

> "There is no 24-hour emergency vet in Sussex County. That is the single most
> important thing on this page and almost nobody tells visitors."

That is a categorical negative — the hardest kind of claim to support and the
easiest to be wrong about, since one practice changing its hours falsifies it. It
renders on six pages: Rehoboth, Dewey, Bethany, Lewes, Fenwick, and pond-safety.
It is styled as the most important thing on each of them.

The file's own rule forbids exactly this. The audit is right to lead with it, and
it is the one item I'd fix before anything else on this list.

Two sub-problems the audit didn't separate:

- **Pet's ER (Salisbury) has `hours: "Not confirmed"`** while being offered as the
  closest option to Fenwick and Bethany. An unknown-hours vet presented as the
  nearest option is worse than no listing, because it sends someone driving.
- **Delmarva's note is genuinely excellent** — "NOT 24/7 on weekdays" is the kind
  of fact this site exists for. It just isn't confirmed either.

### Confirmed factual errors

| # | What | Evidence |
|---|---|---|
| 1 | **Winterthur admission wrong.** Record says "doesn't publish a price table." It does: adult $29, senior/student $27, child 3–12 $12, under-3 free, Yuletide $33/$31/$12, SNAP $2. | Read `winterthur.org/visit/admission-packages/` today. I had checked `/visit/` and stopped. |
| 2 | **Biggs contradicts itself on its own page.** Renders "Closed Monday and Tuesday" and "Closed Monday through Wednesday" in the same document. | Data says Thu–Sun (= closed Mon/Tue/Wed). The Mon/Tue line is hand-typed prose; the Mon–Wed line is derived. Prose is wrong. |
| 3 | **Homepage indoor count wrong** — says 13, should be 12. | `indoor.json` holds 14 records, two of which (Brandywine Zoo, Ashland) are attractions. |
| 4 | **Homepage "Places to go" says 1 of 1** — should be 2. | Same root cause as #3. |
| 5 | **`including7`** — missing space, live on `/disc-golf/`. | JSX whitespace collapse around `{total}`. |
| 6 | **Addresses render `..., DE 19707, DE`** on **91 pages**. | Formatter appends the state when it's already in the string. |
| 7 | **"Kesselring County Park — Kent County · Kent County."** | Locality formatter duplicates when town is absent. |
| 8 | **`/good-for/*` 404s** with no redirects. | No `dist/good-for*`, nothing in `astro.config.mjs`. Old URLs still indexed. |
| 9 | **About says "The photographs are mine."** | No longer true — the indoors section uses credited CC BY / CC BY-SA images. |
| 10 | **`/nearby/` "half of New Castle County lives closer…"** | A population claim with no source. It's also mine, and I never checked it. |
| 11 | **`/dogs/` "Coming in this section"** labels content that already exists. | Live. |

### Root cause worth naming

#3 and #4 are the **same stale indoor/outdoor split** I fixed in `map-points.ts`
earlier this session — the version that tested `kind === "Zoo"` instead of
`isIndoors()`. I fixed it in two places and missed the homepage counter. Fixing
the third instance isn't enough; the split should exist once and be imported.

That's the fourth hand-maintained number to go stale on this site in two days
(events recurring-rules, dog-park caption, "four of them" on drinks, now these).
The pattern is the bug, not the individual numbers.

---

## 2. Wrong — I checked, the audit is mistaken

| Claim | Reality |
|---|---|
| "`/dogs/pet-fees/` says it stays out of search, yet it is crawlable." | It serves `<meta name="robots" content="noindex, nofollow">` and is **excluded from the sitemap**. The page is doing exactly what it says. **No change.** |
| "`/dogs/` still describes 'the seven dog parks'" and "`/dogs/dog-parks/` says seven things." | Both fixed earlier this session when the dataset went to 19 parks and eight fields. No "seven" remains anywhere in `src/`. |
| "`/disc-golf/` summary says zero hole counts confirmed while cards show hole counts." | Not an error — it's the tier system. The page says **0 *confirmed*** because hole counts came from state PDFs (`sourced`), not from a call. The line even reads "That last zero is honest." **But the audit's underlying point stands**: if a careful reader misreads this, the label is failing. That belongs in the verification-language work, not the bug list. |

The British-spelling item is also effectively clean — the only hits are in code
comments, not user-facing copy. The build guard has been catching these.

---

## 3. Conflicts with instructions you've already given me

**I'm not acting on these without your say-so.** In each case the audit asks for
something you told me the opposite of, and you outrank the audit.

### a. Ads, sponsors and analytics vs. "no trackers"

Parts IX–XI and XVII are ~40% of the document. They assume sponsor units, click
tracking, outbound-click measurement, returning-user metrics and a newsletter.

Your standing constraint: **no third-party JavaScript, no trackers, no display
ads.**

These are not reconcilable by careful implementation — the audit's reporting
promises to advertisers ("impressions, clicks, CTR, click-to-call") *require* the
tracking you ruled out. It's a real strategic fork, not a detail.

Worth saying: the audit's *editorial* half is fully compatible with your rules,
and its best commercial insight — **"advertisers cannot buy the answer"** — is
already how the site works. The independence policy is worth publishing whether or
not you ever sell anything.

### b. Homepage rewrite vs. the copy you wrote

The audit wants H1 → "Know before you drive." You gave me the current homepage
copy verbatim earlier this session ("Looking for somewhere to take the dog to
play, or a dry place to go with the kids when it rains?"). I'm not overwriting
your words on an audit's say-so.

The audit's tagline **"Delaware, checked before you drive"** is genuinely strong
and could live in the masthead without touching your copy. That's an additive
option.

### c. A Method page vs. "lets remove this page"

The audit wants `/how-we-verify/` restored as a Method page. You said: *"lets
remove this page"*, and it now 301s to `/about/`. Not restoring it unless you say
so — though I'd note the audit's *reason* is decent: "who writes this" and "how do
you decide something is true" are two different reader questions.

### d. Restoring `/good-for/` vs. task #2

The audit says restore-or-redirect. Your open task #2 says replace `/good-for/`
with filters. **Redirecting is compatible with both** and is what I'd do — it
recovers the indexing without resurrecting pages you've decided against.

---

## 4. Proposed order of work

Nothing here touches the conflicts in §3.

### Phase 1 — the safety claim (do first, alone)
1. Pull the categorical "no 24-hour emergency vet in Sussex County" claim from all
   six pages until it's confirmed. Replace with what's actually supportable:
   name the practices, their published hours, and mark unconfirmed ones plainly.
2. Add a build gate: **`emergency.json` cannot render a claim whose
   `verifiedDate` is null.** The file's comment already says this is the rule;
   right now nothing enforces it. This is the same class of gate as the sitemap
   and US-English checks.
3. Give you a call list — these need first-party calls and I can't make them.
   Rehoboth Beach Animal Hospital is already in your notes from earlier today.

Phase 1 is deliberately narrow. Safety content shouldn't ride along with a
cosmetic batch.

### Phase 2 — confirmed factual errors
Winterthur admission (source is in hand); Biggs prose; homepage counts via a
single shared `isIndoors()` split; `including7`; the 91-page double-DE address
formatter; Kesselring locality; About photo credit line; `/nearby/` population
claim; `/dogs/` "coming" labels.

### Phase 3 — structural, no new facts
`/good-for/` 301s to the nearest live page or Ask query. Then a sweep for other
hand-typed numbers that should be derived — the root cause from §1, not just its
four known symptoms.

### Phase 4 — verification language (needs a decision from you)
The audit's strongest editorial idea: replace the internal-sounding labels with
three reader-facing ones — **Checked directly / Official source / Needs
checking** — and split *confidence* from *completeness* ("Official source ·
Aug 8" above "8 of 22 facility details documented").

I think this is right, and it's the fix for the disc-golf confusion in §2. But it
touches every card on the site and changes how your three-tier model is presented
to readers, so it shouldn't be folded into a bug-fix batch.

### Phase 5 — voice
Founder "I" throughout; one time/date format enforced in the renderer; trim the
"almost nobody tells you" / "every guide gets this wrong" habit. The audit is
right that it's overused — the emergency headline uses it, which is the worst
possible place for a rhetorical flourish.

---

## 5. Decisions taken (Aug 8)

### Advertising: yes. Trackers: still no.

I'd framed this badly as "ads or no ads". That wasn't the tension. A sponsor strip
is an image and a link on our own domain — no JavaScript, no tracker, no conflict.
What collides with the no-tracker rule is the *reporting* advertisers expect
(impressions, CTR, click-to-call, returning users), which needs third-party ad JS
or an analytics beacon.

**Resolution — both, via infrastructure already planned:**

- Sponsor units are static. Image, line of copy, link. No script.
- Cloudflare proxy (orange-cloud) counts requests **server-side, no page script**.
  Gives page popularity, referrer, country.
- Sponsor links route through `/go/<sponsor>/` on our own domain, 301 onward.
  Cloudflare logs the hit, so click counts are real and first-party.

Given up: per-user funnels, and anything resembling "brand lift" — which the audit
tells us not to sell anyway ("Report what you can actually measure").

**Editorial rule, from your wording — "as long as it fits the brand and it shows
confirmed data":** a sponsor must be a real local business whose own listing meets
the site's normal sourcing standard. No sponsor may appear beside emergency,
safety, or children's content. Alcohol stays inside adult sections.

Sequencing: this comes **after** Phases 1–3. The audit is right that trust cleanup
precedes selling anything.

### Verification labels: split completeness only

Keep `confirmed` / `sourced` / `reported` as they are — they're load-bearing.
Stop making readers count gray rows: spell the fraction out in words and name the
top unknowns beside it. This also fixes the disc-golf "0 confirmed" confusion
without renaming the tiers.

### Homepage: take the audit's version

Your call, against your own earlier copy — noted and proceeding. New H1, subhead,
and the "Changed recently" module. Masthead tagline "Delaware, checked before you
drive."

### Still outstanding

**The emergency call list.** I can draft it; the calls have to be yours. Rehoboth
Beach Animal Hospital is already in your notes from earlier today.
