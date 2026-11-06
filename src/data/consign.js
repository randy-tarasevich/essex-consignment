// Content pulled from Al's print ads (Worldwide Consignment, "Sell your stuff",
// "I Want Your Ash Tray", eBay Items Wanted). Confirm figures with Al before launch.

// Headline numbers. TODO: confirm with Al. The ads say both 23 and 24 years,
// and the 38,000 count may be out of date.
export const stats = [
  { value: '24 years', label: '5-star rated eBay seller' },
  { value: '38,000', label: 'transactions worldwide' },
  // Third stat is calculated from `results` below, so it stays accurate as sales change.
];

// "What we accept": both ads' lists merged and grouped.
export const categories = [
  { name: 'Furniture & Home', items: 'All furniture, antiques, lamps and mirrors, rugs and pottery' },
  { name: 'Art & Sculpture', items: 'Paintings, sculpture, prints, fine art from ash trays to rare art' },
  { name: 'Jewelry, Watches & Luxury', items: 'Gold and diamonds, vintage jewelry, gemstones, watches, Gucci, Hermès and Coach bags and scarves' },
  { name: 'Silver, China & Glass', items: 'Sterling silver and all tableware, china, dish and glassware' },
  { name: 'Coins & Precious Metals', items: 'Coins, currency, metals, old stock certificates' },
  { name: 'Militaria & History', items: 'Civil War, WWI and WWII items, presidential and political memorabilia' },
  { name: 'Sports & Entertainment', items: 'Baseball memorabilia and autographs, sports cards, movie posters, music memorabilia, tickets and programs' },
  { name: 'Toys, Comics & Games', items: 'Vintage toys, trains, Matchbox, Dinky, comic books, video games (Nintendo, Atari, Game Boy, Xbox)' },
  { name: 'Music & Records', items: 'Musical instruments, records, LPs, 33s and 45s' },
  { name: 'Books & Writing', items: 'Rare books and manuscripts, vintage pens' },
  { name: 'Collectibles', items: 'Pocket knives, collectibles of every kind, anything you would list on eBay' },
  { name: 'Automobiles', items: 'Classic, collector and exotic cars' },
];

// "Is this you?" from the ash tray ad.
export const situations = [
  'Spring cleaning',
  'Redecorating',
  'Downsizing',
  'Marriage changes',
  'An office closing',
  'Too much clutter',
  'Just need extra cash',
  'Too busy to do a tag sale',
];

// Actual items sold: auction estimate vs. what Essex Consignment got.
// From the "Sell your stuff" ad. Numbers are whole dollars.
// featured: shown as highlights on the homepage and consign page.
export const results = [
  { category: 'Sterling Silver', item: 'Georg Jensen 78-piece flatware set', estimate: 4250, sold: 6500 },
  { category: 'Fine Art', item: 'Norman Rockwell oil painting', estimate: 250000, sold: 400000, featured: true },
  { category: 'Fine Art', item: 'Alexander Calder gouache, Form', estimate: 40000, sold: 65000, featured: true },
  { category: 'Fine Art', item: 'Guy Wiggins oil painting', estimate: 18000, sold: 30000 },
  { category: 'Furniture', item: 'Baker vintage dining table with 8 chairs', estimate: 1500, sold: 4500, featured: true },
  { category: 'Furniture', item: 'Ethan Allen country pine table with 8 chairs', estimate: 1500, sold: 3995 },
  { category: 'Automobiles', item: '1984 Ferrari 308 GTS', estimate: 18000, sold: 34000, featured: true },
  { category: 'Automobiles', item: '2001 Porsche Carrera 4 Cabriolet', estimate: 14000, sold: 21000 },
  { category: 'Fine China', item: 'Meissen 91-piece set', estimate: 450, sold: 649 },
  { category: 'Baseball Cards', item: 'Hank Aaron 1954 card', estimate: 300, sold: 800 },
  { category: 'Baseball Cards', item: 'Mickey Mantle 1961 Topps All-Star card', estimate: 102, sold: 199 },
  { category: 'Militaria', item: 'WWII German helmet', estimate: 75, sold: 300 },
  { category: 'Vintage Toys', item: '1954 Tonka livestock truck', estimate: 135, sold: 273 },
  { category: 'Comic Books', item: 'Batman #232 (1972)', estimate: 300, sold: 750 },
  { category: 'Comic Books', item: 'Spider-Man #4 (1963)', estimate: 400, sold: 1000 },
  { category: 'Coins', item: '18k gold coins (13 states)', estimate: 8000, sold: 12500 },
];

export const usd = (n) => '$' + n.toLocaleString('en-US');
export const pctOver = (r) => Math.round(((r.sold - r.estimate) / r.estimate) * 100);

// Average % our sales beat their auction estimates (shown on the homepage).
const avgOver = Math.round(results.reduce((sum, r) => sum + pctOver(r), 0) / results.length);
stats.push({ value: `${avgOver}% more`, label: 'than auction estimates, on average' });
