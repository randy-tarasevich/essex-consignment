// Single source of truth for business details. Confirm hours with Al.
export const site = {
  name: 'Essex Consignment',
  tagline: 'Whatever it is, we can sell it for more!',
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
  // Official profiles for Google (schema.org sameAs): Facebook, eBay store, Google Business Profile, Yelp
  sameAs: [], // TODO: get Facebook + eBay store URLs from Al
  // Google rating shown on the homepage. Update by hand when it changes (checked Nov 6, 2026).
  google: {
    rating: '5.0',
    reviewCount: 7,
    reviewsUrl: '', // TODO: "View all Google reviews" link from the Business Profile
  },
  // Stand-in from the JPG Miles texted (Nov 6). Replace src/assets/logo.png + public/logo.png with the designer's file.
  logo: '/logo.png',
  ogImage: '/og-image.png',
  shopUrl: '', // TODO: Shopify storefront URL
};

// `es` = our own Spanish nav labels. Google Translate's are too long for the header and
// get some wrong ("Home" -> "Hogar" = house), so the nav is excluded from translation.
export const nav = [
  { label: 'Home', es: 'Inicio', href: '/' },
  { label: 'About', es: 'Nosotros', href: '/about/' },
  // Hidden from the nav until Al & Miles decide whether to keep the page (Nov 2026). The page itself still exists.
  // { label: 'Announcements', es: 'Anuncios', href: '/announcements/' },
  { label: 'Consign With Us', es: 'Consignar', href: '/consign/' },
  { label: 'Sales Results', es: 'Resultados', href: '/results/' },
  { label: 'Contact', es: 'Contacto', href: '/contact/' },
];

// Gallery filters (client request, Nov 16).
// A piece lands in a category if it's in one of the listed Shopify collections (by handle),
// or its Shopify product type / a tag matches one of the listed names (case-insensitive).
// Easiest for Miles: create these three collections in Shopify and add pieces to them.
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
    slug: 'glassware-dishware-collectables',
    label: 'Glassware/Dishware & Collectables',
    es: 'Cristalería, Vajilla y Coleccionables',
    collections: ['glassware-dishware-collectables', 'glassware-dishware-collectibles', 'glassware', 'dishware', 'collectables', 'collectibles'],
    names: ['glassware', 'dishware', 'china', 'crystal', 'collectables', 'collectibles', 'collectable', 'collectible'],
  },
];

// Price filter tiers. TODO: confirm cut-offs with Miles.
// Low: under $100 · Medium: $100–$499 · High: $500+ ("Inquire" / call-for-price pieces count as High).
export const priceTiers = [
  { slug: 'low', label: 'Low', hint: 'Under $100', max: 100 },
  { slug: 'medium', label: 'Medium', hint: '$100–$499', max: 500 },
  { slug: 'high', label: 'High', hint: '$500 & up', max: Infinity },
];
