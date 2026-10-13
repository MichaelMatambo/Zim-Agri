import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Button, Row, Icon } from './UI';
import { useKeyboard } from './Screen';
import { C, s } from '../constants/theme';

export type Step = { title: string; icon: string; content: React.ReactNode; validate?: () => string | null };

/**
 * Multi-step form so no screen needs to scroll. Each step holds only a few fields that fit above the keyboard.
 * The step dots collapse while the keyboard is open to give the fields more room.
 */
export default function Wizard({ steps, onFinish, finishLabel = 'Save', busy }: { steps: Step[]; onFinish: () => void; finishLabel?: string; busy?: boolean }) {
  const [i, setI] = useState(0);
  const [err, setErr] = useState('');
  const kb = useKeyboard();
  const step = steps[i]; const last = i === steps.length - 1;
  const next = () => { const e = step.validate?.() ?? null; setErr(e ?? ''); if (e) return; last ? onFinish() : setI(i + 1); };
  return (
    <View style={{ flex: 1 }}>
      {!kb && (
        <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          {steps.map((st, k) => (
            <View key={k} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: k <= i ? C.green : C.line, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={k < i ? 'checkmark' : st.icon} size={16} color={k <= i ? '#fff' : C.muted} />
              </View>
              <Text style={{ fontSize: s(10), fontWeight: '800', color: k === i ? C.green : C.muted, marginTop: 3 }} numberOfLines={1}>{st.title}</Text>
            </View>))}
        </Row>
      )}
      <View style={{ flex: 1 }}>{step.content}</View>
      {!!err && <Text style={{ color: C.red, fontSize: s(12), fontWeight: '700', marginBottom: 6 }}>{err}</Text>}
      <Row style={{ gap: 10 }}>
        {i > 0 && <Button kind="ghost" icon="arrow-back" title="Back" onPress={() => { setErr(''); setI(i - 1); }} style={{ flex: 1 }} />}
        <Button title={last ? finishLabel : 'Next'} icon={last ? 'checkmark-circle' : 'arrow-forward'} onPress={next} loading={busy} style={{ flex: 2 }} />
      </Row>
    </View>
  );
}
