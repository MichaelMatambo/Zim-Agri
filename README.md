# ZimAgri Farmer: HGISE0400 Digital Agricultural Decision-Support Platform

Offline-first React Native (Expo SDK 51, TypeScript) app for Zimbabwe's young crop farmers.
No screen scrolls vertically: lists are paged, forms are short steps, tabs can be swiped.

## Run
    npm install
    npx expo install --fix
    npx expo start        (scan with Expo Go on your phone; do not use the web preview)

## Data (assets/data, built by scripts/build_data.py from the research files)
- grid.json: ~4,300 model cells (~3 km) of East Zimbabwe with rainfall, rainfall variability, temperature, elevation, slope, soil pH,
  distance to water and the model's 0-100 suitability index for 15 crops (prototype, data_type=synthetic_model).
- crop_requirements.json: indicative thresholds [absMin, optMin, optMax, absMax]; 6 extra crops (groundnuts, sorghum, millets, soya,
  sunflower, cotton) were added with the same method and are flagged extra:true.
- services.json: 230 agricultural services (markets, depots, Agritex, agro-dealers, vets, finance, storage, processing...).
  Only 23 are approximate real locations; the rest are placeholders. The app labels them.
- rivers.json: 599 simplified river/stream lines. overlays/*.png: pre-rendered map layers (26).
- assets/geojson/wards.json (illustrative ward polygons, used for ward detection) and basemap.json (outline, roads, towns) are approximate.
To refresh after re-exporting from Earth Engine: python3 scripts/build_data.py <folder with the source files>

## GIS analyses (services/gis.ts, commented for the lecturer)
1. Crop suitability: point -> grid cell (Turf booleanPointInPolygon) -> model index + plain-language reason; ranks best crops.
2. Market accessibility: Turf distance to markets/depots, 3 nearest, transport cost = km x USD 0.5.
3. Proximity to water: Turf pointToLineDistance to river lines (+ model distance to permanent water).
4. Service accessibility: nearest Agritex office; counts of services within 25 km (turf.circle).
5. Weighted overlay farm score: suitability 50%, market 25%, water 15%, extension 10% (indicative weights).
Map: OSM tiles when online (cached for offline), always-on offline vector basemap, model layer overlays (suitability, rainfall, temperature,
pH, elevation, water), routes to nearest market / Agritex / water. Outside East Zimbabwe only a coarse rainfall estimate is shown.

## Offline-first
SQLite (expo-sqlite + drizzle) is the source of truth; every write has sync_status pending/synced/failed; services/sync.ts pushes
to Firestore when NetInfo is online (last write wins). Photos are compressed on the phone; a small thumbnail syncs with the listing.
"# Zim-Agri" 
