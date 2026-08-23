<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-58",
  "lang": "en",
  "risk": "high",
  "surfaces": [
    "MonobankTokenService.save",
    "MonobankTokenService.get",
    "MonobankTokenService.clear",
    "src/features/monobank/types.ts",
    "src/services/monobank/CLAUDE.md",
    "npx tsc --noEmit"
  ],
  "acceptance": [
    { "id": "AC-001",
      "surface": "MonobankTokenService.save",
      "given": "a MonobankTokenService backed by a SecretStore double that records every set call",
      "when": "save('tok-1', 'Ada Lovelace') is awaited",
      "then": "the value recorded under the storage key monobank_personal_token equals the token argument",
      "expect": "tok-1" },

    { "id": "AC-002",
      "surface": "MonobankTokenService.save",
      "given": "a MonobankTokenService backed by a SecretStore double that records every set call",
      "when": "save('tok-1', 'Ada Lovelace') is awaited",
      "then": "the value recorded under the storage key monobank_client_name equals the client name argument",
      "expect": "Ada Lovelace" },

    { "id": "AC-003",
      "surface": "MonobankTokenService.save",
      "given": "a MonobankTokenService backed by a SecretStore double whose set resolves",
      "when": "save('tok-1', 'Ada Lovelace') is called without await",
      "then": "returns an instance of Promise",
      "expect": true },

    { "id": "AC-004",
      "surface": "MonobankTokenService.get",
      "given": "a SecretStore double holding 'tok-1' under monobank_personal_token and 'Ada Lovelace' under monobank_client_name",
      "when": "get() is awaited",
      "then": "the token property of the resolved object equals the stored token",
      "expect": "tok-1" },

    { "id": "AC-005",
      "surface": "MonobankTokenService.get",
      "given": "a SecretStore double holding 'tok-1' under monobank_personal_token and 'Ada Lovelace' under monobank_client_name",
      "when": "get() is awaited",
      "then": "the clientName property of the resolved object equals the stored client name",
      "expect": "Ada Lovelace" },

    { "id": "AC-006",
      "surface": "MonobankTokenService.get",
      "given": "a SecretStore double holding no entry under either storage key",
      "when": "get() is awaited",
      "then": "the resolved value is null",
      "expect": "null" },

    { "id": "AC-007",
      "surface": "MonobankTokenService.get",
      "given": "a SecretStore double holding no entry under monobank_personal_token while the plaintext MMKV instance still holds 'legacy-tok' under that same key",
      "when": "get() is awaited",
      "then": "the resolved value is null",
      "expect": "null" },

    { "id": "AC-008",
      "surface": "MonobankTokenService.clear",
      "given": "a SecretStore double that records every delete call",
      "when": "clear() is awaited",
      "then": "the recorded delete key list contains monobank_personal_token",
      "expect": "monobank_personal_token" },

    { "id": "AC-009",
      "surface": "MonobankTokenService.clear",
      "given": "a SecretStore double that records every delete call",
      "when": "clear() is awaited",
      "then": "the recorded delete key list contains monobank_client_name",
      "expect": "monobank_client_name" },

    { "id": "AC-010",
      "surface": "MonobankTokenService.save",
      "given": "a SecretStore double whose set returns a promise rejecting with new Error('boom-on-set')",
      "when": "save('tok-1', 'Ada Lovelace') is awaited",
      "then": "throws an exception carrying the message boom-on-set",
      "expect": "boom-on-set" },

    { "id": "AC-011",
      "surface": "MonobankTokenService.get",
      "given": "a SecretStore double whose get returns a promise rejecting with new Error('boom-on-get')",
      "when": "get() is awaited",
      "then": "throws an exception carrying the message boom-on-get",
      "expect": "boom-on-get" },

    { "id": "AC-012",
      "surface": "src/features/monobank/types.ts",
      "given": "the MonobankStoreActions interface after this change",
      "when": "the declared signature of loadSavedToken is read",
      "then": "the declared return type matches Promise<string | null>",
      "expect": "Promise<string | null>" },

    { "id": "AC-013",
      "surface": "src/features/monobank/types.ts",
      "given": "the MonobankStoreActions interface after this change",
      "when": "the declared signature of disconnect is read",
      "then": "the declared return type matches Promise<void>",
      "expect": "Promise<void>" },

    { "id": "AC-014",
      "surface": "npx tsc --noEmit",
      "given": "the repository with every call site of get / save / clear updated for the promise-returning forms",
      "when": "npx tsc --noEmit is run from the project root",
      "then": "the process exit code equals 0",
      "expect": 0 },

    { "id": "AC-015",
      "surface": "src/services/monobank/CLAUDE.md",
      "given": "the Monobank layer documentation after this change",
      "when": "the file content is read",
      "then": "the Token storage section contains the text secret-storage",
      "expect": "secret-storage" }
  ],
  "assumptions": [
    { "id": "AS-001", "text": "MonobankTokenService keeps a constructor-injected storage seam, now typed as the SecretStore API from OPES-42, so tests can supply a double in place of the module-level instance." },
    { "id": "AS-002", "text": "The two storage key strings are unchanged: monobank_personal_token and monobank_client_name." },
    { "id": "AS-003", "text": "get() decides presence from the token key alone; when the token key is absent it resolves null even if a client name is stored." },
    { "id": "AS-004", "text": "When the token key is present but the client name key is absent, get() resolves clientName as the empty string, preserving today's behaviour." },
    { "id": "AS-005", "text": "get() never reads the plaintext MMKV instance as a fallback, under any condition." },
    { "id": "AS-006", "text": "Rejections from SecretStore propagate unchanged — the same rejection value reaches the caller, not a re-wrapped one." },
    { "id": "AS-007", "text": "The relative order of the two set calls inside save() and the two delete calls inside clear() is unspecified; neither is partial-write safe, and pinning that is not part of this ticket." },
    { "id": "AS-008", "text": "The exported monobankTokenService singleton keeps its name and module path, so call sites change only by adding await." },
    { "id": "AS-009", "text": "Call-site edits add await and adjust signatures only; no status transition, ordering, or failure-presentation behaviour in useMonobankStore or useTransactionsStore changes in this ticket." },
    { "id": "AS-010", "text": "MonobankAccountSelectionService keeps its existing plaintext MMKV storage; only the token and client name move to the secret store." }
  ],
  "verification_gaps": [
    { "id": "VG-001", "text": "Nothing here runs against a device. Under Jest the secret store is in-memory and react-native-keychain is mocked, so a green suite would not prove that anything on real device storage is encrypted at rest." },
    { "id": "VG-002", "text": "Nothing here establishes what an already-connected user sees after upgrading; the plaintext copy left on disk and its migration are OPES-63 and are not exercised by this suite." },
    { "id": "VG-003", "text": "Connect/disconnect ordering and how a store surfaces a rejected save or clear are not established by this cycle — that is OPES-64." },
    { "id": "VG-004", "text": "clear()'s rejection propagation is not exercised; only save() and get() are pinned against a rejecting store." },
    { "id": "VG-005", "text": "AC-014 establishes only that the updated call sites type-check. The runtime behaviour of HomeScreen, ConnectMonobankScreen and syncFromMonobank after the await propagation is covered only by whatever the pre-existing suite already asserted." }
  ],
  "non_goals": [
    "The one-time migration of an existing plaintext token (OPES-63)",
    "Connect/disconnect ordering guarantees and failure presentation at the call sites (OPES-64)",
    "Moving MonobankAccountSelectionService onto the secret store",
    "Changing the SecretStore module itself, its key bootstrap, or key rotation",
    "Deciding whether MonobankTokenService stays a class, a singleton, or becomes a factory"
  ] }
-->

# OPES-58 — Move the Monobank token onto the encrypted secret store

This is the consumer half of OPES-42: `MonobankTokenService` stops writing the personal token
and client name to plaintext MMKV and persists them through the encrypted `SecretStore`
instead, which makes its `get` / `save` / `clear` promise-returning. The criteria pin the
read/write/delete contract against a `SecretStore` double, pin that a rejection from the store
reaches the caller rather than being swallowed, pin that `get()` never falls back to the
plaintext copy, and pin that the awaited call sites type-check.

Two things this deliberately does not decide, and the reviewer should read them as absent
rather than as answered: the existing plaintext token stays on disk untouched, so between this
ticket and OPES-63 an already-connected user reads `null` and appears disconnected; and the
order in which connection status may change around a now-async save or clear is OPES-64's
subject. Risk is high because the change moves where a secret is written and makes a
security-visible flow async without yet pinning that ordering.
