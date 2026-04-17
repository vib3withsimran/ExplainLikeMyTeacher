import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { IconSymbol } from './ui/icon-symbol';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomDrawerContent(props: any) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Navigation helper
  const navigateTo = (path: any) => {
    router.push(path);
  };

  const currentRouteName = props.state.routes[props.state.index].name;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    header: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl + insets.top,
      paddingBottom: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.outline_variant,
    },
    title: {
      ...Fonts.headlineSm,
      color: theme.on_surface,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      ...Fonts.labelMd,
      color: theme.primary,
    },
    sectionLabel: {
      ...Fonts.labelSm,
      color: theme.on_surface_variant,
      marginLeft: Spacing.xl,
      marginTop: Spacing.xl,
      marginBottom: Spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    bottomSection: {
      padding: Spacing.xl,
      paddingBottom: Spacing.xl + insets.bottom,
      borderTopWidth: 1,
      borderTopColor: theme.outline_variant,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      marginHorizontal: Spacing.sm,
      borderRadius: Radii.md,
      marginVertical: 2,
    },
    itemActive: {
      backgroundColor: theme.primary_container,
    },
    itemText: {
      ...Fonts.bodyLg,
      color: theme.on_surface,
      marginLeft: Spacing.md,
    },
    itemTextActive: {
      color: theme.on_primary_container,
      fontFamily: 'Manrope_700Bold',
    },
  });

  const DrawerRow = ({ label, icon, routeName, path }: any) => {
    const isActive = currentRouteName === routeName;
    return (
      <Pressable 
        style={[styles.itemContainer, isActive && styles.itemActive]} 
        onPress={() => navigateTo(path)}
      >
        <IconSymbol 
          name={icon as any} 
          size={24} 
          color={isActive ? theme.on_primary_container : theme.on_surface_variant} 
        />
        <Text style={[styles.itemText, isActive && styles.itemTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        <View style={styles.header}>
          <Text style={styles.title}>ExplainLikeMyTeacher</Text>
          <Text style={styles.subtitle}>Digital Mentor</Text>
        </View>

        <Text style={styles.sectionLabel}>Features</Text>
        <DrawerRow label="Home" icon="house.fill" routeName="index" path="/(drawer)" />
        <DrawerRow label="Teacher Chat" icon="bubble.left.and.bubble.right.fill" routeName="chat" path="/(drawer)/chat" />
        <DrawerRow label="Generate Quiz" icon="list.bullet.rectangle.portrait.fill" routeName="quiz" path="/(drawer)/quiz" />
        <DrawerRow label="MindMaps" icon="map.fill" routeName="mindmaps" path="/(drawer)/mindmaps" />
        <DrawerRow label="PBL Learning" icon="briefcase.fill" routeName="pbl" path="/(drawer)/pbl" />

        <Text style={styles.sectionLabel}>Utility</Text>
        <DrawerRow label="History" icon="clock.fill" routeName="history" path="/(drawer)/history" />
        <DrawerRow label="Settings" icon="gearshape.fill" routeName="settings" path="/(drawer)/settings" />
      </DrawerContentScrollView>

      <View style={styles.bottomSection}>
        <Pressable 
          style={styles.itemContainer} 
          onPress={() => router.replace('/')}
        >
          <IconSymbol name="arrow.right.square.fill" size={24} color={theme.error} />
          <Text style={[styles.itemText, { color: theme.error }]}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}
