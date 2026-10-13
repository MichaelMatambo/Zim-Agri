import { info_articles } from './schema';

// Offline best-practice content (general guidance for Zimbabwe; confirm local rates with Agritex).
const A = (id: string, crop: string, topic: string, title: string, body_md: string) => ({ id, crop, topic, title, body_md });

const ARTICLES = [
  A('maize-prep', 'Maize', 'Land preparation', 'Maize: land preparation',
`# Land preparation
- Prepare early, before the first effective rains (October–November).
- **Conservation agriculture (Pfumvudza):** plant on 16 m x 39 m plots with permanent planting stations and mulch.
- Conventional: ridge or plough to 20–25 cm; remove weeds and previous crop residues.
- Correct soil acidity with lime where pH is below 5.0 (soil test at Agritex).
- Best soils: well drained loams, sandy loams and red clays.`),
  A('maize-spacing', 'Maize', 'Spacing & planting', 'Maize: spacing and planting',
`# Spacing
- Rows **90 cm** apart, plants **25 cm** apart in the row, 1 seed per station = about 44,000 plants per ha.
- Plant depth 5 cm. Plant with the first effective rains (25+ mm).
- Choose the variety by season length: *early* (SC403, ZM523) for Natural Regions III–V, *medium* (SC513, SC637) and *late* (SC719, SC727) for IIa–IIb.
- Late planting cuts yield by roughly 1–2% per day after early December.`),
  A('maize-fert', 'Maize', 'Fertilizer rates', 'Maize: fertilizer rates',
`# Fertilizer (typical guide per hectare)
- **Basal:** Compound D (7:14:7) at 300–400 kg/ha at planting.
- **Top dressing:** Ammonium Nitrate (AN) at 200–300 kg/ha in two splits, 3–4 and 6–7 weeks after emergence.
- Smallholder Pfumvudza plot (1,444 m²): about 5 kg compound D + 4 kg AN in two splits.
- Use manure (5–10 t/ha) to build soil organic matter.
- Rates depend on soil type and rainfall zone; confirm with your Agritex officer.`),
  A('maize-pests', 'Maize', 'Pests & diseases', 'Maize: pests and diseases',
`# Pests
- **Fall armyworm:** scout weekly from emergence; look for windowing and frass in the whorl. Hand-pick egg masses; spray registered products early.
- **Stalk borer:** remove crop residues; early planting.
- **Grey leaf spot and maize streak:** use tolerant varieties; rotate with legumes.
- Store grain dry (12.5% moisture) in clean, treated storage to avoid weevils and larger grain borer.`),
  A('gnuts-prep', 'Groundnuts', 'Land preparation', 'Groundnuts: land preparation',
`# Land preparation
- Prefer **light sandy or sandy-loam soils** with good drainage; heavy clay makes pod harvesting difficult.
- Fine, weed-free seedbed; rotate after a cereal (not after groundnuts or beans).
- Apply lime or gypsum where calcium is low (pods need calcium).`),
  A('gnuts-spacing', 'Groundnuts', 'Spacing & planting', 'Groundnuts: spacing and planting',
`# Spacing
- Bunch types (Nyanda, Ilanda, Jesa): rows **45 cm**, plants **10-15 cm**.
- Runner (Natal Common): rows 60 cm.
- Use certified or well-selected seed, 2 seeds per station, depth 5 cm.
- Shell just before planting; do not damage the seed coat.`),
  A('gnuts-fert', 'Groundnuts', 'Fertilizer rates', 'Groundnuts: fertilizer rates',
`# Fertilizer
- Groundnuts fix their own nitrogen. Apply **single super phosphate** 200-250 kg/ha or compound D 150 kg/ha at planting.
- Add **gypsum** (about 400 kg/ha) at flowering on low-calcium soils.
- Avoid excessive nitrogen; it promotes leaves over pods.`),
  A('gnuts-pests', 'Groundnuts', 'Pests & diseases', 'Groundnuts: pests and diseases',
`# Pests and diseases
- **Early and late leaf spot, rosette virus:** plant on time, rogue infected plants, use tolerant varieties.
- **Aflatoxin:** dry pods fast in the sun (below 8% moisture), keep off bare soil, discard mouldy nuts. Aflatoxin can block sales.
- Aphids spread rosette: dense planting reduces spread.`),
  A('sorghum-prep', 'Sorghum', 'Land preparation', 'Sorghum: land preparation',
`# Land preparation
- Sorghum tolerates heat and dry spells; ideal for Natural Regions III–V.
- Well-drained loam or clay-loam; avoid waterlogging.
- Prepare a fine seedbed; plant after the first good rains (November–December).`),
  A('sorghum-spacing', 'Sorghum', 'Spacing & planting', 'Sorghum: spacing and planting',
`# Spacing
- Rows **75 cm**, plants **15 cm** (about 90,000 plants per ha); thin to 1 plant per station after emergence.
- Depth 3 cm. Varieties: Macia (white, early), SV1, SV4.
- Protect seed from birds at grain fill (early morning scaring, netting).`),
  A('sorghum-fert', 'Sorghum', 'Fertilizer rates', 'Sorghum: fertilizer rates',
`# Fertilizer
- Basal: Compound D 150-200 kg/ha at planting.
- Top dress: AN 100-150 kg/ha 4–5 weeks after emergence when rainfall is adequate.
- Use manure where possible; sorghum responds well to organic inputs.`),
  A('sorghum-pests', 'Sorghum', 'Pests & diseases', 'Sorghum: pests and diseases',
`# Pests
- **Quelea and other birds:** the biggest loss; plant together with neighbours to share scaring.
- **Stalk borer, sorghum midge, shoot fly:** early planting and clean fields.
- **Striga (witchweed):** hand-pull before seeding; rotate with cowpeas or groundnuts.`),
  A('soya-general', 'Soya Beans', 'Guide', 'Soya beans: quick guide',
`# Quick guide
- Best in Natural Regions II–III on well-drained loams.
- Rows 45 cm, 5-7 cm in the row; inoculate seed with rhizobium.
- Basal: single super phosphate 200 kg/ha; no nitrogen needed.
- Plant early to mid-December; varieties Solitaire and Safari suit local conditions.`),
  A('marketing', 'General', 'Marketing', 'Getting a better price',
`# Selling smarter
- Grade and clean produce: buyers pay more for dry, clean, uniform grain.
- Sell as a **group** to reach GMB depots, millers and Musika traders at better prices.
- Compare the 3 nearest markets on the Map tab; transport cost can erase a higher price.
- Keep records on the Farm tab so you know your real cost per kg.`),
];

export function seedArticles(db: any) {
  const existing = db.select().from(info_articles).all();
  if (existing.length >= ARTICLES.length) return;
  for (const a of ARTICLES) db.insert(info_articles).values(a).onConflictDoUpdate({ target: info_articles.id, set: a }).run();
}
