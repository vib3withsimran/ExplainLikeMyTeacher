import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { IconSymbol } from './ui/icon-symbol';
import { Fonts, Spacing, useTheme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Header({ title }: { title: string }) {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: insets.top + Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.sm,
      backgroundColor: theme.background,
    },
    menuButton: {
      padding: Spacing.sm,
      marginRight: Spacing.md,
      borderRadius: 20,
    },
    title: {
      ...Fonts.headlineSm,
      color: theme.on_background,
    },
  });

  return (
    <View style={styles.container}>
      <Pressable
        onPress={openDrawer}
        style={({ pressed }) => [
          styles.menuButton,
          pressed && { backgroundColor: theme.surface_variant }
        ]}
      >
        <IconSymbol name="line.3.horizontal" size={28} color={theme.on_background} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}
