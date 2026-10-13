import React, { useState } from 'react';
import { View, Image, Linking, Alert, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { eq } from 'drizzle-orm';
import Screen from '../../components/Screen';
import { Card, Button, T, Row, Empty, Badge, Chip, MIcon, Icon } from '../../components/UI';
import { db, schema } from '../../db';
import { getFarmer } from '../../components/hooks';
import { getNearestMarkets, getNearestWater, checkSuitability } from '../../services/gis';
import { photoSource } from '../../services/photos';
import { cropIcon } from '../../constants/crops';
import { countPending } from '../../services/sync';
import { C, s, suitColor } from '../../constants/theme';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useRouter();
  const { height } = useWindowDimensions();
  const [tab, setTab] = useState<'info' | 'near'>('info');
  const x = db.select().from(schema.listings).where(eq(schema.listings.id, String(id))).get();
  const me = getFarmer();
  if (!x || x.deleted) return <Screen><Empty icon="alert-circle-outline" title="Listing not found" /></Screen>;
  const p = x.lat != null && x.lon != null ? { lat: x.lat, lon: x.lon } : null;
  const digits = x.phone.replace(/[^\d+]/g, '');
  const mine = me?.id === x.farmer_id;
  const src = photoSource(x);
  const suit = p ? checkSuitability(p, x.crop_type) : null;
  const del = () => Alert.alert('Delete listing?', 'It will be removed from this phone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { db.update(schema.listings).set({ deleted: 1, sync_status: 'pending', updated_at: Date.now() }).where(eq(schema.listings.id, x.id)).run(); countPending(); r.back(); } }]);
  const ph = Math.round(height * 0.24);
  return (
    <Screen>
      {src ? <Image source={src} style={{ width: '100%', height: ph, borderRadius: 16, marginBottom: 8 }} />
        : <View style={{ height: ph * 0.6, borderRadius: 16, backgroundColor: C.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}><MIcon name={cropIcon(x.crop_type)} size={44} color={C.green} /></View>}
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}><T bold size={s(18)} numberOfLines={1}>{x.crop_type}</T>{!!x.variety && <T muted>{x.variety}</T>}</View>
        <T bold size={s(20)} style={{ color: C.green }}>${x.price_per_kg.toFixed(2)}<T muted size={s(11)}>/kg</T></T>
      </Row>
      <Row style={{ marginVertical: 8 }}><Chip label="Details" active={tab === 'info'} onPress={() => setTab('info')} icon="information-outline" /><Chip label="Nearby" active={tab === 'near'} onPress={() => setTab('near')} icon="map-marker-radius" /></Row>
      <View style={{ flex: 1 }}>
        {tab === 'info' ? (
          <Card>
            <Row><Icon name="cube-outline" size={16} color={C.muted} /><T style={{ marginLeft: 8 }}>{x.quantity_kg.toLocaleString()} kg · total ${(x.quantity_kg * x.price_per_kg).toFixed(2)}</T></Row>
            <Row style={{ marginTop: 6 }}><Icon name="location-outline" size={16} color={C.muted} /><T style={{ marginLeft: 8, flex: 1 }} numberOfLines={1}>{[x.ward, x.district, x.province].filter(Boolean).join(', ') || 'Location not recorded'}</T></Row>
            <Row style={{ marginTop: 6 }}><Icon name="person-outline" size={16} color={C.muted} /><T style={{ marginLeft: 8 }}>{x.seller_name ?? 'Farmer'} · {x.phone}</T></Row>
            {!!x.description && <T muted style={{ marginTop: 8 }} numberOfLines={3}>{x.description}</T>}
            {x.sync_status !== 'synced' && <View style={{ marginTop: 8 }}><Badge text="WAITING TO SYNC" color="#8A5A00" bg={C.sunLight} /></View>}
          </Card>
        ) : (
          <Card>
            {p ? (<>
              {suit && <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}><T bold>Grown here</T><Badge text={`${suit.level.toUpperCase()} · ${suit.index}`} color="#fff" bg={suitColor(suit.level)} /></Row>}
              {getNearestMarkets(p).map((m) => <Row key={m.id} style={{ justifyContent: 'space-between', paddingVertical: 3 }}><T size={s(12)} style={{ flex: 1 }} numberOfLines={1}>{m.name}</T><T bold size={s(12)}>{m.distance_km} km · ${m.transport_cost_usd}</T></Row>)}
              {(() => { const w = getNearestWater(p); return w ? <T muted size={s(11)} style={{ marginTop: 4 }}>{w.name} is {w.distance_km} km from the farm</T> : null; })()}
            </>) : <T muted>No location recorded for this listing.</T>}
          </Card>
        )}
      </View>
      <Row style={{ gap: 8 }}>
        <Button style={{ flex: 1 }} icon="call" title="Call" onPress={() => Linking.openURL(`tel:${digits}`)} />
        <Button style={{ flex: 1 }} kind="sun" icon="chatbubble" title="SMS" onPress={() => Linking.openURL(`sms:${digits}`)} />
        <Button style={{ flex: 1 }} kind="ghost" icon="logo-whatsapp" title="Chat" onPress={() => Linking.openURL(`https://wa.me/${digits.replace('+', '')}`)} />
        {mine && <Button kind="danger" icon="trash" onPress={del} />}
      </Row>
    </Screen>
  );
}
