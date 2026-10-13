import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../components/Screen';
import Wizard from '../components/Wizard';
import { Field, Picker, Chip, Row, T } from '../components/UI';
import { getFarmer } from '../components/hooks';
import { db, schema, uid } from '../db';
import { wardProps } from '../services/gis';
import { countPending, syncNow } from '../services/sync';
import { FARMING_TYPES, PROVINCES } from '../constants/crops';
import { C, s } from '../constants/theme';

/** Local-only profile (table `farmers`). No login needed, so it works fully offline. */
export default function Profile() {
  const r = useRouter();
  const ex = getFarmer();
  const [name, setName] = useState(ex?.name ?? '');
  const [phone, setPhone] = useState(ex?.phone ?? '');
  const [province, setProvince] = useState(ex?.province ?? '');
  const [district, setDistrict] = useState(ex?.district ?? '');
  const [ward, setWard] = useState(ex?.ward ?? '');
  const [type, setType] = useState(ex?.farming_type ?? 'Crops');
  const districts = useMemo(() => Array.from(new Set(wardProps.filter((p) => !province || p.province === province).map((p) => p.district))).sort(), [province]);
  const wardOpts = wardProps.filter((p) => !district || p.district === district).map((p) => p.ward_name);
  const save = () => {
    const v = { name: name.trim(), phone: phone.trim(), province: province || null, district: district || null, ward: ward || null, farming_type: type, sync_status: 'pending' as const, updated_at: Date.now() };
    if (ex) db.update(schema.farmers).set(v).run(); else db.insert(schema.farmers).values({ id: uid(), ...v }).run();
    countPending(); syncNow();
    r.back();
  };
  return (
    <Screen>
      <Wizard finishLabel="Save profile" onFinish={save} steps={[
        { title: 'You', icon: 'person', validate: () => (name.trim().length < 2 ? 'Enter your name' : phone.replace(/\D/g, '').length < 9 ? 'Enter a valid phone number' : null), content: (
          <View>
            <Field label="Full name" value={name} onChangeText={setName} placeholder="e.g. Tendai Moyo" autoCapitalize="words" />
            <Field label="Phone (WhatsApp / mobile)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+263 77 123 4567" />
            <T style={{ fontSize: s(10), fontWeight: '800', color: C.muted, marginBottom: 4 }}>FARMING TYPE</T>
            <Row style={{ flexWrap: 'wrap' }}>{FARMING_TYPES.map((t) => <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />)}</Row>
          </View>) },
        { title: 'Place', icon: 'location', content: (
          <View>
            <Picker label="Province" value={province} options={PROVINCES.map((p) => ({ value: p }))} onChange={(v) => { setProvince(v); setDistrict(''); setWard(''); }} searchable={false} />
            <Picker label="District" value={district} options={districts.map((d) => ({ value: d }))} onChange={(v) => { setDistrict(v); setWard(''); }} allowOther />
            <Picker label="Ward" value={ward} options={wardOpts.map((w) => ({ value: w }))} onChange={setWard} allowOther />
          </View>) },
      ]} />
    </Screen>
  );
}
