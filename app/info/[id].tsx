import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { eq } from 'drizzle-orm';
import Screen from '../../components/Screen';
import { Card, Empty, T } from '../../components/UI';
import { PageFooter } from '../../components/Paged';
import Markdown from '../../components/Markdown';
import { db, schema } from '../../db';

// The article is split into short pages (heading + 3 lines) so nothing needs to scroll.
export default function Article() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [page, setPage] = useState(0);
  const a = db.select().from(schema.info_articles).where(eq(schema.info_articles.id, String(id))).get();
  if (!a) return <Screen><Empty title="Article not found" /></Screen>;
  const lines = a.body_md.split('\n').filter((l) => l.trim());
  const head = lines[0]?.startsWith('#') ? lines[0] : '';
  const body = head ? lines.slice(1) : lines;
  const pages: string[] = [];
  for (let i = 0; i < body.length; i += 3) pages.push([head, ...body.slice(i, i + 3)].filter(Boolean).join('\n'));
  if (!pages.length) pages.push(head);
  const p = Math.min(page, pages.length - 1);
  return (
    <Screen>
      <T muted style={{ marginBottom: 6 }}>{a.crop} · {a.topic}</T>
      <Card style={{ flex: 1 }}><Markdown text={pages[p]} /></Card>
      <T muted size={11} style={{ textAlign: 'center', marginBottom: 4 }}>General guidance. Confirm rates and varieties with your Agritex officer.</T>
      <PageFooter page={p} pages={pages.length} onPage={setPage} />
    </Screen>
  );
}
