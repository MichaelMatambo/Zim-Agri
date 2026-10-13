import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, MIcon, Picker, T, Row, Badge } from '../../components/UI';
import { CROPS, shortName, cropByName } from '../../constants/crops';
import { OVERLAY_BOUNDS } from '../../constants/overlays';
import { OVERLAY_DATA } from '../../constants/overlayData';
import { MAP_HTML } from '../../constants/mapHtml';
import { fullReport, cellAt, cellPolygon, routesFor, kindOf, KINDS, SERVICES, countryCoords, roadLines, towns, riverCoords, LatLon, prettySubtype } from '../../services/gis';
import { getZimPoint } from '../../services/location';
import { useSync } from '../../services/sync';
import { C, s, suitColor, CLASS_COLOR, shadow } from '../../constants/theme';

/**
 * The map is Leaflet running inside a WebView (bundled offline, no Google Maps key or Play Services needed), so it renders
 * the same on every phone. Vector layers (outline, roads, rivers, services) and the model raster layers work with NO internet;
 * OpenStreetMap tiles are added on top when online. Taps are sent to React Native, which runs the Turf analyses.
 */
const LAYERS: Record<string, { label: string; icon: string; overlay?: string; stops?: string[]; lo?: string; hi?: string }> = {
  suit: { label: 'Suitability', icon: 'sprout' },
  rain: { label: 'Rainfall', icon: 'weather-rainy', overlay: 'rain', stops: ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'], lo: '300 mm', hi: '1500 mm' },
  temp: { label: 'Temperature', icon: 'thermometer', overlay: 'temp', stops: ['#313695', '#74add1', '#ffffbf', '#f46d43', '#a50026'], lo: '12 °C', hi: '30 °C' },
  ph: { label: 'Soil pH', icon: 'flask-outline', overlay: 'ph', stops: ['#d73027', '#fee08b', '#1a9850', '#4575b4'], lo: 'pH 4.5', hi: 'pH 8' },
  elev: { label: 'Elevation', icon: 'terrain', overlay: 'elev', stops: ['#2b83ba', '#abdda4', '#ffffbf', '#fdae61', '#d7191c'], lo: '0 m', hi: '2500 m' },
  dwater: { label: 'Distance to water', icon: 'water', overlay: 'dwater', stops: ['#08306b', '#6baed6', '#f7fbff'], lo: '0 km', hi: '30 km' },
};
const TABS = [{ k: 'score', i: 'gauge', l: 'Score' }, { k: 'crop', i: 'sprout', l: 'Crop' }, { k: 'market', i: 'storefront', l: 'Market' }, { k: 'water', i: 'water', l: 'Water' }, { k: 'svc', i: 'account-tie', l: 'Services' }];

// data sent once to the WebView
const INIT = {
  country: countryCoords.map((p: any) => [p.latitude, p.longitude]),
  roads: roadLines.map((l: any[]) => l.map((p) => [p.latitude, p.longitude])),
  towns: towns.map((t: any) => ({ n: t.name, la: t.latitude, lo: t.longitude })),
  rivers: riverCoords,
  services: SERVICES.map((x) => { const k = kindOf(x); return { n: x.name, st: prettySubtype(x.subtype), t: x.town, la: x.lat, lo: x.lon, k, c: KINDS[k].color, q: x.quality }; }),
};
export default function MapScreen() {
  const { top } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { online } = useSync();
  const web = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Loading map…');
  const [crop, setCrop] = useState('Maize');
  const [layer, setLayer] = useState('suit');
  const [pin, setPin] = useState<LatLon | null>(null);
  const [tab, setTab] = useState('score');
  const [note, setNote] = useState('');
  const [base, setBase] = useState<'osm' | 'vector'>('osm');
  const [show, setShow] = useState<Record<string, boolean>>({ market: true, extension: false, input: false, rivers: true, roads: true, ring: false });
  const panelH = Math.min(270, Math.round(height * 0.36));

  const report = useMemo(() => (pin ? fullReport(pin, crop) : null), [pin, crop]);
  const overlayKey = layer === 'suit' ? 's_' + (cropByName(crop)?.suit ?? 'maize') : LAYERS[layer].overlay!;
  const L = LAYERS[layer];

  const send = (name: string, payload: any) => web.current?.injectJavaScript(`window.cmd(${JSON.stringify(name)},${JSON.stringify(payload)});true;`);

  useEffect(() => { if (ready) { send('init', INIT); setStatus(''); } }, [ready]);
  useEffect(() => { if (ready) send('base', base); }, [ready, base]);
  useEffect(() => { if (ready) send('show', show); }, [ready, show]);
  useEffect(() => {
    if (!ready) return;
    send('overlay', { uri: OVERLAY_DATA[overlayKey], s: OVERLAY_BOUNDS.south, w: OVERLAY_BOUNDS.west, n: OVERLAY_BOUNDS.north, e: OVERLAY_BOUNDS.east, o: 0.8 });
  }, [ready, overlayKey]);
  useEffect(() => {
    if (!ready) return;
    if (!pin) return send('pin', null);
    const cell = cellAt(pin);
    send('pin', { lat: pin.lat, lon: pin.lon, cell: cell ? cellPolygon(cell).map((p) => [p.latitude, p.longitude]) : null,
      ring: show.ring && report ? report.within.ring.map((p) => [p.latitude, p.longitude]) : null,
      routes: routesFor(pin).map((r) => ({ color: r.color, coords: r.coords.map((p) => [p.latitude, p.longitude]) })) });
  }, [ready, pin, show.ring, report]);

  const onMessage = (e: any) => {
    let m: any; try { m = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (m.type === 'ready') setReady(true);
    else if (m.type === 'tap') { setPin({ lat: m.lat, lon: m.lon }); setNote(''); }
    else if (m.type === 'log') setNote(String(m.msg).slice(0, 120));
  };
  const locate = async () => {
    const g = await getZimPoint();
    setPin(g.point); setNote(g.note ?? '');
    send('fly', { lat: g.point.lat, lon: g.point.lon, z: 11 });
  };
  const tog = (k: string) => setShow((x) => ({ ...x, [k]: !x[k] }));
  // small labelled pill buttons so every control says what it does
  const sideBtn = (k: string, icon: string, color: string, on: boolean, label: string, press: () => void) => (
    <Pressable key={k} onPress={press} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', height: 30, paddingHorizontal: 9, borderRadius: 15, backgroundColor: on ? color : '#fff', marginBottom: 5, ...shadow }}>
      <MIcon name={icon} size={15} color={on ? '#fff' : color} />
      <Text style={{ marginLeft: 5, fontSize: s(10), fontWeight: '800', color: on ? '#fff' : C.ink }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#DCE6EA' }}>
      <WebView ref={web} style={{ flex: 1, backgroundColor: '#DCE6EA' }} originWhitelist={['*']} source={{ html: MAP_HTML, baseUrl: 'https://zimagri.app/' }}
        javaScriptEnabled domStorageEnabled onMessage={onMessage} overScrollMode="never" setSupportMultipleWindows={false}
        onError={(e) => setStatus('Map failed to load: ' + e.nativeEvent.description)} onHttpError={(e) => setNote('Map tiles error ' + e.nativeEvent.statusCode)} />
      {!!status && <View style={{ position: 'absolute', top: '40%', alignSelf: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 12, ...shadow }}><Text style={{ fontWeight: '700' }}>{status}</Text></View>}

      {/* top bar: crop + layer pickers */}
      <View style={{ position: 'absolute', top: top + 8, left: 10, right: 10 }}>
        <Row style={{ gap: 8 }}>
          <Picker compact label="Crop" value={crop} icon="sprout" options={CROPS.map((c) => ({ value: c.name, label: c.name, icon: c.icon, sub: c.group }))} onChange={(v) => { setCrop(v); setLayer('suit'); }} />
          <Picker compact label="Layer" value={layer} options={Object.entries(LAYERS).map(([k, v]) => ({ value: k, label: v.label, icon: v.icon }))} onChange={setLayer} searchable={false} />
        </Row>
        <View style={{ alignSelf: 'flex-start', backgroundColor: '#ffffffE6', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 }}>
          <Text style={{ fontSize: s(10), fontWeight: '800', color: '#546E7A' }}>{base === 'osm' ? (online ? 'Street map + model layer' : 'Offline: outline + model layer') : 'Offline outline + model layer'}</Text>
        </View>
        {!!note && <View style={{ backgroundColor: '#FFF3D1', borderRadius: 10, padding: 6, marginTop: 6 }}><Text style={{ fontSize: s(11), fontWeight: '700', color: '#8A5A00' }}>{note}</Text></View>}
      </View>

      {/* right: tools */}
      <View style={{ position: 'absolute', right: 10, top: top + 62 }}>
        {sideBtn('loc', 'crosshairs-gps', C.green, true, 'My location', locate)}
        {sideBtn('base', 'map', '#546E7A', base === 'osm', 'Street map', () => setBase(base === 'osm' ? 'vector' : 'osm'))}
        {sideBtn('market', 'storefront', KINDS.market.color, show.market, 'Markets', () => tog('market'))}
        {sideBtn('extension', 'account-tie', KINDS.extension.color, show.extension, 'Agritex', () => tog('extension'))}
        {sideBtn('input', 'sack', KINDS.input.color, show.input, 'Inputs', () => tog('input'))}
        {sideBtn('rivers', 'water', '#1E88E5', show.rivers, 'Rivers', () => tog('rivers'))}
        {sideBtn('roads', 'road-variant', '#A8844A', show.roads, 'Roads', () => tog('roads'))}
        {sideBtn('ring', 'radius-outline', C.green, show.ring, '25 km area', () => tog('ring'))}
      </View>

      {/* legend */}
      <View style={{ position: 'absolute', left: 10, bottom: panelH + 8, backgroundColor: '#fffffff0', borderRadius: 10, padding: 6, ...shadow }}>
        {layer === 'suit' ? (
          <Row>{(['High', 'Moderate', 'Marginal', 'Not suitable'] as const).map((l) => <Row key={l} style={{ marginRight: 8 }}><View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: CLASS_COLOR[l] }} /><Text style={{ marginLeft: 3, fontSize: s(10), fontWeight: '700' }}>{l}</Text></Row>)}</Row>
        ) : (
          <Row><Text style={{ fontSize: s(10), fontWeight: '700' }}>{L.lo}</Text><View style={{ flexDirection: 'row', marginHorizontal: 6 }}>{L.stops!.map((c) => <View key={c} style={{ width: 18, height: 10, backgroundColor: c }} />)}</View><Text style={{ fontSize: s(10), fontWeight: '700' }}>{L.hi}</Text></Row>
        )}
      </View>

      {/* analysis panel: fixed height, tabs instead of scrolling */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: panelH, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 12, ...shadow }}>
        {!report ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <MIcon name="gesture-tap" size={30} color={C.green} />
            <T bold size={s(14)} style={{ marginTop: 4 }}>Tap the map to analyse any spot</T>
            <T muted size={s(11)} style={{ textAlign: 'center' }}>Suitability, score, markets, water and services, all calculated on your phone.</T>
          </View>
        ) : (
          <>
            <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              {TABS.map((t) => (
                <Pressable key={t.k} onPress={() => setTab(t.k)} style={{ flex: 1, alignItems: 'center', paddingVertical: 4, borderBottomWidth: 2, borderBottomColor: tab === t.k ? C.green : 'transparent' }}>
                  <MIcon name={t.i} size={18} color={tab === t.k ? C.green : C.muted} /><Text style={{ fontSize: s(10), fontWeight: '800', color: tab === t.k ? C.green : C.muted }}>{t.l}</Text>
                </Pressable>))}
            </Row>
            {report.env && <T muted size={s(10)} style={{ marginBottom: 4 }} numberOfLines={1}>{report.env.rain} mm · variability {report.env.cv}% ({report.env.rainRisk} risk) · {report.env.temp} °C · {report.env.elev} m · pH {report.env.ph}</T>}
            <View style={{ flex: 1 }}>
              {tab === 'score' && (
                <Row style={{ flex: 1 }}>
                  <View style={{ alignItems: 'center', width: 92 }}>
                    <View style={{ width: 70, height: 70, borderRadius: 35, borderWidth: 6, borderColor: suitColor(report.score.score >= 75 ? 'High' : report.score.score >= 55 ? 'Moderate' : report.score.score >= 35 ? 'Marginal' : 'Not suitable'), alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: s(22), fontWeight: '900' }}>{report.score.score}</Text></View>
                    <T bold size={s(12)} style={{ marginTop: 3 }}>{report.score.label}</T><T muted size={s(10)} numberOfLines={1}>{shortName(crop)}</T>
                  </View>
                  <View style={{ flex: 1 }}>
                    {report.score.parts.map((p) => (
                      <View key={p.key} style={{ marginBottom: 5 }}>
                        <Row style={{ justifyContent: 'space-between' }}><T size={s(11)} bold>{p.label} ({Math.round(p.weight * 100)}%)</T><T size={s(11)} muted>{p.detail}</T></Row>
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: C.line }}><View style={{ height: 6, borderRadius: 3, width: `${Math.round(p.value)}%`, backgroundColor: C.green }} /></View>
                      </View>))}
                  </View>
                </Row>)}
              {tab === 'crop' && (
                <View>
                  <Row style={{ justifyContent: 'space-between' }}><T bold>{report.suitability.ward ?? `${shortName(crop)}`}</T><Badge text={`${report.suitability.level.toUpperCase()} · ${report.suitability.index}`} color="#fff" bg={suitColor(report.suitability.level)} /></Row>
                  <T muted size={s(11)} numberOfLines={3} style={{ marginVertical: 3 }}>{report.suitability.reason}{report.suitability.proxy ? ' (Estimated from a similar crop.)' : ''}</T>
                  <T bold size={s(11)}>Best crops here</T>
                  <Row style={{ flexWrap: 'wrap', marginTop: 3 }}>{report.ranking.slice(0, 5).map((r) => <Row key={r.crop.name} style={{ marginRight: 10, marginBottom: 3 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: suitColor(r.level) }} /><MIcon name={r.crop.icon} size={14} color={C.ink} /><T size={s(11)} style={{ marginLeft: 2 }}>{shortName(r.crop.name)} {r.index}</T></Row>)}</Row>
                </View>)}
              {tab === 'market' && report.markets.map((m) => (
                <Row key={m.id} style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
                  <View style={{ flex: 1 }}><T bold size={s(12)} numberOfLines={1}>{m.name}</T><T muted size={s(10)}>{prettySubtype(m.subtype)}</T></View>
                  <View style={{ alignItems: 'flex-end' }}><T bold size={s(12)}>{m.distance_km} km</T><T muted size={s(10)}>~${m.transport_cost_usd} transport</T></View>
                </Row>))}
              {tab === 'water' && (report.water ? (
                <View>
                  <Row style={{ justifyContent: 'space-between' }}><T bold>{report.water.name}</T><T bold>{report.water.distance_km} km</T></Row>
                  <T muted size={s(11)} style={{ marginVertical: 2 }}>{report.water.irrigation}</T>
                  {report.water.surface_water_km != null && <T size={s(11)}>Nearest permanent water body or dam (model): {report.water.surface_water_km} km</T>}
                  {report.water.scheme && <T size={s(11)} numberOfLines={1}>Nearest scheme: {report.water.scheme.name} ({report.water.scheme.distance_km} km)</T>}
                </View>) : <T muted>No water data here.</T>)}
              {tab === 'svc' && (
                <View>
                  {report.expert && <Row style={{ justifyContent: 'space-between', paddingVertical: 3 }}><View style={{ flex: 1 }}><T bold size={s(12)} numberOfLines={1}>{report.expert.name}</T><T muted size={s(10)}>Nearest Agritex / extension</T></View><T bold size={s(12)}>{report.expert.distance_km} km</T></Row>}
                  <T bold size={s(11)} style={{ marginTop: 4 }}>Within 25 km</T>
                  <Row style={{ flexWrap: 'wrap', marginTop: 3 }}>{Object.entries(report.within.counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => <Row key={k} style={{ marginRight: 10, marginBottom: 3 }}><MIcon name={KINDS[k].icon} size={14} color={KINDS[k].color} /><T size={s(11)} style={{ marginLeft: 3 }}>{KINDS[k].label.split(' ')[0]} {n}</T></Row>)}</Row>
                  {Object.keys(report.within.counts).length === 0 && <T muted size={s(11)}>No mapped services nearby.</T>}
                </View>)}
            </View>
          </>
        )}
      </View>
    </View>
  );
}
