# Design system primitives

Reusable UI components consumed by every feature. **Inline `StyleSheet.create` is allowed here** (unlike features), because these primitives are part of the design system and their styles are tightly coupled to behavior.

Always prefer these primitives over raw `react-native` components in feature code.

## Screen

`<Screen>` is the root wrapper for every screen. Props:

- `background?: 'blank' | 'gradient'` — `'blank'` (white) is default.
- `headerLeft?`, `headerCenter?`, `headerRight?` — `ReactNode` slots. Header is rendered only when at least one slot is filled.

**Header config lives on `<Screen>`** — do not compose `<Header>` manually inside a screen body, and do not use React Navigation's built-in `header` option (it renders outside `Screen` and breaks the gradient background).

## Header

[header/](header/) is slot-based: `left`, `center`, `right`.

- `center` is absolutely positioned full-width, guaranteeing true centering regardless of side content.
- `left` and `right` are rows with gap, supporting 1–3 icon buttons each (pass a Fragment of items).

Sub-components: `HeaderTitle`, `HeaderBackButton`, `HeaderIconButton`. Don't add a `HeaderBackButton` on a screen reached via `navigation.replace(...)` — see [../../app/CLAUDE.md](../../app/CLAUDE.md).

## Icons

[icons/](icons/) — SVGs transformed into React components by `react-native-svg-transformer` (configured in [../../../metro.config.js](../../../metro.config.js)).

- **Public API: `<Icon name="..." size="sm|md|lg" color="..." />`.** Never import an individual icon component into feature code.
- `IconName` is derived from the keys of [icons/registry.ts](icons/registry.ts) — adding to the registry is the only way to make a new icon usable via `<Icon name="...">`.

**Adding an icon:**

1. Drop the `.svg` into [icons/assets/](icons/).
2. Create a wrapper component accepting `{ size, color }`.
3. Register it in `registry.ts`.

## UI state primitives

Use these consistently — don't invent ad-hoc loading/error/empty UIs.

- **Loading:** `<LoadingOverlay />` ([LoadingOverlay.tsx](LoadingOverlay.tsx)) — full-screen semi-transparent overlay with centered spinner. Use whenever an async operation blocks the screen.
- **Errors:** `showErrorBottomSheet` from [bottom-sheet/](bottom-sheet/). **Never** use inline error banners or `Alert` for operation failures — always go through the bottom sheet.
- **Empty state:** `<EmptyState />` ([EmptyState.tsx](EmptyState.tsx)) — show this when a screen has no data. Never show a blank screen.

## Inputs

- `<Input>` — themed input wrapping RN `TextInput`. Visual states: default, focused (`primary` border), error (`error` border), disabled. Supports `forwardRef`.
- `<FormInput>` — generic `Controller` wrapper connecting `<Input>` to React Hook Form. Type-safe `name` via `FieldPath<T>`.
- **Feature code uses `<Input>` or `<FormInput>`, never raw `TextInput`.** See [../../features/CLAUDE.md](../../features/CLAUDE.md).
