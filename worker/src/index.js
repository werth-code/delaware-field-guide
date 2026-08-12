/**
 * Delaware Field Guide — backend.
 *
 * WHAT THIS IS FOR
 *
 * The site is static and that is deliberate: no server means nothing to
 * compromise, nothing to keep patched, and a page that renders the same for
 * everyone. But three things genuinely need somewhere to POST to, and one of
 * them has been broken in production since it was built:
 *
 *   /report     Field reports. PUBLIC_REPORT_ENDPOINT has never been set, so
 *               the form renders on NO page in production. The site invites
 *               corrections it currently cannot receive.
 *   /subscribe  Email, for the birding starter checklist.
 *   /go/:slug   Sticker QR codes and sponsor links, counted first-party.
 *
 * WHAT IT DELIBERATELY IS NOT
 *
 * Not an analytics beacon. Nothing here runs in a reader's browser, sets a
 * cookie, or follows anybody between pages. It counts requests it is sent, and
 * that is all. The no-trackers rule is intact because there is no tracker.
 *
 * Not a publisher. A report lands in storage with a date and waits for a human.
 * Nothing submitted here reaches a page without somebody reading it first —
 * that is the difference between a field report and a comment section, and it
 * is the entire reason this site's community input is worth anything.
 *
 * FORMS POST DIRECTLY TO IT, WITHOUT JAVASCRIPT
 *
 * The report form is a plain `method="POST" action="..."` with no script
 * behind it, so this must speak multipart/form-data and answer with a 303 to a
 * real page. That constraint is why it returns redirects rather than JSON.
 */

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

/* A no-JS form gets a redirect it can follow; a fetch() gets JSON. */
const done = (request, env, path, payload) => {
  const wantsJson = (request.headers.get("accept") ?? "").includes("application/json");
  if (wantsJson) return json(payload.ok ? 200 : 400, payload);
  return Response.redirect(`${env.SITE_ORIGIN}${path}`, 303);
};

/**
 * Per-IP throttle.
 *
 * Coarse on purpose: an hourly bucket per IP, stored as a counter with a TTL.
 * No log of what anybody submitted against their address, because a moderation
 * queue does not need to know who is behind it and a stored IP history is a
 * liability the moment anyone asks for it.
 *
 * Skipped entirely when KV isn't bound, so the worker still functions before
 * the namespace exists rather than failing closed on a form nobody can use.
 */
async function overLimit(env, ip, bucket, max) {
  if (!env.REPORTS || !ip) return false;
  const hour = Math.floor(Date.now() / 3_600_000);
  const key = `rl:${bucket}:${hour}:${ip}`;
  const n = Number((await env.REPORTS.get(key)) ?? 0);
  if (n >= max) return true;
  await env.REPORTS.put(key, String(n + 1), { expirationTtl: 7200 });
  return false;
}

const MAX_REPORT = 1200;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function handleReport(request, env) {
  const ip = request.headers.get("cf-connecting-ip");
  if (await overLimit(env, ip, "report", 10)) {
    return done(request, env, "/report/problem/", { ok: false, error: "rate_limited" });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return done(request, env, "/report/problem/", { ok: false, error: "bad_form" });
  }

  /* Honeypot. A person never fills a field they cannot see. Answered with the
     same success page a real submission gets — telling a bot it was detected
     just teaches whoever wrote it to stop filling the field. */
  if ((form.get("_gotcha") ?? "").toString().trim() !== "") {
    return done(request, env, "/report/thanks/", { ok: true });
  }

  const text = (form.get("report") ?? "").toString().trim();
  if (!text || text.length > MAX_REPORT) {
    return done(request, env, "/report/problem/", { ok: false, error: "bad_report" });
  }

  const id = crypto.randomUUID();
  const record = {
    id,
    receivedAt: new Date().toISOString(),
    page: (form.get("page") ?? "").toString().slice(0, 300),
    subject: (form.get("subject") ?? "").toString().slice(0, 200),
    report: text,
    visited: (form.get("visited") ?? "").toString().slice(0, 40) || null,
    /* Optional, and only so a person can be asked a follow-up question. Never
       used for anything else, never added to a list. */
    email: (form.get("email") ?? "").toString().slice(0, 200) || null,
    photos: [],
    /* THE FIELD THAT MATTERS. Nothing reaches the site without a human. */
    status: "unreviewed",
  };

  if (env.PHOTOS) {
    for (const file of form.getAll("photos")) {
      if (typeof file === "string" || !file?.size) continue;
      if (!PHOTO_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES) continue;
      const key = `${id}/${record.photos.length}-${file.name.replace(/[^\w.-]/g, "_").slice(0, 80)}`;
      await env.PHOTOS.put(key, file.stream(), {
        httpMetadata: { contentType: file.type },
      });
      record.photos.push(key);
    }
  }

  if (env.REPORTS) {
    await env.REPORTS.put(`report:${record.receivedAt}:${id}`, JSON.stringify(record));
  } else {
    /* No store bound yet. Better to tell the person plainly than to accept
       their report and drop it — a form that silently discards a correction is
       worse than no form. */
    return done(request, env, "/report/problem/", { ok: false, error: "no_store" });
  }

  return done(request, env, "/report/thanks/", { ok: true, id });
}

async function handleSubscribe(request, env) {
  const ip = request.headers.get("cf-connecting-ip");
  if (await overLimit(env, ip, "sub", 5)) {
    return json(429, { ok: false, error: "rate_limited" });
  }
  const form = await request.formData().catch(() => null);
  if (!form) return json(400, { ok: false, error: "bad_form" });
  if ((form.get("_gotcha") ?? "").toString().trim() !== "") return json(200, { ok: true });

  const email = (form.get("email") ?? "").toString().trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) {
    return json(400, { ok: false, error: "bad_email" });
  }
  if (!env.REPORTS) return json(503, { ok: false, error: "no_store" });

  await env.REPORTS.put(
    `sub:${email}`,
    JSON.stringify({
      email,
      at: new Date().toISOString(),
      /* Which page asked. Tells us what people actually subscribed FOR, which
         is the only thing worth knowing here. */
      source: (form.get("source") ?? "").toString().slice(0, 200) || null,
    }),
  );
  return done(request, env, "/birding/start/?subscribed=1", { ok: true });
}

/**
 * Sticker QR codes and sponsor links.
 *
 * The destination is NOT baked into the printed card — a card cannot be
 * reprinted when a park page moves. It resolves here, so the target stays
 * editable forever, and the redirect is counted on the way through.
 *
 * The count is a number per slug per day. No cookie, no identifier, nothing
 * that could reconstruct a person's path.
 */
async function handleGo(request, env, slug) {
  if (!env.REPORTS) return Response.redirect(env.SITE_ORIGIN, 302);
  const target = await env.REPORTS.get(`go:${slug}`);
  if (!target) return Response.redirect(env.SITE_ORIGIN, 302);

  const day = new Date().toISOString().slice(0, 10);
  const key = `hits:${slug}:${day}`;
  const n = Number((await env.REPORTS.get(key)) ?? 0);
  await env.REPORTS.put(key, String(n + 1));

  return Response.redirect(target, 302);
}

/**
 * Follow-up suggestions for /ask.
 *
 * THE ONE JOB THE MODEL KEPT. The endpoint contract the page speaks offers
 * three fields — lead, order, followUps — and this returns only the last,
 * on the strength of tools/ask-eval's numbers: local and hosted models
 * miscount a handed list about half the time (the lead stays deterministic,
 * where it is dated and names the unchecked gaps), and the matcher's own
 * ordering already scores 0.98 monotonicity, so re-ranking buys nothing.
 * The page falls back for the missing fields on its own.
 *
 * A suggestion is the one output that is STRUCTURALLY safe: ask.astro runs
 * every followUp through parse() and discards anything that doesn't resolve
 * to real filters, so the worst a bad one can be is useless, never wrong.
 * Nothing here touches a fact.
 *
 * The model never receives the site's data — only the visitor's question and
 * the names/kinds/towns of places the deterministic matcher already chose.
 */
const ASK_SCHEMA = {
  type: "object",
  properties: { followUps: { type: "array", items: { type: "string" } } },
  required: ["followUps"],
};

async function handleAsk(request, env) {
  /* Same-origin fetch, so the response needs the CORS header the form
     endpoints never did. Still SITE_ORIGIN only — an open AI endpoint is a
     bill anyone can run up. */
  const cors = { "access-control-allow-origin": env.SITE_ORIGIN };
  const reply = (status, body) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json; charset=utf-8", ...cors },
    });

  const ip = request.headers.get("cf-connecting-ip");
  if (await overLimit(env, ip, "ask", 60)) {
    return reply(429, { ok: false, error: "rate_limited" });
  }
  if (!env.AI) {
    /* Not bound yet. The page treats any failure as "no suggestions" and
       renders everything else, so failing plainly costs nothing. */
    return reply(503, { ok: false, error: "no_model" });
  }

  const body = await request.json().catch(() => null);
  const question = (body?.question ?? "").toString().slice(0, 200).trim();
  if (!question) return reply(400, { ok: false, error: "bad_question" });

  const attributes = (Array.isArray(body?.attributes) ? body.attributes : [])
    .filter((a) => typeof a === "string")
    .map((a) => a.slice(0, 40))
    .slice(0, 20);
  const places = (Array.isArray(body?.candidates) ? body.candidates : [])
    .slice(0, 24)
    .map((c) => ({
      name: (c?.name ?? "").toString().slice(0, 80),
      kind: (c?.kind ?? "").toString().slice(0, 40),
      town: (c?.town ?? "").toString().slice(0, 40),
    }));

  const system = `You suggest next questions for a Delaware outdoor reference site.

Given a visitor's question and the places that answered it, offer 5 short
follow-up questions they might ask next. Rules:
- Each must be answerable by filtering on: ${attributes.join(", ")}, a town name, or a place type (park, beach, trail, dog park, brewery).
- Plain language a visitor would type, under 60 characters.
- Vary them: a different amenity, a nearby town, a season or weather angle.
- Never suggest the question you were given.
Return JSON only: {"followUps": ["...", "...", "...", "...", "..."]}`;

  let raw;
  try {
    const out = await env.AI.run(env.ASK_MODEL, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify({ question, places }) },
      ],
      max_tokens: 220,
      temperature: 0.6,
      response_format: { type: "json_schema", json_schema: ASK_SCHEMA },
    });
    raw = out?.response ?? out;
  } catch {
    return reply(502, { ok: false, error: "model_error" });
  }

  /* Parse defensively whatever shape came back — object, JSON string, or a
     string wearing markdown fences — then sanitise. The page re-filters
     through parse() regardless; this pass just keeps garbage off the wire. */
  let followUps = [];
  try {
    const parsed =
      typeof raw === "string"
        ? JSON.parse(raw.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ""))
        : raw;
    followUps = (Array.isArray(parsed?.followUps) ? parsed.followUps : [])
      .filter((f) => typeof f === "string")
      .map((f) => f.trim())
      .filter((f) => f.length > 2 && f.length < 80)
      .filter((f, i, a) => a.indexOf(f) === i)
      .slice(0, 5);
  } catch {
    followUps = [];
  }

  return reply(200, { ok: true, followUps });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": env.SITE_ORIGIN,
          "access-control-allow-methods": "POST, GET, OPTIONS",
          "access-control-allow-headers": "content-type",
        },
      });
    }

    if (url.pathname === "/health") {
      return json(200, {
        ok: true,
        store: Boolean(env.REPORTS),
        photos: Boolean(env.PHOTOS),
      });
    }

    if (url.pathname.startsWith("/go/")) {
      return handleGo(request, env, url.pathname.slice(4).replace(/\/$/, ""));
    }

    if (request.method !== "POST") return json(405, { ok: false, error: "method" });

    /* Only this site may post here. A form endpoint anybody can drive is a
       spam relay with extra steps. */
    const origin = request.headers.get("origin");
    if (origin && origin !== env.SITE_ORIGIN) {
      return json(403, { ok: false, error: "origin" });
    }

    if (url.pathname === "/report") return handleReport(request, env);
    if (url.pathname === "/subscribe") return handleSubscribe(request, env);
    if (url.pathname === "/ask") return handleAsk(request, env);
    return json(404, { ok: false, error: "not_found" });
  },
};
