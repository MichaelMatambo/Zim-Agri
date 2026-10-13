import React, { useState } from 'react';
import { View, Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { eq } from 'drizzle-orm';
import Screen from '../components/Screen';
import Wizard from '../components/Wizard';
import { Card, Field, Picker, Button, T, Row } from '../components/UI';
import DateField from '../components/DateField';
import { getFarmer } from '../components/hooks';
import { db, schema, uid } from '../db';
import { CROPS, cropByName } from '../constants/crops';
import { countPending, syncNow } from '../services/sync';
import { C, s } from '../constants/theme';

const n = (v: string) => parseFloat(v) || 0;

export default function AddRecord() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const r = useRouter();
  const existing = id ? db.select().from(schema.records).where(eq(schema.records.id, String(id))).get() : null;
  const [f, setF] = useState({
    crop: existing?.crop ?? '', variety: existing?.variety ?? '', planting_date: existing?.planting_date ?? '', area_ha: String(existing?.area_ha || ''),
    seed_cost: String(existing?.seed_cost || ''), fert_cost: String(existing?.fert_cost || ''), labour_cost: String(existing?.labour_cost || ''),
    harvest_date: existing?.harvest_date ?? '', yield_kg: String(existing?.yield_kg || ''), sale_price_per_kg: String(existing?.sale_price_per_kg || ''), notes: existing?.notes ?? '',
  });
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const cost = n(f.seed_cost) + n(f.fert_cost) + n(f.labour_cost);
  const rev = n(f.yield_kg) * n(f.sale_price_per_kg);
  const profit = rev - cost; const ha = n(f.area_ha);

  const save = () => {
    const vals = { crop: f.crop, variety: f.variety || null, planting_date: f.planting_date || null, area_ha: ha, seed_cost: n(f.seed_cost), fert_cost: n(f.fert_cost), labour_cost: n(f.labour_cost),
      harvest_date: f.harvest_date || null, yield_kg: n(f.yield_kg), sale_price_per_kg: n(f.sale_price_per_kg), notes: f.notes.trim() || null, sync_status: 'pending' as const, updated_at: Date.now() };
    if (existing) db.update(schema.records).set(vals).where(eq(schema.records.id, existing.id)).run();
    else db.insert(schema.records).values({ id: uid(), farmer_id: getFarmer()?.id ?? 'local', ...vals }).run();
    countPending(); syncNow(); r.back();
  };
  const del = () => Alert.alert('Delete record?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { db.update(schema.records).set({ deleted: 1, sync_status: 'pending', updated_at: Date.now() }).where(eq(schema.records.id, existing!.id)).run(); countPending(); r.back(); } }]);

  return (
    <Screen>
      <Wizard finishLabel={existing ? 'Save changes' : 'Save record'} onFinish={save} steps={[
        { title: 'Crop', icon: 'leaf', validate: () => (f.crop ? null : 'Choose a crop'), content: (
          <View>
            <Picker label="Crop" icon="sprout" value={f.crop} placeholder="What did you plant?" options={CROPS.map((c) => ({ value: c.name, label: c.name, sub: c.group, icon: c.icon }))} onChange={(v) => setF((p) => ({ ...p, crop: v, variety: '' }))} />
            <Picker label="Variety" value={f.variety} placeholder="Choose or type your own" allowOther options={(cropByName(f.crop)?.varieties ?? []).map((v) => ({ value: v }))} onChange={set('variety')} />
            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1 }}><DateField label="Planting date" value={f.planting_date} onChange={set('planting_date')} /></View>
              <Field style={{ flex: 1 }} label="Area (ha)" value={f.area_ha} onChangeText={set('area_ha')} keyboardType="decimal-pad" placeholder="0.5" />
            </Row>
          </View>) },
        { title: 'Costs', icon: 'cash', content: (
          <View>
            <T bold style={{ marginBottom: 6 }}>Input costs (USD)</T>
            <Row style={{ gap: 8 }}>
              <Field style={{ flex: 1 }} label="Seed" value={f.seed_cost} onChangeText={set('seed_cost')} keyboardType="decimal-pad" placeholder="0" />
              <Field style={{ flex: 1 }} label="Fertilizer" value={f.fert_cost} onChangeText={set('fert_cost')} keyboardType="decimal-pad" placeholder="0" />
              <Field style={{ flex: 1 }} label="Labour" value={f.labour_cost} onChangeText={set('labour_cost')} keyboardType="decimal-pad" placeholder="0" />
            </Row>
            <Field label="Notes" value={f.notes} onChangeText={set('notes')} multiline placeholder="Rain, pests, what to do better next season…" />
          </View>) },
        { title: 'Harvest', icon: 'basket', content: (
          <View>
            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1 }}><DateField label="Harvest date" value={f.harvest_date} onChange={set('harvest_date')} /></View>
              <Field style={{ flex: 1 }} label="Yield (kg)" value={f.yield_kg} onChangeText={set('yield_kg')} keyboardType="decimal-pad" placeholder="0" />
            </Row>
            <Field label="Sale price per kg (USD)" value={f.sale_price_per_kg} onChangeText={set('sale_price_per_kg')} keyboardType="decimal-pad" placeholder="0.00" />
            <Card style={{ backgroundColor: profit >= 0 ? C.greenLight : C.redLight }}>
              <Row style={{ justifyContent: 'space-between' }}><T>Revenue ${rev.toFixed(2)}</T><T>Costs ${cost.toFixed(2)}</T><Text style={{ fontWeight: '900', fontSize: s(16), color: profit >= 0 ? C.green : C.red }}>Profit ${profit.toFixed(2)}</Text></Row>
              {ha > 0 && <T muted size={s(11)}>${(profit / ha).toFixed(0)} per ha · {(n(f.yield_kg) / ha).toFixed(0)} kg/ha{n(f.yield_kg) > 0 ? ` · cost $${(cost / n(f.yield_kg)).toFixed(2)}/kg` : ''}</T>}
            </Card>
            {existing && <Button title="Delete record" kind="danger" icon="trash" small onPress={del} />}
          </View>) },
      ]} />
    </Screen>
  );
}
