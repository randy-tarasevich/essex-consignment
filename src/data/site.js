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
  hours: 'By appointment', // TODO: confirm regular hours
  shopUrl: '', // TODO: Shopify storefront URL
};

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'Announcements', href: '/announcements/' },
  { label: 'Consign With Us', href: '/consign/' },
  { label: 'Contact', href: '/contact/' },
];
