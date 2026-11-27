// Content pulled from Al's print ads (Worldwide Consignment, "Sell your stuff",
// "I Want Your Ash Tray", eBay Items Wanted). Confirm figures with Al before launch.

// Headline numbers. 27 years confirmed by Miles (Nov 14, 2026); the 38,000 count may be out of date.
export const stats = [
  { value: '27 years', label: 'in business' },
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
  { name: 'Collectibles', items: 'Collectibles of every kind, anything you would list on eBay' },
  { name: 'Automobiles', items: 'Classic, collector and exotic cars' },
];

// Consign With Us page: Al's "Ebay Items Wanted" list, copied from the old site (Miles, Nov 24, 2026).
// [bold lead, rest of the line, optional second line]. Two columns, in this order (first 9 left, next 9 right).
export const wanted = [
  ['Coins,', 'Currency, Metals'],
  ['Comic Books,', 'Sports Cards'],
  ['Civil War,', 'WWI and WWII Items'],
  ['Sterling Silver', 'All Tableware'],
  ['Rare Books', 'and Manuscripts'],
  ['Presidential', 'and Political Memorabilia'],
  ['Vintage Toys,', 'Trains, Matchbox, Dinky'],
  ['Movie', 'Posters'],
  ['Music Memorabilia,', 'Tickets, Programs'],
  ['Watches,', 'All Jewelry and gemstones'],
  ['Bags & Scarves,', 'Gucci, Hermes, Coach'],
  ['Baseball', 'Memorabilia & Autographs'],
  ['Old Stock', 'Certificates'],
  ['Musical', 'Instruments'],
  ['Vintage Pens,', 'Pocket Knives'],
  ['Records,', 'LP’s, 33⅓, 45’s'],
  ['Video Games,', 'Nintendo, Atari,', 'Game Boy, XBOX'],
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
// homepage: highlights shown on the homepage "Sell your stuff" section and the consign page, in this order (1-3).
// Miles (Nov 17): one each of Art, Car, Furniture.
// es: our own short Spanish name, shown on Sales Results in Spanish mode instead of Google's
//     longer machine translation (keeps the chart layout intact). Confirm wording with Al/Miles.
// bold: item name shown in bold on Sales Results (Nov 27, 2026).
export const categoryEs = {
  'Sterling Silver': 'Plata esterlina',
  'Fine Art': 'Bellas artes',
  'Furniture': 'Muebles',
  'Automobiles': 'Automóviles',
  'Fine China': 'Porcelana fina',
  'Baseball Cards': 'Béisbol',
  'Militaria': 'Militaria',
  'Vintage Toys': 'Juguetes',
  'Comic Books': 'Cómics',
  'Coins': 'Monedas',
};

export const results = [
  { category: 'Sterling Silver', item: 'Georg Jensen 78-piece flatware set', es: 'Cubiertos Georg Jensen, 78 piezas', estimate: 4250, sold: 6500 },
  { category: 'Fine Art', item: 'Norman Rockwell oil painting', es: 'Óleo de Norman Rockwell', bold: true, estimate: 250000, sold: 400000, homepage: 1 },
  { category: 'Fine Art', item: 'Alexander Calder gouache, Form', es: 'Gouache de Alexander Calder, Form', bold: true, estimate: 40000, sold: 65000 },
  { category: 'Fine Art', item: 'Guy Wiggins oil painting', es: 'Óleo de Guy Wiggins', bold: true, estimate: 18000, sold: 30000 },
  { category: 'Furniture', item: 'Baker vintage dining table with 8 chairs', es: 'Mesa de comedor Baker con 8 sillas', estimate: 1500, sold: 4500, homepage: 3 },
  { category: 'Furniture', item: 'Ethan Allen country pine table with 8 chairs', es: 'Mesa de pino Ethan Allen, 8 sillas', estimate: 1500, sold: 3995 },
  { category: 'Automobiles', item: '1984 Ferrari 308 GTS', es: 'Ferrari 308 GTS (1984)', estimate: 18000, sold: 34000, homepage: 2 },
  { category: 'Automobiles', item: '2001 Porsche Carrera 4 Cabriolet', es: 'Porsche Carrera 4 Cabriolet (2001)', estimate: 14000, sold: 21000 },
  { category: 'Fine China', item: 'Meissen 91-piece set', es: 'Vajilla Meissen, 91 piezas', estimate: 450, sold: 649 },
  { category: 'Baseball Cards', item: 'Hank Aaron 1954 card', es: 'Tarjeta de Hank Aaron (1954)', estimate: 300, sold: 800 },
  { category: 'Baseball Cards', item: 'Mickey Mantle 1961 Topps All-Star card', es: 'Mickey Mantle Topps All-Star (1961)', estimate: 102, sold: 199 },
  { category: 'Militaria', item: 'WWII German helmet', es: 'Casco alemán de la II Guerra Mundial', estimate: 75, sold: 300 },
  { category: 'Vintage Toys', item: '1954 Tonka livestock truck', es: 'Camión de ganado Tonka (1954)', estimate: 135, sold: 273 },
  { category: 'Comic Books', item: 'Batman #232 (1972)', es: 'Batman #232 (1972)', estimate: 300, sold: 750 },
  { category: 'Comic Books', item: 'Spider-Man #4 (1963)', es: 'Spider-Man #4 (1963)', estimate: 400, sold: 1000 },
  { category: 'Coins', item: '18k gold coins (13 states)', es: 'Monedas de oro de 18k (13 estados)', estimate: 8000, sold: 12500 },
];

export const usd = (n) => '$' + n.toLocaleString('en-US');
export const pctOver = (r) => Math.round(((r.sold - r.estimate) / r.estimate) * 100);

// Average % our sales beat their auction estimates (shown on the homepage).
const avgOver = Math.round(results.reduce((sum, r) => sum + pctOver(r), 0) / results.length);
stats.push({ value: `${avgOver}% more`, label: 'than auction estimates, on average' });
