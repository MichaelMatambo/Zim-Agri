import React, { useEffect, useMemo, useState } from 'react';
import { View, Linking } from 'react-native';
import Screen from '../components/Screen';
import { Card, T, Row, Button, Badge, Picker, IconBubble } from '../components/UI';
import { Paged } from '../components/Paged';
import { expertsWithDistance, KINDS, prettySubtype, LatLon } from '../services/gis';
import { getZimPoint } from '../services/location';
import { C, s } from '../constants/theme';

const KIND_KEYS = ['extension', 'input', 'vet', 'finance', 'market', 'storage', 'processing', 'machinery', 'water'];

export default function Experts() {
  const [p, setP] = useState<LatLon | null>(null);
  const [kind, setKind] = useState('extension');
  const [note, setNote] = useState('Finding your location…');
  useEffect(() => { getZimPoint().then((g) => { setP(g.point); setNote(g.real ? 'Sorted by distance from you (Turf, offline).' : g.note ?? ''); }); }, []);
  const list = useMemo(() => expertsWithDistance(p, kind), [p, kind]);
  const K = KINDS[kind];
  return (
    <Screen>
      <Picker label="Service type" value={kind} icon={K.icon} options={KIND_KEYS.map((k) => ({ value: k, label: KINDS[k].label, icon: KINDS[k].icon }))} onChange={setKind} searchable={false} />
      <T muted size={s(11)} style={{ marginTop: -4, marginBottom: 6 }}>{note}</T>
      <Paged data={list} itemHeight={s(78)} renderItem={(e: any, i: number) => (
        <Card style={{ flex: 1, marginBottom: 0, justifyContent: 'center', ...(i === 0 && p ? { borderWidth: 2, borderColor: C.green } : {}) }}>
          <Row>
            <IconBubble m name={K.icon} color={K.color} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <T bold numberOfLines={1}>{e.name}</T>
              <T muted size={s(11)} numberOfLines={1}>{prettySubtype(e.subtype)} · {e.town}{e.district ? `, ${e.district}` : ''}</T>
              <Row style={{ gap: 6, marginTop: 2 }}>
                {e.distance_km != null && <T bold size={s(11)} style={{ color: C.green }}>{e.distance_km} km</T>}
                {i === 0 && p && <Badge text="NEAREST" />}
              </Row>
            </View>
            {e.phone ? <Button small icon="call" onPress={() => Linking.openURL(`tel:${String(e.phone).replace(/\s/g, '')}`)} /> : null}
          </Row>
        </Card>)} />
    </Screen>
  );
}
