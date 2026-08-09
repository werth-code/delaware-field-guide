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
    return json(404, { ok: false, error: "not_found" });
  },
};
