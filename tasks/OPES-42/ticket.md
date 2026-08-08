<!-- aif:meta
{ "schema": 1, "ticket": "OPES-42", "lang": "en", "risk": "high" }
-->

# OPES-42 — Encrypted secret-storage module

## Why

The app stores runtime secrets — first and foremost the Monobank **personal token** — in
**plaintext MMKV**. That token grants read access to the user's entire transaction history
and account balances, and anyone with filesystem access (a rooted/jailbroken device, an
unencrypted backup, forensic extraction) can read it straight off disk. For a personal
finance app this is a real at-rest exposure.

This ticket builds the **encrypted store** that closes it: a reusable `secret-storage`
module that keeps secrets encrypted at rest, keyed from the device Keychain/Keystore. It is
the primitive, delivered and unit-tested on its own. Actually moving the Monobank token onto
it — the one-time plaintext migration and the async propagation through the app — is its
first consumer and is tracked separately in **OPES-49**; the at-rest exposure closes when
both ship. This ticket is scoped to the module.

## What should be true after

**An encrypted secret store exists.** A new module under `src/services/secret-storage/`
wraps a dedicated MMKV instance created with an `encryptionKey`. That 32-byte **encryption
key** is generated **once from a cryptographically secure random source** (never a
non-crypto RNG such as `Math.random`), stored in the device Keychain/Keystore (a new
`react-native-keychain` dependency, used only to hold this key; if no suitable
native/existing secure-random source is available, the spec may add **one** small,
well-established crypto-random dependency to produce the bytes — justified per the project's
dependency rule), and read back on later launches. The Keychain entry is written
**device-only, not synced to iCloud and excluded from backups** (accessibility along the
lines of `WHEN_UNLOCKED_THIS_DEVICE_ONLY`) — the strongest at-rest guarantee, with the
accepted trade-off that the encryption key (and therefore any saved secret) does **not**
survive device migration/restore; the user re-supplies the secret in that case. The store
exposes a small async API — `get` / `set` / `delete` — behind a memoized readiness step that
bootstraps the encryption key and opens the encrypted instance. The readiness step
**serializes concurrent first-launch callers**: two simultaneous calls share a single
encryption-key generation, never racing to generate two encryption keys. If bootstrap fails
**transiently**, a later call must be able to succeed — a single hiccup must not disable the
store for the rest of the app's lifetime. (Whether that is achieved by clearing the memoized
readiness or otherwise is an implementation detail.)

**The async API has a clear error contract.** A returned `null` from `get` means one thing
only: the requested **storage key** has no stored value. Any transient or unexpected failure
**rejects (throws)** rather than resolving `null`, so a caller can always tell "nothing
stored" from "something broke". `delete` on an absent storage key is a silent no-op. `set`
resolves `void` on success and **rejects** on a readiness or write failure. (Once the store
is ready, ordinary concurrent `set`/`delete`/`get` on the underlying encrypted MMKV are
last-writer-wins — only bootstrap is serialized.)

**It fails closed, never crashes — and never reverts to plaintext.** The store distinguishes
a genuinely **absent** Keychain entry from a **transient/unreadable** one. Only when the
entry is truly absent does it regenerate the encryption key and start clean (a caller in
that state loses any previously-saved secret and must re-supply it). On a transient read
error (e.g. device locked, an OS hiccup) it surfaces the failure and does **not** discard
the stored data — a momentary error must not permanently destroy a recoverable secret. When
the encryption key **is** regenerated, any existing encrypted MMKV instance written under
the old (now-undecryptable) encryption key is wiped/recreated so `get` returns cleanly
rather than throwing on stale ciphertext. If **writing** a freshly generated encryption key
into the Keychain fails during bootstrap, the store surfaces that failure — it never
proceeds keyless and never falls back to storing the secret in plaintext, since that would
defeat the entire purpose of this change. If the encrypted MMKV instance itself cannot be
created on device, the store likewise surfaces that failure rather than silently degrading
to a non-persistent in-memory store — a secret that appears to save but is gone on next
launch is worse than a visible error. The in-memory path exists as a **Jest-only** branch,
not a device fallback.

**The Jest-vs-device split is preserved.** Under Jest the store is in-memory and
`react-native-keychain` is mocked, mirroring the existing MMKV-vs-Jest pattern the codebase
already uses. Every acceptance criterion is exercised through that Jest backing, never
against on-device native crypto.

## Surfaces the change is seen through

- New module `src/services/secret-storage/` with a barrel `index.ts` and its own
  `CLAUDE.md`; its public `SecretStore` API (`get` / `set` / `delete`, async — `get` yields
  `null` on an absent storage key, `delete` no-ops on an absent storage key; a readiness step
  that serializes concurrent first callers).
- New dependency `react-native-keychain` in `package.json` (native install / rebuild is a
  device concern, not part of what the test suite verifies).

## Edge cases that matter

- **Keychain entry genuinely absent** — regenerate the encryption key, wipe any stale
  encrypted instance, start clean, do not crash.
- **Keychain entry transiently unreadable** — surface the failure, do **not** wipe the
  stored data; a momentary error must not destroy a recoverable secret.
- **Keychain write fails at bootstrap** — surface it; never proceed keyless, never store the
  secret in plaintext.
- **Encrypted store cannot be opened on device** — surfaced as a failure; no silent
  in-memory degradation, no plaintext fallback.
- **Two concurrent first-launch callers** — share a single encryption-key generation, never
  generate two keys.

## Risk

High. This is a security change delivering **secret-at-rest storage**. A green test suite
alone does not prove the secret is actually encrypted on disk, that the encryption key came
from a secure random source, or that the fail-closed path never silently reverts to
plaintext — so those properties must be pinned explicitly, not left implied by "tests pass".
The specific properties above (crypto-secure key, device-only non-backed-up Keychain entry,
transient-vs-absent fail-closed, never-keyless, never-plaintext) are load-bearing and were
chosen deliberately at the ticket stage.

## Non-goals

- **Wiring the Monobank token onto this store is out of scope — it is OPES-49.** The
  one-time plaintext→encrypted migration, the `MonobankTokenService` rewrite, and the async
  propagation through `useMonobankStore` and the screens all live there. This ticket delivers
  the module and its own unit tests; it does not change any existing consumer.
- **The Claude API key strand is out of scope.** Keeping the Claude API key out of the
  shipped binary is a separate, spec-only concern; the decided direction (2026-07-31, see
  OPES-47) is **BYO-key only** — the Firebase proxy backend earlier drafts named as primary
  is **not** pursued. No code, guard, or spec for that path is produced here.
- Encrypting non-secret MMKV data — theme preference and Monobank account selection stay
  plaintext.
- No WatermelonDB schema bump or DB migration.
- Auth / user accounts, encrypting the WatermelonDB database, and full-disk encryption.

## Deliberately left open

- **The exact Keychain entry naming and MMKV instance id** beyond "a 32-byte key" and "an
  instance dedicated to secrets" are implementation details for the spec to fix.
- **The exact rule that classifies a native `react-native-keychain` result as "absent"
  versus "transient"** (which return value or thrown error falls in which bucket, and where
  an unrecognised/ambiguous result lands) is left to the spec — the ticket fixes the
  *principle* (only a genuine absence may regenerate/wipe; ambiguity must preserve the stored
  data), not the native-API mechanics.
- **Which specific crypto-random API/module supplies the 32 bytes** is left to the spec,
  within the "one small crypto dependency, only if no native source exists" bound above.
- **Whether `SecretStore` implements or reuses the existing `StorageGateway` interface**
  (`src/services/storage/StorageGateway.ts` — async `getItem` / `setItem` / `removeItem`) or
  defines its own `get` / `set` / `delete` shape is left to the spec. The ticket fixes only
  that the API is async and carries the error contract above.
