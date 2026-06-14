## 1. Theme (shared/theme)

- [x] 1.1 Add a dark color token set and a `themes` map keyed by `ThemeMode` (light/dark), keeping the `Theme` shape identical
- [x] 1.2 Add `themeStorage` (MMKV + jest fallback) to persist the mode
- [x] 1.3 Rework `ThemeProvider` to hold the active mode (persisted choice → system scheme) and expose `mode`/`setMode`/`toggleMode`

## 2. Data export (features/settings)

- [x] 2.1 Add `transactionsToJson` / `transactionsToCsv` pure helpers (fixed CSV columns + escaping) and unit-test them
- [x] 2.2 Add `useSettingsStore.exportTransactions(format)`: load all, empty → info sheet, else `Share.share`

## 3. Settings screen + navigation

- [x] 3.1 Add `SettingsScreen` (+ styles): Appearance (dark-mode `Switch`) + Data export (JSON/CSV buttons)
- [x] 3.2 Append the `Settings` route, register the screen, and add a Home entry point

## 4. Definition of Done

- [x] 4.1 `npx tsc --noEmit`, `npm run lint`, and `npm test` all pass; theme `CLAUDE.md` updated
