# Yours

Things only you can do. Everything else on the site is either done or something I
can pick up on your word.

Ordered by what unblocks the most.

---

## 1. Rotate the eBird key — 2 minutes

You pasted it in chat, so it's in a transcript. Get a new one at
[ebird.org/api/keygen](https://ebird.org/api/keygen) and let the old one lapse.

Nothing breaks meanwhile — the reference data is fetched and committed. You only
need the key again to refresh, which is a once-a-month job at most.

---

## 2. Stand up the Worker — 30 minutes

**This is the highest-value item on the list**, because a form that silently
discards corrections is live on 125 pages right now. It currently falls back to a
mail link, which reaches you but loses the photo upload and the structure.

Full steps in [worker/README.md](worker/README.md). Short version:

```bash
cd worker && npm i -D wrangler && npx wrangler login
npx wrangler kv namespace create REPORTS
npx wrangler r2 bucket create dfg-report-photos
```

Paste both IDs into `worker/wrangler.toml`, then `npx wrangler deploy`, then attach
`api.delawarefieldguide.com` as a **Custom Domain** in the dashboard (Cloudflare makes
the DNS record — don't add one by hand).

Then in GitHub → Settings → Secrets and variables → Actions → **Variables**:

```
PUBLIC_REPORT_ENDPOINT = https://api.delawarefieldguide.com/report
```

Next deploy, the report form works for the first time.

---

## 3. Phone calls — 31 outstanding, ~2 hours total

The data tracks these. The ones that matter most:

**Safety — unblocks a headline that's written and held back**
- Ring the emergency vets and confirm hours. If *"no 24-hour emergency vet in Sussex County"* holds up, it publishes on six pages as the top line. It's sitting in `emergency.json` behind a null date.
- Rehoboth Beach Animal Hospital, **302-227-2009** — does curbside urgent care run the full office day, and do they take a walk-in with no file there?
- BluePearl Christiana — their site 403s me. If they confirm they're Delaware's only 24/7, that's the sourced version of the Sussex headline.

**Legal, and eight months stale**
- City of Lewes, **302-645-7777** — is the before-8am / after-6:30pm dog rule still current for 2026 including guarded beaches, and did the December 2025 proposed summer ban get a final vote? Record who answered and when.

**Kent County Parks — three records that are names and nothing else**
- Big Oak, Browns Branch, Kesselring. Call the county, fill them in, **or tell me to drop them.** Three empty cards make the whole community-parks section look unfinished.

**Drinks — 12 places assert a dog policy nobody published**
- Pizzadili is the priority: two tourism listings disagree on which days it opens, so the page publishes neither.
- Thompson Island, Mispillion River, Nassau Valley, Brimming Horn Seaford.

---

## 4. Twelve sticker designs

Brief with copy, art direction and plumage reference:
[FIELD-MARKS-BIRDS-BRIEF.md](FIELD-MARKS-BIRDS-BRIEF.md) covers the four birds.
Places 001–008 have art notes on each record.

**Start with four, not twelve.** The print run answers "which of these do people
want", and 50 each is enough to see a difference without trapping money in the wrong
eight.

Then: verify StickerApp pricing (it moves), order, photograph — five shots per SKU,
real photos not mockups. Send me the files and I'll import them and flip the status.

---

## 5. Decide checkout

Nothing can be sold until this is answered. Three options, in
[FIELD-MARKS-PLAN.md](FIELD-MARKS-PLAN.md):

- **Etsy link-out** — zero JS, doubles as discovery, loses in-page bundles
- **Stripe Payment Links** — still just a link, keeps the customer, one URL per SKU
- **Shopify/Snipcart** — real cart, but third-party JS on the page, which reverses your standing rule

Etsy or Stripe both hold the no-JS line. I'd start with Stripe Payment Links.

---

## 6. Sponsor outreach — when you're ready, not before

**I will not contact anyone.** Prospects, prices, and the exact emails are in
[MONETIZATION-PLAN.md](MONETIZATION-PLAN.md) and
[BIRDING-SALES-PLAN.md](BIRDING-SALES-PLAN.md).

The plan's own advice, which I'd hold you to: *don't approach Wild Birds Unlimited
until the birding section looks real enough to show them.* It's 7 of 27 sites. More
places first, not more products.

---

## 7. Werth Design case study

On the other site, not this one. Structure in
[BRAND-ARCHITECTURE.md](BRAND-ARCHITECTURE.md).

One rule from the doc worth repeating: **don't invent performance metrics.** Describe
the system until real numbers exist — which they will, once the Worker is up and
`/go/` starts counting.

---

## Optional, and reversible

**Orange-cloud the apex.** DNS is already on Cloudflare but grey-clouded, so the apex
answers straight from GitHub Pages. Proxying it would give you server-side page
analytics with no script on the page — the only way to get visitor numbers without
breaking the no-trackers rule. It also changes how the live site is served, so it's a
real decision rather than a toggle. Not needed for the Worker.

---

## What I'll do next, on your word

- More birding places — it's 7 of 27, and that's the section's weakest number
- `/birding/backyard/`, the seasonal pages, and the gear pages
- The 336 outstanding items that need reading rather than ringing
- Homepage "From the Field Guide" module, once something exists to sell
- Birding to top-level nav, once the section earns it
