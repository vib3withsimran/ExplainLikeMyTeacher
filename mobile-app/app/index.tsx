import { View, Text, StyleSheet, TextInput, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function AuthScreen() {
  const Colors = useTheme();

  const handleSignIn = () => {
    router.replace('/(drawer)');
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: Spacing.xl,
      justifyContent: 'center',
    },
    header: {
      marginBottom: Spacing.xxxl,
    },
    title: {
      ...Fonts.displayMd,
      color: Colors.on_surface,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      ...Fonts.bodyLg,
      color: Colors.on_surface_variant,
    },
    form: {
      gap: Spacing.lg,
    },
    inputGroup: {
      gap: Spacing.xs,
    },
    label: {
      ...Fonts.labelMd,
      color: Colors.on_surface,
      marginLeft: Spacing.xs,
    },
    input: {
      backgroundColor: Colors.surface_container_lowest,
      borderWidth: 0,
      borderRadius: Radii.lg,
      padding: Spacing.lg,
      ...Fonts.bodyLg,
      color: Colors.on_surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.02,
      shadowRadius: 16,
      elevation: 2,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    forgotText: {
      ...Fonts.labelMd,
      color: Colors.primary,
      fontWeight: '600',
    },
    buttonContainer: {
      marginTop: Spacing.xl,
      borderRadius: Radii.lg,
      overflow: 'hidden',
    },
    buttonGradient: {
      paddingVertical: Spacing.lg,
      alignItems: 'center',
    },
    buttonText: {
      ...Fonts.headlineSm,
      color: Colors.on_primary,
    },
    signupContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: Spacing.xl,
    },
    signupText: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
    },
    signupHighlight: {
      ...Fonts.labelLg,
      color: Colors.primary,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>ExplainLikeMyTeacher.</Text>
            <Text style={styles.subtitle}>
              Experience an editorial, human-first learning journey powered by AI. Tactics, not just theory.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.outline_variant}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <Text style={styles.forgotText}>Forgot?</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.outline_variant}
                secureTextEntry
              />
            </View>
          </View>

          <Pressable onPress={handleSignIn} style={({ pressed }) => [
            styles.buttonContainer,
            { transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}>
            <LinearGradient
              colors={[Colors.primary, Colors.primary_container]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Sign In</Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don&apos;t have an account? </Text>
            <Pressable>
              <Text style={styles.signupHighlight}>Sign up for free</Text>
            </Pressable>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
