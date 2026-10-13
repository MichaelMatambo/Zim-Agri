/**
 * GIS engine: everything here runs on the phone with Turf.js and bundled data (no network).
 *
 * DATA (assets/data, built by scripts/build_data.py from the research files):
 *  - grid.json     ~4,300 model cells (~3 km) of East Zimbabwe: rainfall, rainfall CV, temperature, elevation,
 *                  slope, soil pH, distance to surface water, and the model's 0-100 suitability index for 15 crops.
 *  - crop_requirements.json  [absMin, optMin, optMax, absMax] thresholds per crop (used for reasons + extra crops).
 *  - services.json 230 agricultural services (markets, depots, extension, agro-dealers, vets, finance, storage...).
 *  - rivers.json   simplified river/stream lines.
 *  - geojson/wards.json (illustrative ward polygons for ward detection / coarse fallback), geojson/basemap.json (offline outline, roads, towns).
 * The grid and most service points are PROTOTYPE data (data_type synthetic_*); the UI shows this to the user.
 */
import * as turf from '@turf/turf';
import { CROPS, cropByName, Crop } from '../constants/crops';

const gridData = require('../assets/data/grid.json');
const svcData = require('../assets/data/services.json');
const riverData = require('../assets/data/rivers.json');
const reqData = require('../assets/data/crop_requirements.json');
const wardsData = require('../assets/geojson/wards.json');
export const basemap = require('../assets/geojson/basemap.json');

export type LatLon = { lat: number; lon: number };
export const TRANSPORT_USD_PER_KM = 0.5; // brief: transport cost = distance x 0.5 USD
const pt = (p: LatLon) => turf.point([p.lon, p.lat]); // GeoJSON order is [lon, lat]
const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));

// ───────────────────────── Crop requirements ─────────────────────────
type Req = { id: string; name: string; water: string; rain: number[] | null; temp: number[]; ph: number[]; slope: number[]; window?: string; cycle_days?: string; extra?: boolean };
const REQ: Record<string, Req> = {};
(reqData.crops as Req[]).forEach((c) => (REQ[c.id] = c));
const ORIGINAL_IDS = (reqData.crops as Req[]).filter((c) => !c.extra).map((c) => c.id); // order of grid "scores"
export const requirementOf = (suitId: string) => REQ[suitId];

// factor: 1 = optimal, 0.5 = tolerable, 0 = outside range (same rule as the GEE script)
const factor = (v: number, r: number[] | null) => (r === null ? 1 : v >= r[1] && v <= r[2] ? 1 : v >= r[0] && v <= r[3] ? 0.5 : 0);

// ───────────────────────── Grid cells + spatial index ─────────────────────────
export type Cell = { x0: number; y0: number; w: number; h: number; rain: number; cv: number; temp: number; elev: number; slope: number; ph: number; dw: number; scores: number[] };
export const GRID_BBOX: number[] = gridData.bbox; // [west, south, east, north]
let cells: Cell[] | null = null;
const buckets = new Map<string, number[]>();
const bkey = (lon: number, lat: number) => `${Math.floor(lon * 10)}|${Math.floor(lat * 10)}`;
function ensureGrid() {
  if (cells) return cells;
  cells = (gridData.cells as any[]).map((a) => ({ x0: a[0], y0: a[1], w: a[2], h: a[3], rain: a[4], cv: a[5], temp: a[6], elev: a[7], slope: a[8], ph: a[9], dw: a[10], scores: a[11] }));
  cells.forEach((c, i) => {
    for (let x = Math.floor(c.x0 * 10); x <= Math.floor((c.x0 + c.w) * 10); x++)
      for (let y = Math.floor(c.y0 * 10); y <= Math.floor((c.y0 + c.h) * 10); y++) {
        const k = `${x}|${y}`; (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(i);
      }
  });
  return cells;
}
export const inGrid = (p: LatLon) => p.lon >= GRID_BBOX[0] && p.lon <= GRID_BBOX[2] && p.lat >= GRID_BBOX[1] && p.lat <= GRID_BBOX[3];

/** Which model cell contains the point? Bucket lookup, then turf.booleanPointInPolygon on the candidate cell. */
export function cellAt(p: LatLon): (Cell & { approx?: boolean }) | null {
  const all = ensureGrid();
  if (!inGrid(p)) return null;
  const point = pt(p);
  const cand = buckets.get(bkey(p.lon, p.lat)) ?? [];
  for (const i of cand) {
    const c = all[i];
    if (turf.booleanPointInPolygon(point, turf.bboxPolygon([c.x0, c.y0, c.x0 + c.w, c.y0 + c.h]))) return c;
  }
  // tiny gaps between cells: take the nearest cell centre within ~4 km
  let best: Cell | null = null, bd = 0.04;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    for (const i of buckets.get(`${Math.floor(p.lon * 10) + dx}|${Math.floor(p.lat * 10) + dy}`) ?? []) {
      const c = all[i]; const d = Math.hypot(c.x0 + c.w / 2 - p.lon, c.y0 + c.h / 2 - p.lat);
      if (d < bd) { bd = d; best = c; }
    }
  }
  return best ? { ...best, approx: true } : null;
}
export const cellPolygon = (c: Cell) => [
  { latitude: c.y0, longitude: c.x0 }, { latitude: c.y0, longitude: c.x0 + c.w },
  { latitude: c.y0 + c.h, longitude: c.x0 + c.w }, { latitude: c.y0 + c.h, longitude: c.x0 },
];

export function envAt(p: LatLon) {
  const c = cellAt(p);
  if (!c) return null;
  const risk = c.cv >= 30 ? 'High' : c.cv >= 20 ? 'Moderate' : 'Low';
  return { rain: c.rain, cv: c.cv, temp: c.temp, elev: c.elev, slope: c.slope, ph: c.ph, waterKm: c.dw, rainRisk: risk };
}

// ───────────────────────── (a) Crop suitability ─────────────────────────
export type Suitability = {
  level: 'High' | 'Moderate' | 'Marginal' | 'Not suitable' | 'Unknown'; index: number; reason: string; limiting: string[];
  source: 'grid' | 'ward' | 'none'; proxy?: boolean; irrigated?: boolean; ward?: string; district?: string;
};
const levelOf = (i: number) => (i >= 90 ? 'High' : i >= 60 ? 'Moderate' : i >= 1 ? 'Marginal' : 'Not suitable') as Suitability['level'];

const FACT: { k: 'rain' | 'temp' | 'ph' | 'slope'; label: string; unit: string }[] = [
  { k: 'rain', label: 'Rainfall', unit: ' mm' }, { k: 'temp', label: 'Temperature', unit: ' °C' }, { k: 'ph', label: 'Soil pH', unit: '' }, { k: 'slope', label: 'Slope', unit: '°' },
];

/** Index for one cell + crop: the model's stored score for the 15 original crops; recomputed from raw values for the extras. */
export function indexFor(c: Cell, suitId: string): number {
  const at = ORIGINAL_IDS.indexOf(suitId);
  if (at >= 0 && c.scores && c.scores[at] != null) return c.scores[at];
  const r = REQ[suitId]; if (!r) return 0;
  const fs = [...(r.rain ? [factor(c.rain, r.rain)] : []), factor(c.temp, r.temp), factor(c.ph, r.ph), factor(c.slope, r.slope)];
  return Math.min(...fs) === 0 ? 0 : Math.round((fs.reduce((a, b) => a + b, 0) / fs.length) * 100);
}

/** checkSuitability(userPoint, crop): cell lookup (point in polygon) -> model index -> plain-language reason. */
export function checkSuitability(p: LatLon, cropName: string): Suitability {
  const crop = cropByName(cropName); const req = crop && REQ[crop.suit];
  if (!crop || !req) return { level: 'Unknown', index: 0, reason: 'No requirement data for this crop.', limiting: [], source: 'none' };
  const c = cellAt(p);
  if (!c) return wardFallback(p, crop, req);
  const index = indexFor(c, crop.suit);
  const limiting: string[] = []; const notes: string[] = [];
  for (const f of FACT) {
    const range = req[f.k] as number[] | null; if (!range) continue;
    const v = c[f.k]; const fv = factor(v, range);
    if (fv === 1) continue;
    const side = v < range[1] ? `below the best range (${range[1]}-${range[2]}${f.unit})` : `above the best range (${range[1]}-${range[2]}${f.unit})`;
    limiting.push(f.label); notes.push(`${f.label} ${v}${f.unit} is ${fv === 0 ? 'outside the workable range and ' : ''}${side}`);
  }
  const irrigated = req.rain === null;
  const reason = (notes.length ? notes.join('. ') + '.' : 'Rainfall, temperature, soil pH and slope are all in the best range.')
    + (irrigated ? ' Needs irrigation (rain is not limiting in this model).' : '');
  return { level: levelOf(index), index, reason, limiting, source: 'grid', proxy: crop.proxy, irrigated };
}

// Outside the model grid we only have illustrative ward polygons: coarse, rainfall-based estimate.
function wardFallback(p: LatLon, crop: Crop, req: Req): Suitability {
  const w = findWard(p);
  if (!w) return { level: 'Unknown', index: 0, reason: 'This point is outside the model area (East Zimbabwe) and the ward data.', limiting: [], source: 'none' };
  const f = req.rain ? factor(w.rainfall_mm, req.rain) : 1;
  const index = f === 1 ? 75 : f === 0.5 ? 45 : 0;
  return { level: levelOf(index), index, source: 'ward', ward: w.ward_name, district: w.district, limiting: f === 1 ? [] : ['Rainfall'], proxy: crop.proxy,
    reason: `Coarse estimate only (outside the model grid): ${w.ward_name} gets about ${w.rainfall_mm} mm a year, ${f === 1 ? 'inside' : 'outside'} the best range for ${crop.name}.` };
}

/** Rank every crop at this point (unique requirement sets, proxies skipped). */
export function rankCrops(p: LatLon, n = 5) {
  const c = cellAt(p); if (!c) return [];
  const seen = new Set<string>();
  return CROPS.filter((x) => !x.proxy && !seen.has(x.suit) && seen.add(x.suit))
    .map((crop) => ({ crop, index: indexFor(c, crop.suit) }))
    .sort((a, b) => b.index - a.index).slice(0, n).map((r) => ({ ...r, level: levelOf(r.index) }));
}

// ───────────────────────── Services (markets, extension, inputs, vets, finance...) ─────────────────────────
export type Service = { id: string; name: string; group: string; subtype: string; town: string; district: string; crops: string[]; services: string[]; lon: number; lat: number; quality: 'sourced' | 'placeholder'; cap: number | null; hours: string | null; phone: string | null };
export const SERVICES: Service[] = (svcData as any[]).map((s) => ({ id: s.id, name: s.n, group: s.g, subtype: s.s, town: s.t, district: s.d, crops: (s.c || '').split(',').filter(Boolean), services: (s.v || '').split(',').filter(Boolean), lon: s.lo, lat: s.la, quality: s.q, cap: s.cap, hours: s.h, phone: s.ph }));

export const KINDS: Record<string, { label: string; icon: string; color: string; subtypes: string[] }> = {
  market: { label: 'Markets & depots', icon: 'storefront', color: '#F5A400', subtypes: ['produce_market', 'wholesale_market', 'grain_depot'] },
  extension: { label: 'Agritex & research', icon: 'account-tie', color: '#7E57C2', subtypes: ['extension_office', 'research_station', 'soil_lab'] },
  input: { label: 'Seed & fertiliser', icon: 'sack', color: '#8B5A2B', subtypes: ['agro_dealer', 'seed_depot', 'fertiliser_depot'] },
  vet: { label: 'Vets', icon: 'medical-bag', color: '#D93B3B', subtypes: ['vet_clinic'] },
  finance: { label: 'Finance', icon: 'bank', color: '#00897B', subtypes: ['bank_branch', 'microfinance', 'crop_insurance_agent'] },
  storage: { label: 'Storage', icon: 'warehouse', color: '#546E7A', subtypes: ['silo', 'cold_storage', 'warehouse'] },
  water: { label: 'Water schemes', icon: 'water-pump', color: '#1E88E5', subtypes: ['irrigation_scheme', 'dam', 'borehole', 'pumping_station'] },
  processing: { label: 'Processing', icon: 'factory', color: '#6D4C41', subtypes: ['maize_mill', 'cannery', 'sugar_mill', 'tea_coffee_factory', 'tobacco_grading_depot', 'abattoir', 'oilseed_press', 'cotton_ginnery', 'nut_fruit_processing'] },
  machinery: { label: 'Machinery', icon: 'tractor', color: '#455A64', subtypes: ['repair_workshop', 'tractor_dealer', 'irrigation_equipment'] },
};
export const kindOf = (s: Service) => Object.keys(KINDS).find((k) => KINDS[k].subtypes.includes(s.subtype)) ?? 'market';
export const prettySubtype = (s: string) => s.replace(/_/g, ' ');

export function nearestServices(p: LatLon, kind: string, n = 3) {
  const from = pt(p); const st = KINDS[kind].subtypes;
  return SERVICES.filter((s) => st.includes(s.subtype))
    .map((s) => { const km = turf.distance(from, turf.point([s.lon, s.lat]), { units: 'kilometers' }); return { ...s, distance_km: r1(km), road_km: r1(km * 1.3), transport_cost_usd: Math.round(km * TRANSPORT_USD_PER_KM * 100) / 100 }; })
    .sort((a, b) => a.distance_km - b.distance_km).slice(0, n);
}

// ───────────────────────── (b) Market accessibility ─────────────────────────
/** getNearestMarkets: turf.distance to every market/depot, sort, 3 nearest with transport cost = km x USD 0.5. */
export const getNearestMarkets = (p: LatLon, n = 3) => nearestServices(p, 'market', n);

// ───────────────────────── (c) Proximity to water ─────────────────────────
type Line = { name: string; bbox: number[]; coords: number[][] };
const LINES: Line[] = [
  ...(riverData.lines as number[][][]).map((c) => ({ name: 'River / stream', coords: c })),
  ...(riverData.named as any[]).map((n) => ({ name: n.n as string, coords: n.c as number[][] })),
].map((l) => { const xs = l.coords.map((c) => c[0]), ys = l.coords.map((c) => c[1]); return { ...l, bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] }; });
export const riverCoords: number[][][] = LINES.map((l) => l.coords); // [lon, lat] pairs, drawn by the WebView map
const bboxKm = (p: LatLon, b: number[]) => { const dx = Math.max(b[0] - p.lon, 0, p.lon - b[2]) * 105, dy = Math.max(b[1] - p.lat, 0, p.lat - b[3]) * 111; return Math.hypot(dx, dy); };

/** getNearestWater: turf.pointToLineDistance on river lines (bbox pre-filter keeps it fast) + snapped point for drawing. */
export function getNearestWater(p: LatLon) {
  const from = pt(p);
  const order = LINES.map((l) => ({ l, lb: bboxKm(p, l.bbox) })).sort((a, b) => a.lb - b.lb);
  let best: { l: Line; d: number } | null = null;
  for (const { l, lb } of order) {
    if (best && lb >= best.d) break;
    const d = turf.pointToLineDistance(from, turf.lineString(l.coords), { units: 'kilometers' });
    if (!best || d < best.d) best = { l, d };
  }
  if (!best) return null;
  const snap = turf.nearestPointOnLine(turf.lineString(best.l.coords), from).geometry.coordinates;
  const km = r1(best.d); const cell = cellAt(p);
  const scheme = nearestServices(p, 'water', 1)[0];
  const irrigation = km <= 5 ? 'Good: irrigation and garden crops are feasible' : km <= 20 ? 'Moderate: consider a shared pump or borehole' : 'Far: plan rain-fed crops or a borehole';
  return { name: best.l.name, distance_km: km, irrigation, snap: { lat: snap[1], lon: snap[0] }, surface_water_km: cell ? cell.dw : null, scheme };
}

// ───────────────────────── (d) Service accessibility ─────────────────────────
/** getNearestExpert: nearest Agritex / extension office (falls back to any extension service). */
export const getNearestExpert = (p: LatLon) => nearestServices(p, 'extension', 200).find((x) => x.subtype === 'extension_office') ?? nearestServices(p, 'extension', 1)[0] ?? null;
export const expertsWithDistance = (p: LatLon | null, kind = 'extension') =>
  (p ? nearestServices(p, kind, 200) : SERVICES.filter((s) => KINDS[kind].subtypes.includes(s.subtype)).map((s) => ({ ...s, distance_km: null as number | null, road_km: 0, transport_cost_usd: 0 })));

// ───────────────────────── (e) Weighted overlay: farm score ─────────────────────────
/** Multi-criteria score 0-100: crop suitability 50%, market access 25%, water 15%, extension access 10%. Weights are indicative. */
export function farmScore(p: LatLon, cropName: string) {
  const suit = checkSuitability(p, cropName);
  const m = getNearestMarkets(p, 1)[0]; const w = getNearestWater(p); const e = getNearestExpert(p);
  const parts = [
    { key: 'suit', label: 'Crop suitability', weight: 0.5, value: suit.index, detail: suit.level },
    { key: 'market', label: 'Market access', weight: 0.25, value: m ? clamp(100 - m.distance_km / 1.5) : 0, detail: m ? `${m.distance_km} km` : '-' },
    { key: 'water', label: 'Water access', weight: 0.15, value: w ? clamp(100 * (1 - (w.distance_km - 2) / 38)) : 0, detail: w ? `${w.distance_km} km` : '-' },
    { key: 'ext', label: 'Extension access', weight: 0.1, value: e ? clamp(100 - e.distance_km / 0.8) : 0, detail: e ? `${e.distance_km} km` : '-' },
  ];
  const score = Math.round(parts.reduce((a, x) => a + x.value * x.weight, 0));
  return { score, label: score >= 75 ? 'Excellent' : score >= 55 ? 'Good' : score >= 35 ? 'Fair' : 'Poor', parts };
}

// ───────────────────────── Catchment + routes (for the map) ─────────────────────────
/** Everything within radiusKm of the point (turf.circle + distance). */
export function catchment(p: LatLon, radiusKm = 25) {
  const from = pt(p);
  const counts: Record<string, number> = {};
  for (const s of SERVICES) if (turf.distance(from, turf.point([s.lon, s.lat]), { units: 'kilometers' }) <= radiusKm) counts[kindOf(s)] = (counts[kindOf(s)] ?? 0) + 1;
  const ring = turf.circle(from, radiusKm, { steps: 48, units: 'kilometers' }).geometry.coordinates[0].map(([lo, la]) => ({ latitude: la, longitude: lo }));
  return { counts, ring };
}
export function routesFor(p: LatLon) {
  const m = getNearestMarkets(p, 1)[0]; const e = getNearestExpert(p); const w = getNearestWater(p);
  const a = { latitude: p.lat, longitude: p.lon };
  return [
    m && { key: 'market', color: '#F5A400', coords: [a, { latitude: m.lat, longitude: m.lon }] },
    e && { key: 'extension', color: '#7E57C2', coords: [a, { latitude: e.lat, longitude: e.lon }] },
    w && { key: 'water', color: '#1E88E5', coords: [a, { latitude: w.snap.lat, longitude: w.snap.lon }] },
  ].filter(Boolean) as { key: string; color: string; coords: { latitude: number; longitude: number }[] }[];
}

// ───────────────────────── Map helpers (viewport culling keeps the map fast) ─────────────────────────
type Region = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
const inRegion = (lo: number, la: number, r: Region, pad = 0.1) => Math.abs(la - r.latitude) <= r.latitudeDelta * (0.5 + pad) && Math.abs(lo - r.longitude) <= r.longitudeDelta * (0.5 + pad);
export const riversInRegion = (r: Region, cap = 120) => LINES.filter((l) => !(l.bbox[2] < r.longitude - r.longitudeDelta / 2 || l.bbox[0] > r.longitude + r.longitudeDelta / 2 || l.bbox[3] < r.latitude - r.latitudeDelta / 2 || l.bbox[1] > r.latitude + r.latitudeDelta / 2))
  .slice(0, cap).map((l) => l.coords.map(([lo, la]) => ({ latitude: la, longitude: lo })));
export const servicesInRegion = (r: Region, kinds: string[], cap = 70) => SERVICES.filter((s) => kinds.includes(kindOf(s)) && inRegion(s.lon, s.lat, r)).slice(0, cap);

// ───────────────────────── Zimbabwe + ward helpers ─────────────────────────
const country = basemap.features.find((f: any) => f.properties.kind === 'country');
export const inZimbabwe = (p: LatLon) => turf.booleanPointInPolygon(pt(p), country);
export const countryCoords = country.geometry.coordinates[0].map(([lo, la]: number[]) => ({ latitude: la, longitude: lo }));
export const roadLines = basemap.features.filter((f: any) => f.properties.kind === 'road').map((f: any) => f.geometry.coordinates.map(([lo, la]: number[]) => ({ latitude: la, longitude: lo })));
export const towns = basemap.features.filter((f: any) => f.properties.kind === 'town').map((f: any) => ({ name: f.properties.name as string, latitude: f.geometry.coordinates[1] as number, longitude: f.geometry.coordinates[0] as number }));
export const wardProps: any[] = wardsData.features.map((f: any) => f.properties);

/** Point-in-polygon ward detection (illustrative ward polygons); nearest centroid within 60 km as fallback. */
export function findWard(p: LatLon) {
  const point = pt(p);
  for (const w of wardsData.features) if (turf.booleanPointInPolygon(point, w)) return w.properties as any;
  let best: any = null, bd = Infinity;
  for (const w of wardsData.features) { const d = turf.distance(point, turf.centroid(w), { units: 'kilometers' }); if (d < bd) { bd = d; best = w.properties; } }
  return bd < 60 ? { ...best, approximate: true } : null;
}

/** One call for the map analysis panel. */
export function fullReport(p: LatLon, crop: string) {
  return { env: envAt(p), suitability: checkSuitability(p, crop), ranking: rankCrops(p, 5), markets: getNearestMarkets(p, 3), water: getNearestWater(p), expert: getNearestExpert(p), score: farmScore(p, crop), within: catchment(p, 25) };
}
