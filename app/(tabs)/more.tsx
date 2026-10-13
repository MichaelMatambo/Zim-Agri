import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/Screen';
import TabHeader from '../../components/TabHeader';
import { Card, Icon, T, Row, Button, IconBubble } from '../../components/UI';
import { useSync, syncNow } from '../../services/sync';
import { useFarmer } from '../../components/hooks';
import { C, s } from '../../constants/theme';

export default function More() {
  const r = useRouter();
  const st = useSync();
  const [farmer] = useFarmer();
  const items = [
    { t: 'My profile', sub: farmer ? `${farmer.name} · ${farmer.phone}` : 'Create your farmer profile', i: 'person-circle-outline', go: '/profile' },
    { t: 'Farming guide', sub: 'Maize, groundnuts, sorghum: works offline', i: 'book-outline', go: '/info' },
    { t: 'Experts & services', sub: 'Agritex, agro-dealers, vets, finance', i: 'people-outline', go: '/experts' },
    { t: 'Finance & funding', sub: 'AFC, ZAGP, contract farming, youth funds', i: 'wallet-outline', go: '/finance' },
    { t: 'Weather', sub: 'Current + 5-day, cached offline', i: 'partly-sunny-outline', go: '/weather' },
    { t: 'About the data', sub: 'Model grid, services and their quality', i: 'information-circle-outline', go: '/data' },
  ];
  return (
    <View style={{ flex: 1 }}>
      <TabHeader title="More" sub="Everything else you need" />
      <Screen tab>
        <View style={{ flex: 1 }}>
          {items.map((x) => (
            <Card key={x.t} onPress={() => r.push(x.go as any)} style={{ flex: 1, justifyContent: 'center', maxHeight: 64 }}>
              <Row>
                <IconBubble name={x.i} />
                <View style={{ flex: 1, marginLeft: 10 }}><T bold>{x.t}</T><T muted size={s(11)} numberOfLines={1}>{x.sub}</T></View>
                <Icon name="chevron-forward" size={16} color={C.muted} />
              </Row>
            </Card>
          ))}
        </View>
        <Card style={{ marginBottom: 0 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <T bold>Cloud backup</T>
              <T muted size={s(11)} numberOfLines={2}>
                {!st.configured ? 'Cloud backup not set up: fully offline on this phone.' : st.online ? `${st.uid ? 'signed in · ' : ''}${st.pending} waiting · ${st.lastSync ? 'last sync ' + new Date(st.lastSync).toLocaleTimeString() : 'not synced yet'}` : 'Offline: saved on your phone, syncs when you reconnect.'}
              </T>
              {st.error ? <T style={{ color: C.red }} size={s(11)} numberOfLines={3}>{st.error}</T> : null}
            </View>
            <Button small title={st.syncing ? 'Syncing' : 'Sync now'} icon="sync" kind="ghost" onPress={() => syncNow()} disabled={!st.online || !st.configured} />
          </Row>
        </Card>
      </Screen>
    </View>
  );
}
