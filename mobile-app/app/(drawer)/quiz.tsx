import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Header from '@/components/Header';
import * as DocumentPicker from 'expo-document-picker';
import { generateQuiz } from '@/services/gradioService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  correct: number; // index of the correct option
}

/**
 * Parse the raw API response into a normalised QuizQuestion[].
 *
 * The Gradio endpoint returns JSON — we handle several plausible shapes:
 *   1. Already an array of {question, options, answer/correct_answer, ...}
 *   2. An object with a "questions" key
 *   3. A raw string that needs JSON.parse
 */
function parseQuizResponse(raw: any): QuizQuestion[] {
  // Check for server-side error objects (e.g. 401 from HuggingFace API key issues)
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.error) {
    const errMsg = typeof raw.error === 'string' ? raw.error : JSON.stringify(raw.error);
    if (errMsg.includes('401') || errMsg.includes('Unauthorized')) {
      throw new Error('The AI service is temporarily unavailable (authentication issue on the server). Please try again later or contact the app maintainer.');
    }
    throw new Error(`Server error: ${errMsg}`);
  }

  // If raw is a string, try to extract JSON from it
  if (typeof raw === 'string') {
    // Check for error strings too
    if (raw.includes('"error"') && (raw.includes('401') || raw.includes('Unauthorized'))) {
      throw new Error('The AI service is temporarily unavailable (authentication issue on the server). Please try again later.');
    }

    // Try to find JSON in the string (it may be wrapped in markdown code fences)
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                      raw.match(/(\[[\s\S]*\])/) ||
                      raw.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        raw = JSON.parse(jsonMatch[1]);
      } catch {
        throw new Error('Could not parse quiz data from response.');
      }
    } else {
      throw new Error('No quiz data found in response.');
    }

    // Re-check parsed result for error objects
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.error) {
      throw new Error(`Server error: ${typeof raw.error === 'string' ? raw.error : JSON.stringify(raw.error)}`);
    }
  }

  // Normalise: unwrap a {questions: [...]} wrapper
  const list: any[] = Array.isArray(raw)
    ? raw
    : raw?.questions && Array.isArray(raw.questions)
      ? raw.questions
      : raw?.quiz && Array.isArray(raw.quiz)
        ? raw.quiz
        : [];

  if (list.length === 0) {
    throw new Error('Quiz response contained no questions.');
  }

  return list.map((q: any, idx: number) => {
    // Gather option strings from common key shapes
    const options: string[] =
      q.options ||
      q.choices ||
      q.answers ||
      (q.A ? [q.A, q.B, q.C, q.D].filter(Boolean) : []);

    // Determine correct answer index
    let correctIdx = 0;
    const correctRaw = q.correct_answer ?? q.correct ?? q.answer ?? q.correctAnswer ?? 0;
    if (typeof correctRaw === 'number') {
      correctIdx = correctRaw;
    } else if (typeof correctRaw === 'string') {
      // Could be "A", "B", "C", "D" or the full answer text
      const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      if (letterMap[correctRaw.toUpperCase()] !== undefined) {
        correctIdx = letterMap[correctRaw.toUpperCase()];
      } else {
        // Match by text
        const match = options.findIndex(
          (o: string) => o.trim().toLowerCase() === correctRaw.trim().toLowerCase()
        );
        correctIdx = match >= 0 ? match : 0;
      }
    }

    return {
      id: idx,
      text: q.question || q.text || `Question ${idx + 1}`,
      options,
      correct: correctIdx,
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function QuizScreen() {
  const theme = useTheme();
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const scoreAnim = useRef(new Animated.Value(0)).current;
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
        setQuestions([]);
        setSelectedAnswers({});
        setIsSubmitted(false);
        setIsGenerating(true);

        // Fade in loading
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        try {
          const rawData = await generateQuiz(
            picked.uri,
            picked.name,
            picked.mimeType || 'image/png'
          );
          console.log('Raw quiz response:', JSON.stringify(rawData).substring(0, 500));
          const parsed = parseQuizResponse(rawData);
          setQuestions(parsed);
        } catch (err: any) {
          console.error('Quiz generation error:', err);
          setError(err.message || 'Failed to generate quiz. Please try again.');
          setFile(null);
        } finally {
          setIsGenerating(false);
        }
      }
    } catch (err) {
      console.error('Document picker error:', err);
    }
  };

  const handleSelectOption = (qId: number, oIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: oIdx }));
  };

  const handleSubmit = () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      Alert.alert(
        'Incomplete',
        'Please answer all questions before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }
    setIsSubmitted(true);

    // Animate score reveal
    Animated.spring(scoreAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correct) score++;
    });
    return score;
  };

  const reset = () => {
    setFile(null);
    setQuestions([]);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setError(null);
    scoreAnim.setValue(0);
    fadeAnim.setValue(0);
  };

  const getOptionStyle = (q: QuizQuestion, idx: number) => {
    const isSelected = selectedAnswers[q.id] === idx;
    const isCorrect = isSubmitted && q.correct === idx;
    const isWrong = isSubmitted && isSelected && q.correct !== idx;

    if (isCorrect) return styles.optionBtnCorrect;
    if (isWrong) return styles.optionBtnWrong;
    if (isSelected && !isSubmitted) return styles.optionBtnSelected;
    return {};
  };

  const getOptionIcon = (q: QuizQuestion, idx: number) => {
    const isSelected = selectedAnswers[q.id] === idx;
    const isCorrect = isSubmitted && q.correct === idx;
    const isWrong = isSubmitted && isSelected && q.correct !== idx;

    if (isCorrect) return { name: 'checkmark.circle.fill' as any, color: '#166534' };
    if (isWrong) return { name: 'xmark.circle.fill' as any, color: '#991b1b' };
    if (isSelected) return { name: 'circle.inset.filled' as any, color: theme.primary };
    return { name: 'circle' as any, color: theme.outline };
  };

  const getOptionTextColor = (q: QuizQuestion, idx: number) => {
    const isCorrect = isSubmitted && q.correct === idx;
    const isWrong = isSubmitted && selectedAnswers[q.id] === idx && q.correct !== idx;
    if (isCorrect) return '#166534';
    if (isWrong) return '#991b1b';
    return theme.on_surface;
  };

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

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
    quizContent: {
      padding: Spacing.xl,
      paddingBottom: Spacing.xxxl + 20,
    },
    quizHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
    },
    quizHeaderText: {
      ...Fonts.headlineMd,
      color: theme.on_surface,
    },
    quizCountBadge: {
      backgroundColor: theme.primary_container,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radii.full,
    },
    quizCountText: {
      ...Fonts.labelMd,
      color: theme.on_primary_container,
      fontWeight: 'bold',
    },
    questionCard: {
      backgroundColor: theme.surface,
      padding: Spacing.xl,
      borderRadius: Radii.lg,
      marginBottom: Spacing.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    questionNumber: {
      ...Fonts.labelMd,
      color: theme.primary,
      fontWeight: 'bold',
      marginBottom: Spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    questionText: {
      ...Fonts.headlineSm,
      color: theme.on_surface,
      marginBottom: Spacing.lg,
      lineHeight: 26,
    },
    optionBtn: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radii.md,
      borderWidth: 1.5,
      borderColor: theme.outline_variant,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionBtnSelected: {
      backgroundColor: theme.primary_container,
      borderColor: theme.primary,
    },
    optionBtnCorrect: {
      backgroundColor: '#dcfce7',
      borderColor: '#22c55e',
    },
    optionBtnWrong: {
      backgroundColor: '#fee2e2',
      borderColor: '#ef4444',
    },
    optionLabel: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.surface_variant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    optionLabelText: {
      ...Fonts.labelMd,
      color: theme.on_surface_variant,
      fontWeight: 'bold',
    },
    optionText: {
      ...Fonts.bodyLg,
      color: theme.on_surface,
      flex: 1,
    },
    optionIconContainer: {
      marginLeft: Spacing.sm,
    },
    submitContainer: {
      marginTop: Spacing.lg,
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.surface_variant,
      borderRadius: 3,
      marginBottom: Spacing.lg,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 3,
    },
    progressText: {
      ...Fonts.labelMd,
      color: theme.on_surface_variant,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    scoreContainer: {
      marginTop: Spacing.sm,
      padding: Spacing.xxl,
      backgroundColor: theme.surface,
      borderRadius: Radii.xl,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    scoreEmoji: {
      fontSize: 48,
      marginBottom: Spacing.md,
    },
    scoreLabel: {
      ...Fonts.headlineSm,
      color: theme.on_surface_variant,
      marginBottom: Spacing.sm,
    },
    scoreValue: {
      ...Fonts.displayMd,
      color: theme.primary,
      marginBottom: Spacing.xs,
    },
    scorePercent: {
      ...Fonts.bodyLg,
      color: theme.on_surface_variant,
    },
    loadingDots: {
      flexDirection: 'row',
      marginTop: Spacing.lg,
      gap: Spacing.sm,
    },
  });

  // ─── Upload screen ───────────────────────────────────────────────────────────
  if (!file && !isGenerating) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Generate Quiz" />
        <View style={styles.center}>
          <View style={styles.uploadCard}>
            <View style={styles.uploadIconFrame}>
              <IconSymbol name="list.bullet.rectangle.portrait.fill" size={36} color={theme.primary} />
            </View>
            <Text style={styles.uploadTitle}>Generate a Quiz</Text>
            <Text style={styles.uploadDesc}>
              Upload your lecture notes and we&apos;ll create multiple-choice questions to test your understanding.
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

  // ─── Generating screen ───────────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="Generate Quiz" />
        <Animated.View style={[styles.center, { opacity: fadeAnim }]}>
          <View style={styles.uploadIconFrame}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
          <Text style={styles.uploadTitle}>Formulating Questions…</Text>
          <Text style={styles.uploadDesc}>
            Extracting key concepts from your notes and crafting questions. This may take a moment.
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

  // ─── Quiz screen ──────────────────────────────────────────────────────────────
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress = questions.length > 0 ? answeredCount / questions.length : 0;
  const score = calculateScore();
  const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const getScoreEmoji = () => {
    if (percent >= 90) return '🏆';
    if (percent >= 70) return '🎉';
    if (percent >= 50) return '💪';
    return '📚';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Generate Quiz" />

      {/* File info bar */}
      <View style={styles.fileInfoBar}>
        <Text style={styles.fileInfoText} numberOfLines={1}>
          📄 {file?.name}
        </Text>
        <Pressable style={styles.newButton} onPress={reset}>
          <Text style={styles.newButtonText}>New +</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.quizContent}>
        {/* Quiz header */}
        <View style={styles.quizHeader}>
          <Text style={styles.quizHeaderText}>Your Quiz</Text>
          <View style={styles.quizCountBadge}>
            <Text style={styles.quizCountText}>{questions.length} Questions</Text>
          </View>
        </View>

        {/* Progress bar */}
        {!isSubmitted && (
          <>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {answeredCount} of {questions.length} answered
            </Text>
          </>
        )}

        {/* Questions */}
        {questions.map((q, qIdx) => (
          <View key={q.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>Question {qIdx + 1}</Text>
            <Text style={styles.questionText}>{q.text}</Text>
            {q.options.map((opt, idx) => {
              const iconInfo = getOptionIcon(q, idx);
              return (
                <Pressable
                  key={idx}
                  style={[styles.optionBtn, getOptionStyle(q, idx)]}
                  onPress={() => handleSelectOption(q.id, idx)}
                  android_ripple={{ color: theme.primary_container }}
                >
                  <View style={[
                    styles.optionLabel,
                    selectedAnswers[q.id] === idx && !isSubmitted && { backgroundColor: theme.primary, },
                    isSubmitted && q.correct === idx && { backgroundColor: '#22c55e' },
                    isSubmitted && selectedAnswers[q.id] === idx && q.correct !== idx && { backgroundColor: '#ef4444' },
                  ]}>
                    <Text style={[
                      styles.optionLabelText,
                      (selectedAnswers[q.id] === idx || (isSubmitted && q.correct === idx)) && { color: '#ffffff' },
                    ]}>
                      {optionLabels[idx] || (idx + 1).toString()}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: getOptionTextColor(q, idx) }]}>
                    {opt}
                  </Text>
                  <View style={styles.optionIconContainer}>
                    <IconSymbol
                      name={iconInfo.name}
                      size={20}
                      color={iconInfo.color}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}

        {/* Submit / Score */}
        <View style={styles.submitContainer}>
          {!isSubmitted ? (
            <Pressable
              style={[styles.primaryButton, { opacity: answeredCount < questions.length ? 0.6 : 1 }]}
              onPress={handleSubmit}
            >
              <Text style={styles.primaryButtonText}>Submit Answers</Text>
            </Pressable>
          ) : (
            <Animated.View
              style={[
                styles.scoreContainer,
                {
                  transform: [
                    {
                      scale: scoreAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                  opacity: scoreAnim,
                },
              ]}
            >
              <Text style={styles.scoreEmoji}>{getScoreEmoji()}</Text>
              <Text style={styles.scoreLabel}>Your Score</Text>
              <Text style={styles.scoreValue}>
                {score} / {questions.length}
              </Text>
              <Text style={styles.scorePercent}>{percent}% correct</Text>
              <Pressable
                style={[styles.primaryButton, { marginTop: Spacing.xl }]}
                onPress={reset}
              >
                <Text style={styles.primaryButtonText}>Take Another Quiz</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
