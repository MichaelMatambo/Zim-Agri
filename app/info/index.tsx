import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import { Card, Icon, MIcon, T, Row, Empty, Picker } from '../../components/UI';
import { Paged } from '../../components/Paged';
import { useQuery } from '../../components/hooks';
import { db, schema } from '../../db';
import { cropIcon } from '../../constants/crops';
import { C, s, R } from '../../constants/theme';

export default function Info() {
  const r = useRouter();
  const [rows] = useQuery(() => db.select().from(schema.info_articles).all(), [], [] as any[]);
  const [crop, setCrop] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const crops = Array.from(new Set(rows.map((x) => x.crop)));
  const list = rows.filter((x) => (!crop || x.crop === crop) && (!q || `${x.title} ${x.body_md}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <Screen>
      <Row style={{ gap: 8, marginBottom: 8 }}>
        <Row style={{ flex: 2, backgroundColor: '#fff', borderRadius: R.md, paddingHorizontal: 10, borderWidth: 1.5, borderColor: C.line }}>
          <Icon name="search" size={16} color={C.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="e.g. fertilizer" placeholderTextColor="#9AA79D" style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: s(13) }} />
        </Row>
        <View style={{ flex: 1.3 }}><Picker compact label="All crops" value={crop} icon="sprout" options={[{ value: '', label: 'All crops' }, ...crops.map((c) => ({ value: c, icon: cropIcon(c) }))]} onChange={(v) => setCrop(v || null)} searchable={false} /></View>
      </Row>
      <Paged data={list} itemHeight={s(60)} empty={<Empty icon="book-outline" title="Nothing found" />}
        renderItem={(a: any) => (
          <Card onPress={() => r.push(`/info/${a.id}` as any)} style={{ flex: 1, marginBottom: 0, justifyContent: 'center' }}>
            <Row><MIcon name={cropIcon(a.crop)} size={24} color={C.green} /><View style={{ flex: 1, marginLeft: 10 }}><T bold numberOfLines={1}>{a.title}</T><T muted size={s(11)}>{a.crop} · {a.topic}</T></View><Icon name="chevron-forward" size={16} color={C.muted} /></Row>
          </Card>)} />
    </Screen>
  );
}
