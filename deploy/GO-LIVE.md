# Go live

Everything is built and pushed. This is the whole remaining list.

---

## 1. DNS — Cloudflare

Upload [`delawarefieldguide.com.zone`](delawarefieldguide.com.zone):

**Cloudflare → delawarefieldguide.com → DNS → Records → Import and Export →
Import DNS records.**

Or add them by hand:

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `@` | `185.199.108.153` | **DNS only** |
| A | `@` | `185.199.109.153` | **DNS only** |
| A | `@` | `185.199.110.153` | **DNS only** |
| A | `@` | `185.199.111.153` | **DNS only** |
| CNAME | `www` | `werth-code.github.io` | **DNS only** |

> **Grey cloud first.** Cloudflare imports records proxied by default. Proxying
> before GitHub has issued its certificate is what causes the infinite redirect
> loop your notes warn about.

## 2. GitHub Pages

Repo → **Settings → Pages → Custom domain** → `delawarefieldguide.com` → Save.

Wait for the green tick (a few minutes, occasionally an hour), then tick
**Enforce HTTPS**. It stays greyed out until the certificate exists.

## 3. Turn the proxy on — only now

Switch the four A records and `www` to **Proxied (orange)**, then:

- **SSL/TLS → Overview → Full (strict).** Not Flexible.
- **Speed → Optimization → Auto Minify: off.** It breaks the planner.
- **Rocket Loader: off.** Same reason.
- **Caching → Cache Rules →** bypass cache for `*.html`, or purge on deploy.
  Cloudflare will otherwise serve stale pages after each build.

## 4. Submit

- Google Search Console → add `delawarefieldguide.com` → submit
  `https://delawarefieldguide.com/sitemap-index.xml`
- Bing Webmaster Tools → same

**45 pages are indexable.** The dog park pages, the emergency contacts and the
pet fee table are deliberately held back — see below.

---

## Two environment variables

Both are repo **variables**, not secrets: repo → Settings → Secrets and
variables → Actions → **Variables** tab → New repository variable. The deploy
workflow already passes both through.

| Variable | What it switches on |
|---|---|
| `PUBLIC_BEEHIIV_EMBED_URL` | The newsletter form in the footer. Create the Beehiiv publication, copy its embed URL. Until this is set, the footer shows a labelled placeholder rather than a form that silently drops addresses. |
| `PUBLIC_REPORT_ENDPOINT` | The field-report form on dog park pages. Any endpoint accepting a form-encoded POST; Formspree is the assumed shape. |

---

## What is deliberately still out of search

Not a bug. These three have no primary source — their details came from review
sites and aggregators, which is the one thing `/how-we-verify/` promises we
won't publish as fact.

| What | Why it's held | What releases it |
|---|---|---|
| **17 dog park pages** | The seven fields came from Google and BringFido reviews | Visit or call each one |
| **Emergency contacts** | Vet numbers and hours from directory listings | Call each practice — this is the one where being wrong hurts a dog |
| **Pet fee table** | Only review evidence that the properties are dog-friendly; no fees | The twelve calls |

Everything else publishes now, labelled either **Confirmed** (we called or
visited) or **Read from the source** (a named primary source, not yet confirmed
by phone).

---

## Then

`npm run calls` regenerates [`../CALL-SHEET.md`](../CALL-SHEET.md) from the data.
Work down it, fill in `verifiedDate` and `verifiedSource` on each record, and
items disappear as they're done — pages upgrade from *Read from the source* to
*Confirmed* on the next build.

The site rebuilds itself daily at 07:10 UTC, so the "as of" dates and today's
status stay current without you touching it.
