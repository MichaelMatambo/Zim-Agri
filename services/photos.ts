import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

const DIR = FileSystem.documentDirectory + 'photos/';
export type Picked = { uri: string; b64: string };

/**
 * Pick/take a photo, then make two copies on the phone:
 *  - full: 1024 px JPEG (60%) saved in app storage for display on this device
 *  - thumb: 480 px JPEG (40%) as base64; stored with the listing and synced to the cloud with the rest of its data
 */
export async function pickPhoto(source: 'camera' | 'library'): Promise<Picked | null> {
  const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const opts = { quality: 0.8, allowsEditing: true, aspect: [4, 3] as [number, number] };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets?.[0]) return null;
  const src = res.assets[0].uri;
  const full = await ImageManipulator.manipulateAsync(src, [{ resize: { width: 1024 } }], { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG });
  const thumb = await ImageManipulator.manipulateAsync(src, [{ resize: { width: 480 } }], { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true });
  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
  const dest = DIR + `p_${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: full.uri, to: dest });
  return { uri: dest, b64: thumb.base64 ?? '' };
}

/** Image source for a listing: local file first, else the synced thumbnail (listings from other farmers). */
export const photoSource = (x: { photo_uri?: string | null; photo_b64?: string | null }) =>
  x.photo_uri ? { uri: x.photo_uri } : x.photo_b64 ? { uri: 'data:image/jpeg;base64,' + x.photo_b64 } : null;
