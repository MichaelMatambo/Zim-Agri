import React from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import { Card, T, Row, Badge, Icon } from '../components/UI';
import { SERVICES, GRID_BBOX } from '../services/gis';
import { C, s } from '../constants/theme';

const grid = require('../assets/data/grid.json');
const rivers = require('../assets/data/rivers.json');
const reqs = require('../assets/data/crop_requirements.json');

export default function DataInfo() {
  const sourced = SERVICES.filter((x) => x.quality === 'sourced').length;
  const extra = (reqs.crops as any[]).filter((c) => c.extra).length;
  const rows = [
    ['Model grid', `${grid.cells.length.toLocaleString()} cells (~3 km), East Zimbabwe`, 'PROTOTYPE', true],
    ['Crop requirements', `${reqs.crops.length} crops (${extra} added by the app)`, 'INDICATIVE', true],
    ['Services', `${SERVICES.length} points. Locations are approximate and not field-verified (${sourced} mapped from public sources)`, 'INDICATIVE', true],
    ['Rivers', `${rivers.lines.length} simplified lines`, 'SOURCED', false],
    ['Coverage', `${GRID_BBOX[0].toFixed(1)}E to ${GRID_BBOX[2].toFixed(1)}E, ${Math.abs(GRID_BBOX[3]).toFixed(1)}S to ${Math.abs(GRID_BBOX[1]).toFixed(1)}S`, '', false],
  ] as [string, string, string, boolean][];
  return (
    <Screen>
      <View style={{ flex: 1 }}>
        {rows.map(([a, b, c, warn]) => (
          <Card key={a}>
            <Row style={{ justifyContent: 'space-between' }}><T bold>{a}</T>{!!c && <Badge text={c} color={warn ? '#8A5A00' : C.green} bg={warn ? C.sunLight : C.greenLight} />}</Row>
            <T muted size={s(12)}>{b}</T>
          </Card>))}
        <Card style={{ backgroundColor: C.sunLight }}>
          <Row style={{ alignItems: 'flex-start' }}><Icon name="alert-circle-outline" size={18} color={C.sun} /><T size={s(12)} style={{ flex: 1, marginLeft: 8 }}>Suitability scores come from a prototype model and indicative thresholds. Validate with Agritex and agronomists before making farm decisions. Outside East Zimbabwe only a coarse rainfall-based estimate is shown.</T></Row>
        </Card>
      </View>
    </Screen>
  );
}
