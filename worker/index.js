// Essex Consignment: Cloudflare Worker.
//
// Serves the Astro site from ./dist and handles one API route:
//   POST /api/inquiry  (Contact and Consign With Us forms)
//
// Flow: spam check (honeypot + Cloudflare Turnstile) → find or create the
// Shopify customer by email → add tag "website-contact" or "consignor" →
// save the message in the customer note → set email-marketing consent if
// the box was ticked. The email notification is sent from the visitor's
// browser (Web3Forms free plan only accepts browser submissions), using the
// `saved` flag this endpoint returns.
//
// Secrets (Cloudflare dashboard → Settings → Variables and Secrets, or .dev.vars locally):
//   SHOPIFY_STORE_DOMAIN       e.g. essex-consignment.myshopify.com
//   SHOPIFY_ADMIN_TOKEN        Admin API token with write_customers
//     or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (Dev Dashboard app, client-credentials grant)
//   TURNSTILE_SECRET_KEY       Cloudflare Turnstile secret
// Optional:
//   SHOPIFY_API_VERSION        default 2026-10

const TAGS = { contact: 'website-contact', consignor: 'consignor' };
const MAX = { name: 80, email: 254, phone: 40, message: 4000 };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/inquiry') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
      return handleInquiry(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  },
};

// ---------- inquiry ----------

async function handleInquiry(request, env, ctx) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const origin = new URL(request.url).origin;
  const respond = (ok, status, message, type, extra = {}) =>
    wantsJson
      ? json({ ok, message, ...extra }, status)
      : Response.redirect(`${origin}${ok ? `/thank-you/?type=${type}` : `/contact/?error=1`}`, 303);

  let form;
  try {
    form = await request.formData();
  } catch {
    return respond(false, 400, 'Could not read the form.');
  }

  // Honeypot: real people never fill this hidden field. Pretend success so bots learn nothing.
  if (str(form.get('company_website'))) return respond(true, 200, 'Thanks!', 'contact');

  const data = clean(form);
  const problem = validate(data);
  if (problem) return respond(false, 400, problem);

  const ip = request.headers.get('cf-connecting-ip') || '';
  const human = await verifyTurnstile(env, str(form.get('cf-turnstile-response')), ip);
  if (!human) return respond(false, 403, 'Spam check failed. Please try again.');

  try {
    const result = await saveToShopify(env, data);
    return respond(true, 200, 'Thanks! We received your message and will be in touch soon.', data.type, {
      saved: true,
      action: result.action,
      tag: data.tag,
    });
  } catch (err) {
    console.error('[inquiry] Shopify error:', err.message);
    // The browser still sends the email notification (saved: false), so the lead isn't lost.
    return respond(false, 502, 'Sorry, something went wrong sending your message. Please call us at (860) 767-9741.', data.type, {
      saved: false,
      tag: data.tag,
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
  const res = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`Shopify token request failed (${res.status})`);
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
  return lines.join('\n');
}

const FIND = `query Find($q: String!) { customers(first: 1, query: $q) { nodes { id note tags } } }`;
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
  userErrors((await admin(env, UPDATE, { input: { id: existing.id, note: note.slice(-5000) } })).customerUpdate);
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
