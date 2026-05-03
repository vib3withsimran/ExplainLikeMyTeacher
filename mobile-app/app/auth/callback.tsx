/**
 * auth/callback.tsx
 *
 * This screen handles the deep-link redirect after Google OAuth.
 * Supabase sends the user back to:
 *   explainlikemyteacher://auth/callback#access_token=...&refresh_token=...
 *
 * We extract the tokens, set the session, then redirect to the main app.
 */
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { useTheme, Fonts } from '@/constants/theme';

export default function AuthCallbackScreen() {
  const Colors = useTheme();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Tokens may arrive as query params or hash params
        const accessToken = (params.access_token as string) ?? null;
        const refreshToken = (params.refresh_token as string) ?? null;

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
        // Whether we set them or not, check if session exists
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace('/(drawer)');
        } else {
          router.replace('/auth/login');
        }
      } catch {
        router.replace('/auth/login');
      }
    };

    handleCallback();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={[Fonts.bodyMd, { color: Colors.on_surface_variant, marginTop: 16 }]}>
        Completing sign in…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
