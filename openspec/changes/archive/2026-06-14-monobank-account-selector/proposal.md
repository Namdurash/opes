Ticket: OPES-39

> Backfilled retrospectively: this change documents work already implemented and
> committed as `feat(OPES-39)`. Tasks are checked because the code already landed.

## Why

When a Monobank token is linked, every account is synced. Users with multiple accounts (e.g. a secondary currency card or a jar) cannot opt out of syncing some of them. We want to let the user choose which linked accounts sync, persisted across launches, without a schema change.

## What Changes

- New `MonobankAccountSelectionService` persists the enabled account ids in MMKV (existing dep), with a jest in-memory fallback like `MonobankTokenService`. `null` (never chosen) means "sync all"; an explicit (possibly empty) array is the allow-list.
- `TransactionSyncService.syncAllAccounts` gains an optional `selectedAccountIds` param and filters the Monobank cards accordingly (`null`/`undefined` → all; a list → only matching account ids).
- `useTransactionsStore.syncFromMonobank` reads the persisted selection and passes it to the sync service.
- `useMonobankStore` exposes the linked accounts + the selection and a `toggleAccount` action that persists via the service; `disconnect` clears the selection.
- The Connect Monobank screen, when connected, lists the linked accounts with a per-account on/off switch ("Accounts to sync").

## Capabilities

### New Capabilities
- `monobank-account-selection`: a user SHALL choose which linked Monobank accounts are synced; the choice persists and sync honors it.

### Modified Capabilities
- _None — Monobank token connection and the sync algorithm itself are unchanged; this adds an account filter in front of sync._

## Impact

- New `services/monobank/MonobankAccountSelectionService` (+ test) and barrel export, `services/sync` (filter), `features/monobank` (store + screen), `features/transactions` (pass selection on sync).
- MMKV only (existing dep). No `domain/` change, no schema-version bump, no new dependency.

## Non-goals

- Per-account sync windows/intervals or independent refresh.
- Selecting accounts before connecting (selection applies to already-linked accounts).
- A schema/table for the selection (an MMKV key only).
