import React, { useState } from 'react';
import { View, Text, Pressable, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Icon, Button } from './UI';
import { C, R, s } from '../constants/theme';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Offline date picker (native dialog). Value is stored as YYYY-MM-DD text. */
export default function DateField({ label, value, onChange }: { label: string; value?: string | null; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [tmp, setTmp] = useState(value ? new Date(value) : new Date());
  const picker = (
    <DateTimePicker value={tmp} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={(e, d) => { if (Platform.OS === 'android') { setOpen(false); if (e.type === 'set' && d) onChange(iso(d)); } else if (d) setTmp(d); }} />
  );
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: s(10), fontWeight: '800', color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
      <Pressable onPress={() => { setTmp(value ? new Date(value) : new Date()); setOpen(true); }} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: R.sm, paddingHorizontal: 14, minHeight: 44 }}>
        <Icon name="calendar" size={18} color={C.green} />
        <Text style={{ flex: 1, marginLeft: 10, fontSize: s(14), color: value ? C.ink : '#9AA79D' }}>{value || 'Select date'}</Text>
        {!!value && <Pressable hitSlop={10} onPress={() => onChange('')}><Icon name="close-circle" size={18} color={C.muted} /></Pressable>}
      </Pressable>
      {open && Platform.OS === 'android' && picker}
      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' }}>
            <View style={{ backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              {picker}
              <Button title="Done" onPress={() => { onChange(iso(tmp)); setOpen(false); }} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
