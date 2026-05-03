import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { supabase } from '@/services/supabaseClient';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth via browser redirect requires a production/dev build.
// In Expo Go, the exp:// redirect scheme conflicts with iOS URL handling.
const IS_EXPO_GO = Constants.appOwnership === 'expo';

export default function LoginScreen() {
  const Colors = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Email / Password login ──
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      router.replace('/(drawer)');
    }
  };

  // ── Google OAuth ──
  const handleGoogleLogin = async () => {
    if (IS_EXPO_GO) {
      Alert.alert(
        'Not available in Expo Go',
        'Google Sign-In requires the production app build. Please use email & password to sign in during testing.',
        [{ text: 'OK' }]
      );
      return;
    }
    setGoogleLoading(true);
    try {
      // Linking.createURL is the correct way in Expo Router:
      //   Expo Go  → exp://192.168.x.x:8081/--/auth/callback
      //   Standalone → explainlikemyteacher://auth/callback
      const redirectTo = Linking.createURL('auth/callback');
      console.log('[Google OAuth] redirectTo:', redirectTo); // ← CHECK THIS IN TERMINAL

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.log('[Google OAuth] result type:', result.type);

      if (result.type === 'success' && result.url) {
        console.log('[Google OAuth] callback URL:', result.url);
        // Implicit flow: tokens are in the URL hash  #access_token=...&refresh_token=...
        const hashParams = new URLSearchParams(
          result.url.includes('#') ? result.url.split('#')[1] : result.url.split('?')[1] ?? ''
        );
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setErr) throw setErr;
          router.replace('/(drawer)');
        } else {
          // Check if Supabase already set the session internally
          const { data: sess } = await supabase.auth.getSession();
          if (sess.session) {
            router.replace('/(drawer)');
          } else {
            throw new Error('No tokens received. Check Supabase redirect URL settings.');
          }
        }
      } else if (result.type === 'cancel') {
        // User dismissed — do nothing
      } else {
        console.warn('[Google OAuth] unexpected result:', JSON.stringify(result));
      }
    } catch (err: any) {
      console.error('[Google OAuth] error:', err.message);
      Alert.alert('Google Sign-In Failed', err.message || 'Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const s = makeStyles(Colors);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo area */}
          <View style={s.logoBlock}>
            <View style={s.logoCircle}>
              <Text style={s.logoEmoji}>🎓</Text>
            </View>
            <Text style={s.appName}>ExplainLikeMyTeacher</Text>
            <Text style={s.tagline}>Your AI-powered study companion</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Welcome back</Text>
            <Text style={s.cardSub}>Sign in to continue learning</Text>

            {/* Google button */}
            <Pressable style={s.googleBtn} onPress={handleGoogleLogin} disabled={googleLoading}>
              {googleLoading ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <>
                  <Text style={s.googleIcon}>G</Text>
                  <Text style={s.googleBtnText}>Continue with Google</Text>
                </>
              )}
            </Pressable>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Email */}
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.outline}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            {/* Password */}
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.outline}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Login button */}
            <Pressable style={s.primaryBtn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.on_primary} />
              ) : (
                <Text style={s.primaryBtnText}>Sign In</Text>
              )}
            </Pressable>

            {/* Footer */}
            <Pressable onPress={() => router.push('/auth/signup')} style={s.footerRow}>
              <Text style={s.footerText}>
                Don't have an account?{' '}
                <Text style={s.footerLink}>Sign up</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(Colors: any) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    logoBlock: {
      alignItems: 'center',
      marginBottom: Spacing.xxl,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: Radii.full,
      backgroundColor: Colors.primary_container,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    logoEmoji: {
      fontSize: 36,
    },
    appName: {
      ...Fonts.displaySm,
      color: Colors.primary,
      textAlign: 'center',
    },
    tagline: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
      marginTop: Spacing.xs,
    },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: Radii.xl,
      padding: Spacing.xxl,
      borderWidth: 1,
      borderColor: Colors.surface_container_highest,
      shadowColor: Colors.on_surface,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 4,
    },
    cardTitle: {
      ...Fonts.headlineLg,
      color: Colors.on_surface,
      marginBottom: Spacing.xs,
    },
    cardSub: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
      marginBottom: Spacing.xl,
    },
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: Colors.surface_container_low,
      borderWidth: 1,
      borderColor: Colors.outline_variant,
      borderRadius: Radii.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    googleIcon: {
      fontFamily: 'Manrope_700Bold',
      fontSize: 18,
      color: '#4285F4',
    },
    googleBtnText: {
      ...Fonts.labelLg,
      color: Colors.on_surface,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      gap: Spacing.sm,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: Colors.surface_container_highest,
    },
    dividerText: {
      ...Fonts.bodySm,
      color: Colors.outline,
    },
    label: {
      ...Fonts.labelLg,
      color: Colors.on_surface,
      marginBottom: Spacing.xs,
    },
    input: {
      backgroundColor: Colors.surface_container_low,
      borderWidth: 1,
      borderColor: Colors.outline_variant,
      borderRadius: Radii.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      ...Fonts.bodyLg,
      color: Colors.on_surface,
      marginBottom: Spacing.lg,
    },
    primaryBtn: {
      backgroundColor: Colors.primary,
      borderRadius: Radii.full,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    primaryBtnText: {
      ...Fonts.labelLg,
      color: Colors.on_primary,
      fontFamily: 'Manrope_700Bold',
    },
    footerRow: {
      alignItems: 'center',
    },
    footerText: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
    },
    footerLink: {
      color: Colors.primary,
      fontFamily: 'Inter_500Medium',
    },
  });
}
