import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeContext } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const Colors = useTheme();
  const { isDarkMode, toggleTheme } = useThemeContext();
  const { voiceSettings, setAudioEnabled, setAutoPlayAudio, setPlaybackSpeed } = useSettings();

  const handleSignOut = () => {
    router.replace('/');
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
      paddingBottom: 120, // For tabs
    },
    header: {
      alignItems: 'center',
      marginBottom: Spacing.xxxl,
      marginTop: Spacing.lg,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: Spacing.md,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: Radii.full,
      borderWidth: 4,
      borderColor: Colors.primary_container,
      backgroundColor: Colors.surface_container_highest,
    },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: Colors.primary,
      width: 32,
      height: 32,
      borderRadius: Radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: Colors.background,
    },
    userName: {
      ...Fonts.headlineLg,
      color: Colors.on_surface,
      marginBottom: 2,
    },
    userEmail: {
      ...Fonts.bodyMd,
      color: Colors.on_surface_variant,
    },
    section: {
      backgroundColor: Colors.surface_container_lowest,
      borderRadius: Radii.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
      shadowColor: Colors.on_surface,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.02,
      shadowRadius: 16,
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      ...Fonts.headlineSm,
      color: Colors.on_surface,
      marginLeft: Spacing.sm,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
    },
    settingLabel: {
      ...Fonts.bodyLg,
      color: Colors.on_surface,
      fontWeight: '500',
    },
    settingSubLabel: {
      ...Fonts.bodySm,
      color: Colors.on_surface_variant,
      marginTop: 2,
    },
    settingSpacer: {
      height: 1,
      backgroundColor: Colors.surface_container_high,
      marginVertical: Spacing.sm,
    },
    dropdownButton: {
      backgroundColor: Colors.surface_container_low,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: Radii.lg,
      marginTop: Spacing.sm,
    },
    dropdownText: {
      ...Fonts.bodyMd,
      color: Colors.on_surface,
      fontWeight: '500',
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: Colors.surface_container_low,
      borderRadius: Radii.lg,
      padding: 4,
      marginTop: Spacing.sm,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: Radii.md,
    },
    segmentButtonActive: {
      backgroundColor: Colors.surface_container_lowest,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 1,
    },
    segmentText: {
      ...Fonts.labelMd,
      color: Colors.on_surface_variant,
    },
    segmentTextActive: {
      color: Colors.primary,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      backgroundColor: Colors.surface_container_low,
      borderRadius: Radii.lg,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
      justifyContent: 'space-between',
    },
    logoutButton: {
      backgroundColor: Colors.error_container,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.lg,
      borderRadius: Radii.xl,
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    logoutText: {
      ...Fonts.labelLg,
      color: Colors.on_error_container,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* User Info */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar} />
            <View style={styles.editBadge}>
              <IconSymbol name="pencil" size={14} color={Colors.on_primary} />
            </View>
          </View>
          <Text style={styles.userName}>Alex Johnson</Text>
          <Text style={styles.userEmail}>alex.j@example.com</Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="paintbrush.fill" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: Colors.surface_container_highest, true: Colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#ffffff' : (isDarkMode ? '#ffffff' : '#f4f3f4')}
            />
          </View>
        </View>

        {/* Voice Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="speaker.wave.2.fill" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Voice Preferences</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Enable audio responses</Text>
              <Text style={styles.settingSubLabel}>Audio responses will follow selected language</Text>
            </View>
            <Switch
              value={voiceSettings.audioEnabled}
              onValueChange={setAudioEnabled}
              trackColor={{ false: Colors.surface_container_highest, true: Colors.primary }}
              thumbColor={'#ffffff'}
            />
          </View>

          <View style={styles.settingSpacer} />

          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={[styles.settingLabel, { fontSize: 13, color: Colors.on_surface_variant }]}>Output Language</Text>
            <Pressable style={styles.dropdownButton}>
              <Text style={styles.dropdownText}>English (US)</Text>
              <IconSymbol name="chevron.down" size={20} color={Colors.on_surface_variant} />
            </Pressable>
          </View>

          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={[styles.settingLabel, { fontSize: 13, color: Colors.on_surface_variant }]}>Voice Selection</Text>
            <Pressable style={styles.dropdownButton}>
              <Text style={styles.dropdownText}>English Voice - Default</Text>
              <IconSymbol name="chevron.down" size={20} color={Colors.on_surface_variant} />
            </Pressable>
          </View>

          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={[styles.settingLabel, { fontSize: 13, color: Colors.on_surface_variant }]}>Playback Speed</Text>
            <View style={styles.segmentedControl}>
              {[1, 1.5, 2].map((speed) => (
                <Pressable
                  key={speed}
                  style={[styles.segmentButton, voiceSettings.playbackSpeed === speed && styles.segmentButtonActive]}
                  onPress={() => setPlaybackSpeed(speed)}
                >
                  <Text style={[styles.segmentText, voiceSettings.playbackSpeed === speed && styles.segmentTextActive]}>{speed}x</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing.xs}}>
              <IconSymbol name="play.circle.fill" size={20} color={Colors.on_surface_variant} />
              <Text style={styles.settingLabel}>Auto play audio</Text>
            </View>
            <Switch
              value={voiceSettings.autoPlayAudio}
              onValueChange={setAutoPlayAudio}
              trackColor={{ false: Colors.surface_container_highest, true: Colors.primary }}
              thumbColor={'#ffffff'}
            />
          </View>

        </View>

        {/* Learning Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="book.pages.fill" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Learning Preferences</Text>
          </View>
          <View style={styles.segmentedControl}>
            <Pressable style={styles.segmentButton}>
              <Text style={styles.segmentText}>Simple explanation</Text>
            </Pressable>
            <Pressable style={[styles.segmentButton, styles.segmentButtonActive]}>
              <Text style={[styles.segmentText, styles.segmentTextActive]}>Detailed explanation</Text>
            </Pressable>
          </View>
        </View>

        {/* Session Controls */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="clock.arrow.circlepath" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Session Controls</Text>
          </View>
          
          <Pressable style={styles.actionRow}>
            <Text style={[styles.settingLabel, { color: Colors.on_surface_variant }]}>Clear chat history</Text>
            <IconSymbol name="trash.fill" size={20} color={Colors.on_surface_variant} />
          </Pressable>

          <Pressable style={styles.actionRow}>
            <Text style={[styles.settingLabel, { color: Colors.on_surface_variant }]}>Reset session</Text>
            <IconSymbol name="arrow.counterclockwise" size={20} color={Colors.on_surface_variant} />
          </Pressable>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="person.crop.circle.fill" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <Pressable onPress={handleSignOut} style={({ pressed }) => [
            styles.logoutButton,
            { opacity: pressed ? 0.8 : 1 }
          ]}>
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={Colors.on_error_container} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
