import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, s } from '../constants/theme';
import SyncBadge from './SyncBadge';

/** Compact header for the tab screens (they have no native header). Respects notches / status bars. */
export default function TabHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: C.green, paddingTop: top + 6, paddingBottom: 10, paddingHorizontal: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 680, width: '100%', alignSelf: 'center' }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ color: '#fff', fontSize: s(19), fontWeight: '900' }} numberOfLines={1}>{title}</Text>
          {!!sub && <Text style={{ color: '#D7F3DF', fontSize: s(11), marginTop: 1 }} numberOfLines={1}>{sub}</Text>}
        </View>
        {right ?? <SyncBadge />}
      </View>
    </View>
  );
}
