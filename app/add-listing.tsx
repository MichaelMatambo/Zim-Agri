import React, { useEffect, useState } from 'react';
import { View, Image, Text, Alert, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Screen, { useKeyboard } from '../components/Screen';
import Wizard from '../components/Wizard';
import { Card, Field, Picker, Button, Chip, T, Icon, Row, IconBubble } from '../components/UI';
import { getFarmer } from '../components/hooks';
import { db, schema, uid } from '../db';
import { CROPS, cropByName, UNITS } from '../constants/crops';
import { findWard } from '../services/gis';
import { getZimPoint } from '../services/location';
import { pickPhoto, Picked } from '../services/photos';
import { countPending, syncNow } from '../services/sync';
import { C, s } from '../constants/theme';

/** 4 short steps (no scrolling). Works 100% offline: GPS, local ward detection, on-device photo compression. */
export default function AddListing() {
  const r = useRouter();
  const { height } = useWindowDimensions();
  const kb = useKeyboard();
  const farmer = getFarmer();
  const [crop, setCrop] = useState('');
  const [variety, setVariety] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<(typeof UNITS)[number]['key']>('kg');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [phone, setPhone] = useState(farmer?.phone ?? '');
  const [photo, setPhoto] = useState<Picked | null>(null);
  const [pt, setPt] = useState<{ lat: number; lon: number } | null>(null);
  const [note, setNote] = useState('');
  const [ward, setWard] = useState<any>(null);
  const [gps, setGps] = useState(false);
  const [saving, setSaving] = useState(false);

  const locate = async () => { setGps(true); const g = await getZimPoint(); setPt(g.point); setWard(findWard(g.point)); setNote(g.note ?? ''); setGps(false); };
  useEffect(() => { locate(); }, []);
  const u = UNITS.find((x) => x.key === unit)!;
  const qtyKg = (parseFloat(qty) || 0) * u.kg; const p = parseFloat(price) || 0;

  const save = () => {
    setSaving(true);
    try {
      const now = Date.now();
      db.insert(schema.listings).values({
        id: uid(), farmer_id: farmer?.id ?? 'local', seller_name: farmer?.name ?? null, crop_type: crop, variety: variety || null,
        quantity_kg: qtyKg, price_per_kg: p, unit, description: desc.trim() || null, photo_uri: photo?.uri ?? null, photo_b64: photo?.b64 ?? null,
        lat: pt?.lat ?? null, lon: pt?.lon ?? null, ward: ward?.ward_name ?? farmer?.ward ?? null, district: ward?.district ?? farmer?.district ?? null,
        province: ward?.province ?? farmer?.province ?? null, phone: phone.trim(), sync_status: 'pending', created_at: now, updated_at: now,
      }).run();
      countPending(); syncNow(); r.back();
    } catch (x: any) { Alert.alert('Could not save', x?.message ?? 'Try again'); setSaving(false); }
  };

  const photoH = Math.max(110, Math.round(height * 0.26));
  return (
    <Screen>
      <Wizard busy={saving} finishLabel="Post listing" onFinish={save} steps={[
        { title: 'Crop', icon: 'leaf', validate: () => (crop ? null : 'Choose a crop'), content: (
          <View>
            <Picker label="Crop" icon="sprout" value={crop} placeholder="What are you selling?" options={CROPS.map((c) => ({ value: c.name, label: c.name, sub: c.group, icon: c.icon }))} onChange={(v) => { setCrop(v); setVariety(''); }} />
            <Picker label="Variety" value={variety} placeholder={crop ? 'Choose or type your own' : 'Pick a crop first'} allowOther options={(cropByName(crop)?.varieties ?? []).map((v) => ({ value: v }))} onChange={setVariety} />
          </View>) },
        { title: 'Price', icon: 'pricetag', validate: () => (!(qtyKg > 0) ? 'Enter the quantity' : !(p > 0) ? 'Enter a price per kg' : null), content: (
          <View>
            <Row style={{ flexWrap: 'wrap', marginBottom: 6 }}>{UNITS.map((x) => <Chip key={x.key} label={x.label} active={unit === x.key} onPress={() => setUnit(x.key)} />)}</Row>
            <Row style={{ gap: 10 }}>
              <Field style={{ flex: 1 }} label={`Quantity (${u.label})`} value={qty} onChangeText={setQty} keyboardType="decimal-pad" placeholder="0" />
              <Field style={{ flex: 1 }} label="Price per kg (USD)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" />
            </Row>
            {qtyKg > 0 && p > 0 && <Card style={{ backgroundColor: C.greenLight }}><T bold>{qtyKg.toLocaleString()} kg × ${p.toFixed(2)} = ${(qtyKg * p).toFixed(2)}{unit === 'bag50' ? ` · $${(p * 50).toFixed(2)} per bag` : ''}</T></Card>}
          </View>) },
        { title: 'Photo', icon: 'camera', content: (
          <View style={{ flex: 1 }}>
            {!kb && (photo ? <Image source={{ uri: photo.uri }} style={{ width: '100%', height: photoH, borderRadius: 14, marginBottom: 8 }} /> : <View style={{ height: photoH, borderRadius: 14, backgroundColor: C.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}><Icon name="image-outline" size={40} color={C.green} /><T muted size={s(11)}>Add a photo of your produce</T></View>)}
            {!kb && <Row style={{ gap: 10, marginBottom: 8 }}>
              <Button style={{ flex: 1 }} kind="ghost" icon="camera" title="Camera" onPress={async () => { const x = await pickPhoto('camera'); if (x) setPhoto(x); }} />
              <Button style={{ flex: 1 }} kind="ghost" icon="images" title="Gallery" onPress={async () => { const x = await pickPhoto('library'); if (x) setPhoto(x); }} />
            </Row>}
            <Field label="Description (optional)" value={desc} onChangeText={setDesc} multiline placeholder="Quality, moisture, packaging, delivery…" />
            {!!photo && !kb && <T muted size={s(11)}>The photo is compressed and will sync with this listing.</T>}
          </View>) },
        { title: 'Contact', icon: 'call', validate: () => (phone.replace(/\D/g, '').length < 9 ? 'Enter a valid phone number' : null), content: (
          <View>
            <Field label="Contact phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+263 77 123 4567" />
            <Card style={{ backgroundColor: pt ? C.skyLight : C.sunLight }}>
              <Row>
                <IconBubble name={pt ? 'location' : 'location-outline'} color={C.sky} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <T bold>{gps ? 'Getting GPS…' : ward?.ward_name ?? (pt ? 'Location saved' : 'No location')}</T>
                  <T muted size={s(11)} numberOfLines={2}>{note || (pt ? `${pt.lat.toFixed(4)}, ${pt.lon.toFixed(4)}${ward ? ` · ${ward.district}, ${ward.province}` : ''}` : 'Turn on location. You can still post.')}</T>
                </View>
                <Button small kind="ghost" title="Refresh" onPress={locate} />
              </Row>
            </Card>
            {!kb && <T muted size={s(11)}>Saved on your phone first; syncs automatically when online.</T>}
          </View>) },
      ]} />
    </Screen>
  );
}
