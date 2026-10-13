import React, { useMemo, useState } from 'react';
import { View, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { desc, eq } from 'drizzle-orm';
import Screen from '../../components/Screen';
import TabHeader from '../../components/TabHeader';
import SyncBadge from '../../components/SyncBadge';
import { Card, Icon, MIcon, T, Badge, Empty, Picker, Row, Button, Chip, Opt } from '../../components/UI';
import { Paged } from '../../components/Paged';
import { useQuery, useFarmer } from '../../components/hooks';
import { db, schema } from '../../db';
import { CROPS, cropIcon, shortName, PROVINCES } from '../../constants/crops';
import { photoSource } from '../../services/photos';
import { C, s, R } from '../../constants/theme';

export default function Market() {
  const r = useRouter();
  const [rows] = useQuery(() => db.select().from(schema.listings).where(eq(schema.listings.deleted, 0)).orderBy(desc(schema.listings.created_at)).all(), [], [] as any[]);
  const [farmer] = useFarmer();
  const [mine, setMine] = useState(false);
  const [crop, setCrop] = useState<string | null>(null);
  const [province, setProvince] = useState<string | null>(null);
  const [ward, setWard] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const wardOpts: Opt[] = useMemo(() => Array.from(new Set(rows.map((x) => x.ward).filter(Boolean))).map((w) => ({ value: w as string })), [rows]);
  const list = rows.filter((x) => (!mine || x.farmer_id === farmer?.id) && (!crop || x.crop_type === crop) && (!province || x.province === province) && (!ward || x.ward === ward)
    && (!q || `${x.crop_type} ${x.variety ?? ''} ${x.ward ?? ''} ${x.description ?? ''}`.toLowerCase().includes(q.toLowerCase())));
  const H = s(78);
  return (
    <View style={{ flex: 1 }}>
      <TabHeader title="Marketplace" sub={`${list.length} listing${list.length === 1 ? '' : 's'}`} right={<Row style={{ gap: 8 }}><SyncBadge /><Button small kind="sun" icon="add" title="Sell" onPress={() => r.push('/add-listing')} /></Row>} />
      <Screen tab>
        <Row style={{ marginBottom: 6 }}><Chip icon="storefront-outline" label="All listings" active={!mine} onPress={() => setMine(false)} /><Chip icon="account-outline" label="My listings" active={mine} onPress={() => setMine(true)} /></Row>
        <Row style={{ backgroundColor: '#fff', borderRadius: R.md, paddingHorizontal: 10, marginBottom: 6, borderWidth: 1.5, borderColor: C.line }}>
          <Icon name="search" size={16} color={C.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search crop, variety, ward" placeholderTextColor="#9AA79D" style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: s(13) }} />
        </Row>
        <Row style={{ gap: 6, marginBottom: 8 }}>
          <Picker compact label="All crops" value={crop} icon="sprout" options={[{ value: '', label: 'All crops' }, ...CROPS.map((c) => ({ value: c.name, label: c.name, icon: c.icon }))]} onChange={(v) => setCrop(v || null)} />
          <Picker compact label="Province" value={province} icon="map-marker-outline" options={[{ value: '', label: 'All provinces' }, ...PROVINCES.map((p) => ({ value: p }))]} onChange={(v) => setProvince(v || null)} searchable={false} />
          <Picker compact label="Ward" value={ward} icon="home-map-marker" options={[{ value: '', label: 'All wards' }, ...wardOpts]} onChange={(v) => setWard(v || null)} />
        </Row>
        <Paged data={list} itemHeight={H} empty={<Empty icon="basket-outline" title={mine ? 'You have no listings yet' : 'No listings yet'} sub="List your produce: it works offline too." />}
          renderItem={(x: any) => {
            const src = photoSource(x);
            return (
              <Card onPress={() => r.push(`/listing/${x.id}` as any)} style={{ flex: 1, padding: 0, marginBottom: 0, overflow: 'hidden' }}>
                <Row style={{ flex: 1 }}>
                  {src ? <Image source={src} style={{ width: H, height: H }} /> : <View style={{ width: H, height: H, backgroundColor: C.greenLight, alignItems: 'center', justifyContent: 'center' }}><MIcon name={cropIcon(x.crop_type)} size={32} color={C.green} /></View>}
                  <View style={{ flex: 1, paddingHorizontal: 10, justifyContent: 'center' }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <T bold size={s(14)} style={{ flex: 1 }} numberOfLines={1}>{shortName(x.crop_type)}{x.variety ? ` · ${x.variety}` : ''}</T>
                      <T bold size={s(14)} style={{ color: C.green }}>${x.price_per_kg.toFixed(2)}/kg</T>
                    </Row>
                    <T size={s(12)}>{x.quantity_kg >= 1000 ? `${(x.quantity_kg / 1000).toFixed(1)} t` : `${x.quantity_kg} kg`} available</T>
                    <Row style={{ justifyContent: 'space-between', marginTop: 2 }}>
                      <Row style={{ flex: 1 }}><Icon name="location-outline" size={12} color={C.muted} /><T muted size={s(11)} style={{ marginLeft: 3, flex: 1 }} numberOfLines={1}>{x.ward ?? x.district ?? 'Location saved'}</T></Row>
                      {x.sync_status !== 'synced' && <Badge text={x.sync_status === 'failed' ? 'RETRY' : 'PENDING'} color="#8A5A00" bg={C.sunLight} />}
                    </Row>
                  </View>
                </Row>
              </Card>
            );
          }} />
      </Screen>
    </View>
  );
}
