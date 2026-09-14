<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-63",
  "spec_sha256": "e8e268d25eaf82aa78f0dd38a47bbd11efe8fa7686fc96cf61b9f8d8d96864ca",
  "risk": "high",
  "files": {
    "create": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "change": [
      "src/services/monobank/MonobankTokenService.ts",
      "src/services/monobank/index.ts",
      "src/services/monobank/CLAUDE.md",
      "index.js"
    ],
    "tests": ["src/services/monobank/migrateMonobankSecrets.test.ts"] },
  "decisions": [
    { "id": "D-001",
      "statement": "Put the migration in a new file src/services/monobank/migrateMonobankSecrets.ts exporting one async arrow, migrateMonobankSecrets.",
      "because": "AS-001 places it in the Monobank module, and a standalone entry point is drivable from a test.",
      "rejected": "Do not put it inside SecretStore's readiness step or inside MonobankTokenService." },

    { "id": "D-002",
      "statement": "Give it one optional object parameter typed MonobankSecretMigrationPorts with fields plaintext and secret, defaulting to createDefaultPorts().",
      "because": "Named ports cannot be passed in the wrong order by a test.",
      "rejected": "Do not take two positional store arguments." },

    { "id": "D-003",
      "statement": "Type the secret port as SecretStorePort imported from './MonobankTokenService'.",
      "rejected": "Do not declare a second get/set/delete interface in the new file." },

    { "id": "D-004",
      "statement": "Add the export keyword to the existing createDefaultSecretStore in MonobankTokenService.ts and change nothing else in that file.",
      "because": "The lazy-require plus typeof-jest secret-store factory already exists there and must not be duplicated." },

    { "id": "D-005",
      "statement": "Declare PlaintextStorePort in the new file with exactly getString(key: string): string | undefined and delete(key: string): void.",
      "rejected": "Do not give the plaintext port a set method — the migration never writes plaintext." },

    { "id": "D-006",
      "statement": "Build the default plaintext port in the new file behind typeof jest !== 'undefined' (in-memory Map) with a lazy require('react-native-mmkv') on the device branch, calling createMMKV() with no config.",
      "because": "createMMKV(configuration?) with no argument is the default plaintext instance; a top-level import loads a native module under Jest." },

    { "id": "D-007",
      "statement": "Map the plaintext port's delete onto the MMKV instance's remove(key).",
      "because": "The react-native-mmkv instance has remove, not delete; see the comment in src/services/secret-storage/encryptedStore.ts." },

    { "id": "D-008",
      "statement": "Declare the two literal keys as an as-const tuple ['monobank_personal_token', 'monobank_client_name'] and await one per-key helper for each, token first.",
      "rejected": "Do not enumerate the plaintext instance's keys, match by prefix, or run the two keys through Promise.all." },

    { "id": "D-009",
      "statement": "Per key, read plaintext.getString(key); return immediately when it is undefined; treat the empty string as present.",
      "because": "AS-003/AS-004 — an absent plaintext key is the only 'already migrated' signal." },

    { "id": "D-010",
      "statement": "Then await secret.get(key); when it is non-null, call plaintext.delete(key) and issue no set and no read-back.",
      "because": "AS-006 — the existing encrypted value is itself the proof the value survives." },

    { "id": "D-011",
      "statement": "Otherwise await secret.set(key, value), then await secret.get(key) again, and call plaintext.delete(key) only when that read-back === value.",
      "rejected": "Do not accept a merely non-null read-back, and do not delete before the read-back resolves." },

    { "id": "D-012",
      "statement": "Wrap each key's whole sequence in its own try/catch that swallows the failure; declare the return type Promise<void> and never rethrow.",
      "because": "AS-008 — the migration always resolves undefined so a failure cannot stop the app starting." },

    { "id": "D-013",
      "statement": "Report every per-key failure with a single console.warn naming only the storage key and the retry-next-launch fact.",
      "rejected": "Do not interpolate the plaintext value, the read-back value or the caught error into the message." },

    { "id": "D-014",
      "statement": "Persist no migration marker, flag, version or done-key anywhere.",
      "because": "AS-003 — absence of the plaintext key is the whole idempotency mechanism." },

    { "id": "D-015",
      "statement": "Re-export migrateMonobankSecrets (and the type MonobankSecretMigrationPorts) from src/services/monobank/index.ts.",
      "because": "Every layer is imported through its barrel." },

    { "id": "D-016",
      "statement": "Call it once from index.js, after AppRegistry.registerComponent, as migrateMonobankSecrets().catch(() => {}); import it from './src/services/monobank' below the react-native-get-random-values import.",
      "because": "AS-010 — once per launch, after the crypto polyfill, awaited by nothing that blocks first render.",
      "rejected": "Do not await it, do not call it from App.tsx or a useEffect, and do not use the void operator." },

    { "id": "D-017",
      "statement": "Add a '## Legacy plaintext migration' section to src/services/monobank/CLAUDE.md containing the literal words 'one-time migration', and drop the 'until OPES-63 lands' clause in Token storage.",
      "because": "AC-016 matches that literal text." },

    { "id": "D-018",
      "statement": "Leave MonobankAccountSelectionService, monobank_selected_account_ids, the theme key and every other plaintext key untouched.",
      "because": "AS-002/AS-015 — only the two Monobank secret keys move." } ],
  "ac_coverage": {
    "AC-001": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-002": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-003": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-004": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-005": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-006": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-007": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-008": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-009": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-010": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-011": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-012": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-013": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-014": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-015": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "AC-016": ["src/services/monobank/CLAUDE.md"] },
  "uncovered": [],
  "surface_map": {
    "migrateMonobankSecrets": [
      "src/services/monobank/migrateMonobankSecrets.ts",
      "src/services/monobank/MonobankTokenService.ts",
      "src/services/monobank/index.ts",
      "index.js" ],
    "the encrypted SecretStore": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "the default plaintext MMKV instance": ["src/services/monobank/migrateMonobankSecrets.ts"],
    "src/services/monobank/CLAUDE.md": ["src/services/monobank/CLAUDE.md"] },
  "external": [
    { "name": "react-native-mmkv (createMMKV(), instance getString/remove)" },
    { "name": "the jest global (typeof jest guard in createDefaultPorts)" },
    { "name": "console.warn" } ] }
-->

# OPES-63 — plan

One new module, `src/services/monobank/migrateMonobankSecrets.ts`, exporting a single
async arrow that takes `{ plaintext, secret }` ports and resolves `undefined`. It walks
exactly two literal keys in a fixed order — `monobank_personal_token`, then
`monobank_client_name` — and each key gets its own try/catch, so one failing key never
touches the other.

Per key: read the plaintext value; an `undefined` read means the key is already done and
the helper returns. A pre-write `secret.get(key)` that resolves non-null means the
encrypted value wins — delete the plaintext copy, issue no `set`. Otherwise `set`, then
`get` again, and delete the plaintext copy **only** when that read-back is strictly equal
to the value written. That `get`-then-`delete` adjacency is the property AC-006 and AC-007
pin, so nothing may be inserted between them and no other branch may reach a delete.

The ports mirror the two stores' real shapes: `secret` is the existing `SecretStorePort`
from `MonobankTokenService.ts` (all three methods promise-returning); `plaintext` is a new
two-method port whose device implementation lazy-requires `react-native-mmkv`, calls
`createMMKV()` with no config for the default instance, and maps `delete` onto the
instance's `remove` — `delete` does not exist on an MMKV instance and would compile
cleanly while failing on device.

Wiring is one line in `index.js` after `AppRegistry.registerComponent`, fire-and-forget
with a terminal `.catch`. No criterion exercises that line, the default ports, or a real
MMKV file (VG-001, VG-004); those stay manual device checks.
