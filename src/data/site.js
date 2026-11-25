// Single source of truth for business details. Confirm hours with Al.
export const site = {
  name: 'Essex Consignment',
  tagline: 'Whatever it is, we can sell it for more!',
  // Shown on the Sales Results page, as on the original site. Confirm with Al before launch.
  monthlyViews: '16,000',
  description:
    'Essex Consignment buys and sells estate furniture, antiques, art, jewelry, and collectibles in Essex, CT, for 27 years, with a 5-star eBay store.',
  url: 'https://essexconsignment.com',
  phone: '(860) 767-9741',
  phoneHref: 'tel:+18607679741',
  email: 'al@essexconsignment.com',
  address: {
    street: '204 Westbrook Rd',
    city: 'Essex',
    region: 'CT',
    postalCode: '06426',
    country: 'US',
  },
  hours: 'By appointment', // TODO: confirm regular hours (directories list Fri–Sat 11am–4pm)
  // Structured hours for Google (schema.org). Fill once Al confirms, e.g.
  // { days: ['Friday', 'Saturday'], opens: '11:00', closes: '16:00' }
  openingHours: [],
  // Official profiles for Google (schema.org sameAs): Facebook, Instagram, eBay store, Google Business Profile
  sameAs: [
    'https://www.facebook.com/essexconsignments/',
    'https://www.instagram.com/_essexconsignment/',
    'https://www.ebay.com/str/aaestatesales',
    // Google Business Profile (Google Maps share link)
    'https://maps.app.goo.gl/guT2FEqCHgnAHuct5',
  ],
  // Social links shown in the footer and on the Contact page.
  social: [
    { label: 'Facebook', href: 'https://www.facebook.com/essexconsignments/', icon: 'facebook' },
    { label: 'Instagram', href: 'https://www.instagram.com/_essexconsignment/', icon: 'instagram' },
    { label: 'eBay', href: 'https://www.ebay.com/str/aaestatesales', text: 'eBay Store' },
  ],
  // Google rating shown on the homepage. Update by hand when it changes (checked Nov 6, 2026).
  google: {
    rating: '5.0',
    reviewCount: 7,
    reviewsUrl: 'https://maps.app.goo.gl/guT2FEqCHgnAHuct5', // Google Maps listing (reviews tab is one tap away)
  },
  // Google Maps: keyless embed on the Contact page + place-ID link (opens the exact business listing).
  map: {
    embedUrl: 'https://www.google.com/maps?q=Essex+Consignment,+204+Westbrook+Rd,+Essex,+CT+06426&output=embed',
    placeUrl: 'https://www.google.com/maps/search/?api=1&query=Essex+Consignment&query_place_id=ChIJ_W6oulkj5okR_jMHAqtCNcQ',
  },
  // eBay store, linked from the homepage "5-Star eBay Seller" badge.
  ebayUrl: 'https://www.ebay.com/str/aaestatesales',
  // Stand-in from the JPG Miles texted (Nov 6). Replace src/assets/logo.png + public/logo.png with the designer's file.
  logo: '/logo.png',
  ogImage: '/og-image.png',
  shopUrl: '', // TODO: Shopify storefront URL
};

// `es` = our own Spanish nav labels. Google Translate's are too long for the header and
// get some wrong ("Home" -> "Hogar" = house), so the nav is excluded from translation.
export const nav = [
  { label: 'Home', es: 'Inicio', href: '/' },
  // Hidden from the nav until Al & Miles decide whether to keep the page (Nov 2026). The page itself still exists.
  // { label: 'Announcements', es: 'Anuncios', href: '/announcements/' },
  { label: 'Submit Your Items', es: 'Envíe sus artículos', href: '/consign/' },
  { label: 'Sales Results', es: 'Resultados', href: '/results/' },
  { label: 'Contact', es: 'Contacto', href: '/contact/' },
];

// Gallery filters (client request, Nov 16).
// A piece lands in a category if it's in one of the listed Shopify collections (by handle),
// or its Shopify product type / a tag matches one of the listed names (case-insensitive).
// Easiest for Miles: create these collections in Shopify (handles: art, home-living, glassware-dishware, collectables) and add pieces to them.
export const shopCategories = [
  {
    slug: 'art',
    label: 'Art',
    es: 'Arte',
    collections: ['art'],
    names: ['art', 'artwork', 'painting', 'paintings', 'prints', 'sculpture'],
  },
  {
    slug: 'home-living',
    label: 'Home & Living',
    es: 'Hogar y Decoración',
    collections: ['home-living', 'home-and-living'],
    names: ['home & living', 'home and living', 'home', 'furniture', 'lighting', 'decor', 'home decor'],
  },
  {
    slug: 'glassware-dishware',
    label: 'Glassware/Dishware',
    es: 'Cristalería y Vajilla',
    collections: ['glassware-dishware', 'glassware-dishware-collectables', 'glassware-dishware-collectibles', 'glassware', 'dishware'],
    names: ['glassware', 'dishware', 'glassware/dishware', 'china', 'crystal'],
  },
  // Split out of Glassware/Dishware (Miles, Nov 24, 2026).
  {
    slug: 'collectables',
    label: 'Collectables',
    es: 'Coleccionables',
    collections: ['collectables', 'collectibles'],
    names: ['collectables', 'collectibles', 'collectable', 'collectible'],
  },
];

// Price filter tiers (Miles, Nov 24, 2026). Each tier runs up to, not including, its max:
// a $500 piece lands in "$500–$2,499", a $2,500 piece in "$2,500+". "Inquire" / call-for-price pieces count as $2,500+.
export const priceTiers = [
  { slug: 'under-100', label: 'Under $100', hint: 'Under $100', max: 100 },
  { slug: '100-500', label: '$100–$500', hint: '$100 to $499.99', max: 500 },
  { slug: '500-2500', label: '$500–$2,499', hint: '$500 to $2,499.99', max: 2500 },
  { slug: '2500-plus', label: '$2,500+', hint: '$2,500 and up', max: Infinity },
];
