import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Header from '@/components/Header';
import * as DocumentPicker from 'expo-document-picker';

export default function QuizScreen() {
  const theme = useTheme();
  const [file, setFile] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const mockQuestions = [
    { id: 0, text: 'What is the main advantage of Neural Networks?', options: ['Fast training', 'Pattern recognition', 'Low memory usage', 'No data required'], correct: 1 },
    { id: 1, text: 'Which of the following is an unsupervised learning method?', options: ['Linear Regression', 'Decision Trees', 'K-Means Clustering', 'Random Forest'], correct: 2 },
  ];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled && result.assets.length > 0) {
        setFile(result.assets[0]);
        setIsGenerating(true);
        setTimeout(() => {
          setIsGenerating(false);
          setQuizStarted(true);
        }, 1500); // simulate loading
      }
    } catch (err) {}
  };

  const handleSelectOption = (qId: number, oIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: oIdx }));
  };

  const handleSubmit = () => {
    if (Object.keys(selectedAnswers).length < mockQuestions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }
    setIsSubmitted(true);
  };

  const calculateScore = () => {
    let score = 0;
    mockQuestions.forEach(q => {
      if (selectedAnswers[q.id] === q.correct) score++;
    });
    return score;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    uploadContainer: {
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
    quizContent: {
      padding: Spacing.xl,
      paddingBottom: Spacing.xxxl,
    },
    questionCard: {
      backgroundColor: theme.surface,
      padding: Spacing.xl,
      borderRadius: Radii.lg,
      marginBottom: Spacing.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    questionText: {
      ...Fonts.headlineSm,
      color: theme.on_surface,
      marginBottom: Spacing.lg,
    },
    optionBtn: {
      padding: Spacing.lg,
      borderRadius: Radii.md,
      borderWidth: 1,
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
    optionText: {
      ...Fonts.bodyLg,
      color: theme.on_surface,
      marginLeft: Spacing.md,
    },
    scoreContainer: {
      marginTop: Spacing.xl,
      padding: Spacing.xl,
      backgroundColor: theme.surface_variant,
      borderRadius: Radii.lg,
      alignItems: 'center',
    },
    scoreText: {
      ...Fonts.displaySm,
      color: theme.primary,
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="Generate Quiz" />
      
      {!file ? (
        <View style={styles.uploadContainer}>
          <View style={styles.uploadCard}>
            <View style={styles.uploadIconFrame}>
              <IconSymbol name="list.bullet.rectangle.portrait.fill" size={36} color={theme.primary} />
            </View>
            <Text style={styles.uploadTitle}>Generate a Quiz</Text>
            <Text style={styles.uploadDesc}>We&apos;ll formulate multiple-choice questions from your lecture.</Text>
            <Pressable style={styles.primaryButton} onPress={pickDocument}>
              <Text style={styles.primaryButtonText}>Select File</Text>
            </Pressable>
          </View>
        </View>
      ) : isGenerating ? (
        <View style={styles.uploadContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.uploadTitle, { marginTop: Spacing.xl }]}>Formulating Questions...</Text>
          <Text style={styles.uploadDesc}>Finding key concepts to test your retention.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.quizContent}>
          {mockQuestions.map(q => (
            <View key={q.id} style={styles.questionCard}>
              <Text style={styles.questionText}>{q.text}</Text>
              {q.options.map((opt, idx) => {
                const isSelected = selectedAnswers[q.id] === idx;
                const isCorrect = isSubmitted && q.correct === idx;
                const isWrong = isSubmitted && isSelected && !isCorrect;

                let btnStyle = [styles.optionBtn];
                if (isSelected && !isSubmitted) btnStyle.push(styles.optionBtnSelected as any);
                if (isCorrect) btnStyle.push(styles.optionBtnCorrect as any);
                if (isWrong) btnStyle.push(styles.optionBtnWrong as any);

                return (
                  <Pressable 
                    key={idx} 
                    style={btnStyle}
                    onPress={() => handleSelectOption(q.id, idx)}
                  >
                    <IconSymbol 
                      name={isCorrect ? "checkmark.circle.fill" : (isWrong ? "xmark.circle.fill" : (isSelected ? "circle.inset.filled" : "circle")) as any} 
                      size={20} 
                      color={isCorrect ? '#166534' : (isWrong ? '#991b1b' : (isSelected ? theme.primary : theme.outline))} 
                    />
                    <Text style={[styles.optionText, isCorrect && {color: '#166534'}, isWrong && {color: '#991b1b'}]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
          
          {!isSubmitted ? (
            <Pressable style={styles.primaryButton} onPress={handleSubmit}>
              <Text style={styles.primaryButtonText}>Submit Answers</Text>
            </Pressable>
          ) : (
            <View style={styles.scoreContainer}>
              <Text style={styles.uploadTitle}>Your Score</Text>
              <Text style={styles.scoreText}>{calculateScore()} / {mockQuestions.length}</Text>
              <Pressable style={[styles.primaryButton, { marginTop: Spacing.xl }]} onPress={() => { setFile(null); setIsSubmitted(false); setSelectedAnswers({}); }}>
                <Text style={styles.primaryButtonText}>Take Another Quiz</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
