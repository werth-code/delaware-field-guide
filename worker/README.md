# Backend

A single Cloudflare Worker at **`api.delawarefieldguide.com`**. It exists for three
things the static site genuinely cannot do, and does nothing else.

| Route | Why |
|---|---|
| `POST /report` | Field reports. **`PUBLIC_REPORT_ENDPOINT` has never been set**, so the form renders on 125 pages with no `action` — it posts to a static page and the report is lost. Worse than not asking. |
| `POST /subscribe` | Email, for the birding starter checklist. |
| `POST /ask` | Follow-up suggestions for the ask page — the one model job that survived tools/ask-eval (leads miscount, ordering is already optimal). Returns `{followUps}` only; the page's deterministic lead and order stand. Workers AI, no key to manage. |
| `GET /go/:slug` | Sticker QR codes and sponsor links, counted first-party. |
| `GET /health` | Whether the stores are bound. |

## Why a subdomain and not the apex

Your DNS is already on Cloudflare — nameservers are `ignat`/`gloria.ns.cloudflare.com`
— but the records are **grey-clouded**. `delawarefieldguide.com` resolves straight to
GitHub Pages (`185.199.108–111.153`) and answers with `server: GitHub.com` and no
`cf-ray`.

Routing a Worker on the apex would mean proxying GitHub Pages through Cloudflare:
a change to how the live site is served, for the sake of a form endpoint. A Worker
**Custom Domain** on `api.` touches nothing that currently works.

It is still first-party. Same registrable domain, no third-party script, no
cross-site cookie. **The site's no-third-party-JavaScript rule is about what runs
in a reader's browser, and nothing here does** — the report form is a plain HTML
POST with no script behind it.

## What it deliberately isn't

**Not an analytics beacon.** Nothing runs in a browser, nothing sets a cookie,
nothing follows anyone between pages. It counts requests it is sent. The
no-trackers rule is intact because there is no tracker.

**Not a publisher.** Every report lands with `status: "unreviewed"` and waits for a
human. Nothing submitted reaches a page without somebody reading it. That is the
difference between a field report and a comment section, and it is the whole reason
the site's community input is worth anything.

## Setup — yours, not mine

I never handle key or token values. Every step below is you.

```bash
cd worker
npm i -D wrangler
npx wrangler login
```

**1. Create the stores**, then paste the returned IDs into `wrangler.toml`
(both blocks are commented out until you do):

```bash
npx wrangler kv namespace create REPORTS
npx wrangler r2 bucket create dfg-report-photos
```

**2. Deploy and attach the domain.** In the Cloudflare dashboard, under the Worker →
Settings → Domains & Routes, add a **Custom Domain** of `api.delawarefieldguide.com`.
Cloudflare creates the DNS record itself; don't add one by hand.

```bash
npx wrangler deploy
curl https://api.delawarefieldguide.com/health
```

`/health` should report `store: true, photos: true`. Until the KV namespace is bound
the report endpoint **refuses submissions rather than accepting and dropping them** —
a form that silently discards a correction is worse than no form.

**3. Point the site at it.** In the GitHub repo → Settings → Secrets and variables →
Actions → **Variables** (not secrets; these URLs are public by nature):

```
PUBLIC_REPORT_ENDPOINT = https://api.delawarefieldguide.com/report
PUBLIC_CHAT_ENDPOINT   = https://api.delawarefieldguide.com/ask
```

The next deploy makes the report form actually submit for the first time (until
then it falls back to a prefilled mail link, which at least reaches a person)
and turns on the ask page's follow-up suggestions. The `/ask` route needs no
store and no secret — the Workers AI binding in wrangler.toml is granted at
deploy. Verify with:

```bash
curl -s https://api.delawarefieldguide.com/ask -X POST \
  -H "content-type: application/json" \
  -H "origin: https://delawarefieldguide.com" \
  -d '{"question":"fenced dog park near Wilmington","attributes":["shade","dogs allowed"],"candidates":[{"name":"Rockford Park","kind":"park","town":"Wilmington"}]}'
```

Leave `PUBLIC_CHAT_ENDPOINT` unset and the ask page stays fully deterministic —
that is a supported mode, not a degraded one.

## Reading the queue

```bash
npx wrangler kv key list --binding REPORTS --prefix "report:"
npx wrangler kv key get --binding REPORTS "report:<key>"
```

Keys are `report:<iso-timestamp>:<uuid>`, so listing is chronological. Subscribers
are `sub:<email>`, click counts `hits:<slug>:<yyyy-mm-dd>`.

## Redirect targets

`/go/:slug` reads its destination from KV, so a printed QR code can be repointed
after the card is in someone's hand:

```bash
npx wrangler kv key put --binding REPORTS "go:fm001" "https://delawarefieldguide.com/parks/cape-henlopen/"
```

## Still open

- **Checkout.** Deliberately absent. No product exists yet, and Stripe Payment Links
  need no backend at all. When a real cart is wanted, a `/checkout` route here can
  create Stripe Checkout Sessions server-side so the secret key never reaches a
  browser — but that decision comes after there is something to sell.
- **Page analytics.** This Worker sees only its own traffic. Page-view numbers would
  need the apex orange-clouded, which is the separate decision above.
- **Photo rights.** The upload form should state plainly whether a submitted picture
  may be published, how credit works, and who keeps ownership. That is copy, not
  code, and it should exist before the endpoint goes live.
