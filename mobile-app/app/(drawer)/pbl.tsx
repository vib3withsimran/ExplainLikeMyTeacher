import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Header from '@/components/Header';
import * as DocumentPicker from 'expo-document-picker';

export default function PBLScreen() {
  const theme = useTheme();
  const [file, setFile] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [problemReady, setProblemReady] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const mockProblem = {
    statement: "You are building a spam filter for a new email client. Based on the lecture on algorithms, which approach would you take to classify incoming emails accurately without taking too much computational overhead? Outline your choice and why.",
    hints: [
      "1. Think about the trade-off between speed and accuracy.",
      "2. What algorithm is traditionally paired with text classification tasks?",
      "3. Consider Naive Bayes or simple Neural Networks."
    ],
    solution: "The most efficient approach would be a Naive Bayes classifier. It requires very little training data compared to deep learning models, is extremely fast to predict, and has historically proven highly effective for text classification tasks like spam filtering."
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled && result.assets.length > 0) {
        setFile(result.assets[0]);
        setIsGenerating(true);
        setTimeout(() => {
          setIsGenerating(false);
          setProblemReady(true);
        }, 1500); // simulate loading
      }
    } catch (err) {}
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
    content: {
      padding: Spacing.xl,
      paddingBottom: Spacing.xxxl,
    },
    card: {
      backgroundColor: theme.surface,
      padding: Spacing.xl,
      borderRadius: Radii.lg,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.outline_variant,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    cardTitle: {
      ...Fonts.headlineSm,
      color: theme.on_surface,
      marginLeft: Spacing.sm,
    },
    cardBody: {
      ...Fonts.bodyLg,
      color: theme.on_surface_variant,
      lineHeight: 24,
    },
    hintText: {
      ...Fonts.bodyMd,
      color: theme.on_surface,
      marginBottom: Spacing.xs,
    },
    toggleButton: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radii.md,
      backgroundColor: theme.surface_variant,
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    toggleButtonText: {
      ...Fonts.labelLg,
      color: theme.on_surface,
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="PBL Learning" />
      
      {!file ? (
        <View style={styles.uploadContainer}>
          <View style={styles.uploadCard}>
            <View style={styles.uploadIconFrame}>
              <IconSymbol name="briefcase.fill" size={36} color={theme.primary} />
            </View>
            <Text style={styles.uploadTitle}>Project-Based Learning</Text>
            <Text style={styles.uploadDesc}>Upload material to generate a real-world scenario you can solve.</Text>
            <Pressable style={styles.primaryButton} onPress={pickDocument}>
              <Text style={styles.primaryButtonText}>Select File</Text>
            </Pressable>
          </View>
        </View>
      ) : isGenerating ? (
        <View style={styles.uploadContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.uploadTitle, { marginTop: Spacing.xl }]}>Designing Scenario...</Text>
          <Text style={styles.uploadDesc}>Crafting a practical problem for you.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="doc.text.fill" size={24} color={theme.primary} />
              <Text style={styles.cardTitle}>Problem Statement</Text>
            </View>
            <Text style={styles.cardBody}>{mockProblem.statement}</Text>
          </View>

          {!showHints ? (
            <Pressable style={styles.toggleButton} onPress={() => setShowHints(true)}>
              <Text style={styles.toggleButtonText}>Need a Hint?</Text>
            </Pressable>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <IconSymbol name="lightbulb.fill" size={24} color="#eab308" />
                <Text style={styles.cardTitle}>Hints</Text>
              </View>
              {mockProblem.hints.map((hint, idx) => (
                <Text key={idx} style={styles.hintText}>{hint}</Text>
              ))}
            </View>
          )}

          {!showSolution ? (
            <Pressable style={styles.primaryButton} onPress={() => setShowSolution(true)}>
              <Text style={styles.primaryButtonText}>Reveal Solution</Text>
            </Pressable>
          ) : (
            <View style={[styles.card, { borderColor: theme.primary, backgroundColor: theme.primary_container }]}>
              <View style={styles.cardHeader}>
                <IconSymbol name="checkmark.circle.fill" size={24} color={theme.primary} />
                <Text style={styles.cardTitle}>Ideal Solution</Text>
              </View>
              <Text style={styles.cardBody}>{mockProblem.solution}</Text>
            </View>
          )}

          <Pressable style={[styles.toggleButton, { marginTop: Spacing.xxxl }]} onPress={() => { setFile(null); setProblemReady(false); setShowHints(false); setShowSolution(false); }}>
            <Text style={styles.toggleButtonText}>Upload New File</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
