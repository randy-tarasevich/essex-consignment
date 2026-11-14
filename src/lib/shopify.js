// Shopify Storefront API helper (read-only).
//
// Where products come from, in order:
//   1. Essex's store, when PUBLIC_SHOPIFY_STORE_DOMAIN and PUBLIC_SHOPIFY_STOREFRONT_TOKEN are set
//   2. Shopify's public demo store (mock.shop), during `npm run dev` or when PUBLIC_SHOPIFY_USE_MOCK=true
//   3. Nothing (the gallery shows placeholders)
//
// Runs at build time only, so the token never reaches the browser.

const API_VERSION = import.meta.env.PUBLIC_SHOPIFY_API_VERSION || '2026-10';
const MAX_ITEMS = 10;

function source() {
  const domain = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
  if (domain && token) {
    return {
      kind: 'shopify',
      domain,
      endpoint: `https://${domain}/api/${API_VERSION}/graphql.json`,
      headers: { 'X-Shopify-Storefront-Access-Token': token },
    };
  }
  if (import.meta.env.DEV || import.meta.env.PUBLIC_SHOPIFY_USE_MOCK === 'true') {
    return { kind: 'mock', domain: 'mock.shop', endpoint: 'https://mock.shop/api', headers: {} };
  }
  return null;
}

const PRODUCT_FIELDS = `
  id
  title
  handle
  availableForSale
  onlineStoreUrl
  featuredImage { url(transform: { maxWidth: 800, maxHeight: 800 }) altText width height }
  priceRange { minVariantPrice { amount currencyCode } }
`;

const FEATURED_QUERY = `
  query Featured($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first) { nodes { ${PRODUCT_FIELDS} } }
    }
  }
`;

// Newest products in the store, used to top up the gallery when Featured has fewer than 10.
const NEWEST_QUERY = `
  query Newest($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) { nodes { ${PRODUCT_FIELDS} } }
  }
`;

async function storefront(src, query, variables) {
  const res = await fetch(src.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...src.headers },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
  return json.data;
}

// Items listed at $0 in Shopify are "call for price" pieces: show "Inquire" instead of $0.00.
export function formatPrice({ amount, currencyCode }) {
  if (!(Number(amount) > 0)) return 'Inquire';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(Number(amount));
}

// Essex types product titles in ALL CAPS. Show them in title case on the site
// ("ETHAN ALLEN PEDESTAL LEG BASE TABLE" -> "Ethan Allen Pedestal Leg Base Table").
// Titles already in mixed case are left exactly as entered.
const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
export function displayTitle(title) {
  if (!title || /[a-z]/.test(title)) return title;
  return title
    .toLowerCase()
    .split(/(\s+)/)
    .map((word, i, words) => {
      if (/^\s+$/.test(word)) return word;
      const isFirst = i === 0;
      const isLast = i === words.length - 1;
      if (!isFirst && !isLast && SMALL_WORDS.has(word)) return word;
      // Capitalize each part of hyphenated / slashed words: "mid-century" -> "Mid-Century".
      return word.replace(/(^|[-/(])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
    })
    .join('');
}

export function toCard(p, domain) {
  return {
    id: p.id,
    title: displayTitle(p.title),
    price: formatPrice(p.priceRange.minVariantPrice),
    url: p.onlineStoreUrl || `https://${domain}/products/${p.handle}`,
    image: p.featuredImage
      ? { src: p.featuredImage.url, alt: p.featuredImage.altText || displayTitle(p.title), width: p.featuredImage.width, height: p.featuredImage.height }
      : null,
  };
}

/**
 * Up to 10 for-sale items: the "Featured" collection first, then the store's newest
 * products to fill any empty spots. Returns { items, source } and never throws,
 * so a Shopify outage can't break the build.
 */
export async function getFeaturedItems({ handle = 'featured' } = {}) {
  const src = source();
  if (!src) return { items: [], source: 'none' };
  try {
    // Ask for extra so sold items can drop off and still leave 10.
    const data = await storefront(src, FEATURED_QUERY, { handle, first: 30 });
    const featured = data.collection?.products.nodes ?? [];
    if (!data.collection) console.warn(`[shopify] Collection "${handle}" not found on ${src.domain}; using newest products`);

    let nodes = featured.filter((p) => p.availableForSale);
    if (nodes.length < MAX_ITEMS) {
      const newest = (await storefront(src, NEWEST_QUERY, { first: 30 })).products.nodes;
      const seen = new Set(nodes.map((p) => p.id));
      nodes = nodes.concat(newest.filter((p) => p.availableForSale && !seen.has(p.id)));
    }
    const items = nodes.slice(0, MAX_ITEMS).map((p) => toCard(p, src.domain));
    return { items, source: src.kind };
  } catch (err) {
    console.warn(`[shopify] Could not load featured items: ${err.message}`);
    return { items: [], source: src.kind };
  }
}
