<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-42",
  "spec_sha256": "15cd44a01d42c9cd5a2a54f8d452d32e3e5e5560cfdc5e9a949a51dfc8144e6e",
  "risk": "high",
  "files": {
    "create": [
      "src/services/secret-storage/SecretStore.ts",
      "src/services/secret-storage/keychainKeyStore.ts",
      "src/services/secret-storage/encryptedStore.ts",
      "src/services/secret-storage/cryptoKey.ts",
      "src/services/secret-storage/index.ts",
      "src/services/secret-storage/CLAUDE.md"
    ],
    "change": ["package.json"],
    "tests": ["src/services/secret-storage/SecretStore.test.ts"] },
  "decisions": [
    { "id": "D-001",
      "statement": "Define SecretStore's own async API — get(key): Promise<string|null>, set(key,value): Promise<void>, delete(key): Promise<void> — in SecretStore.ts.",
      "because": "AS-001 chose a dedicated shape over StorageGateway.",
      "rejected": "Do not implement or reuse StorageGateway's getItem/setItem/removeItem." },
    { "id": "D-002",
      "statement": "Memoize bootstrap as one readiness Promise held on the instance that every get/set/delete awaits; on rejection null it out so the next call retries.",
      "because": "AS-006/AC-006 serialize concurrent first callers into a single key generation; AC-010 requires retry after a transient bootstrap failure.",
      "rejected": "Do not re-run bootstrap per call and do not leave a rejected readiness cached." },
    { "id": "D-003",
      "statement": "Generate the key as 32 bytes from globalThis.crypto.getRandomValues into a Uint8Array in cryptoKey.ts, base64-encode it for Keychain/MMKV, and expose the raw 32-byte length before encoding.",
      "because": "AS-004/AS-007, AC-007 (length 32) and AC-008 (Math.random count 0).",
      "rejected": "Never use Math.random; do not add a crypto-random dependency." },
    { "id": "D-004",
      "statement": "In keychainKeyStore.ts, classify getGenericPassword resolving false as genuinely absent (readKey resolves null) and any thrown/rejected result as transient (readKey rejects).",
      "because": "AS-002; drives AC-005/AC-010/AC-013/AC-014.",
      "rejected": "Do not treat an ambiguous or unrecognised result as absent — only false regenerates/wipes." },
    { "id": "D-005",
      "statement": "Write the key via setGenericPassword with accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY (string 'AccessibleWhenUnlockedThisDeviceOnly') passed at the keychainKeyStore.ts call site.",
      "because": "AS-003, AC-009; device-only, not synchronizable to iCloud." },
    { "id": "D-006",
      "statement": "When writeKey rejects during bootstrap, reject the pending get/set and never open or write any plaintext store.",
      "because": "AC-011 (set rejects) and AC-012 (zero plaintext writes) — fail closed, never keyless." },
    { "id": "D-007",
      "statement": "On a genuinely-absent key, generate+write a new key then wipe the stale encrypted instance (encrypted.wipe → deleteMMKV(id) on device / clear the Map under Jest) before opening it.",
      "because": "AC-013 — stale ciphertext under the old key must yield get()===null, not a throw." },
    { "id": "D-008",
      "statement": "Open the encrypted store in encryptedStore.ts via createMMKV({ id, encryptionKey, encryptionType: 'AES-256' }) on device, with an in-memory Map under a typeof jest branch.",
      "because": "AS-005/AS-008; a device open failure must reject (bootstrap propagates), never degrade in-memory.",
      "rejected": "Do not fall back to an in-memory or plaintext store on device when the encrypted instance cannot open." },
    { "id": "D-009",
      "statement": "Fix the Keychain service/account names and the secret MMKV instance id to stable module-level constants in their owning files.",
      "because": "AS-005 — stable but not asserted by tests." },
    { "id": "D-010",
      "statement": "Wire SecretStore's three backends (keychain API, encrypted backend, generateKey) as constructor dependencies with real defaults, so tests inject fakes as MonobankAccountSelectionService does.",
      "because": "AC-005/006/008/009/011/012/013/014 require injecting transient/absent/throwing backends and counting spies." },
    { "id": "D-011",
      "statement": "Add \"react-native-keychain\": \"^10.0.0\" to dependencies in package.json, matching the ^x.y.z style of every other dependency.",
      "because": "AC-015; ^10.0.0 is the current stable major; native install/rebuild is a device concern outside the test suite." },
    { "id": "D-012",
      "statement": "Access react-native-keychain in keychainKeyStore.ts only behind a typeof jest guard via a lazy require(...) cast, never a top-level import.",
      "because": "react-native-keychain is uninstalled with no jest.setup.js mock; D-010 loads real default constructor args on module import, so a static top-level import would crash SecretStore.test.ts at import time. Constructor-DI means tests inject a fake keychain and never hit the require, so no jest.setup.js mock is added.",
      "rejected": "Do not add a static top-level import of react-native-keychain and do not add a jest.setup.js mock for it." },
    { "id": "D-013",
      "statement": "Encode the raw 32-byte key to base64 with a small hand-rolled encoder inside cryptoKey.ts (standard alphabet, plain char/bitwise ops running under Node/Jest), not Buffer, btoa, or a new dependency.",
      "because": "src/ has no Buffer polyfill, btoa/atob, or base64 helper; the project's no-new-dependency rule (the ticket's one-small-crypto-dep allowance covered the RNG source, not base64); AS-007/AC-007 keep the raw key at 32 bytes measured before this encoding, and the base64 form is what is handed to Keychain/MMKV.",
      "rejected": "Do not rely on Buffer/btoa/atob and do not add a base64 dependency." },
    { "id": "D-014",
      "statement": "If require('react-native-keychain') itself throws (native module missing/unlinked), let it propagate uncaught so bootstrap rejects; add no try/catch fallback to any substitute keychain.",
      "because": "Fail-closed per D-006/D-008 and AC-011/AC-012 (never keyless, never plaintext); a silent in-memory keychain would be a security regression. This is a load failure, distinct from D-004's getGenericPassword read failure.",
      "rejected": "Do not copy the react-native-mmkv try/catch idiom that console.warns and swaps in an in-memory substitute when the require fails." } ],
  "ac_coverage": {
    "AC-001": ["src/services/secret-storage/SecretStore.ts", "src/services/secret-storage/encryptedStore.ts"],
    "AC-002": ["src/services/secret-storage/SecretStore.ts", "src/services/secret-storage/encryptedStore.ts"],
    "AC-003": ["src/services/secret-storage/SecretStore.ts", "src/services/secret-storage/encryptedStore.ts"],
    "AC-004": ["src/services/secret-storage/SecretStore.ts", "src/services/secret-storage/encryptedStore.ts"],
    "AC-005": ["src/services/secret-storage/SecretStore.ts", "src/services/secret-storage/keychainKeyStore.ts"],
    "AC-006": ["src/services/secret-storage/SecretStore.ts", "src/services/secret-storage/cryptoKey.ts"],
    "AC-007": ["src/services/secret-storage/cryptoKey.ts"],
    "AC-008": ["src/services/secret-storage/cryptoKey.ts"],
    "AC-009": ["src/services/secret-storage/keychainKeyStore.ts"],
    "AC-010": ["src/services/secret-storage/SecretStore.ts", "src/services/secret-storage/keychainKeyStore.ts"],
    "AC-011": ["src/services/secret-storage/SecretStore.ts", "src/services/secret-storage/keychainKeyStore.ts"],
    "AC-012": ["src/services/secret-storage/SecretStore.ts", "src/services/secret-storage/encryptedStore.ts"],
    "AC-013": ["src/services/secret-storage/SecretStore.ts", "src/services/secret-storage/keychainKeyStore.ts", "src/services/secret-storage/encryptedStore.ts"],
    "AC-014": ["src/services/secret-storage/SecretStore.ts", "src/services/secret-storage/keychainKeyStore.ts"],
    "AC-015": ["package.json"] } }
-->

# OPES-42 — plan

A new module `src/services/secret-storage/` delivers the `SecretStore` primitive:
secrets encrypted at rest in a dedicated MMKV instance, keyed by a 32-byte
crypto-secure key held in the device Keychain, behind a memoized async bootstrap.
It has no consumers here — moving the Monobank token onto it is OPES-49 and is not
touched. Only `package.json` changes outside the new folder.

`SecretStore` (in `SecretStore.ts`) owns three injected backends with real
defaults, following the constructor-DI pattern of `MonobankAccountSelectionService`
so the test can substitute fakes:

- **keychain** — `keychainKeyStore.ts` wraps a `react-native-keychain`-shaped API
  (`getGenericPassword`/`setGenericPassword`) into a port with `readKey(): Promise<string|null>`
  and `writeKey(keyBase64): Promise<void>`. `readKey` resolves the stored base64 key,
  resolves `null` only when `getGenericPassword` returns `false` (genuine absence),
  and **rejects** on any thrown/rejected result (transient). `writeKey` calls
  `setGenericPassword(..., { accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY })`.
  The real `react-native-keychain` is reached only behind a `typeof jest` guard via a
  lazy `require('react-native-keychain')` cast (D-012) — mirroring only the
  typeof-jest-guarded lazy-require *shape*
  `MonobankTokenService.ts`/`MonobankAccountSelectionService.ts` use for
  `react-native-mmkv`, **not** their silent try/catch fallback: if the require itself
  throws (native module missing/unlinked) the error propagates uncaught and bootstrap
  rejects, with no fallback to a substitute keychain (D-014, fail-closed). Never a
  top-level import, so the uninstalled, unmocked module never loads under Jest (tests
  inject a fake keychain instead; no `jest.setup.js` mock).
- **encrypted** — `encryptedStore.ts` exposes `open(keyBase64)` (getString/set/delete)
  and `wipe()`. Device: `createMMKV({ id, encryptionKey, encryptionType: 'AES-256' })`
  and `deleteMMKV(id)`; a `typeof jest` branch backs both with an in-memory `Map`.
- **generateKey** — `cryptoKey.ts` returns a 32-byte `Uint8Array` from
  `globalThis.crypto.getRandomValues` (never `Math.random`); a small hand-rolled base64
  encoder in the same file (D-013 — no Buffer/btoa, no new dep) turns those raw 32 bytes
  into the base64 string handed to Keychain/MMKV, with the length measured before encoding.

**Bootstrap** (one memoized readiness Promise, D-002): `readKey()`; if it resolves a
key, `open` it; if it resolves `null`, `generateKey` → `writeKey` → `wipe` → `open`
with the new key; if `readKey` or `writeKey` rejects, propagate the rejection and
clear the memoized readiness so a later call retries — never opening a plaintext or
keyless store. Two concurrent first callers await the same readiness, so the key is
generated exactly once.

**API** (D-001): `get` awaits readiness then returns `getString(key) ?? null`;
`set` awaits readiness then writes; `delete` awaits readiness then removes and is a
silent no-op on an absent key. Transient bootstrap trouble surfaces as a rejection,
so a caller always distinguishes "nothing stored" (`null`) from "something broke".

`index.ts` is the barrel (export `SecretStore`, its types, and a default singleton).
`CLAUDE.md` documents the module and its Jest-vs-device split.
