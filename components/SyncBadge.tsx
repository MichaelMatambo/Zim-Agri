import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSync, syncNow } from '../services/sync';
import { Icon } from './UI';
import { s } from '../constants/theme';

/** Small pill: Online/Offline + pending count. Tap to force a sync. */
export default function SyncBadge({ light }: { light?: boolean }) {
  const st = useSync();
  const label = !st.online ? 'Offline' : st.syncing ? 'Syncing…' : st.pending ? `${st.pending} to sync` : 'Synced';
  const bg = !st.online ? '#FFE3B0' : st.pending ? '#FFF3D1' : '#D7F3DF';
  const col = !st.online ? '#8A5A00' : st.pending ? '#8A6A00' : '#0F5C2A';
  return (
    <Pressable onPress={() => syncNow()} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: light ? bg : bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }}>
      <Icon name={!st.online ? 'cloud-offline' : st.pending ? 'cloud-upload' : 'cloud-done'} size={14} color={col} />
      <Text style={{ color: col, fontWeight: '800', fontSize: s(11), marginLeft: 5 }}>{label}</Text>
    </Pressable>
  );
}
