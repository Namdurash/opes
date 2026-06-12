import { darkColors, tokens } from './tokens';

export type ThemeMode = 'light' | 'dark';

// Light and dark share one shape: same color keys (string-valued), same
// spacing / radii / typography. Feature code stays mode-agnostic.
export type ThemeColors = { [K in keyof typeof tokens.colors]: string };

export interface Theme {
  colors: ThemeColors;
  spacing: typeof tokens.spacing;
  radii: typeof tokens.radii;
  typography: typeof tokens.typography;
}

export const lightTheme: Theme = {
  colors: tokens.colors,
  spacing: tokens.spacing,
  radii: tokens.radii,
  typography: tokens.typography,
};

export const darkTheme: Theme = {
  colors: darkColors,
  spacing: tokens.spacing,
  radii: tokens.radii,
  typography: tokens.typography,
};

export const themes: Record<ThemeMode, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};
