import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Header from '@/components/Header';
import * as DocumentPicker from 'expo-document-picker';
import { generatePBL } from '@/services/gradioService';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PBLScenario {
  title: string;
  problem: string;
  questions: string[];
}

/**
 * Parse the raw API response into a normalised PBLScenario[].
 *
 * The API returns JSON — we handle several plausible shapes:
 *   1. Already an array of {title, problem, questions}
 *   2. A raw string that needs JSON.parse / code-fence extraction
 *   3. An object with a wrapper key
 */
function parsePBLResponse(raw: any): PBLScenario[] {
  // Check for error objects
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.error) {
    const errMsg = typeof raw.error === 'string' ? raw.error : JSON.stringify(raw.error);
    throw new Error(`Server error: ${errMsg}`);
  }

  // If raw is a string, try to extract JSON
  if (typeof raw === 'string') {
    const jsonMatch =
      raw.match(/```(?:json)?\s*([\s\S]*?)```/) ||
      raw.match(/(\[[\s\S]*\])/) ||
      raw.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        raw = JSON.parse(jsonMatch[1]);
      } catch {
        throw new Error('Could not parse PBL data from response.');
      }
    } else {
      throw new Error('No PBL data found in response.');
    }
  }

  // Normalise: unwrap common wrappers
  const list: any[] = Array.isArray(raw)
    ? raw
    : raw?.scenarios && Array.isArray(raw.scenarios)
      ? raw.scenarios
      : raw?.pbl && Array.isArray(raw.pbl)
        ? raw.pbl
        : [];

  if (list.length === 0) {
    throw new Error('PBL response contained no scenarios.');
  }

  return list.map((s: any) => ({
    title: s.title || 'Untitled Scenario',
    problem: s.problem || s.description || s.statement || '',
    questions: Array.isArray(s.questions)
      ? s.questions
      : Array.isArray(s.guiding_questions)
        ? s.guiding_questions
        : [],
  }));
}

// ─── Scenario Card Component ──────────────────────────────────────────────────
function ScenarioCard({
  scenario,
  index,
  theme,
}: {
  scenario: PBLScenario;
  index: number;
  theme: any;
}) {
  const [showQuestions, setShowQuestions] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleQuestions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotateAnim, {
      toValue: showQuestions ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setShowQuestions(!showQuestions);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const accentColors = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899'];
  const accent = accentColors[index % accentColors.length];

  const cardStyles = StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: Radii.xl,
      marginBottom: Spacing.xl,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    accentStrip: {
      height: 4,
      backgroundColor: accent,
    },
    cardContent: {
      padding: Spacing.xl,
    },
    scenarioLabel: {
      ...Fonts.labelSm,
      color: accent,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: Spacing.xs,
    },
    title: {
      ...Fonts.headlineSm,
      color: theme.on_surface,
      marginBottom: Spacing.lg,
      lineHeight: 28,
    },
    problemSection: {
      backgroundColor: theme.surface_container_low,
      borderRadius: Radii.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    problemLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      gap: Spacing.xs,
    },
    problemLabelText: {
      ...Fonts.labelMd,
      color: theme.on_surface_variant,
      fontWeight: '600',
    },
    problemText: {
      ...Fonts.bodyLg,
      color: theme.on_surface,
      lineHeight: 24,
    },
    questionsToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      backgroundColor: theme.surface_variant,
      borderRadius: Radii.md,
    },
    questionsToggleText: {
      ...Fonts.labelLg,
      color: theme.on_surface,
      fontWeight: '600',
    },
    questionsList: {
      marginTop: Spacing.lg,
    },
    questionItem: {
      flexDirection: 'row',
      marginBottom: Spacing.md,
      gap: Spacing.md,
      alignItems: 'flex-start',
    },
    questionBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: accent + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    questionBadgeText: {
      ...Fonts.labelSm,
      color: accent,
      fontWeight: '700',
    },
    questionText: {
      ...Fonts.bodyLg,
      color: theme.on_surface,
      flex: 1,
      lineHeight: 22,
    },
  });

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.accentStrip} />
      <View style={cardStyles.cardContent}>
        <Text style={cardStyles.scenarioLabel}>Scenario {index + 1}</Text>
        <Text style={cardStyles.title}>{scenario.title}</Text>

        <View style={cardStyles.problemSection}>
          <View style={cardStyles.problemLabel}>
            <IconSymbol name="doc.text.fill" size={16} color={theme.on_surface_variant} />
            <Text style={cardStyles.problemLabelText}>Problem Statement</Text>
          </View>
          <Text style={cardStyles.problemText}>{scenario.problem}</Text>
        </View>

        {scenario.questions.length > 0 && (
          <>
            <Pressable style={cardStyles.questionsToggle} onPress={toggleQuestions}>
              <Text style={cardStyles.questionsToggleText}>
                💡 Guiding Questions ({scenario.questions.length})
              </Text>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <IconSymbol name="chevron.down" size={18} color={theme.on_surface_variant} />
              </Animated.View>
            </Pressable>

            {showQuestions && (
              <View style={cardStyles.questionsList}>
                {scenario.questions.map((q, qIdx) => (
                  <View key={qIdx} style={cardStyles.questionItem}>
                    <View style={cardStyles.questionBadge}>
                      <Text style={cardStyles.questionBadgeText}>{qIdx + 1}</Text>
                    </View>
                    <Text style={cardStyles.questionText}>{q}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PBLScreen() {
  const theme = useTheme();
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scenarios, setScenarios] = useState<PBLScenario[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const picked = result.assets[0];
        setFile(picked);
        setError(null);
        setScenarios([]);
        setIsGenerating(true);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        try {
          const rawData = await generatePBL(
            picked.uri,
            picked.name,
            picked.mimeType || 'image/png'
          );
          console.log('Raw PBL response:', JSON.stringify(rawData).substring(0, 500));
          const parsed = parsePBLResponse(rawData);
          setScenarios(parsed);
        } catch (err: any) {
          console.error('PBL generation error:', err);
          setError(err.message || 'Failed to generate PBL scenarios. Please try again.');
          setFile(null);
        } finally {
          setIsGenerating(false);
        }
      }
    } catch (err) {
      console.error('Document picker error:', err);
    }
  };

  const reset = () => {
    setFile(null);
    setScenarios([]);
    setError(null);
    fadeAnim.setValue(0);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    uploadCard: {
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.outline_variant,
      borderStyle: 'dashed',
      borderRadius: Radii.xl,
      width: '100%',
      padding: Spacing.xxxl,
      alignItems: 'center',
    },
    uploadIconFrame: {
      width: 80,
      height: 80,
      borderRadius: Radii.full,
      backgroundColor: theme.primary_container,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
    },
    uploadTitle: {
      ...Fonts.headlineSm,
      color: theme.on_surface,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    uploadDesc: {
      ...Fonts.bodyMd,
      color: theme.on_surface_variant,
      textAlign: 'center',
    },
    formatHint: {
      ...Fonts.labelSm,
      color: theme.on_surface_variant,
      textAlign: 'center',
      marginTop: Spacing.sm,
      opacity: 0.65,
    },
    primaryButton: {
      marginTop: Spacing.xxl,
      backgroundColor: theme.primary,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xxl,
      borderRadius: Radii.full,
      alignItems: 'center',
    },
    primaryButtonText: {
      ...Fonts.labelLg,
      color: theme.on_primary,
    },
    errorBox: {
      marginTop: Spacing.lg,
      backgroundColor: theme.error_container ?? '#fef2f2',
      borderRadius: Radii.md,
      padding: Spacing.md,
      width: '100%',
    },
    errorText: {
      ...Fonts.bodyMd,
      color: theme.on_error_container ?? '#991b1b',
      textAlign: 'center',
    },
    fileInfoBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      backgroundColor: theme.surface_container_low,
      borderBottomWidth: 1,
      borderBottomColor: theme.outline_variant,
    },
    fileInfoText: {
      ...Fonts.labelMd,
      color: theme.on_surface_variant,
      flex: 1,
      marginRight: Spacing.md,
    },
    newButton: {
      backgroundColor: theme.primary_container,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radii.full,
    },
    newButtonText: {
      ...Fonts.labelMd,
      color: theme.on_primary_container,
      fontWeight: 'bold',
    },
    contentContainer: {
      padding: Spacing.xl,
      paddingBottom: Spacing.xxxl + 20,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
    },
    headerTitle: {
      ...Fonts.headlineMd,
      color: theme.on_surface,
    },
    countBadge: {
      backgroundColor: theme.primary_container,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radii.full,
    },
    countText: {
      ...Fonts.labelMd,
      color: theme.on_primary_container,
      fontWeight: 'bold',
    },
    introBanner: {
      backgroundColor: theme.surface_container_low,
      borderRadius: Radii.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    introBannerText: {
      ...Fonts.bodyMd,
      color: theme.on_surface_variant,
      flex: 1,
      lineHeight: 20,
    },
    loadingDots: {
      flexDirection: 'row',
      marginTop: Spacing.lg,
      gap: Spacing.sm,
    },
  });

  // ─── Upload Screen ──────────────────────────────────────────────────────────
  if (!file && !isGenerating) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="PBL Learning" />
        <View style={styles.center}>
          <View style={styles.uploadCard}>
            <View style={styles.uploadIconFrame}>
              <IconSymbol name="briefcase.fill" size={36} color={theme.primary} />
            </View>
            <Text style={styles.uploadTitle}>Project-Based Learning</Text>
            <Text style={styles.uploadDesc}>
              Upload your lecture notes and we&apos;ll generate real-world problem scenarios with guiding questions to deepen your understanding.
            </Text>
            <Text style={styles.formatHint}>Supports PNG, JPG, PDF</Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable style={styles.primaryButton} onPress={pickDocument}>
              <Text style={styles.primaryButtonText}>
                {error ? 'Try Again' : 'Select File'}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Generating Screen ──────────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="PBL Learning" />
        <Animated.View style={[styles.center, { opacity: fadeAnim }]}>
          <View style={styles.uploadIconFrame}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
          <Text style={styles.uploadTitle}>Designing Scenarios…</Text>
          <Text style={styles.uploadDesc}>
            Analyzing your notes and crafting real-world problems. This may take a moment.
          </Text>
          <View style={styles.loadingDots}>
            <Text style={{ ...Fonts.bodyMd, color: theme.on_surface_variant }}>
              📄 {file?.name}
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ─── Results Screen ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="PBL Learning" />

      {/* File info bar */}
      <View style={styles.fileInfoBar}>
        <Text style={styles.fileInfoText} numberOfLines={1}>
          📄 {file?.name}
        </Text>
        <Pressable style={styles.newButton} onPress={reset}>
          <Text style={styles.newButtonText}>New +</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>PBL Scenarios</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{scenarios.length} Scenarios</Text>
          </View>
        </View>

        {/* Intro banner */}
        <View style={styles.introBanner}>
          <IconSymbol name="lightbulb.fill" size={24} color={theme.primary} />
          <Text style={styles.introBannerText}>
            Each scenario presents a real-world problem based on your notes. Tap "Guiding Questions" to explore prompts that help you think through the solution.
          </Text>
        </View>

        {/* Scenario cards */}
        {scenarios.map((scenario, idx) => (
          <ScenarioCard
            key={idx}
            scenario={scenario}
            index={idx}
            theme={theme}
          />
        ))}

        {/* Reset button */}
        <Pressable
          style={[styles.primaryButton, { marginTop: Spacing.lg, alignSelf: 'center' }]}
          onPress={reset}
        >
          <Text style={styles.primaryButtonText}>Upload New File</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
