import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, KeyboardAvoidingView, Platform, ActivityIndicator, TextInputProps, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { C, R, s, shadow } from '../constants/theme';

// Icons come from bundled font files, so they render with no network.
export const Icon = ({ name, size = 18, color = C.ink }: { name: any; size?: number; color?: string }) => <Ionicons name={name} size={size} color={color} />;
export const MIcon = ({ name, size = 18, color = C.ink }: { name: any; size?: number; color?: string }) => <MaterialCommunityIcons name={name} size={size} color={color} />;

export const Card = ({ children, style, onPress }: any) => onPress
  ? <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}>{children}</Pressable>
  : <View style={[styles.card, style]}>{children}</View>;

export const T = ({ children, style, muted, bold, size, numberOfLines }: any) => <Text numberOfLines={numberOfLines} style={[{ fontSize: size ?? s(13), color: muted ? C.muted : C.ink, fontWeight: bold ? '700' : '400' }, style]}>{children}</Text>;
export const H = ({ children, style }: any) => <Text style={[{ fontSize: s(16), fontWeight: '800', color: C.ink, marginBottom: 6 }, style]}>{children}</Text>;
export const Row = ({ children, style }: any) => <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;

export function Button({ title, onPress, icon, kind = 'primary', loading, disabled, style, small }: any) {
  const bg = kind === 'primary' ? C.green : kind === 'sun' ? C.sun : kind === 'danger' ? C.red : '#fff';
  const fg = kind === 'ghost' ? C.green : '#fff';
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.btn, small && { minHeight: 36, paddingVertical: 6, paddingHorizontal: 12 }, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1, borderWidth: kind === 'ghost' ? 1.5 : 0, borderColor: C.green }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : <>{icon && <Icon name={icon} size={small ? 16 : 18} color={fg} />}{!!title && <Text style={{ color: fg, fontWeight: '800', fontSize: s(small ? 12 : 14), marginLeft: icon ? 6 : 0 }}>{title}</Text>}</>}
    </Pressable>
  );
}

export function Field({ label, error, style, ...p }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={[{ marginBottom: 10 }, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#9AA79D" {...p} style={[styles.input, p.multiline && { minHeight: 64, textAlignVertical: 'top' }, error ? { borderColor: C.red } : null]} />
      {!!error && <Text style={{ color: C.red, marginTop: 3, fontSize: s(11) }}>{error}</Text>}
    </View>
  );
}

export const Chip = ({ label, active, onPress, color = C.green, icon }: any) => (
  <Pressable onPress={onPress} style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}>
    {icon && <MIcon name={icon} size={14} color={active ? '#fff' : color} />}
    <Text style={{ color: active ? '#fff' : C.ink, fontWeight: '700', fontSize: s(12), marginLeft: icon ? 5 : 0 }}>{label}</Text>
  </Pressable>
);

export const Badge = ({ text, color = C.green, bg = C.greenLight }: any) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' }}>
    <Text style={{ color, fontWeight: '800', fontSize: s(10) }}>{text}</Text>
  </View>
);

export const IconBubble = ({ name, m, color = C.green, bg, size = 34 }: any) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg ?? color + '1F', alignItems: 'center', justifyContent: 'center' }}>
    {m ? <MIcon name={name} size={size * 0.52} color={color} /> : <Icon name={name} size={size * 0.52} color={color} />}
  </View>
);

export const Empty = ({ icon = 'leaf-outline', title, sub, action }: any) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <IconBubble name={icon} size={64} />
    <T bold size={s(15)} style={{ marginTop: 10 }}>{title}</T>
    {sub && <T muted style={{ textAlign: 'center', marginTop: 4 }}>{sub}</T>}
    {action && <View style={{ marginTop: 12 }}>{action}</View>}
  </View>
);

export type Opt = { value: string; label?: string; sub?: string; icon?: string };

/**
 * Dropdown in a bottom sheet. The option list is PAGED (no scrolling): 5-6 rows per page with prev/next.
 * compact = small pill for filter bars. allowOther = user can type a value that is not in the list.
 */
export function Picker({ label, value, options, onChange, placeholder = 'Select', allowOther, searchable = true, icon, compact }: { label: string; value?: string | null; options: Opt[]; onChange: (v: string) => void; placeholder?: string; allowOther?: boolean; searchable?: boolean; icon?: string; compact?: boolean }) {
  const { height } = useWindowDimensions();
  const per = height < 700 ? 4 : 5;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const list = useMemo(() => options.filter((o) => (o.label ?? o.value).toLowerCase().includes(q.toLowerCase())), [q, options]);
  const pages = Math.max(1, Math.ceil(list.length / per));
  const p = Math.min(page, pages - 1);
  const cur = options.find((o) => o.value === value);
  const shown = cur?.label ?? value;
  const show = () => { setQ(''); setPage(0); setOpen(true); };
  return (
    <View style={compact ? { flex: 1 } : { marginBottom: 10 }}>
      {!compact && <Text style={styles.label}>{label}</Text>}
      <Pressable style={[compact ? styles.pill : styles.input, { flexDirection: 'row', alignItems: 'center' }]} onPress={show}>
        {(cur?.icon || icon) && <MIcon name={cur?.icon ?? icon} size={16} color={C.green} />}
        <Text style={{ flex: 1, marginLeft: (cur?.icon || icon) ? 6 : 0, color: shown ? C.ink : '#9AA79D', fontSize: s(compact ? 12 : 14), fontWeight: compact ? '700' : '400' }} numberOfLines={1}>{shown || (compact ? label : placeholder)}</Text>
        <Icon name="chevron-down" size={14} color={C.muted} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={{ flex: 1, backgroundColor: '#0008' }} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: s(15), fontWeight: '800' }}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}><Icon name="close" size={22} color={C.muted} /></Pressable>
            </Row>
            {(searchable || allowOther) && <TextInput value={q} onChangeText={(t) => { setQ(t); setPage(0); }} placeholder={allowOther ? 'Search or type your own' : 'Search'} placeholderTextColor="#9AA79D" style={[styles.input, { marginBottom: 6 }]} />}
            <View style={{ height: per * 50 }}>
              {list.slice(p * per, p * per + per).map((o) => (
                <Pressable key={o.value} style={styles.row} onPress={() => { onChange(o.value); setOpen(false); }}>
                  {o.icon && <View style={{ marginRight: 10 }}><MIcon name={o.icon} size={20} color={C.green} /></View>}
                  <View style={{ flex: 1 }}><Text style={{ fontSize: s(14), fontWeight: o.value === value ? '800' : '500' }} numberOfLines={1}>{o.label ?? o.value}</Text>{o.sub && <Text style={{ color: C.muted, fontSize: s(11) }}>{o.sub}</Text>}</View>
                  {o.value === value && <Icon name="checkmark-circle" size={18} color={C.green} />}
                </Pressable>))}
              {allowOther && q.trim() !== '' && p === pages - 1 && list.length < per && (
                <Pressable style={styles.row} onPress={() => { onChange(q.trim()); setOpen(false); }}><Icon name="add-circle" size={20} color={C.green} /><Text style={{ marginLeft: 10, fontWeight: '700', color: C.green }}>Use "{q.trim()}"</Text></Pressable>)}
              {list.length === 0 && !allowOther && <Text style={{ color: C.muted, padding: 12 }}>No matches</Text>}
            </View>
            <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
              <Button small kind="ghost" icon="chevron-back" onPress={() => setPage(Math.max(0, p - 1))} disabled={p === 0} />
              <Text style={{ color: C.muted, fontSize: s(12), fontWeight: '700' }}>Page {p + 1} of {pages}</Text>
              <Button small kind="ghost" icon="chevron-forward" onPress={() => setPage(Math.min(pages - 1, p + 1))} disabled={p >= pages - 1} />
            </Row>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.md, padding: 12, marginBottom: 8, ...shadow },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 16, borderRadius: R.md, minHeight: 44 },
  label: { fontSize: s(10), fontWeight: '800', color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 11 : 8, fontSize: s(14), color: C.ink, minHeight: 44 },
  pill: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 99, paddingHorizontal: 10, minHeight: 36 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5, borderColor: C.line, backgroundColor: '#fff', marginRight: 6 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 14, paddingBottom: 22 },
  row: { flexDirection: 'row', alignItems: 'center', height: 50, borderBottomWidth: 1, borderBottomColor: C.line },
});
