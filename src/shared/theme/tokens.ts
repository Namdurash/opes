export const tokens = {
  colors: {
    primary: '#8B5CF6',
    primarySoft: '#A78BFA',
    secondary: '#F5F3FF',
    success: '#22C55E',
    error: '#EF4444',
    cta: '#0F766E',
    ctaSoft: '#14B8A6',
    background: '#FFFFFF',
    gradientLightPurple: '#EAE5FF',
    gradientBoldPurple: '#D3C8FF',
    subtle: '#D3C8FF',
    surface: '#FAFAFA',
    border: '#E4E4E7',
    textPrimary: '#18181B',
    textSecondary: '#52525B',
    textMuted: '#A1A1AA',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
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

// Dark-mode colors. Must declare exactly the same keys as `tokens.colors` so the
// two palettes share one `ThemeColors` shape (see theme.ts).
export const darkColors = {
  primary: '#A78BFA',
  primarySoft: '#8B5CF6',
  secondary: '#211C30',
  success: '#22C55E',
  error: '#F87171',
  cta: '#2DD4BF',
  ctaSoft: '#14B8A6',
  background: '#121016',
  gradientLightPurple: '#241F33',
  gradientBoldPurple: '#2E2747',
  subtle: '#2E2747',
  surface: '#1B1822',
  border: '#2E2A38',
  textPrimary: '#F4F4F5',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
} as const;

export type ThemeTokens = typeof tokens;
