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
- Import it through `sandbox/`'s own barrel: `import { SandboxMonobankService } from './sandbox'`. The monobank barrel deliberately does **not** re-export it — `getMonobankService` is the only caller, and nothing above the factory should be able to reach for the fake by name.

## Rate limiting

Monobank enforces **1 request / 60s per endpoint**. The shared limiter is in [rateLimiter.ts](rateLimiter.ts).

- A rate-limit hit surfaces as a `MonobankError` with code `RATE_LIMITED`.
- Stores show errors via `showErrorBottomSheet` from `shared/ui/bottom-sheet` — never inline banners or `Alert`.

## Token storage

[MonobankTokenService.ts](MonobankTokenService.ts) persists `{ token, clientName }` in the encrypted secret store — [../secret-storage/](../secret-storage/), never plaintext MMKV. Because that store is async, **`save`, `get` and `clear` are all promise-returning**, and every call site awaits them.

- **Device:** the app-wide `secretStore` singleton from the secret-storage barrel.
- **Jest:** a module-private in-memory port, so no suite touches the Keychain.
- **Never import the secret-storage barrel at the top of this file.** It evaluates `new SecretStore()` at module load and that construction throws under Jest by design; the device singleton is reached by a lazy `require` inside the non-Jest branch, with `import type` (which erases) for the compile-time check.
- The storage keys `monobank_personal_token` and `monobank_client_name` are the storage contract and do not move. `get()` decides presence from the token key alone and **has no fallback to the plaintext copy** — the plaintext copy an older build left behind is moved across by the migration below, not read through at runtime.
- **No try/catch anywhere in the service:** a rejection from the secret store reaches the caller unchanged.

## Legacy plaintext migration

[migrateMonobankSecrets.ts](migrateMonobankSecrets.ts) is a one-time migration (OPES-63) that moves `monobank_personal_token` and `monobank_client_name` off the default plaintext MMKV instance and onto the encrypted store, deleting the plaintext originals. It is called fire-and-forget from [index.js](../../../index.js), after `AppRegistry.registerComponent` and after the `react-native-get-random-values` polyfill.

- **Absence of the plaintext key is the entire idempotency mechanism.** No marker, flag or version number is persisted anywhere; a key that migrated has no plaintext copy left to find, and a key that failed keeps its copy and is retried on the next launch.
- **The plaintext delete is issued only immediately after a secret-store `get` that proves the value is there** — either a pre-write `get` that found an existing encrypted value (that value wins, no `set` is issued) or the post-write read-back compared with strict equality. A `null` or non-equal read-back deletes nothing. Nothing may be inserted between that `get` and the `delete`.
- **Each key runs in its own try/catch and nothing is rethrown.** The migration always resolves `undefined`, so a broken secret store cannot stop the app launching; a failure is reported by one `console.warn` naming the key — never the value.
- **Exactly those two keys, by literal name.** It never enumerates the plaintext instance or matches by prefix: `monobank_selected_account_ids` and every other plaintext value stay put.
- Both stores are injected as named ports (`{ plaintext, secret }`), defaulting to the real ones; the plaintext default reaches `createMMKV()` with no config through the same lazy-require/`typeof jest` pattern used elsewhere in this folder, and maps its `delete` onto MMKV's `remove`.

## Account-sync selection

[MonobankAccountSelectionService.ts](MonobankAccountSelectionService.ts) persists which linked accounts to sync (same MMKV-vs-Jest storage pattern as the token service):

- `getSelectedAccountIds()` returns the enabled account ids, or **`null` when the user hasn't chosen** — callers treat `null` as "sync every account".
- `TransactionSyncService.syncAllAccounts(userId, service, selectedAccountIds)` filters the Monobank cards by this list; `useTransactionsStore.syncFromMonobank` reads the selection and passes it in.
- The selector UI lives on the connected `ConnectMonobankScreen`; `disconnect()` clears the selection.

## Public types

API response shapes and domain-facing types live in [types.ts](types.ts); use them through the barrel. Transformers ([transformers.ts](transformers.ts)) convert Monobank payloads into shapes the rest of the app can consume. `MonobankApi` in `types.ts` is the interface both `MonobankService` and `SandboxMonobankService` implement — code that consumes the factory's return value should be typed against it, not against `MonobankService`. `MONOBANK_UNAUTHORIZED_MESSAGE` is the one 401 message both raise; do not inline a second copy of that string anywhere.
