export const tokens = {
  colors: {
    primary: '#3B82F6',
    primarySoft: '#60A5FA',
    success: '#4B8B6B',
    cta: '#0F766E',
    ctaSoft: '#14B8A6',
    background: '#FFFFFF',
    surface: '#F3F4F6',
    border: '#E5E7EB',
    error: '#DC2626',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
  },
  typography: {
    h1: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700' as const,
    },
    body: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
    },
    button: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600' as const,
    },
  },
} as const;

export type ThemeTokens = typeof tokens;
