import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Screen from '../components/Screen';
import { Card, Icon, T, Row, Button } from '../components/UI';
import { readCachedWeather, fetchWeather } from '../services/weather';
import { getZimPoint } from '../services/location';
import { useSync } from '../services/sync';
import { C, s } from '../constants/theme';

export default function Weather() {
  const { online } = useSync();
  const [w, setW] = useState(() => readCachedWeather());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const refresh = async () => {
    setBusy(true); setErr('');
    try { const g = await getZimPoint(); setW(await fetchWeather(g.point)); }
    catch (e: any) { setErr(e?.message ?? 'Could not load weather'); }
    setBusy(false);
  };
  const stale = w && Date.now() - w.fetched_at > 6 * 3600e3;
  return (
    <Screen>
      {w ? (
        <View style={{ flex: 1 }}>
          <Card style={{ backgroundColor: C.sky }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View>
                <T style={{ color: '#D6ECFF' }}>{w.data.place}</T>
                <Text style={{ color: '#fff', fontSize: s(40), fontWeight: '900' }}>{w.data.temp}°</Text>
                <Text style={{ color: '#fff', textTransform: 'capitalize' }}>{w.data.desc}</Text>
                <T style={{ color: '#D6ECFF' }} size={s(11)}>Humidity {w.data.humidity}% · Wind {w.data.wind} km/h</T>
              </View>
              <Icon name="partly-sunny" size={56} color="#FFE082" />
            </Row>
          </Card>
          <T size={s(11)} style={{ marginBottom: 6, color: stale ? C.red : C.muted }}>Last updated: {new Date(w.fetched_at).toLocaleString()}{!online ? ' (offline copy)' : ''}</T>
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            {w.data.days.map((d) => (
              <Card key={d.date} style={{ marginBottom: 4, paddingVertical: 8 }}>
                <Row>
                  <Icon name={d.icon as any} size={22} color={C.sky} />
                  <View style={{ flex: 1, marginLeft: 10 }}><T bold size={s(12)}>{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</T><T muted size={s(11)}>{d.desc} · rain {d.rain} mm</T></View>
                  <T bold>{d.min}° / {d.max}°</T>
                </Row>
              </Card>))}
          </View>
        </View>
      ) : <View style={{ flex: 1 }}><Card><T bold>No saved forecast yet</T><T muted style={{ marginTop: 4 }}>Load it once with data; it is then saved for offline use.</T></Card></View>}
      {!!err && <T style={{ color: C.red, marginBottom: 6 }} size={s(11)}>{err}</T>}
      <Button title={online ? 'Refresh forecast' : 'Offline: showing saved forecast'} icon="refresh" loading={busy} disabled={!online} onPress={refresh} />
    </Screen>
  );
}
