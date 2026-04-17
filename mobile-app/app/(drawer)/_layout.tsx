import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { useTheme } from '@/constants/theme';
import CustomDrawerContent from '@/components/CustomDrawerContent';
import React from 'react';
import { View } from 'react-native';

export default function DrawerLayout() {
  const theme = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: theme.surface,
            width: '78%',
          },
          sceneContainerStyle: {
            backgroundColor: theme.background,
          },
          drawerActiveBackgroundColor: theme.primary_container,
          drawerActiveTintColor: theme.on_primary_container,
          drawerInactiveTintColor: theme.on_surface_variant,
        }}
      >
        <Drawer.Screen name="index" />
        <Drawer.Screen name="chat" />
        <Drawer.Screen name="mindmaps" />
        <Drawer.Screen name="quiz" />
        <Drawer.Screen name="pbl" />
        <Drawer.Screen name="history" />
        <Drawer.Screen name="settings" />
      </Drawer>
    </GestureHandlerRootView>
  );
}
