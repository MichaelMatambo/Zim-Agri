import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { initDb } from '../db';
import { startSync } from '../services/sync';
import { C } from '../constants/theme';

export default function RootLayout() {
  // icon fonts are bundled in the app; load them before the first screen so no icon ever appears blank
  const [fontsLoaded, fontError] = useFonts({ ...Ionicons.font, ...MaterialCommunityIcons.font });
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    try { initDb(); setReady(true); startSync(); } catch (e: any) { setErr(e?.message ?? 'Database failed to start'); }
  }, []);
  if (err) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}><Text style={{ color: C.red, textAlign: 'center' }}>Could not open local database:{'\n'}{err}</Text></View>;
  if (!ready || !(fontsLoaded || fontError)) return <View style={{ flex: 1, backgroundColor: C.green }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {/* Native stack: swipe from the left edge to go back (iOS full-screen swipe, Android system back gesture). */}
        <Stack screenOptions={{ headerStyle: { backgroundColor: C.green }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '800' }, animation: 'slide_from_right', gestureEnabled: true, fullScreenGestureEnabled: true, headerBackTitleVisible: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add-listing" options={{ title: 'Sell produce', presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="add-record" options={{ title: 'Farm record' }} />
          <Stack.Screen name="listing/[id]" options={{ title: 'Listing' }} />
          <Stack.Screen name="info/index" options={{ title: 'Farming guide' }} />
          <Stack.Screen name="info/[id]" options={{ title: 'Guide' }} />
          <Stack.Screen name="experts" options={{ title: 'Experts & services' }} />
          <Stack.Screen name="data" options={{ title: 'About the data' }} />
          <Stack.Screen name="finance" options={{ title: 'Finance & funding' }} />
          <Stack.Screen name="weather" options={{ title: 'Weather' }} />
          <Stack.Screen name="profile" options={{ title: 'My profile' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
