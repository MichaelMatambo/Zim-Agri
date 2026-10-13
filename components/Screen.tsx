import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Keyboard, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../constants/theme';

/** true while the soft keyboard is open: screens use it to hide decorations so the focused field is never covered. */
export function useKeyboard() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return open;
}

/**
 * Every screen uses this wrapper. NOTHING scrolls vertically in this app: content is laid out with flex to fit the screen,
 * long lists are paged (Paged.tsx) and long forms are split into steps (Wizard.tsx).
 *  - Keyboard: iOS pads the view; Android resizes the window (app.json) so the focused field stays visible.
 *  - Responsive: max width on tablets, safe-area aware for stack screens (tab screens sit above the tab bar).
 */
export default function Screen({ children, tab, style }: { children: React.ReactNode; tab?: boolean; style?: any }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
      <View style={[{ flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center', padding: 12, paddingBottom: tab ? 8 : 12 + insets.bottom }, style]}>{children}</View>
    </KeyboardAvoidingView>
  );
}
