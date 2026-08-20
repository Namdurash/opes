# Monobank integration

Wraps the Monobank Personal API. Optional — the app must function without it.

## Service instance

- **Always obtain the service via `getMonobankService(token)`** from [serviceInstance.ts](serviceInstance.ts). It returns `MonobankApi` — the shared interface in [types.ts](types.ts) — not the concrete `MonobankService` class, and caches one instance per `(token, sandbox flag)` pair.
- **Never `new MonobankService(...)`** in a store, screen, or other service. The cache exists to share the rate-limiter state across callers.
- **In the sandbox build (`isSandboxBuild()`), the factory returns `SandboxMonobankService`** from [sandbox/](sandbox/) instead of the real service. Every caller — `TransactionSyncService`, the stores — is typed against `MonobankApi`, so which class the factory constructs is invisible above it.

## Sandbox fake

[sandbox/](sandbox/) holds the fake and its fixtures, used only in the sandbox build:

- `SandboxMonobankService` implements `MonobankApi`, resolving the token to a fixture user on every call (never at construction) through the token map in `sandbox/fixtures.ts`. An unlisted token raises the same `MonobankError('UNAUTHORIZED', MONOBANK_UNAUTHORIZED_MESSAGE)` a real 401 would.
- The fake **carries no rate limiter, no timer and no module-level mutable state** — only the dates on its statements move, derived from the clock at call time.
- Fixtures are stored as raw API shapes and returned through the production `transformClientInfo` / `transformStatements`, so minor-unit and currency-symbol conversion is never restated.
- Import it through the barrel: `import { SandboxMonobankService } from './sandbox'` (or the monobank barrel).

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

API response shapes and domain-facing types live in [types.ts](types.ts); use them through the barrel. Transformers ([transformers.ts](transformers.ts)) convert Monobank payloads into shapes the rest of the app can consume. `MonobankApi` in `types.ts` is the interface both `MonobankService` and `SandboxMonobankService` implement — code that consumes the factory's return value should be typed against it, not against `MonobankService`. `MONOBANK_UNAUTHORIZED_MESSAGE` is the one 401 message both raise; do not inline a second copy of that string anywhere.
