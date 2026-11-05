# Essex Consignment website

Rebuild of essexconsignment.com by Shoreline Web Solutions.
Astro + Tailwind CSS v4, deployed to Cloudflare. Target launch: January 1, 2027.

## Getting started

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to ./dist
npm run preview
```

Copy `.env.example` to `.env` and fill in the Shopify values once store access is approved (or point it at a Shopify development store for now). Without them, `npm run dev` shows demo products from mock.shop.

### Testing the forms locally

`npm run dev` runs the site only. The forms need the Worker, so test them with:

```bash
cp .dev.vars.example .dev.vars   # then fill in your dev store values
npm run preview:worker           # http://localhost:8787
```

## How the forms work

`worker/index.js` handles `POST /api/inquiry` (Contact and Consign With Us):

1. Spam check: hidden honeypot field + Cloudflare Turnstile
2. Finds the Shopify customer by email, or creates one
3. Adds the tag `website-contact` or `consignor`, and appends the message to the customer note
4. Marks them subscribed to email marketing only if they ticked the box
5. The visitor's browser then sends the email notification via Web3Forms (free plan only accepts browser submissions). If Shopify is down, the email still goes out, marked "NOT saved to Shopify". Visitors without JavaScript get the thank-you page but no email.

### Worker secrets (Cloudflare → essex-consignment → Settings → Variables and Secrets)

| Name | What |
| --- | --- |
| `SHOPIFY_STORE_DOMAIN` | `store-name.myshopify.com` |
| `SHOPIFY_ADMIN_TOKEN` | Admin API token with `read_customers` + `write_customers` |
| or `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` | if the app gives a client ID/secret instead of a token |
| `TURNSTILE_SECRET_KEY` | Turnstile widget secret |

Public keys live in `src/components/InquiryForm.astro` (Turnstile site key, Web3Forms access key); override with `PUBLIC_TURNSTILE_SITE_KEY` / `PUBLIC_WEB3FORMS_ACCESS_KEY` build variables.

## Pages (from the proposal)

| Page | File |
| --- | --- |
| Home (with Shopify featured items gallery) | `src/pages/index.astro` |
| About | `src/pages/about.astro` |
| Announcements (updated by SWS on request) | `src/pages/announcements.astro` |
| Consign With Us (consignor inquiry form) | `src/pages/consign.astro` |
| Contact | `src/pages/contact.astro` |
| Thank you (after a form is sent without JavaScript) | `src/pages/thank-you.astro` |

Business details (address, phone, email, hours) live in `src/data/site.js`.
Brand colors live in `src/styles/global.css`.

## Still to build

- [x] Featured gallery: Storefront API, "Featured" collection, available items only, max 10 (`src/lib/shopify.js`)
- [ ] Shopify webhook to trigger a Cloudflare rebuild when featured items change
- [x] Forms: Worker saves submissions as Shopify customers tagged `website-contact` / `consignor` (`worker/index.js`)
- [ ] Test forms against the dev store, then add Essex's real secrets in Cloudflare
- [ ] Self-hosted brand fonts and real logo
- [ ] GA4 with Shopify cross-domain tracking; Search Console (already verified on the domain)
- [ ] Content from the kickoff sheet
- [ ] Decide which current-site content to keep (Ebay Items Wanted, Sales Results, Worldwide Consignments)

## Launch DNS note

Email (Microsoft 365 via GoDaddy) depends on the current MX, SPF, autodiscover, and Microsoft records.
Only the `@` A record and `www` CNAME point at the website. See the DNS snapshot in the client folder before changing anything.
