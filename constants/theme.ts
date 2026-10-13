import { Dimensions, PixelRatio } from 'react-native';

export const C = {
  green: '#1B8A3E', greenDark: '#0F5C2A', greenLight: '#E3F5E8',
  sun: '#F5A400', sunLight: '#FFF3D1', soil: '#8B5A2B', soilLight: '#F3E7DA',
  sky: '#1E88E5', skyLight: '#E3F1FD', red: '#D93B3B', redLight: '#FDE8E8',
  ink: '#1D2B20', muted: '#66756A', line: '#E1E8E2', bg: '#F5F8F3', card: '#FFFFFF',
};

// Scale sizes with screen width (baseline 375dp) so layouts fit small and large phones.
const { width } = Dimensions.get('window');
export const s = (n: number) => Math.round(PixelRatio.roundToNearestPixel(Math.min(Math.max(width / 375, 0.85), 1.2) * n));
export const R = { sm: 10, md: 14, lg: 22 };
export const shadow = { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 };

// Suitability classes from the model: >=90 High, 60-89 Moderate, 1-59 Marginal, 0 Not suitable
export const CLASS_COLOR: Record<string, string> = { High: '#1A9641', Moderate: '#E6C12E', Marginal: '#F08A24', 'Not suitable': '#9B2D2D', Unknown: '#9AA5A0' };
export const classOf = (i: number) => (i >= 90 ? 'High' : i >= 60 ? 'Moderate' : i >= 1 ? 'Marginal' : 'Not suitable');
export const suitColor = (v?: string) => CLASS_COLOR[v ?? 'Unknown'] ?? CLASS_COLOR.Unknown;
