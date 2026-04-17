import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Header from '@/components/Header';
import * as DocumentPicker from 'expo-document-picker';
import { generateMindmap } from '@/services/gradioService';
import MindMapView from '@/components/MindMapView';

export default function MindMapsScreen() {
  const theme = useTheme();

  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mindmapData, setMindmapData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const picked = result.assets[0];

        // Reset state for new upload
        setFile(picked);
        setError(null);
        setMindmapData(null);
        setIsGenerating(true);

        try {
          const data = await generateMindmap(
            picked.uri,
            picked.name,
            picked.mimeType || 'image/png'
          );
          setMindmapData(data);
        } catch (err: any) {
          console.error('Mindmap generation error:', err);
          setError(err.message || 'Failed to generate mindmap. Please try again.');
          setFile(null); // Return to upload screen on error
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
    setMindmapData(null);
    setError(null);
    setIsGenerating(false);
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
    loadingTitle: {
      ...Fonts.headlineSm,
      color: theme.on_surface,
      marginTop: Spacing.xl,
      textAlign: 'center',
    },
    loadingDesc: {
      ...Fonts.bodyMd,
      color: theme.on_surface_variant,
      textAlign: 'center',
      marginTop: Spacing.sm,
    },
  });

  // ─── Upload screen ───────────────────────────────────────────────────────────
  if (!file && !isGenerating) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Header title="MindMaps" />
        <View style={styles.center}>
          <View style={styles.uploadCard}>
            <View style={styles.uploadIconFrame}>
              <IconSymbol name="map.fill" size={36} color={theme.primary} />
            </View>
            <Text style={styles.uploadTitle}>Upload to Map</Text>
            <Text style={styles.uploadDesc}>
              Select an image or PDF of your notes to auto‑generate a visual mind map.
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
        <Header title="MindMaps" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingTitle}>Generating Mind Map…</Text>
          <Text style={styles.loadingDesc}>
            Analysing structure and key concepts. This may take a moment.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Map screen ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="MindMaps" />

      {/* File info bar */}
      <View style={styles.fileInfoBar}>
        <Text style={styles.fileInfoText} numberOfLines={1}>
          {file?.name}
        </Text>
        <Pressable style={styles.newButton} onPress={reset}>
          <Text style={styles.newButtonText}>New +</Text>
        </Pressable>
      </View>

      {/* Interactive mind map */}
      {mindmapData && <MindMapView mindmapData={mindmapData} />}
    </SafeAreaView>
  );
}
