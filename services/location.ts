import * as Location from 'expo-location';
import { inZimbabwe, LatLon } from './gis';

// Harare centre: used when GPS is unavailable or outside Zimbabwe so the app never blocks
export const DEFAULT_POINT: LatLon = { lat: -17.83, lon: 31.05 };

/** GPS works offline (satellite), so this needs no data. Returns null if permission denied / no fix. */
export async function getCurrentPoint(timeoutMs = 12000): Promise<LatLon | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return null;
    const last = await Location.getLastKnownPositionAsync();
    const fresh = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const timeout = new Promise<null>((r) => setTimeout(() => r(null), timeoutMs));
    const pos: any = await Promise.race([fresh, timeout]);
    const p = pos ?? last;
    return p ? { lat: p.coords.latitude, lon: p.coords.longitude } : null;
  } catch {
    return null;
  }
}

/** GPS fix that is guaranteed to be inside Zimbabwe (emulators / mock locations can return far-away places). */
export async function getZimPoint(): Promise<{ point: LatLon; real: boolean; note?: string }> {
  const p = await getCurrentPoint();
  if (!p) return { point: DEFAULT_POINT, real: false, note: 'GPS unavailable: using Harare' };
  if (!inZimbabwe(p)) return { point: DEFAULT_POINT, real: false, note: 'GPS is outside Zimbabwe (test location?): using Harare' };
  return { point: p, real: true };
}
