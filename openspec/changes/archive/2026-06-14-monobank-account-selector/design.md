## Context

A Monobank token links one or more accounts, persisted as `cards` rows (type `monobank`, with a `monobankAccountId`). `TransactionSyncService.syncAllAccounts` fetches statements for every Monobank card. Token persistence already uses an MMKV-with-jest-fallback service (`MonobankTokenService`) — the selection follows the same pattern.

## Goals / Non-Goals

**Goals:** let the user enable/disable individual linked accounts for sync; persist across launches; have sync honor it; reuse the existing storage pattern.

**Non-Goals:** per-account intervals, pre-connect selection, a schema/table.

## Decisions

- **Selection as an MMKV allow-list of enabled account ids**, behind `MonobankAccountSelectionService` (same `KeyValueStorage` interface + jest in-memory fallback as `MonobankTokenService`). `null` = not chosen yet → sync all (backward-compatible default); an explicit array (including empty) is the allow-list. JSON-encoded; malformed values read as `null`.
- **Filtering lives in `TransactionSyncService`** via an optional `selectedAccountIds` param, so the service stays the single place that decides which accounts to fetch; the store reads the persisted selection and passes it in (composed at the call site, per the sync convention).
- **The store (`useMonobankStore`) holds the linked accounts** (from `getMonobankCards`) and the selection; `toggleAccount` computes the next enabled set from the current one (defaulting to "all" when unset) and persists it. `disconnect` clears the selection.
- **The selector UI is a per-account switch** on the existing Connect Monobank screen (shown when connected) — no new route.

## Risks / Trade-offs

- [Empty allow-list = sync nothing] → a deliberate, valid user choice; the UI labels the section ("Only the accounts you enable are synced") so it is clear.
- [Selection keyed by account id, cards keyed by row id] → the filter guards `monobankAccountId != null` before matching, so manual cards are never affected.
