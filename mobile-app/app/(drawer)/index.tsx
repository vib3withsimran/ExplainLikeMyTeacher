import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/constants/theme';
import Header from '@/components/Header'; // Assuming Header is present

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      paddingHorizontal: 24,
      paddingVertical: 48,
    },
    // Hero
    heroBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.secondary_container,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
    },
    heroBadgeText: {
      color: theme.on_secondary_container,
      fontWeight: '500',
      fontSize: 14,
      marginLeft: 8,
    },
    heroTitle: {
      fontSize: 48,
      fontWeight: '800',
      lineHeight: 52,
      color: theme.on_surface,
      marginBottom: 32,
    },
    heroTitleHighlight: {
      color: theme.primary,
    },
    heroSubtitle: {
      fontSize: 20,
      fontWeight: '500',
      lineHeight: 28,
      color: theme.on_surface_variant,
      marginBottom: 16,
    },
    heroDesc: {
      fontSize: 16,
      color: theme.on_surface_variant,
      opacity: 0.8,
      marginBottom: 32,
      lineHeight: 24,
    },
    primaryBtn: {
      backgroundColor: theme.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    primaryBtnText: {
      color: theme.on_primary,
      fontWeight: '700',
      fontSize: 18,
      marginRight: 8,
    },
    secondaryBtn: {
      backgroundColor: theme.surface_container_high,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: {
      color: theme.primary,
      fontWeight: '700',
      fontSize: 18,
    },
    heroImageContainer: {
      marginTop: 48,
      width: width - 48,
      height: width - 48,
      borderRadius: 40,
      overflow: 'hidden',
      backgroundColor: theme.surface_container_high,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      transform: [{ rotate: '3deg' }],
    },
    heroImage: {
      width: '100%',
      height: '100%',
      opacity: 0.9,
    },
    testimonialBox: {
      position: 'absolute',
      bottom: -24,
      left: -10,
      backgroundColor: theme.surface_container_lowest,
      padding: 24,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
      transform: [{ rotate: '-2deg' }],
      width: 250,
    },
    testimonialText: {
      fontStyle: 'italic',
      color: theme.on_surface_variant,
      fontWeight: '500',
      fontSize: 14,
      marginBottom: 8,
    },
    testimonialAuthor: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.primary,
    },
    // Bento grid
    bentoSection: {
      backgroundColor: theme.surface_container_low,
    },
    sectionTitle: {
      fontSize: 30,
      fontWeight: '700',
      color: theme.on_surface,
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 16,
      color: theme.on_surface_variant,
      marginBottom: 48,
    },
    card: {
      backgroundColor: theme.surface_container_lowest,
      padding: 32,
      borderRadius: 16,
      marginBottom: 24,
    },
    cardPrimaryText: {
      color: theme.primary,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.on_surface,
      marginBottom: 8,
    },
    cardDesc: {
      fontSize: 14,
      color: theme.on_surface_variant,
      lineHeight: 20,
    },
    pblLabel: {
      alignSelf: 'flex-start',
      backgroundColor: theme.tertiary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      marginBottom: 16,
    },
    pblLabelText: {
      color: theme.on_tertiary,
      fontWeight: '700',
      fontSize: 12,
    },
    pblImageContainer: {
      marginTop: 24,
      width: '100%',
      height: 128,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: theme.surface_container_high,
    },
    pblImage: {
      width: '100%',
      height: '100%',
    },
    // Why App Exists
    whySection: {
      paddingHorizontal: 24,
      paddingVertical: 64,
    },
    whyTitle: {
      fontSize: 36,
      fontWeight: '800',
      lineHeight: 44,
      color: theme.on_surface,
      marginBottom: 32,
    },
    whyTitleHighlight: {
      fontStyle: 'italic',
      color: theme.primary,
    },
    whyRow: {
      flexDirection: 'row',
      marginBottom: 24,
    },
    whyIconBoxRed: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.error_container,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    whyIconBoxBlue: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary_container,
      opacity: 0.8,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    whyRowTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.on_surface,
      marginBottom: 4,
    },
    whyRowDesc: {
      fontSize: 16,
      color: theme.on_surface_variant,
      lineHeight: 24,
      paddingRight: 24,
    },
    // Step Section
    stepSection: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 80,
      alignItems: 'center',
    },
    stepSectionTitle: {
      fontSize: 30,
      fontWeight: '700',
      color: theme.on_primary,
      marginBottom: 64,
      textAlign: 'center',
    },
    stepItem: {
      alignItems: 'center',
      marginBottom: 48,
    },
    stepCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.on_primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    stepTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.on_primary,
      marginBottom: 16,
    },
    stepDesc: {
      fontSize: 16,
      color: theme.primary_container,
      textAlign: 'center',
      paddingHorizontal: 16,
    },
    // Footer CTA
    ctaSection: {
      paddingHorizontal: 24,
      paddingVertical: 96,
      alignItems: 'center',
    },
    ctaTitle: {
      fontSize: 36,
      fontWeight: '800',
      textAlign: 'center',
      color: theme.on_surface,
      marginBottom: 32,
    },
    ctaDesc: {
      fontSize: 20,
      color: theme.on_surface_variant,
      textAlign: 'center',
      marginBottom: 48,
    },
    ctaBtnPrimary: {
      backgroundColor: theme.primary,
      paddingVertical: 20,
      paddingHorizontal: 40,
      borderRadius: 16,
      marginBottom: 16,
      width: '100%',
      alignItems: 'center',
    },
    ctaBtnPrimaryText: {
      color: theme.on_primary,
      fontWeight: '700',
      fontSize: 20,
    },
    ctaBtnSecondary: {
      backgroundColor: theme.surface_container_high,
      borderWidth: 1,
      borderColor: theme.outline_variant,
      paddingVertical: 20,
      paddingHorizontal: 40,
      borderRadius: 16,
      width: '100%',
      alignItems: 'center',
    },
    ctaBtnSecondaryText: {
      color: theme.on_surface,
      fontWeight: '700',
      fontSize: 20,
    },
    fab: {
      position: 'absolute',
      bottom: 40,
      right: 24,
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 8,
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header title="ExplainLikeMyTeacher" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* --- Hero Section --- */}
        <View style={styles.section}>
          <View style={styles.heroBadge}>
            <IconSymbol name="sparkles" size={16} color={theme.primary} />
            <Text style={styles.heroBadgeText}>New: Audio Lecture Processing</Text>
          </View>
          
          <Text style={styles.heroTitle}>
            Explain Like My{'\n'}
            <Text style={styles.heroTitleHighlight}>Teacher</Text>
          </Text>
          
          <Text style={styles.heroSubtitle}>
            Because understanding shouldn’t depend on changing teachers.
          </Text>
          
          <Text style={styles.heroDesc}>
            Upload your lecture. Ask anything. Get answers in the same teaching style you're used to.
          </Text>
          
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/(drawer)/chat')}>
            <Text style={styles.primaryBtnText}>Start Learning</Text>
            <IconSymbol name="arrow.right" size={20} color={theme.on_primary} />
          </Pressable>
          <Pressable style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Watch Demo</Text>
          </Pressable>

          <View style={{ marginTop: 48, marginBottom: 24, paddingLeft: 10 }}>
            <View style={styles.heroImageContainer}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDP_-pz_oBH_AdUtO1nEtza6mdlPyuWE3dr_uy5OtKRf5tar8Uqh5-arCvP1CdT320rLyD-1MawZeACLHMjLiL-fSP7AHtVOkK4egGacMjmyAs0FLmHNQ8GGSVMK5u3UJwcaJLFsM2k5JOgpUJRALS_llU_kaEb5C2ciMI81FmrrC-adkg_alQZVkVUEJcOHiHvU5gfWkzDZckzKka2_ay_wK6ex-QNJMGY3JkO4yD0Gt-KQOsbOzjFSKh8nan2Gtj8xT929Y-t93aV' }} 
                style={styles.heroImage} 
                resizeMode="cover"
              />
            </View>
            
            <View style={styles.testimonialBox}>
              <Text style={styles.testimonialText}>"It literally uses the same metaphors my Chem teacher used. Mind-blown."</Text>
              <Text style={styles.testimonialAuthor}>— Alex, Med Student</Text>
            </View>
          </View>
        </View>

        {/* --- Bento Grid Section --- */}
        <View style={[styles.section, styles.bentoSection]}>
          <Text style={styles.sectionTitle}>Master any subject</Text>
          <Text style={styles.sectionSubtitle}>Tools designed to bridge the gap between lecture and mastery.</Text>

          <Pressable style={styles.card} onPress={() => router.push('/(drawer)/chat')}>
            <IconSymbol name="bubble.left.and.bubble.right.fill" size={36} color={theme.primary} style={{ marginBottom: 16 }} />
            <Text style={[styles.cardTitle, { fontSize: 24 }]}>Teacher Chat</Text>
            <Text style={styles.cardDesc}>Ask doubts. Get explanations in your teacher’s specific style and vocabulary.</Text>
            <View style={{ alignItems: 'flex-end', marginTop: 16 }}>
              <IconSymbol name="arrow.right" size={24} color={theme.primary} />
            </View>
          </Pressable>

          <Pressable style={styles.card} onPress={() => router.push('/(drawer)/quiz')}>
            <IconSymbol name="list.bullet.rectangle.portrait.fill" size={36} color={theme.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.cardTitle}>Generate Quiz</Text>
            <Text style={styles.cardDesc}>Turn lectures into quick practice questions instantly.</Text>
          </Pressable>

          <Pressable style={styles.card} onPress={() => router.push('/(drawer)/mindmaps')}>
            <IconSymbol name="map.fill" size={36} color={theme.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.cardTitle}>MindMaps</Text>
            <Text style={styles.cardDesc}>Visualize concepts into structured, easy-to-revise maps.</Text>
          </Pressable>

          <Pressable style={styles.card} onPress={() => router.push('/(drawer)/pbl')}>
            <View style={styles.pblLabel}>
              <Text style={styles.pblLabelText}>MOMENT OF DELIGHT</Text>
            </View>
            <Text style={[styles.cardTitle, { fontSize: 24 }]}>PBL Learning</Text>
            <Text style={styles.cardDesc}>Apply concepts to real-world problems, not just theory. Our AI generates case studies based on your teacher's latest lecture.</Text>
            
            <View style={styles.pblImageContainer}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCR_oF6mPV7xoPSByIkf88yDg3aagAV3yYpFwXlee9nEbiMXUINS2layyAkwMZzwTZcU4Lybs3ux6NQRTaXzB6-X3SvVYRlfRA_Zha_nAn_vBrlQfPeBjTDhrIP1VU66AQ6_Eib4W_Bcw_7uNvUaYT3P6NXLAfNs7CA2PwT9NtWeNG_m199xHsjuqlEhg8HgUvg-C1msOeNruUdtoytESXnCWeyPbJ2a3BhH_VcSyeiRvQxcSuXZfGxibgBq1mX0Vubg1BU7NOqU5R4' }} 
                style={styles.pblImage} 
                resizeMode="cover"
              />
            </View>
          </Pressable>
        </View>

        {/* --- Why This App Exists --- */}
        <View style={styles.whySection}>
          <Text style={styles.whyTitle}>
            We don’t replace teachers —{'\n'}
            <Text style={styles.whyTitleHighlight}>we extend them.</Text>
          </Text>
          
          <View style={styles.whyRow}>
            <View style={styles.whyIconBoxRed}>
              <IconSymbol name="xmark" size={20} color={theme.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.whyRowTitle}>The Context Problem</Text>
              <Text style={styles.whyRowDesc}>Standard AI uses generic data. We use YOUR teacher's actual data to ensure consistency in learning.</Text>
            </View>
          </View>

          <View style={styles.whyRow}>
            <View style={styles.whyIconBoxRed}>
              <IconSymbol name="slash.circle" size={20} color={theme.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.whyRowTitle}>The After-Class Wall</Text>
              <Text style={styles.whyRowDesc}>Learning often breaks the moment class ends. Doubts remain unanswered until the next week.</Text>
            </View>
          </View>

          <View style={styles.whyRow}>
            <View style={styles.whyIconBoxBlue}>
              <IconSymbol name="checkmark" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.whyRowTitle}>The AI Solution</Text>
              <Text style={styles.whyRowDesc}>Your teacher's knowledge, available 24/7, phrased exactly how they'd say it.</Text>
            </View>
          </View>
        </View>

        {/* --- How It Works --- */}
        <View style={styles.stepSection}>
          <Text style={styles.stepSectionTitle}>Three steps to mastery</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
              <IconSymbol name="doc.text.fill" size={40} color={theme.primary} />
            </View>
            <Text style={styles.stepTitle}>Step 1: Upload</Text>
            <Text style={styles.stepDesc}>Record or upload your lecture audio or transcripts.</Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
              <IconSymbol name="brain.head.profile" size={40} color={theme.primary} />
            </View>
            <Text style={styles.stepTitle}>Step 2: Ask</Text>
            <Text style={styles.stepDesc}>Ask any doubt as if you were raising your hand in class.</Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
              <IconSymbol name="square.stack.3d.up.fill" size={40} color={theme.primary} />
            </View>
            <Text style={styles.stepTitle}>Step 3: Understand</Text>
            <Text style={styles.stepDesc}>Get answers that use the same examples and style as your teacher.</Text>
          </View>
        </View>

        {/* --- CTA & Impact --- */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>
            Making personalized learning accessible — even beyond the classroom.
          </Text>
          <Text style={styles.ctaDesc}>
            Join 10,000+ students who are bridging the gap between listening and knowing.
          </Text>
          
          <Pressable style={styles.ctaBtnPrimary} onPress={() => router.push('/(drawer)/chat')}>
            <Text style={styles.ctaBtnPrimaryText}>Get Started for Free</Text>
          </Pressable>
          <Pressable style={styles.ctaBtnSecondary}>
            <Text style={styles.ctaBtnSecondaryText}>Pricing Plans</Text>
          </Pressable>
        </View>

      </ScrollView>
      
      {/* Absolute FAB mapped to Chat */}
      <Pressable style={styles.fab} onPress={() => router.push('/(drawer)/chat')}>
        <IconSymbol name="plus" size={32} color={theme.on_primary} />
      </Pressable>
    </SafeAreaView>
  );
}
