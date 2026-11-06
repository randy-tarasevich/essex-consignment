// Single source of truth for business details. Confirm hours with Al.
export const site = {
  name: 'Essex Consignment',
  tagline: 'Whatever it is, we can sell it for more!',
  description:
    'Essex Consignment buys and sells estate furniture, antiques, art, jewelry, and collectibles in Essex, CT, with a top-rated eBay store for 24 years.',
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

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'Announcements', href: '/announcements/' },
  { label: 'Consign With Us', href: '/consign/' },
  { label: 'Sales Results', href: '/results/' },
  { label: 'Contact', href: '/contact/' },
];
