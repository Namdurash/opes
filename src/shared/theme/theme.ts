import { tokens } from './tokens';

export type Theme = typeof lightTheme;

export const lightTheme = {
  colors: tokens.colors,
  spacing: tokens.spacing,
  radii: tokens.radii,
  typography: tokens.typography,
};
