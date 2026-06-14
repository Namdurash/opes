Ticket: OPES-40

> Backfilled retrospectively: this change documents work already implemented and
> committed as `feat(OPES-40)`. Tasks are checked because the code already landed.

## Why

There is no Settings screen and no way to switch themes or get data out. The theme tokens were light-only and `ThemeProvider` hardcoded the light theme, even though the design system was meant to be switchable. And as a local-only app, users have no way to back up or move their transactions.

## What Changes

- New `Settings` screen (route `Settings`) reachable from Home, with two sections: Appearance and Data export.
- Dark/light theme: add a dark token set + a `themes` map keyed by `ThemeMode`; `ThemeProvider` reads the persisted mode (MMKV) or falls back to the system color scheme, and exposes `mode` / `setMode` / `toggleMode`. A `Switch` on Settings toggles it.
- Data export: export all transactions as JSON or CSV via React Native's built-in `Share` (no file-system dependency). An info sheet is shown when there is nothing to export.

## Capabilities

### New Capabilities
- `app-theming`: a user SHALL switch between light and dark themes; the choice persists and applies app-wide, defaulting to the system scheme.
- `data-export`: a user SHALL export all transactions as JSON or CSV via the system share sheet.

### Modified Capabilities
- _None._

## Impact

- New `features/settings` (screen + styles, `useSettingsStore`, `utils` + tests), `shared/theme` (dark tokens, `themes` map, `ThemeMode`, `ThemeProvider` rework, `themeStorage`), `app/navigation` (new `Settings` route), `features/home` (entry point).
- MMKV only (existing dep) for the theme choice; `Share` is built into React Native. No `domain/` change, no schema-version bump, no new dependency.

## Non-goals

- Per-screen theme overrides or additional themes beyond light/dark.
- Exporting to a file on disk or to a cloud target (uses the share sheet only — no file-system dependency).
- Exporting cards/categories/overrides — transactions only.
- Other settings (notifications, language, etc.).
