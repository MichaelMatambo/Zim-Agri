import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Button, Row } from './UI';
import { C, s } from '../constants/theme';

/** Footer used by every paged view: previous / "Page x of y" / next. */
export function PageFooter({ page, pages, onPage, label }: { page: number; pages: number; onPage: (p: number) => void; label?: string }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingTop: 4 }}>
      <Button small kind="ghost" icon="chevron-back" onPress={() => onPage(Math.max(0, page - 1))} disabled={page === 0} />
      <Text style={{ color: C.muted, fontSize: s(12), fontWeight: '700' }}>{label ?? `Page ${page + 1} of ${pages}`}</Text>
      <Button small kind="ghost" icon="chevron-forward" onPress={() => onPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1} />
    </Row>
  );
}

/**
 * Paged list instead of a scrolling list. It measures the space it has, fits as many fixed-height rows as possible
 * on one page, and lets the user flip pages with the footer buttons.
 */
export function Paged<T>({ data, itemHeight, gap = 8, renderItem, empty }: { data: T[]; itemHeight: number; gap?: number; renderItem: (x: T, i: number) => React.ReactNode; empty?: React.ReactNode }) {
  const [h, setH] = useState(0);
  const [page, setPage] = useState(0);
  const FOOT = 48;
  const per = Math.max(1, Math.floor((h - FOOT + gap) / (itemHeight + gap)));
  const pages = Math.max(1, Math.ceil(data.length / per));
  const p = Math.min(page, pages - 1);
  return (
    <View style={{ flex: 1 }} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      <View style={{ flex: 1 }}>
        {data.length === 0 ? empty : data.slice(p * per, p * per + per).map((x, i) => (
          <View key={i} style={{ height: itemHeight, marginBottom: gap }}>{renderItem(x, p * per + i)}</View>
        ))}
      </View>
      {data.length > per && <PageFooter page={p} pages={pages} onPage={setPage} label={`${p * per + 1}-${Math.min(data.length, p * per + per)} of ${data.length}`} />}
    </View>
  );
}
