export const Colors = {
  light: {
    // Primary colors
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    
    // Secondary colors
    secondary: '#8B5CF6',
    accent: '#EC4899',
    
    // Background colors
    background: '#F9FAFB',
    surface: '#FFFFFF',
    
    // Text colors
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    // Border colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    
    // Status colors
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Category colors
    purple: '#8B5CF6',
    orange: '#F97316',
    pink: '#EC4899',
    teal: '#14B8A6',
    cyan: '#06B6D4',
    rose: '#F43F5E',
    emerald: '#059669',
    amber: '#D97706',
    indigo: '#6366F1',
  },
  dark: {
    // Primary colors
    primary: '#818CF8',
    primaryLight: '#A5B4FC',
    primaryDark: '#6366F1',
    
    // Secondary colors
    secondary: '#A78BFA',
    accent: '#F472B6',
    
    // Background colors
    background: '#0F172A',
    surface: '#1E293B',
    
    // Text colors
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    
    // Border colors
    border: '#334155',
    borderLight: '#1E293B',
    
    // Status colors
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
    
    // Category colors
    purple: '#C084FC',
    orange: '#FB923C',
    pink: '#F472B6',
    teal: '#2DD4BF',
    cyan: '#22D3EE',
    rose: '#FB7185',
    emerald: '#34D399',
    amber: '#FBBF24',
    indigo: '#818CF8',
  },
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h3: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  h4: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  round: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};