import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { db, schema } from '../db';

/** Re-runs a synchronous SQLite query every time the screen gains focus (so lists refresh after add/edit). */
export function useQuery<T>(fn: () => T, deps: any[] = [], initial?: T) {
  const [data, setData] = useState<T>(initial as T);
  const [tick, setTick] = useState(0);
  useFocusEffect(useCallback(() => { try { setData(fn()); } catch (e) { console.warn('query failed', e); } }, [...deps, tick])); // eslint-disable-line
  return [data, () => setTick((t) => t + 1)] as const;
}

export const getFarmer = () => db.select().from(schema.farmers).limit(1).get() ?? null;
export const useFarmer = () => useQuery(getFarmer, [], null);
