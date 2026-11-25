// Essex Consignment: Cloudflare Worker.
//
// Serves the Astro site from ./dist and handles these API routes:
//   POST /api/inquiry          (Contact and Consign With Us forms)
//   GET  /api/photo/<key>      (photos visitors attached to the Contact or Consign With Us form, stored in R2)
//   POST /api/shopify-webhook  (Shopify product/collection webhooks -> debounced site rebuild)
//
// Flow: spam check (honeypot + Cloudflare Turnstile) → find or create the
// Shopify customer by email → add tag "website-contact" or "consignor" →
// save the message (plus links to any attached photos) in the customer note → set email-marketing consent if
// the box was ticked. The email notification is sent from the visitor's
// browser (Web3Forms free plan only accepts browser submissions), using the
// `saved` flag this endpoint returns.
//
// Secrets (Cloudflare dashboard → Settings → Variables and Secrets, or .dev.vars locally):
//   SHOPIFY_STORE_DOMAIN       e.g. essex-consignment.myshopify.com
//   SHOPIFY_ADMIN_TOKEN        Admin API token with write_customers
//     or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (Dev Dashboard app, client-credentials grant)
//   TURNSTILE_SECRET_KEY       Cloudflare Turnstile secret
//   SHOPIFY_WEBHOOK_SECRET     Shopify admin → Settings → Notifications → Webhooks → signing secret
//   DEPLOY_HOOK_URL            Cloudflare Workers Builds deploy hook (Settings → Builds → Deploy Hooks)
// Bindings (wrangler.jsonc):
//   PHOTOS                     R2 bucket for Contact and Consign form photos (client request, Nov 24, 2026)
// Optional:
//   SHOPIFY_API_VERSION        default 2026-10

import { DurableObject } from 'cloudflare:workers';

const TAGS = { contact: 'website-contact', consignor: 'consignor' };
const MAX = { name: 80, email: 254, phone: 40, message: 4000 };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/inquiry') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
      return handleInquiry(request, env, ctx);
    }
    if (url.pathname.startsWith('/api/photo/')) {
      if (request.method !== 'GET' && request.method !== 'HEAD') return json({ ok: false, error: 'Method not allowed' }, 405);
      return servePhoto(url.pathname.slice('/api/photo/'.length), env);
    }
    if (url.pathname === '/api/shopify-webhook') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
      return handleShopifyWebhook(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

// ---------- Shopify webhook -> debounced rebuild ----------
//
// The homepage gallery is built from Shopify at build time, so product and collection
// changes need a rebuild. Shopify sends one webhook per edit; a bulk edit can send dozens.
// Every event resets a 90-second timer, so a burst of edits becomes one rebuild after
// things go quiet. A steady stream of edits still rebuilds at least every 10 minutes.

const REBUILD_QUIET_MS = 90_000;
const REBUILD_MAX_WAIT_MS = 10 * 60_000;

async function handleShopifyWebhook(request, env) {
  const body = await request.text();
  const valid = await verifyShopifyHmac(env.SHOPIFY_WEBHOOK_SECRET, body, request.headers.get('x-shopify-hmac-sha256'));
  if (!valid) return json({ ok: false }, 401);

  const topic = request.headers.get('x-shopify-topic') || 'unknown';
  const stub = env.REBUILD_DEBOUNCER.get(env.REBUILD_DEBOUNCER.idFromName('site'));
  const rebuildAt = await stub.schedule(topic);
  console.log(`[webhook] ${topic}: rebuild scheduled for ${new Date(rebuildAt).toISOString()}`);
  // Answer Shopify quickly; the rebuild happens later from the Durable Object alarm.
  return json({ ok: true });
}

export async function verifyShopifyHmac(secret, body, signature) {
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  const expected = btoa(String.fromCharCode(...mac));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

// When the rebuild should fire, given when this burst of events started.
export function nextRebuildTime(now, burstStart) {
  return Math.min(now + REBUILD_QUIET_MS, burstStart + REBUILD_MAX_WAIT_MS);
}

// One instance ("site") holds the timer in a Durable Object alarm, so it survives
// between requests and redeploys.
export class RebuildDebouncer extends DurableObject {

  async schedule(topic) {
    const now = Date.now();
    const burstStart = (await this.ctx.storage.get('burstStart')) ?? now;
    const count = ((await this.ctx.storage.get('count')) ?? 0) + 1;
    const at = nextRebuildTime(now, burstStart);
    await this.ctx.storage.put({ burstStart, count, lastTopic: topic });
    await this.ctx.storage.setAlarm(at);
    return at;
  }

  async alarm() {
    const count = (await this.ctx.storage.get('count')) ?? 0;
    if (!this.env.DEPLOY_HOOK_URL) {
      console.error('[rebuild] DEPLOY_HOOK_URL not set; skipping rebuild');
      await this.ctx.storage.deleteAll();
      return;
    }
    const res = await fetch(this.env.DEPLOY_HOOK_URL, { method: 'POST' });
    // Throwing makes Cloudflare retry the alarm with backoff.
    if (!res.ok) throw new Error(`Deploy hook returned ${res.status}`);
    console.log(`[rebuild] Triggered rebuild after ${count} Shopify event(s)`);
    await this.ctx.storage.deleteAll();
  }
}

// ---------- inquiry ----------

async function handleInquiry(request, env, ctx) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const origin = new URL(request.url).origin;
  // Which form sent this; no-JS failures go back to that form's page.
  let formType = 'contact';
  const errorPage = () => (formType === 'consignor' ? '/consign/?error=1#consign-form' : '/contact/?error=1');
  const respond = (ok, status, message, type, extra = {}) =>
    wantsJson
      ? json({ ok, message, ...extra }, status)
      : Response.redirect(`${origin}${ok ? `/thank-you/?type=${type}` : errorPage()}`, 303);

  let form;
  try {
    form = await request.formData();
  } catch {
    return respond(false, 400, 'Could not read the form.');
  }

  formType = str(form.get('type')) === 'consignor' ? 'consignor' : 'contact';

  // Honeypot: real people never fill this hidden field. Pretend success so bots learn nothing.
  if (str(form.get('company_website'))) return respond(true, 200, 'Thanks!', 'contact');

  const data = clean(form);
  const problem = validate(data);
  if (problem) return respond(false, 400, problem);
  const { files: photos, problem: photoProblem } = await readPhotos(form);
  if (photoProblem) return respond(false, 400, photoProblem);

  const ip = request.headers.get('cf-connecting-ip') || '';
  const human = await verifyTurnstile(env, str(form.get('cf-turnstile-response')), ip);
  if (!human) return respond(false, 403, 'Spam check failed. Please try again.');

  // Photos are stored before the Shopify save, so their links reach the email even if Shopify is down.
  const stored = await storePhotos(env, photos, origin);
  data.photos = stored.urls;
  data.photoError = stored.error;

  try {
    const result = await saveToShopify(env, data);
    console.log(`[inquiry] ${data.type}: ${result.action} Shopify customer ${result.id} (${data.email}), ${stored.urls.length} photo(s)`);
    return respond(true, 200, 'Thanks! We received your message and will be in touch soon.', data.type, {
      saved: true,
      action: result.action,
      tag: data.tag,
      photos: stored.urls,
      photoError: stored.error,
    });
  } catch (err) {
    console.error('[inquiry] Shopify error:', err.message);
    // The browser still sends the email notification (saved: false), so the lead isn't lost.
    return respond(false, 502, 'Sorry, something went wrong sending your message. Please call us at (860) 767-9741.', data.type, {
      saved: false,
      tag: data.tag,
      photos: stored.urls,
      photoError: stored.error,
    });
  }
}

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export function clean(form) {
  const type = str(form.get('type')) === 'consignor' ? 'consignor' : 'contact';
  return {
    type,
    tag: TAGS[type],
    firstName: str(form.get('firstName')).slice(0, MAX.name),
    lastName: str(form.get('lastName')).slice(0, MAX.name),
    email: str(form.get('email')).toLowerCase().slice(0, MAX.email),
    phone: str(form.get('phone')).slice(0, MAX.phone),
    message: str(form.get('message')).slice(0, MAX.message),
    acceptsMarketing: ['on', 'true', '1', 'yes'].includes(str(form.get('acceptsMarketing')).toLowerCase()),
  };
}

export function validate(d) {
  if (!d.firstName || !d.lastName) return 'Please enter your first and last name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return 'Please enter a valid email address.';
  if (!d.message) return 'Please include a message.';
  return null;
}

// ---------- photos (Contact and Consign forms, client request Nov 24, 2026) ----------
//
// Visitors can attach up to 5 photos of items. The browser shrinks big phone photos before
// sending. Each photo is saved to the private R2 bucket under a random key; the email and the
// Shopify customer note get a link (/api/photo/<key>) that the Worker serves from R2.
// Links are unguessable but not password-protected: anyone with a link can view that photo.

export const PHOTO_LIMITS = { count: 5, bytes: 10 * 1024 * 1024 };
const PHOTO_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/heic': 'heic', 'image/heif': 'heif' };
const EXT_TYPE = Object.fromEntries(Object.entries(PHOTO_EXT).map(([t, e]) => [e, t]));
const PHOTO_KEY = /^\d{4}-\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp|gif|heic|heif)$/;

// Image type from the file's first bytes, so a renamed non-image file is refused.
export function sniffImageType(bytes) {
  const b = bytes;
  const ascii = (from, to) => String.fromCharCode(...b.slice(from, to));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (ascii(0, 4) === 'GIF8') return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12);
    if (['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx'].includes(brand)) return 'image/heic';
    if (['mif1', 'msf1'].includes(brand)) return 'image/heif';
  }
  return null;
}

export async function readPhotos(form) {
  // An empty file input still sends one nameless, zero-byte entry; skip those.
  const entries = form.getAll('photos').filter((f) => f && typeof f === 'object' && f.size > 0);
  if (entries.length > PHOTO_LIMITS.count) return { files: [], problem: `Please attach no more than ${PHOTO_LIMITS.count} photos.` };
  const files = [];
  for (const f of entries) {
    if (f.size > PHOTO_LIMITS.bytes) return { files: [], problem: `Each photo must be under ${PHOTO_LIMITS.bytes / 1024 / 1024} MB.` };
    const bytes = new Uint8Array(await f.arrayBuffer());
    const type = sniffImageType(bytes.slice(0, 16));
    if (!type) return { files: [], problem: 'Photos must be JPG, PNG, WEBP, GIF, or HEIC images.' };
    files.push({ bytes, type });
  }
  return { files, problem: null };
}

async function storePhotos(env, files, origin) {
  if (!files.length) return { urls: [], error: false };
  if (!env.PHOTOS) {
    console.error('[inquiry] PHOTOS bucket not bound; dropping', files.length, 'photo(s)');
    return { urls: [], error: true };
  }
  const month = new Date().toISOString().slice(0, 7);
  try {
    const urls = await Promise.all(
      files.map(async ({ bytes, type }) => {
        const key = `${month}/${crypto.randomUUID()}.${PHOTO_EXT[type]}`;
        await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType: type } });
        return `${origin}/api/photo/${key}`;
      }),
    );
    return { urls, error: false };
  } catch (err) {
    console.error('[inquiry] R2 photo upload failed:', err.message);
    return { urls: [], error: true };
  }
}

async function servePhoto(key, env) {
  if (!PHOTO_KEY.test(key) || !env.PHOTOS) return new Response('Not found', { status: 404 });
  const obj = await env.PHOTOS.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'Content-Type': EXT_TYPE[key.split('.').pop()],
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  });
}

// ---------- Turnstile ----------

async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET_KEY) {
    // Local development without keys: allow, but say so in the logs.
    console.warn('[inquiry] TURNSTILE_SECRET_KEY not set; skipping spam check');
    return true;
  }
  if (!token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const out = await res.json();
    return out.success === true;
  } catch (err) {
    console.error('[inquiry] Turnstile error:', err.message);
    return false;
  }
}

// ---------- Shopify Admin API ----------

let cachedToken = null; // { value, expires } for the client-credentials grant

async function adminToken(env) {
  if (env.SHOPIFY_ADMIN_TOKEN) return env.SHOPIFY_ADMIN_TOKEN;
  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) throw new Error('Shopify credentials not configured');
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;
  // Shopify documents this grant as a form-encoded POST.
  const res = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.SHOPIFY_CLIENT_ID.trim(),
      client_secret: env.SHOPIFY_CLIENT_SECRET.trim(),
    }),
  });
  if (!res.ok) {
    // Include Shopify's reason (e.g. invalid_client, shop_not_permitted) so the log says what's wrong.
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    throw new Error(`Shopify token request failed (${res.status}) for ${env.SHOPIFY_STORE_DOMAIN}: ${detail}`);
  }
  const out = await res.json();
  cachedToken = { value: out.access_token, expires: Date.now() + (out.expires_in || 3600) * 1000 };
  return cachedToken.value;
}

async function admin(env, query, variables) {
  if (!env.SHOPIFY_STORE_DOMAIN) throw new Error('SHOPIFY_STORE_DOMAIN not set');
  const version = env.SHOPIFY_API_VERSION || '2026-10';
  const res = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${version}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await adminToken(env) },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify Admin API ${res.status}`);
  const out = await res.json();
  if (out.errors?.length) throw new Error(out.errors.map((e) => e.message).join('; '));
  return out.data;
}

function userErrors(payload) {
  const errs = payload?.userErrors || [];
  if (errs.length) throw new Error(errs.map((e) => `${(e.field || []).join('.')}: ${e.message}`).join('; '));
}

export function noteEntry(d, date = new Date()) {
  const when = date.toISOString().slice(0, 10);
  const label = d.type === 'consignor' ? 'Consignment inquiry' : 'Website message';
  const lines = [`[${when}] ${label} (website form)`];
  if (d.phone) lines.push(`Phone: ${d.phone}`);
  lines.push(d.message);
  if (d.photos?.length) lines.push(`Photos:\n${d.photos.join('\n')}`);
  if (d.photoError) lines.push('(Photos were attached but failed to upload. Ask the customer to email them.)');
  return lines.join('\n');
}

const FIND = `query Find($q: String!) { customers(first: 1, query: $q) { nodes { id firstName lastName note tags } } }`;
const CREATE = `mutation Create($input: CustomerInput!) {
  customerCreate(input: $input) { customer { id } userErrors { field message } } }`;
const UPDATE = `mutation Update($input: CustomerInput!) {
  customerUpdate(input: $input) { customer { id } userErrors { field message } } }`;
const TAG = `mutation Tag($id: ID!, $tags: [String!]!) {
  tagsAdd(id: $id, tags: $tags) { node { id } userErrors { field message } } }`;
const CONSENT = `mutation Consent($input: CustomerEmailMarketingConsentUpdateInput!) {
  customerEmailMarketingConsentUpdate(input: $input) { customer { id } userErrors { field message } } }`;

export async function saveToShopify(env, d) {
  const entry = noteEntry(d);
  const found = await admin(env, FIND, { q: `email:"${d.email.replace(/"/g, '')}"` });
  const existing = found.customers.nodes[0];

  if (!existing) {
    const input = {
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      tags: [d.tag],
      note: entry,
    };
    if (d.acceptsMarketing) {
      input.emailMarketingConsent = { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN' };
    }
    const out = await admin(env, CREATE, { input });
    userErrors(out.customerCreate);
    return { action: 'created', id: out.customerCreate.customer.id };
  }

  // Existing customer: add the tag, append the message to the note, update consent only if they opted in.
  userErrors((await admin(env, TAG, { id: existing.id, tags: [d.tag] })).tagsAdd);
  const note = existing.note ? `${existing.note}\n\n${entry}` : entry;
  const input = { id: existing.id, note: note.slice(-5000) };
  // Fill in a name Shopify doesn't have yet (e.g. a customer first created from an order with
  // only an email), but never overwrite a name that's already there.
  if (!existing.firstName && d.firstName) input.firstName = d.firstName;
  if (!existing.lastName && d.lastName) input.lastName = d.lastName;
  userErrors((await admin(env, UPDATE, { input })).customerUpdate);
  if (d.acceptsMarketing) {
    const out = await admin(env, CONSENT, {
      input: {
        customerId: existing.id,
        emailMarketingConsent: { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN' },
      },
    });
    userErrors(out.customerEmailMarketingConsentUpdate);
  }
  return { action: 'updated', id: existing.id };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
