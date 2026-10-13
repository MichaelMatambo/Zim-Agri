import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { eq, sql } from 'drizzle-orm';
import Screen from '../../components/Screen';
import TabHeader from '../../components/TabHeader';
import { Card, Icon, MIcon, T, Button, Row, IconBubble } from '../../components/UI';
import { useQuery, useFarmer } from '../../components/hooks';
import { db, schema } from '../../db';
import { readCachedWeather } from '../../services/weather';
import { C, s, R } from '../../constants/theme';

const TIPS = [
  'Plant maize with the first effective rains (25 mm+); every week of delay cuts yield.',
  'Groundnuts love light sandy soils: add gypsum at flowering for full pods.',
  'Sorghum and millets are safer bets where rainfall is low or unreliable.',
  'Sell as a group: transport and grading costs drop and buyers pay more.',
  'Dry groundnuts quickly (below 8% moisture) to avoid aflatoxin.',
  'Record every cost: you cannot price your crop without knowing your cost per kg.',
];
const ACTIONS = [
  { t: 'Sell', i: 'cash-outline', c: '#F5A400', go: '/add-listing' },
  { t: 'Plant', i: 'analytics-outline', c: '#1B8A3E', go: '/(tabs)/map' },
  { t: 'Guide', i: 'book-outline', c: '#8B5A2B', go: '/info' },
  { t: 'Weather', i: 'partly-sunny-outline', c: '#1E88E5', go: '/weather' },
  { t: 'Experts', i: 'people-outline', c: '#7E57C2', go: '/experts' },
  { t: 'Finance', i: 'wallet-outline', c: '#00897B', go: '/finance' },
  { t: 'Records', i: 'document-text-outline', c: '#E65100', go: '/add-record' },
  { t: 'Prices', i: 'storefront-outline', c: '#D93B3B', go: '/(tabs)/market' },
];

export default function Home() {
  const r = useRouter();
  const [farmer] = useFarmer();
  const [stats] = useQuery(() => {
    const l = db.select({ n: sql<number>`count(*)` }).from(schema.listings).where(eq(schema.listings.deleted, 0)).get()?.n ?? 0;
    const rec = db.select().from(schema.records).where(eq(schema.records.deleted, 0)).all();
    const profit = rec.reduce((a, x) => a + x.yield_kg * x.sale_price_per_kg - x.seed_cost - x.fert_cost - x.labour_cost, 0);
    return { listings: l, records: rec.length, profit, weather: readCachedWeather() };
  }, [], { listings: 0, records: 0, profit: 0, weather: null as any });
  const tip = TIPS[new Date().getDate() % TIPS.length];
  return (
    <View style={{ flex: 1 }}>
      <TabHeader title={farmer ? `Hello, ${farmer.name.split(' ')[0]}` : 'ZimAgri Farmer'} sub={farmer ? [farmer.ward, farmer.district].filter(Boolean).join(', ') || 'Your farm, your market' : 'Grow smarter, sell better'} />
      <Screen tab>
        {!farmer && (
          <Card style={{ backgroundColor: C.sunLight }}>
            <Row><IconBubble name="person-add" color={C.sun} /><View style={{ flex: 1, marginLeft: 10 }}><T bold>Create your farmer profile</T><T muted size={s(11)}>Stays on your phone. Needed for listings.</T></View><Button small title="Start" onPress={() => r.push('/profile')} /></Row>
          </Card>
        )}
        <Card style={{ backgroundColor: C.greenDark }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View>
              <T style={{ color: '#BFE8CB' }} size={s(10)}>ESTIMATED FARM PROFIT</T>
              <Text style={{ color: '#fff', fontSize: s(26), fontWeight: '900' }}>${stats.profit.toFixed(0)}</Text>
              <T style={{ color: '#BFE8CB' }} size={s(11)}>{stats.records} record{stats.records === 1 ? '' : 's'} · {stats.listings} listing{stats.listings === 1 ? '' : 's'}</T>
            </View>
            <MIcon name="sprout" size={48} color="#5DD483" />
          </Row>
        </Card>
        <Card onPress={() => r.push('/weather')} style={{ backgroundColor: C.skyLight }}>
          <Row>
            <Icon name="partly-sunny" size={26} color={C.sky} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              {stats.weather ? <><T bold>{stats.weather.data.temp}°C · {stats.weather.data.desc}</T><T muted size={s(11)}>{stats.weather.data.place} · saved {new Date(stats.weather.fetched_at).toLocaleDateString()}</T></>
                : <><T bold>Weather</T><T muted size={s(11)}>Load once with data; it is saved for offline.</T></>}
            </View>
            <Icon name="chevron-forward" size={16} color={C.muted} />
          </Row>
        </Card>
        <View style={{ flex: 1, marginHorizontal: -3 }}>
          {[ACTIONS.slice(0, 4), ACTIONS.slice(4)].map((row, k) => (
            <View key={k} style={{ flex: 1, flexDirection: 'row' }}>
              {row.map((a) => (
                <Pressable key={a.t} onPress={() => r.push(a.go as any)} style={{ flex: 1, padding: 3 }}>
                  <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: R.md, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}>
                    <IconBubble name={a.i} color={a.c} size={34} />
                    <Text style={{ marginTop: 4, fontSize: s(11), fontWeight: '800', color: C.ink }} numberOfLines={1}>{a.t}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
        <Card style={{ backgroundColor: C.sunLight, marginBottom: 0 }}>
          <Row><Icon name="bulb-outline" size={20} color={C.sun} /><T style={{ flex: 1, marginLeft: 10 }} size={s(12)} numberOfLines={3}>{tip}</T></Row>
        </Card>
      </Screen>
    </View>
  );
}
