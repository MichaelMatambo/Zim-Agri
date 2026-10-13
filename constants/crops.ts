// Crops grown in Zimbabwe with common varieties. `icon` is a MaterialCommunityIcons name (bundled font, works offline).
// `suit` links each crop to a requirement set in assets/data/crop_requirements.json (proxy = uses a similar crop's requirements).
export type Crop = { name: string; icon: string; group: string; varieties: string[]; suit: string; proxy?: boolean };

export const CROPS: Crop[] = [
  { name: 'Maize', icon: 'corn', group: 'Cereals', suit: 'maize', varieties: ['SC403', 'SC513', 'SC637', 'SC719', 'SC727', 'ZM523', 'ZM625', 'PAN 53', 'PAN 4M-21', 'Local white maize'] },
  { name: 'Sorghum', icon: 'grain', group: 'Cereals', suit: 'sorghum', varieties: ['Macia', 'SV1', 'SV2', 'SV4', 'Local red sorghum'] },
  { name: 'Pearl Millet (Mhunga)', icon: 'grain', group: 'Cereals', suit: 'pmillet', varieties: ['PMV 3', 'Okashana 1', 'Local mhunga'] },
  { name: 'Finger Millet (Rapoko)', icon: 'grain', group: 'Cereals', suit: 'pmillet', proxy: true, varieties: ['SDFM 331', 'Local rapoko'] },
  { name: 'Wheat', icon: 'barley', group: 'Cereals', suit: 'wheat', varieties: ['SC Nduna', 'SC Smart', 'Flagstaff', 'Pandora'] },
  { name: 'Groundnuts', icon: 'peanut', group: 'Legumes', suit: 'groundnut', varieties: ['Nyanda', 'Natal Common', 'Flamingo', 'Jesa', 'Ilanda', 'Igola'] },
  { name: 'Bambara Nuts (Nyimo)', icon: 'seed', group: 'Legumes', suit: 'groundnut', proxy: true, varieties: ['Red nyimo', 'Black nyimo', 'Cream nyimo'] },
  { name: 'Cowpeas (Nyemba)', icon: 'seed-outline', group: 'Legumes', suit: 'cowpea', varieties: ['CBC1', 'CBC2', 'IT18', 'Local nyemba'] },
  { name: 'Sugar Beans', icon: 'seed-outline', group: 'Legumes', suit: 'beans', varieties: ['Cardinal', 'Gloria', 'Sugar 131', 'Speckled'] },
  { name: 'Soya Beans', icon: 'seed', group: 'Legumes', suit: 'soya', varieties: ['Solitaire', 'Safari', 'Status', 'Santa'] },
  { name: 'Sunflower', icon: 'flower', group: 'Oilseeds', suit: 'sunflower', varieties: ['Peredovick', 'Pan 7351', 'Local open-pollinated'] },
  { name: 'Cotton', icon: 'cloud-outline', group: 'Cash crops', suit: 'cotton', varieties: ['CA 324', 'Albar SZ 9314'] },
  { name: 'Tobacco', icon: 'leaf-maple', group: 'Cash crops', suit: 'tobacco', varieties: ['KRK26', 'KM10', 'Burley'] },
  { name: 'Sugarcane', icon: 'spa', group: 'Cash crops', suit: 'sugarcane', varieties: ['ZN7', 'ZN9', 'NCo376'] },
  { name: 'Tomatoes', icon: 'food-apple', group: 'Vegetables', suit: 'tomato', varieties: ['Rodade', 'Money Maker', 'Star 9009', 'Roma'] },
  { name: 'Onions', icon: 'circle-slice-8', group: 'Vegetables', suit: 'onion', varieties: ['Texas Grano', 'Red Creole', 'Caledon'] },
  { name: 'Cabbage', icon: 'sprout-outline', group: 'Vegetables', suit: 'cabbage', varieties: ['Copenhagen Market', 'Drumhead', 'Glory of Enkhuizen'] },
  { name: 'Carrots', icon: 'carrot', group: 'Vegetables', suit: 'carrot', varieties: ['Kuroda', 'Chantenay'] },
  { name: 'Rape / Covo', icon: 'sprout', group: 'Vegetables', suit: 'vegetables', proxy: true, varieties: ['Dwarf Essex', 'Giant Rape'] },
  { name: 'Butternut', icon: 'fruit-citrus', group: 'Vegetables', suit: 'vegetables', proxy: true, varieties: ['Waltham', 'Atlas'] },
  { name: 'Sweet Potato', icon: 'carrot', group: 'Roots', suit: 'sweetpotato', varieties: ['Brondal', 'Kenya', 'Local orange'] },
  { name: 'Irish Potato', icon: 'pot-mix', group: 'Roots', suit: 'potato', varieties: ['BP1', 'Mondial', 'Amethyst', 'Rosita'] },
  { name: 'Cassava', icon: 'sprout', group: 'Roots', suit: 'cassava', varieties: ['Local cassava', 'Kenya 1'] },
  { name: 'Blueberries', icon: 'fruit-grapes', group: 'Fruit', suit: 'blueberry', varieties: ['Duke', 'Legacy', 'Bluecrop'] },
];
export const cropByName = (n?: string | null) => CROPS.find((c) => c.name === n);
export const cropIcon = (n?: string | null) => cropByName(n)?.icon ?? 'sprout';
export const shortName = (n: string) => n.split(' (')[0].split(' / ')[0];

export const UNITS = [
  { key: 'kg', label: 'kg', kg: 1 },
  { key: 'bag50', label: '50kg bag', kg: 50 },
  { key: 'bucket', label: '20L bucket', kg: 15 },
  { key: 'tonne', label: 'tonne', kg: 1000 },
] as const;

export const FARMING_TYPES = ['Crops', 'Livestock', 'Mixed', 'Horticulture'];
export const PROVINCES = ['Harare', 'Mashonaland East', 'Mashonaland West', 'Mashonaland Central', 'Midlands', 'Manicaland', 'Masvingo'];
