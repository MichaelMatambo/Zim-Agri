import React from 'react';
import { View, Pressable, Text, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { desc, eq } from 'drizzle-orm';
import Screen from '../../components/Screen';
import TabHeader from '../../components/TabHeader';
import SyncBadge from '../../components/SyncBadge';
import { Card, Icon, MIcon, T, Row, Empty, Button, Badge } from '../../components/UI';
import { Paged } from '../../components/Paged';
import { useQuery } from '../../components/hooks';
import { db, schema } from '../../db';
import { cropIcon, shortName } from '../../constants/crops';
import { countPending } from '../../services/sync';
import { C, s } from '../../constants/theme';

export const profitOf = (x: any) => x.yield_kg * x.sale_price_per_kg - (x.seed_cost + x.fert_cost + x.labour_cost);

export default function Records() {
  const r = useRouter();
  const [rows, reload] = useQuery(() => db.select().from(schema.records).where(eq(schema.records.deleted, 0)).orderBy(desc(schema.records.updated_at)).all(), [], [] as any[]);
  const cost = rows.reduce((a, x) => a + x.seed_cost + x.fert_cost + x.labour_cost, 0);
  const rev = rows.reduce((a, x) => a + x.yield_kg * x.sale_price_per_kg, 0);
  const del = (id: string) => Alert.alert('Delete record?', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { db.update(schema.records).set({ deleted: 1, sync_status: 'pending', updated_at: Date.now() }).where(eq(schema.records.id, id)).run(); countPending(); reload(); } }]);
  return (
    <View style={{ flex: 1 }}>
      <TabHeader title="My Farm" sub="Seasons, costs and profit" right={<Row style={{ gap: 8 }}><SyncBadge /><Button small kind="sun" icon="add" title="Record" onPress={() => r.push('/add-record')} /></Row>} />
      <Screen tab>
        {rows.length > 0 && (
          <Card style={{ backgroundColor: C.greenDark }}>
            <Row style={{ justifyContent: 'space-around' }}>
              {([['Costs', cost, '#FFD9A0'], ['Revenue', rev, '#BFE8CB'], ['Profit', rev - cost, rev - cost >= 0 ? '#7CF0A0' : '#FF9C9C']] as any[]).map(([l, v, c]) => (
                <View key={l} style={{ alignItems: 'center' }}><T style={{ color: '#BFE8CB' }} size={s(10)}>{String(l).toUpperCase()}</T><Text style={{ color: c, fontSize: s(18), fontWeight: '900' }}>${Number(v).toFixed(0)}</Text></View>))}
            </Row>
          </Card>
        )}
        <Paged data={rows} itemHeight={s(64)} empty={<Empty icon="leaf-outline" title="No seasons recorded" sub="Track planting, costs and yield to know your real profit." action={<Button title="Add first record" icon="add" onPress={() => r.push('/add-record')} />} />}
          renderItem={(x: any) => {
            const p = profitOf(x);
            return (
              <Swipeable overshootRight={false} renderRightActions={() => (
                <Pressable onPress={() => del(x.id)} style={{ backgroundColor: C.red, justifyContent: 'center', alignItems: 'center', width: 70, borderTopRightRadius: 14, borderBottomRightRadius: 14, marginLeft: -14 }}><Icon name="trash" color="#fff" size={20} /></Pressable>)}>
                <Card onPress={() => r.push({ pathname: '/add-record', params: { id: x.id } } as any)} style={{ marginBottom: 0, height: s(64), justifyContent: 'center' }}>
                  <Row>
                    <MIcon name={cropIcon(x.crop)} size={28} color={C.green} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <T bold numberOfLines={1}>{shortName(x.crop)}{x.variety ? ` · ${x.variety}` : ''}</T>
                      <T muted size={s(11)} numberOfLines={1}>{x.area_ha} ha · planted {x.planting_date || '-'} · {x.yield_kg ? `${x.yield_kg} kg` : 'not harvested'}</T>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontWeight: '900', fontSize: s(14), color: p >= 0 ? C.green : C.red }}>{p >= 0 ? '+' : '-'}${Math.abs(p).toFixed(0)}</Text>
                      {x.sync_status !== 'synced' && <Badge text="PENDING" color="#8A5A00" bg={C.sunLight} />}
                    </View>
                  </Row>
                </Card>
              </Swipeable>
            );
          }} />
      </Screen>
    </View>
  );
}
