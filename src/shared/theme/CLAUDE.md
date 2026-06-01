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
