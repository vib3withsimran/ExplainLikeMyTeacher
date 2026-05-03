import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useFonts, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';

import { ThemeProvider } from '@/context/ThemeContext';
import { LectureProvider } from '@/context/LectureContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { supabase } from '@/services/supabaseClient';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = still loading

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listen for login / logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if ((loaded || error) && session !== undefined) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, session]);

  // Navigate based on auth state once fonts + session are both resolved
  useEffect(() => {
    if (!loaded && !error) return;   // fonts not ready yet
    if (session === undefined) return; // still checking session

    if (session) {
      router.replace('/(drawer)');
    } else {
      router.replace('/auth/login');
    }
  }, [loaded, error, session]);

  if ((!loaded && !error) || session === undefined) {
    return null;
  }

  return (
    <SettingsProvider>
      <LectureProvider>
        <ThemeProvider>
          <NavigationThemeProvider value={DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(drawer)" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </NavigationThemeProvider>
        </ThemeProvider>
      </LectureProvider>
    </SettingsProvider>
  );
}
