import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import type { LatLon } from './gis';

const KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;
export type Day = { date: string; min: number; max: number; rain: number; desc: string; icon: string };
export type WeatherData = { place: string; temp: number; desc: string; humidity: number; wind: number; days: Day[] };

const iconFor = (d: string) => (/rain|drizzle/i.test(d) ? 'rainy' : /thunder/i.test(d) ? 'thunderstorm' : /cloud/i.test(d) ? 'cloudy' : /clear/i.test(d) ? 'sunny' : 'partly-sunny');

/** Read the last saved weather (works offline). */
export function readCachedWeather(): { data: WeatherData; fetched_at: number } | null {
  const row = db.select().from(schema.weather_cache).where(eq(schema.weather_cache.key, 'weather')).get();
  return row ? { data: JSON.parse(row.json), fetched_at: row.fetched_at } : null;
}

/** Fetch from OpenWeather (current + 5-day/3h forecast), collapse to daily, save to SQLite. */
export async function fetchWeather(p: LatLon): Promise<{ data: WeatherData; fetched_at: number }> {
  if (!KEY) throw new Error('Add EXPO_PUBLIC_OPENWEATHER_KEY to .env to enable live weather.');
  const base = `https://api.openweathermap.org/data/2.5`;
  const q = `lat=${p.lat}&lon=${p.lon}&units=metric&appid=${KEY}`;
  const [cur, fc] = await Promise.all([fetch(`${base}/weather?${q}`).then((r) => r.json()), fetch(`${base}/forecast?${q}`).then((r) => r.json())]);
  if (!cur?.main || !fc?.list) throw new Error(cur?.message || 'Weather service error');
  const byDay: Record<string, any[]> = {};
  for (const it of fc.list) (byDay[it.dt_txt.slice(0, 10)] ||= []).push(it);
  const days: Day[] = Object.entries(byDay).slice(0, 5).map(([date, arr]) => {
    const desc = arr[Math.floor(arr.length / 2)].weather[0].main;
    return { date, min: Math.round(Math.min(...arr.map((a) => a.main.temp_min))), max: Math.round(Math.max(...arr.map((a) => a.main.temp_max))),
      rain: Math.round(arr.reduce((s, a) => s + (a.rain?.['3h'] ?? 0), 0) * 10) / 10, desc, icon: iconFor(desc) };
  });
  const data: WeatherData = { place: cur.name || 'Your location', temp: Math.round(cur.main.temp), desc: cur.weather[0].description, humidity: cur.main.humidity, wind: Math.round(cur.wind.speed * 3.6), days };
  const fetched_at = Date.now();
  db.insert(schema.weather_cache).values({ key: 'weather', json: JSON.stringify(data), fetched_at }).onConflictDoUpdate({ target: schema.weather_cache.key, set: { json: JSON.stringify(data), fetched_at } }).run();
  return { data, fetched_at };
}
export { iconFor };
