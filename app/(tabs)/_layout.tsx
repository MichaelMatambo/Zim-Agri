import React from 'react';
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/UI';
import { C } from '../../constants/theme';

const { Navigator } = createMaterialTopTabNavigator();
const SwipeTabs = withLayoutContext(Navigator);

/**
 * Bottom tabs you can ALSO swipe left/right between (pager view).
 * Icons are bundled fonts → visible offline. The Map tab disables swiping so map panning still works.
 */
export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();
  const tab = (title: string, icon: string, focusedIcon: string) => ({
    title,
    tabBarIcon: ({ focused, color }: any) => <Icon name={focused ? focusedIcon : icon} size={22} color={color} />,
  });
  return (
    <SwipeTabs
      tabBarPosition="bottom" initialRouteName="index" screenOptions={{
        swipeEnabled: true, lazy: true, tabBarShowIcon: true, tabBarActiveTintColor: C.green, tabBarInactiveTintColor: '#8A978D',
        tabBarIndicatorStyle: { backgroundColor: C.green, height: 3, top: 0 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800', textTransform: 'none', margin: 0 },
        tabBarItemStyle: { paddingHorizontal: 0, paddingVertical: 6 },
        tabBarStyle: { backgroundColor: '#fff', paddingBottom: bottom, elevation: 12, borderTopWidth: 1, borderTopColor: C.line },
      }}>
      <SwipeTabs.Screen name="index" options={tab('Home', 'home-outline', 'home')} />
      <SwipeTabs.Screen name="market" options={tab('Market', 'storefront-outline', 'storefront')} />
      <SwipeTabs.Screen name="map" options={{ ...tab('Map', 'map-outline', 'map'), swipeEnabled: false }} />
      <SwipeTabs.Screen name="farm-records" options={tab('My Farm', 'leaf-outline', 'leaf')} />
      <SwipeTabs.Screen name="more" options={tab('More', 'grid-outline', 'grid')} />
    </SwipeTabs>
  );
}
