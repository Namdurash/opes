## Context

Theme tokens (colors/spacing/radii/typography) feed a single light `Theme` via `ThemeProvider`, consumed through `useTheme`/`makeStyles`. The theme `CLAUDE.md` rule already requires the theme to be switchable without rewriting feature code. Transactions live in WatermelonDB via `TransactionsRepository.getAll()`. The app is local-only with no file-system dependency.

## Goals / Non-Goals

**Goals:** a Settings screen; a persisted light/dark toggle applied at the provider; export all transactions as JSON/CSV via the system share sheet — all with no new dependency.

**Non-Goals:** extra themes, per-screen overrides, file/cloud export, non-transaction export, other settings.

## Decisions

- **Add a dark color set in tokens and a `themes: Record<ThemeMode, Theme>` map**, keeping the `Theme` shape identical across modes so every existing token consumer works unchanged. `ThemeProvider` holds the active mode in state, initialized from the persisted choice (`themeStorage`/MMKV) or the system color scheme, and provides `mode`/`setMode`/`toggleMode`. This satisfies the "switchable without rewriting feature code" rule — only the provider changed.
- **Persist the mode** with a small `themeStorage` module mirroring the `MonobankTokenService` MMKV-with-jest-fallback pattern.
- **Export via `Share.share({ message })`** — no file-system dependency (per the no-new-deps constraint). JSON is pretty-printed; CSV uses a fixed column order with RFC-4180-style quoting/escaping. Both are pure helpers (`transactionsToJson`/`transactionsToCsv`), unit-tested. Empty data shows an info bottom sheet instead of sharing.
- **Settings is a new route** reachable from Home's quick actions; the theme toggle is a `Switch`, export is two buttons.

## Risks / Trade-offs

- [Share shares text, not a file] → accepted: a share-to-file dependency is out of scope; the user can paste/save the shared text. A true file export is a later change.
- [Two themes share one `Theme` type] → any future token must be added to both sets; enforced structurally by `Theme = typeof lightTheme`.
