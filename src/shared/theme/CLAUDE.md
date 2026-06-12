# Theme tokens

Single source of truth for visual constants. Anything you'd otherwise hardcode in a component belongs here.

## Tokens

`theme.colors.*`, `theme.typography.*`, `theme.spacing.*`, `theme.radii.*`, `theme.shadows.*`. Defined in [tokens.ts](tokens.ts), composed into the runtime `Theme` in [theme.ts](theme.ts), provided through [ThemeProvider.tsx](ThemeProvider.tsx).

## Rules

- **No raw hex colors anywhere in `src/features/**` or `src/app/**`.** All colors come from `theme.colors`.
- **No numeric font sizes in feature code.** Use `theme.typography` styles.
- **Styles consume the theme** via [makeStyles.ts](makeStyles.ts) (`makeStyles((theme) => ({ ... }))`) or [useTheme.ts](useTheme.ts) inside a component.
- **`shared/ui` primitives may inline-style with tokens** — they're the layer that bridges raw RN to the design system.

## Extensibility

- The theme must remain switchable (e.g. light/dark) without rewriting feature code. That means: every new visual constant goes into tokens first, then gets used downstream. No exceptions for "just this one screen".
- Adding a color or text style is a one-place edit (`tokens.ts`) followed by usage at the call sites.

## Light / dark mode

- Two color palettes live in [tokens.ts](tokens.ts): `tokens.colors` (light) and `darkColors` (dark). **They must declare exactly the same keys** — `ThemeColors` in [theme.ts](theme.ts) is derived from the light palette and both must satisfy it. Add any new color to **both**.
- `lightTheme` / `darkTheme` (and the `themes` map) are assembled in [theme.ts](theme.ts); spacing, radii, and typography are shared across modes.
- [ThemeProvider.tsx](ThemeProvider.tsx) holds the active `mode`, defaulting to the persisted choice (MMKV via [themeStorage.ts](themeStorage.ts)) then the system scheme (`useColorScheme`). `useTheme()` exposes `{ theme, mode, setMode, toggleMode }`; the Settings screen drives the toggle.
