<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-42",
  "lang": "en",
  "risk": "high",
  "surfaces": ["SecretStore.get", "SecretStore.set", "SecretStore.delete", "SecretStore bootstrap", "Keychain entry", "package.json"],
  "acceptance": [
    { "id": "AC-001",
      "surface": "SecretStore.get",
      "given": "a bootstrapped store with no value stored under storage key 'k'",
      "when": "the result of ((await store.get('k')) === null) is evaluated",
      "then": "equals",
      "expect": true },
    { "id": "AC-002",
      "surface": "SecretStore.set",
      "given": "a bootstrapped store",
      "when": "store.set('token', 'abc') resolves and then store.get('token') is awaited",
      "then": "equals",
      "expect": "abc" },
    { "id": "AC-003",
      "surface": "SecretStore.delete",
      "given": "a bootstrapped store with 'token' set to 'abc'",
      "when": "store.delete('token') resolves and then ((await store.get('token')) === null) is evaluated",
      "then": "equals",
      "expect": true },
    { "id": "AC-004",
      "surface": "SecretStore.delete",
      "given": "a bootstrapped store with no value under storage key 'missing'",
      "when": "the result of ((await store.delete('missing')) === undefined) is evaluated",
      "then": "equals",
      "expect": true },
    { "id": "AC-005",
      "surface": "SecretStore.get",
      "given": "a store whose Keychain read throws a transient rejection on this call while 'token' holds a stored value",
      "when": "the value of (awaiting store.get('token') threw a rejection) is evaluated",
      "then": "equals",
      "expect": true },
    { "id": "AC-006",
      "surface": "SecretStore bootstrap",
      "given": "a fresh store with no Keychain entry and a spy counting encryption-key generations",
      "when": "two store.get('k') calls run concurrently via Promise.all and the encryption-key generation count is read",
      "then": "equals",
      "expect": 1 },
    { "id": "AC-007",
      "surface": "SecretStore bootstrap",
      "given": "a fresh store with no Keychain entry",
      "when": "bootstrap completes and the byte length of the generated encryption key is measured",
      "then": "equals",
      "expect": 32 },
    { "id": "AC-008",
      "surface": "SecretStore bootstrap",
      "given": "a fresh store with no Keychain entry and Math.random replaced by a counting spy",
      "when": "bootstrap generates the encryption key and the Math.random call count is read",
      "then": "equals",
      "expect": 0 },
    { "id": "AC-009",
      "surface": "Keychain entry",
      "given": "a fresh store with no Keychain entry",
      "when": "bootstrap writes the key and the 'accessible' option passed to Keychain.setGenericPassword is read",
      "then": "equals",
      "expect": "AccessibleWhenUnlockedThisDeviceOnly" },
    { "id": "AC-010",
      "surface": "SecretStore bootstrap",
      "given": "a store whose Keychain read throws a transient rejection on the first bootstrap and returns an entry on the next",
      "when": "the first store.get('k') rejects, then the value of ((await store.get('k')) === null) on the recovered call is evaluated",
      "then": "equals",
      "expect": true },
    { "id": "AC-011",
      "surface": "SecretStore.set",
      "given": "a fresh store with no Keychain entry whose Keychain.setGenericPassword throws a rejection",
      "when": "the value of (awaiting store.set('token', 'abc') threw a rejection) is evaluated",
      "then": "equals",
      "expect": true },
    { "id": "AC-012",
      "surface": "SecretStore.set",
      "given": "a fresh store whose Keychain.setGenericPassword throws a rejection and a spy counting writes to a plaintext MMKV instance",
      "when": "store.set('token', 'abc') rejects and the plaintext-MMKV write count is read",
      "then": "equals",
      "expect": 0 },
    { "id": "AC-013",
      "surface": "SecretStore.get",
      "given": "a store whose Keychain read resolves false (a genuinely absent entry) with stale ciphertext left under a prior encryption key",
      "when": "bootstrap regenerates the key and wipes the stale instance, then the value of ((await store.get('token')) === null) is evaluated",
      "then": "equals",
      "expect": true },
    { "id": "AC-014",
      "surface": "SecretStore.get",
      "given": "a store with 'token' set to 'abc' whose Keychain read throws a transient rejection once and then returns the same entry",
      "when": "the transient store.get('token') rejects and then store.get('token') on the recovered call is awaited",
      "then": "equals",
      "expect": "abc" },
    { "id": "AC-015",
      "surface": "package.json",
      "given": "the repository package.json",
      "when": "the dependencies map of package.json is read",
      "then": "contains",
      "expect": "react-native-keychain" }
  ],
  "assumptions": [
    { "id": "AS-001", "text": "SecretStore defines its own async get/set/delete shape rather than reusing StorageGateway; get resolves the stored string or null, set resolves undefined, delete resolves undefined." },
    { "id": "AS-002", "text": "Absent-vs-transient classification: a Keychain.getGenericPassword result of false counts as a genuinely absent entry (regenerate key, wipe stale instance); any thrown/rejected Keychain result — including ambiguous or unrecognised ones — counts as transient and preserves stored data." },
    { "id": "AS-003", "text": "The Keychain accessibility constant is react-native-keychain ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY, whose value is the string 'AccessibleWhenUnlockedThisDeviceOnly'; the entry is device-only and not synchronizable to iCloud." },
    { "id": "AS-004", "text": "The 32 encryption-key bytes come from a cryptographically secure source (crypto.getRandomValues), never Math.random; under Jest that source is mocked, mirroring the existing MMKV-vs-Jest pattern, and all criteria run against the Jest in-memory backing." },
    { "id": "AS-005", "text": "The Keychain service/account naming and the dedicated secret MMKV instance id are fixed by the build station to stable constants; the tests do not assert their exact literal names." },
    { "id": "AS-006", "text": "Bootstrap readiness is memoized and serializes concurrent first callers into one key generation; a transient bootstrap rejection clears the memoized readiness so a later call can retry rather than being permanently disabled." },
    { "id": "AS-007", "text": "The 32-byte key is passed to the encrypted MMKV instance as its encryptionKey after encoding (e.g. base64); the 32 refers to the raw random byte count, measured before encoding." },
    { "id": "AS-008", "text": "The in-memory encrypted-store branch is a Jest-only path; on device an un-openable encrypted MMKV instance surfaces a rejection rather than degrading in-memory, but that device path is not exercised by the Jest suite." }
  ],
  "non_goals": ["Wiring the Monobank token onto this store — the plaintext-to-encrypted migration, MonobankTokenService rewrite, and async propagation through useMonobankStore and screens (OPES-49)", "Any Claude API key storage or proxy-backend strand (OPES-47, BYO-key only)", "Encrypting non-secret MMKV data such as theme preference or Monobank account selection", "WatermelonDB schema bump or DB migration", "Auth, user accounts, encrypting the WatermelonDB database, or full-disk encryption"] }
-->

# OPES-42 — Encrypted secret-storage module

This delivers the `secret-storage` primitive: a reusable module under
`src/services/secret-storage/` that keeps secrets encrypted at rest in a
dedicated MMKV instance, keyed by a 32-byte encryption key generated once from a
cryptographically secure source and held in the device Keychain/Keystore
(device-only, not backed up). It exposes an async `get` / `set` / `delete` API
behind a memoized bootstrap that serializes concurrent first-launch callers into
a single key generation.

The load-bearing properties are security ones a green suite alone cannot prove,
so they are pinned explicitly: the key is 32 bytes, comes from a crypto-secure
source (never `Math.random`), and the Keychain entry is device-only. The error
contract is falsifiable end to end — `get` yields `null` only for a genuinely
absent storage key and rejects on transient trouble; a genuinely absent Keychain
entry regenerates the key and wipes stale ciphertext, while a transient Keychain
read preserves the stored secret; a failed key write rejects and never writes
plaintext. Every criterion runs against the Jest in-memory backing with
`react-native-keychain` mocked. Moving the Monobank token onto this store is
OPES-49 and is out of scope here.
