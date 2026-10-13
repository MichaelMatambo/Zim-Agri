import React from 'react';
import { Text, View } from 'react-native';
import { C, s } from '../constants/theme';

// Tiny offline markdown renderer: #, ##, - bullets, **bold**, *italic*.
const inline = (t: string, k: number) => t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, i) =>
  p.startsWith('**') ? <Text key={`${k}-${i}`} style={{ fontWeight: '800' }}>{p.slice(2, -2)}</Text>
  : p.startsWith('*') && p.length > 2 ? <Text key={`${k}-${i}`} style={{ fontStyle: 'italic' }}>{p.slice(1, -1)}</Text> : p);

export default function Markdown({ text }: { text: string }) {
  return (
    <View>
      {text.split('\n').filter((l) => l.trim()).map((l, i) => {
        if (l.startsWith('# ')) return <Text key={i} style={{ fontSize: s(20), fontWeight: '800', color: C.greenDark, marginBottom: 8 }}>{l.slice(2)}</Text>;
        if (l.startsWith('## ')) return <Text key={i} style={{ fontSize: s(16), fontWeight: '800', marginVertical: 6 }}>{l.slice(3)}</Text>;
        if (l.startsWith('- ')) return <View key={i} style={{ flexDirection: 'row', marginBottom: 6, paddingRight: 8 }}><Text style={{ color: C.green, fontWeight: '900', marginRight: 8 }}>•</Text><Text style={{ flex: 1, fontSize: s(15), lineHeight: s(22), color: C.ink }}>{inline(l.slice(2), i)}</Text></View>;
        return <Text key={i} style={{ fontSize: s(15), lineHeight: s(22), marginBottom: 6 }}>{inline(l, i)}</Text>;
      })}
    </View>
  );
}
