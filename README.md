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

Copy `.env.example` to `.env` and fill in the Shopify values once store access is approved (or point it at a Shopify development store for now).

## Pages (from the proposal)

| Page | File |
| --- | --- |
| Home (with Shopify featured items gallery) | `src/pages/index.astro` |
| About | `src/pages/about.astro` |
| Announcements (updated by SWS on request) | `src/pages/announcements.astro` |
| Consign With Us (consignor inquiry form) | `src/pages/consign.astro` |
| Contact | `src/pages/contact.astro` |

Business details (address, phone, email, hours) live in `src/data/site.js`.
Brand colors live in `src/styles/global.css`.

## Still to build

- [ ] Featured gallery: Storefront API, "Featured" collection, available items only, max 10 (`src/components/FeaturedGallery.astro`)
- [ ] Shopify webhook to trigger a Cloudflare rebuild when featured items change
- [ ] Forms: Cloudflare Worker that saves submissions as Shopify customers tagged `website-contact` / `consignor`, with marketing consent, Turnstile, and email notification (`src/components/InquiryForm.astro`)
- [ ] Self-hosted brand fonts and real logo
- [ ] GA4 with Shopify cross-domain tracking; Search Console (already verified on the domain)
- [ ] Content from the kickoff sheet
- [ ] Decide which current-site content to keep (Ebay Items Wanted, Sales Results, Worldwide Consignments)

## Launch DNS note

Email (Microsoft 365 via GoDaddy) depends on the current MX, SPF, autodiscover, and Microsoft records.
Only the `@` A record and `www` CNAME point at the website. See the DNS snapshot in the client folder before changing anything.
