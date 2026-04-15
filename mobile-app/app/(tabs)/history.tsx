import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HistoryScreen() {
  const Colors = useTheme();

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
    title: {
      ...Fonts.displaySm,
      color: Colors.on_surface,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      ...Fonts.bodyLg,
      color: Colors.on_surface_variant,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      ...Fonts.headlineSm,
      color: Colors.on_surface,
      marginBottom: Spacing.md,
    },
    card: {
      backgroundColor: Colors.surface_container_lowest,
      borderRadius: Radii.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      // Emulate surface drop shadow
      shadowColor: Colors.on_surface,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.02,
      shadowRadius: 16,
      elevation: 2,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: Radii.md,
      backgroundColor: Colors.surface_container_highest,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.lg,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      ...Fonts.labelLg,
      color: Colors.on_surface,
      marginBottom: 2,
    },
    cardMeta: {
      ...Fonts.bodySm,
      color: Colors.on_surface_variant,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.primary,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Review your learning sessions and uncompleted modules.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <IconSymbol name="book.fill" size={24} color={Colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Physics Module • Unit 4</Text>
              <View style={styles.metaRow}>
                <View style={styles.statusDot} />
                <Text style={styles.cardMeta}>In progress • 15 mins ago</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <IconSymbol name="book.fill" size={24} color={Colors.on_surface} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Advanced Neuroscience L1</Text>
              <Text style={styles.cardMeta}>Completed • Yesterday</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Week</Text>

          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <IconSymbol name="book.fill" size={24} color={Colors.on_surface} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Introduction to Economics</Text>
              <Text style={styles.cardMeta}>Completed • Mar 14</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <IconSymbol name="book.fill" size={24} color={Colors.on_surface} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Data Structures - Trees</Text>
              <Text style={styles.cardMeta}>Completed • Mar 12</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
