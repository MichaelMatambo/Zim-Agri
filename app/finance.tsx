import React, { useState } from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import { Card, T, Row, Badge, MIcon, Icon, IconBubble } from '../components/UI';
import { FUNDS } from '../constants/finance';
import { C, s } from '../constants/theme';

const SHORT: Record<string, string> = { afc: 'AFC', zagp: 'ZAGP', contract: 'Contract', youth: 'Youth', inputs: 'Inputs' };

export default function Finance() {
  const [id, setId] = useState('afc');
  const f = FUNDS.find((x) => x.id === id)!;
  return (
    <Screen>
      <Row style={{ marginBottom: 10 }}>
        {FUNDS.map((x) => (
          <View key={x.id} style={{ flex: 1, alignItems: 'center' }}>
            <View onTouchEnd={() => setId(x.id)} style={{ alignItems: 'center' }}>
              <IconBubble m name={x.icon} color={id === x.id ? '#fff' : C.soil} bg={id === x.id ? C.green : C.soilLight} size={44} />
              <T size={s(10)} bold style={{ marginTop: 3, color: id === x.id ? C.green : C.muted }}>{SHORT[x.id]}</T>
            </View>
          </View>))}
      </Row>
      <Card style={{ flex: 1 }}>
        <T bold size={s(15)}>{f.name}</T>
        <View style={{ marginVertical: 6 }}><Badge text={f.type.toUpperCase()} color={C.soil} bg={C.soilLight} /></View>
        <T>{f.summary}</T>
        <T bold style={{ marginTop: 8, marginBottom: 2 }}>Eligibility</T>
        {f.eligibility.map((e) => <Row key={e} style={{ alignItems: 'flex-start', marginTop: 3 }}><Icon name="checkmark-circle" size={16} color={C.green} /><T style={{ flex: 1, marginLeft: 6 }} size={s(12)}>{e}</T></Row>)}
        <Row style={{ marginTop: 8 }}><Icon name="location-outline" size={14} color={C.muted} /><T muted size={s(11)} style={{ marginLeft: 4, flex: 1 }}>{f.contact}</T></Row>
      </Card>
      <T muted size={s(11)} style={{ textAlign: 'center' }}>Confirm current terms with the institution before applying.</T>
    </Screen>
  );
}
