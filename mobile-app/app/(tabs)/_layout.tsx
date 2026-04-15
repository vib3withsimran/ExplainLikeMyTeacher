import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Spacing, useTheme } from '@/constants/theme';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            borderTopWidth: 0,
            backgroundColor: 'transparent',
            elevation: 0,
          },
          default: {
            backgroundColor: theme.surface,
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: theme.on_surface,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.04,
            shadowRadius: 16,
          },
        }),
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              tint={theme.surface === '#0f172a' ? 'dark' : 'light'}
              intensity={80}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <BlurView
              tint={theme.surface === '#0f172a' ? 'dark' : 'light'}
              intensity={80}
              style={[StyleSheet.absoluteFill, { backgroundColor: theme.surface === '#0f172a' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}
            />
          ),
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.on_surface_variant,
        tabBarLabelStyle: {
          ...Fonts.labelSm,
          marginTop: -4,
          marginBottom: 4,
        },
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Upload',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="arrow.up.circle.fill" color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="bubble.left.and.bubble.right.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="clock.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
