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

const IS_EXPO_GO = Constants.appOwnership === 'expo';

export default function SignupScreen() {
  const Colors = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Email / Password signup ──
  const handleSignup = async () => {
    if (!email.trim() || !password || !confirm) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password Mismatch', 'Your passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert(
        'Account Created! 🎉',
        'Check your email to confirm your account, then sign in.',
        [{ text: 'Go to Login', onPress: () => router.replace('/auth/login') }]
      );
    }
  };

  // ── Google OAuth ──
  const handleGoogleSignup = async () => {
    if (IS_EXPO_GO) {
      Alert.alert(
        'Not available in Expo Go',
        'Google Sign-Up requires the production app build. Please use email & password to create your account.',
        [{ text: 'OK' }]
      );
      return;
    }
    setGoogleLoading(true);
    try {
      const redirectTo = Linking.createURL('auth/callback');
      console.log('[Google OAuth] redirectTo:', redirectTo);

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
          const { data: sess } = await supabase.auth.getSession();
          if (sess.session) router.replace('/(drawer)');
          else throw new Error('No tokens received. Check Supabase redirect URL settings.');
        }
      }
    } catch (err: any) {
      console.error('[Google OAuth] error:', err.message);
      Alert.alert('Google Sign-Up Failed', err.message || 'Please try again.');
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
          {/* Logo */}
          <View style={s.logoBlock}>
            <View style={s.logoCircle}>
              <Text style={s.logoEmoji}>🎓</Text>
            </View>
            <Text style={s.appName}>ExplainLikeMyTeacher</Text>
            <Text style={s.tagline}>Start your learning journey</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Create account</Text>
            <Text style={s.cardSub}>Join thousands of students learning smarter</Text>

            {/* Google button */}
            <Pressable style={s.googleBtn} onPress={handleGoogleSignup} disabled={googleLoading}>
              {googleLoading ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <>
                  <Text style={s.googleIcon}>G</Text>
                  <Text style={s.googleBtnText}>Sign up with Google</Text>
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
              placeholder="Min. 6 characters"
              placeholderTextColor={Colors.outline}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Confirm password */}
            <Text style={s.label}>Confirm Password</Text>
            <TextInput
              style={s.input}
              placeholder="Re-enter password"
              placeholderTextColor={Colors.outline}
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />

            {/* Sign up button */}
            <Pressable style={s.primaryBtn} onPress={handleSignup} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.on_primary} />
              ) : (
                <Text style={s.primaryBtnText}>Create Account</Text>
              )}
            </Pressable>

            {/* Footer */}
            <Pressable onPress={() => router.push('/auth/login')} style={s.footerRow}>
              <Text style={s.footerText}>
                Already have an account?{' '}
                <Text style={s.footerLink}>Sign in</Text>
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
    safe: { flex: 1, backgroundColor: Colors.background },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
    logoBlock: { alignItems: 'center', marginBottom: Spacing.xxl },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: Radii.full,
      backgroundColor: Colors.primary_container,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    logoEmoji: { fontSize: 36 },
    appName: { ...Fonts.displaySm, color: Colors.primary, textAlign: 'center' },
    tagline: { ...Fonts.bodyMd, color: Colors.on_surface_variant, marginTop: Spacing.xs },
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
    cardTitle: { ...Fonts.headlineLg, color: Colors.on_surface, marginBottom: Spacing.xs },
    cardSub: { ...Fonts.bodyMd, color: Colors.on_surface_variant, marginBottom: Spacing.xl },
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
    googleIcon: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: '#4285F4' },
    googleBtnText: { ...Fonts.labelLg, color: Colors.on_surface },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      gap: Spacing.sm,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.surface_container_highest },
    dividerText: { ...Fonts.bodySm, color: Colors.outline },
    label: { ...Fonts.labelLg, color: Colors.on_surface, marginBottom: Spacing.xs },
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
    footerRow: { alignItems: 'center' },
    footerText: { ...Fonts.bodyMd, color: Colors.on_surface_variant },
    footerLink: { color: Colors.primary, fontFamily: 'Inter_500Medium' },
  });
}
