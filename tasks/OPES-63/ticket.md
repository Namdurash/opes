<!-- aif:meta
{ "schema": 1, "ticket": "OPES-63", "lang": "en", "risk": "high" }
-->

# OPES-63 — One-time migration of the plaintext Monobank token into the encrypted store

## Why

OPES-58 rewires `MonobankTokenService` onto the encrypted `secret-storage` module, so new
writes land encrypted. It does nothing about the copy already on disk: a user who connected
Monobank before that change still has `monobank_personal_token` and `monobank_client_name`
sitting in the **default plaintext MMKV instance**, and after OPES-58 they read as disconnected
while the plaintext secret stays there.

This ticket is the migration that actually closes the at-rest exposure — it moves the existing
values across and deletes the plaintext originals.

It depends on OPES-42 (the `SecretStore` module) and OPES-58 (the rewired service).

## What should be true after

**A one-time migration moves any existing plaintext copy across.** On the first run after the
change, the migration copies `monobank_personal_token` and `monobank_client_name` from the
default plaintext MMKV instance into the encrypted store.

It is evaluated **per storage key independently**:

- For each storage key the plaintext copy is deleted **only after the encrypted write is read
  back and is byte-for-byte equal** to what was written. A non-null-but-corrupted read is not
  enough to delete the original, and a crash between the copy and the delete can never leave
  that storage key in neither store.
- It is **idempotent** — "already done" is detected per storage key by the plaintext key being
  absent.
- It is a **no-op on a fresh install**: with no plaintext Monobank keys present, it performs no
  writes at all.
- If a value exists in **both** stores the **encrypted value wins** — it is never overwritten
  from plaintext — and the plaintext copy is still deleted.
- One storage key failing does not hold back the other: if the token migrates cleanly and the
  client name does not, the token's plaintext copy is deleted and the client name's is kept.

**Nothing else in plaintext MMKV is touched.** Theme preference, Monobank account selection, and
every other plaintext value are left exactly as they are. The migration reads and writes only
the two Monobank storage keys.

**A failed migration is not fatal.** If a storage key cannot be migrated, the failure does not
prevent the app from starting or token access from resolving; the next launch retries that key.

## Surfaces the change is seen through

- The migration itself. **Where it lives is deliberately left open** — the secret store's
  readiness step or `MonobankTokenService` — provided the observable behaviour above holds.
- The default plaintext MMKV instance and the encrypted `SecretStore`, as the two stores it
  moves values between.
- Docs: `src/services/monobank/CLAUDE.md` updated to describe the one-time migration.

## Edge cases that matter

- **Fresh install** — no plaintext Monobank keys: migration performs zero writes.
- **Existing user with a plaintext token** — both the token and the client name move on first
  launch and the plaintext copies are deleted.
- **Migration re-run** — idempotent, detected per storage key by the plaintext key being absent.
- **Value in both stores** — encrypted wins, plaintext copy deleted, encrypted never overwritten.
- **Crash mid-migration** — because the plaintext copy is deleted only after a byte-for-byte
  read-back, the value survives in at least one store; the next launch completes it.
- **Corrupted read-back** — a non-null but non-equal read does not trigger the plaintext delete.
- **One key succeeds, one fails** — handled independently, per the rule above.
- **Other plaintext MMKV values** (theme, account selection) — left exactly as they are.

## Risk

High. This performs a **one-time destructive delete of the plaintext original**. A green suite
cannot prove the plaintext file on disk no longer holds the token, and the Jest backing is an
in-memory secret store rather than the real encrypted one — so the read-back-before-delete and
encrypted-wins properties must be pinned explicitly as observations, and the real upgrade path
remains a manual check.
