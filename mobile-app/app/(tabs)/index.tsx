import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
// eslint-disable-next-line import/no-unresolved
import * as DocumentPicker from 'expo-document-picker';
import { useLectureContext } from '@/context/LectureContext';
import { useState } from 'react';

export default function DashboardScreen() {
  const Colors = useTheme();
  const { currentFile: file, setCurrentFile: setFile } = useLectureContext();

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        const sizeInMB = pickedFile.size ? (pickedFile.size / (1024 * 1024)).toFixed(1) : 'Unknown';
        setFile({
          uri: pickedFile.uri,
          name: pickedFile.name,
          sizeMB: sizeInMB,
          mimeType: pickedFile.mimeType || 'application/octet-stream'
        });
      }
    } catch (err) {
      console.log('Error picking document', err);
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors.background,
      paddingTop: Platform.OS === 'android' ? Spacing.xl : 0,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: Spacing.xl,
      paddingBottom: 100, // For tabs
    },
    header: {
      marginBottom: Spacing.xl,
      paddingTop: Spacing.lg,
    },
    brandTitle: {
      ...Fonts.headlineMd,
      color: Colors.primary,
      fontFamily: 'Manrope_700Bold',
    },
    section: {
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      ...Fonts.displaySm,
      color: Colors.on_surface,
      marginBottom: Spacing.xs,
    },
    sectionSubtitle: {
      ...Fonts.bodyLg,
      color: Colors.on_surface_variant,
    },
    uploadContainer: {
      marginBottom: Spacing.xl,
    },
    uploadDashedBorder: {
      backgroundColor: Colors.surface_container_lowest,
      borderRadius: Radii.xl,
      padding: Spacing.xl,
      alignItems: 'center',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: Colors.outline_variant,
    },
    uploadTitle: {
      ...Fonts.headlineSm,
      color: Colors.on_surface,
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
    },
    uploadSubtitle: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    mockProgressContainer: {
      width: '100%',
      flexDirection: 'row',
      backgroundColor: Colors.surface_container_low,
      padding: Spacing.md,
      borderRadius: Radii.lg,
      alignItems: 'center',
    },
    fileIcon: {
      width: 48,
      height: 48,
      borderRadius: Radii.md,
      backgroundColor: Colors.surface_container_highest,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    progressInfo: {
      flex: 1,
    },
    fileName: {
      ...Fonts.labelMd,
      color: Colors.on_surface,
      marginBottom: Spacing.sm,
    },
    progressBarBackground: {
      height: 8,
      backgroundColor: Colors.surface_container_highest,
      borderRadius: Radii.full,
      overflow: 'hidden',
      marginBottom: Spacing.xs,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: Colors.primary,
      borderRadius: Radii.full,
    },
    progressText: {
      ...Fonts.labelMd,
      color: Colors.on_surface_variant,
      fontSize: 10,
    },
    insightsRow: {
      flexDirection: 'row',
      marginBottom: Spacing.md,
    },
    insightCard: {
      backgroundColor: Colors.surface_container,
      padding: Spacing.lg,
      borderRadius: Radii.lg,
      marginBottom: Spacing.md,
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    insightTitle: {
      ...Fonts.headlineSm,
      color: Colors.on_surface,
      marginLeft: Spacing.xs,
    },
    insightText: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
      lineHeight: 22,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        <View style={styles.header}>
          <Text style={styles.brandTitle}>ExplainLikeMyTeacher</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Lecture</Text>
          <Text style={styles.sectionSubtitle}>Select your lecture file to start learning.</Text>
        </View>

        {/* Upload Container */}
        <Pressable onPress={handlePickDocument} style={({ pressed }) => [
          styles.uploadContainer,
          { transform: [{ scale: pressed ? 0.98 : 1 }] }
        ]}>
          <View style={styles.uploadDashedBorder}>
            <IconSymbol name="tray.and.arrow.down.fill" size={48} color={Colors.primary} />
            <Text style={styles.uploadTitle}>Drop your files here</Text>
            <Text style={styles.uploadSubtitle}>Supports MP4, MOV, MP3, and WAV files up to 500MB</Text>

            {/* Mock Progress */}
            {file ? (
              <View style={styles.mockProgressContainer}>
                <View style={styles.fileIcon}>
                  <IconSymbol name="doc.fill" size={24} color={Colors.on_surface} />
                </View>
                <View style={styles.progressInfo}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: '100%' }]} />
                  </View>
                  <Text style={styles.progressText}>{file.sizeMB} MB Uploaded</Text>
                </View>
              </View>
            ) : (
              <View style={styles.mockProgressContainer}>
                <View style={styles.fileIcon}>
                  <IconSymbol name="waveform" size={24} color={Colors.on_surface} />
                </View>
                <View style={styles.progressInfo}>
                  <Text style={styles.fileName}>Advanced_Neuroscience_L1.mp3</Text>
                  <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: '45%' }]} />
                  </View>
                  <Text style={styles.progressText}>4.2 MB of 9.5 MB</Text>
                </View>
              </View>
            )}
            
          </View>
        </Pressable>

        {/* Insights Layout */}
        <View style={styles.insightsRow}>
          <View style={[styles.insightCard, { flex: 1, marginRight: Spacing.md }]}>
            <View style={styles.insightHeader}>
              <IconSymbol name="sparkles" size={20} color={Colors.tertiary} />
              <Text style={styles.insightTitle}>AI Insights</Text>
            </View>
            <Text style={styles.insightText}>
              Once uploaded, our Digital Mentor will transcribe, summarize, and generate quiz cards for you instantly.
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <IconSymbol name="lightbulb.fill" size={20} color={Colors.secondary} />
            <Text style={styles.insightTitle}>Quick Tip</Text>
          </View>
          <Text style={styles.insightText}>
            &quot;For the best transcription accuracy, ensure the audio has minimal background noise.&quot;
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
