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

const FALLBACK_QUERY = `
  query Products($first: Int!) {
    products(first: $first) { nodes { ${PRODUCT_FIELDS} } }
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

export function formatPrice({ amount, currencyCode }) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(Number(amount));
}

export function toCard(p, domain) {
  return {
    id: p.id,
    title: p.title,
    price: formatPrice(p.priceRange.minVariantPrice),
    url: p.onlineStoreUrl || `https://${domain}/products/${p.handle}`,
    image: p.featuredImage
      ? { src: p.featuredImage.url, alt: p.featuredImage.altText || p.title, width: p.featuredImage.width, height: p.featuredImage.height }
      : null,
  };
}

/**
 * Items in the "Featured" collection that are still for sale, max 10.
 * Returns { items, source } and never throws, so a Shopify outage can't break the build.
 */
export async function getFeaturedItems({ handle = 'featured' } = {}) {
  const src = source();
  if (!src) return { items: [], source: 'none' };
  try {
    // Ask for extra so sold items can drop off and still leave up to 10.
    const data = await storefront(src, FEATURED_QUERY, { handle, first: 30 });
    let nodes = data.collection?.products.nodes;
    if (!nodes && src.kind === 'mock') {
      // Demo store may not have a "featured" collection; show any products for layout work.
      nodes = (await storefront(src, FALLBACK_QUERY, { first: 30 })).products.nodes;
    }
    if (!nodes) {
      console.warn(`[shopify] Collection "${handle}" not found on ${src.domain}`);
      return { items: [], source: src.kind };
    }
    const items = nodes.filter((p) => p.availableForSale).slice(0, MAX_ITEMS).map((p) => toCard(p, src.domain));
    return { items, source: src.kind };
  } catch (err) {
    console.warn(`[shopify] Could not load featured items: ${err.message}`);
    return { items: [], source: src.kind };
  }
}
