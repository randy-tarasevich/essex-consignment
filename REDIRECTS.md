# Redirect map: old site -> new site

Crawled Nov 6, 2026. The old site has 6 URLs, no sitemap.xml, and a robots.txt.
Redirects live in `public/_redirects` (Cloudflare Workers static assets reads it from `dist/`).

| Old URL | What's there now | New URL | Type |
| --- | --- | --- | --- |
| `/` | Home: "Whatever it is, we can sell it for more!" | `/` | same URL |
| `/home` | Duplicate of the homepage | `/` | 301 |
| `/ebay-items-wanted` | eBay items wanted, "Top Rated Seller (24 Yrs)" | `/consign` | 301 |
| `/sales-and-results` | "Sell your stuff", 16,000 site views/month | `/results` | 301 |
| `/worldwide-consignments` | "From an ashtray to a Picasso", 5-star eBay seller | `/consign` | 301 |
| `/contact-and-directions` | Phone, address, Google Maps directions | `/contact` | 301 |

New pages with no old equivalent: `/about`, `/announcements`, `/thank-you`.

## Open decisions

- **Decided Nov 6:** Sales Results has its own page (`/results`). eBay Items Wanted and Worldwide
  Consignments are merged into `/consign` ("What we accept", "Is this you?"). Content source: Al's print ads.
- **Broken link on the old Contact page.** It links to `/essexconsignments/`, which returns 404.
  It was probably meant to be their Facebook page; confirm the right URL with Al.

## At launch

- Test every old URL against the live site and confirm each returns a single 301 to the right page.
- `www.essexconsignment.com` should 301 to `https://essexconsignment.com` (set up when the custom domains go on the Worker).
- Submit the new sitemap in Search Console (already verified on the domain).
