<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-58",
  "lang": "en",
  "risk": "high",
  "surfaces": [
    "MonobankTokenService.save",
    "MonobankTokenService.get",
    "MonobankTokenService.clear",
    "src/services/secret-storage/cryptoKey.ts",
    "index.js",
    "src/services/monobank/CLAUDE.md",
    "src/services/secret-storage/CLAUDE.md",
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
      "surface": "MonobankTokenService.get",
      "given": "a SecretStore double holding 'tok-1' under monobank_personal_token and 'Ada Lovelace' under monobank_client_name",
      "when": "get() is awaited",
      "then": "the token property of the resolved object equals the stored token",
      "expect": "tok-1" },

    { "id": "AC-004",
      "surface": "MonobankTokenService.get",
      "given": "a SecretStore double holding 'tok-1' under monobank_personal_token and 'Ada Lovelace' under monobank_client_name",
      "when": "get() is awaited",
      "then": "the clientName property of the resolved object equals the stored client name",
      "expect": "Ada Lovelace" },

    { "id": "AC-005",
      "surface": "MonobankTokenService.get",
      "given": "a SecretStore double holding no entry under monobank_personal_token while the plaintext MMKV instance still holds 'legacy-tok' under that same key",
      "when": "get() is awaited",
      "then": "the resolved value is null",
      "expect": "null" },

    { "id": "AC-006",
      "surface": "MonobankTokenService.clear",
      "given": "a SecretStore double that records every delete call",
      "when": "clear() is awaited",
      "then": "the recorded delete key list contains monobank_personal_token",
      "expect": "monobank_personal_token" },

    { "id": "AC-007",
      "surface": "MonobankTokenService.clear",
      "given": "a SecretStore double that records every delete call",
      "when": "clear() is awaited",
      "then": "the recorded delete key list contains monobank_client_name",
      "expect": "monobank_client_name" },

    { "id": "AC-008",
      "surface": "MonobankTokenService.save",
      "given": "a SecretStore double whose set returns a promise rejecting with new Error('boom-on-set')",
      "when": "save('tok-1', 'Ada Lovelace') is awaited",
      "then": "throws an exception carrying the message boom-on-set",
      "expect": "boom-on-set" },

    { "id": "AC-009",
      "surface": "MonobankTokenService.get",
      "given": "a SecretStore double whose get returns a promise rejecting with new Error('boom-on-get')",
      "when": "get() is awaited",
      "then": "throws an exception carrying the message boom-on-get",
      "expect": "boom-on-get" },

    { "id": "AC-010",
      "surface": "src/services/secret-storage/cryptoKey.ts",
      "given": "the cryptoKey module imported while globalThis.crypto is present, and globalThis.crypto then replaced by a stub that fills the array and counts its getRandomValues calls",
      "when": "generateKey() is called",
      "then": "the getRandomValues call count of the stub installed after module load equals 1",
      "expect": 1 },

    { "id": "AC-011",
      "surface": "src/services/secret-storage/cryptoKey.ts",
      "given": "the cryptoKey module imported while globalThis.crypto is present, and globalThis.crypto then removed",
      "when": "generateKey() is called",
      "then": "throws an exception carrying the text random source",
      "expect": "random source" },

    { "id": "AC-012",
      "surface": "index.js",
      "given": "the repository root index.js after this change",
      "when": "the module specifier of its first import statement is read",
      "then": "that specifier equals react-native-get-random-values",
      "expect": "react-native-get-random-values" },

    { "id": "AC-013",
      "surface": "npx tsc --noEmit",
      "given": "the repository with every call site of get / save / clear updated for the promise-returning forms",
      "when": "npx tsc --noEmit is run from the project root",
      "then": "the process exit code equals 0",
      "expect": 0 },

    { "id": "AC-014",
      "surface": "src/services/monobank/CLAUDE.md",
      "given": "the Monobank layer documentation after this change",
      "when": "the file content is read",
      "then": "the Token storage section contains the text secret-storage",
      "expect": "secret-storage" },

    { "id": "AC-015",
      "surface": "src/services/secret-storage/CLAUDE.md",
      "given": "the secret-storage layer documentation after this change",
      "when": "the file content is read",
      "then": "the file contains the text react-native-get-random-values",
      "expect": "react-native-get-random-values" }
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
    { "id": "AS-010", "text": "MonobankAccountSelectionService keeps its existing plaintext MMKV storage; only the token and client name move to the secret store." },
    { "id": "AS-011", "text": "The loadSavedToken and disconnect signatures in src/features/monobank/types.ts still become their promise-returning forms (Promise<string | null> and Promise<void>); this is now enforced only through the type-check criterion rather than by a criterion of its own." },
    { "id": "AS-012", "text": "react-native-get-random-values is added to dependencies (not devDependencies), and the iOS pods are reinstalled as part of this change." },
    { "id": "AS-013", "text": "The polyfill is imported in index.js as a bare side-effect import that is the file's first import statement, above the react-native and App imports." },
    { "id": "AS-014", "text": "cryptoKey.ts resolves globalThis.crypto inside generateKey on every call and keeps no module-level binding of it; generateKey's exported signature and its GeneratedKey result are unchanged, so the SecretStore constructor seam is untouched." },
    { "id": "AS-015", "text": "The fail-closed contract from OPES-42 is preserved: with no crypto source at call time generateKey throws rather than drawing from Math.random, and the thrown message text is unchanged." },
    { "id": "AS-016", "text": "No Jest setup file installs, removes, or mocks the polyfill; under Jest the source stays Node's own globalThis.crypto except where an individual test replaces it and restores it afterwards." },
    { "id": "AS-017", "text": "Key rotation, the Keychain absent-vs-transient classification, the memoized readiness promise and the rest of the SecretStore module stay exactly as OPES-42 delivered them; only the random-source resolution changes." }
  ],
  "verification_gaps": [
    { "id": "VG-001", "text": "Under Jest, Node itself supplies globalThis.crypto. A green suite therefore does not establish that a real device can generate a key at all — that the polyfill supplies getRandomValues on iOS and Android is established only by manual device verification: connect Monobank on a simulator and observe a SecItemAdd in the system log plus an MMKV instance opes.secret-storage opened with Encrypted: true." },
    { "id": "VG-002", "text": "Nothing here exercises index.js at runtime. That the polyfill import actually executes before any secret-storage code on device is not established by this suite; AC-012 reads index.js as text." },
    { "id": "VG-003", "text": "No criterion asserts that the react-native-get-random-values package is installed, that its native module links, or that the iOS pods were reinstalled." },
    { "id": "VG-004", "text": "Nothing here runs against device storage. Under Jest the secret store is in-memory and react-native-keychain is mocked, so a green suite would not prove that anything on real device storage is encrypted at rest." },
    { "id": "VG-005", "text": "Nothing here establishes what an already-connected user sees after upgrading; the plaintext copy left on disk and its migration are OPES-63 and are not exercised by this suite." },
    { "id": "VG-006", "text": "Connect/disconnect ordering and how a store surfaces a rejected save or clear are not established by this cycle — that is OPES-64." },
    { "id": "VG-007", "text": "clear()'s rejection propagation is not exercised; only save() and get() are pinned against a rejecting store." },
    { "id": "VG-008", "text": "AC-013 establishes only that the updated call sites type-check. The runtime behaviour of HomeScreen, ConnectMonobankScreen and syncFromMonobank after the await propagation is covered only by whatever the pre-existing suite already asserted, and the types.ts signatures of AS-011 are covered only transitively by that type-check." }
  ],
  "non_goals": [
    "The one-time migration of an existing plaintext token (OPES-63)",
    "Connect/disconnect ordering guarantees and failure presentation at the call sites (OPES-64)",
    "Moving MonobankAccountSelectionService onto the secret store",
    "Key rotation and every other part of the SecretStore module beyond the random-source resolution in cryptoKey.ts — the key bootstrap is now in scope, the rest of the module is not",
    "Deciding whether MonobankTokenService stays a class, a singleton, or becomes a factory"
  ] }
-->

# OPES-58 — Move the Monobank token onto the encrypted secret store

This is the consumer half of OPES-42: `MonobankTokenService` stops writing the personal token
and client name to plaintext MMKV and persists them through the encrypted `SecretStore`, which
makes its `get` / `save` / `clear` promise-returning. Device verification then showed that this
rewire puts a latent OPES-42 defect on the critical path — `cryptoKey.ts` captures
`globalThis.crypto` at module load, that global does not exist under React Native 0.84 / Hermes,
and no polyfill is installed, so the fail-closed key bootstrap throws on the first `save()` and
Monobank cannot be connected at all. Fixing that is now part of this ticket: add
`react-native-get-random-values`, import it as the first statement of `index.js`, and resolve the
random source lazily at call time.

The honest limit of the crypto criteria is stated plainly, because it is easy to fake. Under Jest,
Node supplies `globalThis.crypto`, so a test that merely calls `generateKey()` and sees it succeed
would have passed **before** the fix and proves nothing. AC-010 and AC-011 therefore pin the
structural fact instead — a source installed *after* the module is loaded is the one actually used,
and a source removed *after* the module is loaded makes the call throw — both of which are red
against today's module-load capture. That a real device can generate a key at all is VG-001 and
must be confirmed by hand on a simulator.

Fitting the grown scope under the 15-criterion limit cost four criteria from the approved round,
none of them silently: the "save returns a Promise" criterion (redundant once every other criterion
awaits it), the plain "no token stored resolves null" case (absorbed into the strictly stronger
AC-005, which also forbids the plaintext fallback), and the two `types.ts` signature criteria,
which are now carried by AS-011 and the type-check in AC-013 — a store whose async implementation
did not match its interface would fail `tsc`. If the maintainer wants any of those pinned in their
own right, the limit needs raising rather than something else being dropped.
