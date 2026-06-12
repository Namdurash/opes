# Monobank integration

Wraps the Monobank Personal API. Optional — the app must function without it.

## Service instance

- **Always obtain the service via `getMonobankService(token)`** from [serviceInstance.ts](serviceInstance.ts). It caches one `MonobankService` per token.
- **Never `new MonobankService(...)`** in a store, screen, or other service. The cache exists to share the rate-limiter state across callers.

## Rate limiting

Monobank enforces **1 request / 60s per endpoint**. The shared limiter is in [rateLimiter.ts](rateLimiter.ts).

- A rate-limit hit surfaces as a `MonobankError` with code `RATE_LIMITED`.
- Stores show errors via `showErrorBottomSheet` from `shared/ui/bottom-sheet` — never inline banners or `Alert`.

## Token storage

[MonobankTokenService.ts](MonobankTokenService.ts) persists `{ token, clientName }`:

- **Device:** MMKV.
- **Jest:** in-memory map.

Use the same Jest-vs-device branch when adding any new native-backed storage in this codebase.

## Account-sync selection

[MonobankAccountSelectionService.ts](MonobankAccountSelectionService.ts) persists which linked accounts to sync (same MMKV-vs-Jest storage pattern as the token service):

- `getSelectedAccountIds()` returns the enabled account ids, or **`null` when the user hasn't chosen** — callers treat `null` as "sync every account".
- `TransactionSyncService.syncAllAccounts(userId, service, selectedAccountIds)` filters the Monobank cards by this list; `useTransactionsStore.syncFromMonobank` reads the selection and passes it in.
- The selector UI lives on the connected `ConnectMonobankScreen`; `disconnect()` clears the selection.

## Public types

API response shapes and domain-facing types live in [types.ts](types.ts); use them through the barrel. Transformers ([transformers.ts](transformers.ts)) convert Monobank payloads into shapes the rest of the app can consume.
