# secret-storage — encrypted secrets at rest

`SecretStore` keeps secrets encrypted at rest in a dedicated MMKV instance, keyed
by a 32-byte crypto-secure key held in the device Keychain. Import it through the
barrel (`index.ts`) — never the individual backend files.

```
new SecretStore({ keychain, encrypted, generateKey })   // constructor-DI
  .get(key)    : Promise<string | null>   // stored string, or null if absent
  .set(key, v) : Promise<void>
  .delete(key) : Promise<void>            // silent no-op on an absent key
```

The three backends are constructor dependencies with real device defaults, so
tests inject fakes (mirrors `MonobankAccountSelectionService`).

## The two load-bearing rules

1. **The encrypted store is never opened without its Keychain key.** Bootstrap is a
   single memoized readiness Promise that every `get`/`set`/`delete` awaits. It reads
   the Keychain key; opens the encrypted MMKV instance only with a real key; and, on
   any read/write failure, rejects and opens nothing — never a plaintext or keyless
   store. A rejected readiness is nulled so the next call retries.

2. **Absent vs. transient is classified, not guessed.** `getGenericPassword`
   resolving `false` is a *genuinely absent* key: mint a new key, write it, and wipe
   the stale encrypted instance before opening (stale ciphertext under the old key is
   discarded, not read back). Any *thrown/rejected* Keychain read is *transient*: the
   stored data is preserved and the caller sees a rejection.

## Jest vs. device split

- **Keychain** (`keychainKeyStore.ts`) reaches `react-native-keychain` only behind a
  `typeof jest` guard via a lazy `require` — never a top-level import, so the
  uninstalled/unmocked native module never loads under Jest (tests inject a fake
  keychain). If the `require` throws on device, it propagates and bootstrap fails
  closed — there is no in-memory keychain fallback.
- **Encrypted store** (`encryptedStore.ts`) uses `createMMKV({ id, encryptionKey,
  encryptionType: 'AES-256' })` / `deleteMMKV(id)` on device and an in-memory `Map`
  under Jest. A device open failure rejects — it never degrades in-memory.
- **Key generation** (`cryptoKey.ts`) draws 32 bytes from `crypto.getRandomValues`
  (never `Math.random`) and base64-encodes them with a hand-rolled encoder (no
  Buffer/btoa, no new dependency). The 32 is the raw byte count, measured before
  encoding.

The Keychain service/account names and the secret MMKV instance id are fixed
module-level constants.
