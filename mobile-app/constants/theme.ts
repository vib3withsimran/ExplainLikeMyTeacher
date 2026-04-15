// Theme mapped from Stitch Digital Mentor standard + Dark Theme references

export const LightColors = {
  primary: '#4f46e5', // indigo-600
  on_primary: '#ffffff',
  primary_container: '#e0e7ff', // indigo-100
  on_primary_container: '#312e81', // indigo-900

  secondary: '#0f172a', // slate-900
  on_secondary: '#ffffff',
  secondary_container: '#f1f5f9', // slate-100
  on_secondary_container: '#334155', // slate-700

  tertiary: '#f59e0b', // amber-500
  on_tertiary: '#ffffff',

  background: '#f8fafc', // slate-50
  on_background: '#0f172a', 

  surface: '#ffffff',
  on_surface: '#0f172a',
  surface_variant: '#f1f5f9',
  on_surface_variant: '#64748b', // slate-500

  surface_container_highest: '#e2e8f0', // slate-200
  surface_container_high: '#cbd5e1', // slate-300
  surface_container: '#f1f5f9', // slate-100
  surface_container_low: '#f8fafc', // slate-50
  surface_container_lowest: '#ffffff', // white

  outline: '#94a3b8',
  outline_variant: '#cbd5e1',

  error: '#ef4444',
  on_error: '#ffffff',
  error_container: '#fee2e2',
  on_error_container: '#991b1b',
};

export const DarkColors = {
  primary: '#6366f1', // indigo-500
  on_primary: '#ffffff',
  primary_container: '#3730a3', // indigo-800
  on_primary_container: '#e0e7ff', 

  secondary: '#f8fafc', 
  on_secondary: '#0f172a',
  secondary_container: '#334155', // slate-700
  on_secondary_container: '#f1f5f9', 

  tertiary: '#fbbf24', // amber-400
  on_tertiary: '#0f172a',

  background: '#020617', // slate-950
  on_background: '#f8fafc', 

  surface: '#0f172a', // slate-900
  on_surface: '#f8fafc',
  surface_variant: '#1e293b', // slate-800
  on_surface_variant: '#94a3b8', // slate-400

  surface_container_highest: '#334155', // slate-700
  surface_container_high: '#475569', // slate-600
  surface_container: '#1e293b', // slate-800
  surface_container_low: '#0f172a', // slate-900
  surface_container_lowest: '#020617', // slate-950

  outline: '#64748b',
  outline_variant: '#334155',

  error: '#f87171',
  on_error: '#0f172a',
  error_container: '#991b1b',
  on_error_container: '#fee2e2',
};

// Fallback to light theme for existing direct imports
// Recommended to use useTheme() hook inside components instead of direct Colors import.
export const Colors = LightColors;

import { useThemeContext } from '@/context/ThemeContext';

export function useTheme() {
  const { isDarkMode } = useThemeContext();
  return isDarkMode ? DarkColors : LightColors;
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Fonts = {
  displayLg: { fontFamily: 'Manrope_700Bold', fontSize: 48, letterSpacing: -1 },
  displayMd: { fontFamily: 'Manrope_700Bold', fontSize: 36, letterSpacing: -0.5 },
  displaySm: { fontFamily: 'Manrope_700Bold', fontSize: 28, letterSpacing: -0.25 },
  
  headlineLg: { fontFamily: 'Manrope_600SemiBold', fontSize: 24, letterSpacing: 0 },
  headlineMd: { fontFamily: 'Manrope_600SemiBold', fontSize: 20, letterSpacing: 0 },
  headlineSm: { fontFamily: 'Manrope_600SemiBold', fontSize: 18, letterSpacing: 0 },

  bodyLg: { fontFamily: 'Inter_400Regular', fontSize: 16, letterSpacing: 0.15 },
  bodyMd: { fontFamily: 'Inter_400Regular', fontSize: 14, letterSpacing: 0.25 },
  bodySm: { fontFamily: 'Inter_400Regular', fontSize: 12, letterSpacing: 0.4 },

  labelLg: { fontFamily: 'Inter_500Medium', fontSize: 14, letterSpacing: 0.1 },
  labelMd: { fontFamily: 'Inter_500Medium', fontSize: 12, letterSpacing: 0.5 },
  labelSm: { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 0.5 },
};
