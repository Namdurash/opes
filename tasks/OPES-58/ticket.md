<!-- aif:meta
{ "schema": 1, "ticket": "OPES-58", "lang": "en", "risk": "high" }
-->

# OPES-58 — Move the Monobank token onto the encrypted secret store

## Why

This is the consumer half of OPES-42. OPES-42 built the encrypted `secret-storage` module
(an encrypted MMKV instance keyed from the device Keychain, with an async `get`/`set`/`delete`
error contract and a fail-closed key bootstrap). On its own that module holds nothing — the
Monobank **personal token** is still written to **plaintext MMKV** via `MonobankTokenService`.

This ticket rewires `MonobankTokenService` to persist through `SecretStore`, which is the point
at which new writes stop landing in plaintext.

It depends on OPES-42: the `SecretStore` API it consumes (async `get`/`set`/`delete`, `null`
only for a genuinely-absent storage key, rejects on transient/write failure) is defined and
delivered there.

## Scope note — this ticket was split

The original OPES-58 covered the rewire, the one-time plaintext migration, and the async
propagation semantics in one change. That is three units of work, so it was split:

- **OPES-58 (this ticket)** — rewire `MonobankTokenService` onto the secret store; make its
  three methods async; update every call site so the project type-checks and its existing
  behaviour is preserved.
- **OPES-63** — the one-time migration that moves any existing plaintext copy across and
  deletes the original.
- **OPES-64** — the security-visible async semantics at the call sites: connect/disconnect
  ordering, failure presentation, `loadSavedToken` on the two screens and in sync.

Do not implement OPES-63's migration or OPES-64's ordering guarantees here.

## What should be true after

**The Monobank token rides on the secret store.** `MonobankTokenService` persists through
`SecretStore` instead of the default plaintext MMKV instance. Its `get` / `save` / `clear`
become async:

- `save(token, clientName)` writes both the token and the client name into the encrypted store,
  under the storage keys `monobank_personal_token` and `monobank_client_name`.
- `get()` resolves both values; it resolves `null` when no token is stored.
- `clear()` removes both.
- When the underlying `SecretStore` rejects, the service does not swallow it — the rejection
  reaches the caller.

**Every call site compiles and keeps behaving as it does today.** Because the three methods are
now async, `useMonobankStore.loadSavedToken` / `connect` / `disconnect`,
`useTransactionsStore.syncFromMonobank`, `HomeScreen.tsx` and `ConnectMonobankScreen.tsx` are
updated to await them, and the `loadSavedToken` / `disconnect` signatures in
`src/features/monobank/types.ts` are updated to their promise-returning forms. `npx tsc --noEmit`
passes and the existing suite stays green.

This ticket asks for the mechanical propagation only. **What the store should do when a save or
a clear fails, and in what order the status may change, is OPES-64's subject** — nothing here
should be read as deciding it.

**The docs say where the token now lives.** `src/services/monobank/CLAUDE.md` is updated to state
that the token is stored encrypted via `secret-storage`.

**The Jest-vs-device split is preserved.** Under Jest the secret store is in-memory and
`react-native-keychain` is mocked (as delivered by OPES-42); these criteria are exercised through
that Jest backing.

## Surfaces the change is seen through

- `MonobankTokenService` — `get` / `save` / `clear`, now async and backed by `SecretStore`.
- `src/features/monobank/types.ts` — `loadSavedToken` and `disconnect` signatures.
- Call sites updated for the await only: `useMonobankStore.loadSavedToken` / `connect` /
  `disconnect`, `useTransactionsStore.syncFromMonobank`, `HomeScreen.tsx`,
  `ConnectMonobankScreen.tsx`.
- Docs: `src/services/monobank/CLAUDE.md`.

## Edge cases that matter

- **No token stored** — `get()` resolves `null` rather than an object with empty fields.
- **The secret store rejects on write** — `save()` rejects; the rejection is not swallowed by the
  service.
- **Existing plaintext token on disk** — out of scope here. Until OPES-63 lands, a user who
  already connected will read `null` from the encrypted store and appear disconnected, with the
  plaintext copy still on disk. That is expected between these two tickets and must not be
  papered over with a plaintext fallback read.

## Risk

High. It changes where a secret is written, and it makes a security-visible connect/disconnect
flow async without yet pinning the ordering (that is OPES-64). A green suite after this ticket
does not establish that the flow is safe under failure — only that it type-checks and that the
service reads and writes through the encrypted store.

## Deliberately left open

- Whether `MonobankTokenService` stays a class, a singleton, or becomes a factory — provided the
  observable `get` / `save` / `clear` contract above holds.
