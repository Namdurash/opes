<!-- aif:meta
{ "schema": 1, "ticket": "OPES-58", "lang": "en", "risk": "high" }
-->

# OPES-58 — Migrate the Monobank token onto the encrypted secret store

## Why

This is the consumer half of OPES-42. OPES-42 builds the encrypted `secret-storage` module
(an encrypted MMKV instance keyed from the device Keychain, with an async `get`/`set`/`delete`
error contract and a fail-closed key bootstrap). On its own that module holds nothing — the
Monobank **personal token** is still written to **plaintext MMKV** via `MonobankTokenService`.
This ticket moves the token (and the connected client name) onto the secret store and migrates
any existing plaintext copy across, which is the point at which the at-rest exposure actually
closes.

It depends on OPES-42: the `SecretStore` API it consumes (async `get`/`set`/`delete`, `null`
only for a genuinely-absent storage key, rejects on transient/write failure) is defined and
delivered there.

## What should be true after

**The Monobank token rides on the secret store.** `MonobankTokenService` is rewired to persist
through `SecretStore`; its `get` / `save` / `clear` become async. `save` writes both the token
and the client name into the encrypted store; `get` returns both; `clear` removes them.

**A one-time migration moves any existing plaintext copy across.** On the first run after the
change, the migration copies `monobank_personal_token` and `monobank_client_name` from the
default plaintext MMKV instance into the encrypted store. It is evaluated **per storage key
independently**: for each storage key the plaintext copy is deleted **only after the encrypted
write is read back and is byte-for-byte equal** to what was written — a non-null-but-corrupted
read is not enough to delete the original, and a crash between the copy and the delete can never
leave that storage key in neither store. The migration is **idempotent** ("already done"
detected per storage key by the plaintext key being absent), a **no-op on a fresh install**,
and if a value exists in **both** stores the **encrypted value wins** (it is never overwritten
from plaintext). Every other plaintext MMKV value — theme preference, Monobank account
selection — is left exactly as it is. Where the migration lives (the store's readiness step or
`MonobankTokenService`) is left to the spec, provided this observable behaviour holds.

**Async token access is propagated — reads and writes.** Because the secret store is async,
every `MonobankTokenService` method is now async, and both read and write call sites are
updated.

Reads:

- `useMonobankStore.loadSavedToken` becomes `async` returning `Promise<string | null>` (its
  signature in `src/features/monobank/types.ts` updated to match);
- the `HomeScreen.tsx` startup effect calls it fire-and-forget with a `.catch` (its return
  value is already unused);
- the `ConnectMonobankScreen.tsx` effect awaits it and then `setValue`s the restored token;
  on `null` (no saved token) the field is left empty, and on a rejection (transient error) the
  rejection is caught and the field is left empty rather than blocking the form with an error;
- `useTransactionsStore.syncFromMonobank` (already an async context) awaits the
  `monobankTokenService.get()` call.

Writes:

- `useMonobankStore.connect` awaits `monobankTokenService.save(...)` before it sets
  `status: 'connected'`. The connected state must never be announced ahead of the secret being
  persisted, and a failed save must surface as a connection failure (`status: 'error'`, an
  existing `MonobankConnectionStatus` value) rather than an unhandled promise rejection.
- `useMonobankStore.disconnect` becomes async (`Promise<void>`), awaiting
  `monobankTokenService.clear()` before it resets the store state; its signature in
  `src/features/monobank/types.ts` is updated and its call site in `ConnectMonobankScreen.tsx`
  updated accordingly. Disconnect is security-visible: it must not report the user as
  disconnected while the secret is still on disk. If `clear()` rejects, the failure is surfaced
  and the store does not silently present a disconnected state.

**The Jest-vs-device split is preserved.** Under Jest the secret store is in-memory and
`react-native-keychain` is mocked (as delivered by OPES-42); these criteria are exercised
through that Jest backing.

## Surfaces the change is seen through

- `MonobankTokenService` — `get` / `save` / `clear` now async, backed by the secret store; the
  one-time migration lives here (or in the store's readiness step). Its write call sites are
  `useMonobankStore.connect` (await `save` before the status change) and
  `useMonobankStore.disconnect` (now async, awaiting `clear`).
- `src/features/monobank/types.ts` — `loadSavedToken` and `disconnect` signatures.
- `useMonobankStore.loadSavedToken` / `connect` / `disconnect`, `HomeScreen.tsx`,
  `ConnectMonobankScreen.tsx`, `useTransactionsStore.syncFromMonobank`.
- Docs: `src/services/monobank/CLAUDE.md` updated to say the token is now encrypted via
  `secret-storage`.

## Edge cases that matter

- **Fresh install** — no plaintext Monobank keys: migration does nothing.
- **Existing user with a plaintext token** — migration moves both the token and the client name
  on first launch and deletes the plaintext copies.
- **Migration re-run** — idempotent (detected per storage key by the plaintext key being absent).
- **Value in both stores** — encrypted wins, plaintext copy deleted; encrypted never overwritten
  from plaintext.
- **Crash mid-migration** — because the plaintext copy is deleted only after a byte-for-byte
  read-back, the value survives in at least one store; the next launch completes it.
- **Corrupted read-back** — a non-null but non-equal read does not trigger the plaintext delete.
- **Disconnect while the secret store is failing** — `clear()` rejects: the failure is surfaced
  and the user is not shown as disconnected while the token is still stored.
- **Other plaintext MMKV values** (theme, account selection) — left exactly as they are; the
  migration touches only the two Monobank storage keys.

## Risk

High. This is the change that performs a **one-time destructive migration** deleting the
plaintext original, and it makes a **security-visible** connect/disconnect flow async. A green
suite does not by itself prove the plaintext copy is gone or that disconnect never reports
success while the secret is still on disk — so the write-confirmed-before-delete, encrypted-wins,
and connect/disconnect ordering properties must be pinned explicitly.

## Deliberately left open

- **Where the one-time migration lives** — the secret store's readiness step or
  `MonobankTokenService` — provided the observable behaviour (idempotent, no-op on fresh install,
  byte-for-byte read-back before delete, encrypted-wins, other keys untouched) holds.
