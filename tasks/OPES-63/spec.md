<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-63",
  "lang": "en",
  "risk": "high",
  "surfaces": [
    "migrateMonobankSecrets",
    "the encrypted SecretStore",
    "the default plaintext MMKV instance",
    "src/services/monobank/CLAUDE.md"
  ],
  "acceptance": [
    { "id": "AC-001",
      "surface": "the encrypted SecretStore",
      "given": "a plaintext-store double holding no Monobank storage keys and a secret-store double recording every call",
      "when": "the migration is awaited",
      "then": "the recorded secret-store set call count equals 0",
      "expect": 0 },

    { "id": "AC-002",
      "surface": "the encrypted SecretStore",
      "given": "a plaintext-store double holding 'legacy-tok' under monobank_personal_token and 'Ada Lovelace' under monobank_client_name, and an empty secret-store double",
      "when": "the migration is awaited",
      "then": "the secret-store value under monobank_personal_token equals the plaintext token",
      "expect": "legacy-tok" },

    { "id": "AC-003",
      "surface": "the encrypted SecretStore",
      "given": "a plaintext-store double holding 'legacy-tok' under monobank_personal_token and 'Ada Lovelace' under monobank_client_name, and an empty secret-store double",
      "when": "the migration is awaited",
      "then": "the secret-store value under monobank_client_name equals the plaintext client name",
      "expect": "Ada Lovelace" },

    { "id": "AC-004",
      "surface": "the default plaintext MMKV instance",
      "given": "a plaintext-store double holding 'legacy-tok' under monobank_personal_token and 'Ada Lovelace' under monobank_client_name, and an empty secret-store double",
      "when": "the migration is awaited",
      "then": "the recorded plaintext delete key list contains monobank_personal_token",
      "expect": "monobank_personal_token" },

    { "id": "AC-005",
      "surface": "the default plaintext MMKV instance",
      "given": "a plaintext-store double holding 'legacy-tok' under monobank_personal_token and 'Ada Lovelace' under monobank_client_name, and an empty secret-store double",
      "when": "the migration is awaited",
      "then": "the recorded plaintext delete key list contains monobank_client_name",
      "expect": "monobank_client_name" },

    { "id": "AC-006",
      "surface": "the default plaintext MMKV instance",
      "given": "a plaintext-store double holding 'legacy-tok' under monobank_personal_token and an empty secret-store double, both appending to one shared call log whose entries read <store>:<op>:<key>",
      "when": "the migration is awaited",
      "then": "the log entry immediately preceding plaintext:delete:monobank_personal_token equals secret:get:monobank_personal_token",
      "expect": "secret:get:monobank_personal_token" },

    { "id": "AC-007",
      "surface": "the default plaintext MMKV instance",
      "given": "a plaintext-store double holding 'legacy-tok' under monobank_personal_token and a secret-store double whose get for that key resolves null before the set and the one-character-different string 'legacy-t0k' after it",
      "when": "the migration is awaited",
      "then": "the recorded plaintext delete call count equals 0",
      "expect": 0 },

    { "id": "AC-008",
      "surface": "the encrypted SecretStore",
      "given": "a plaintext-store double holding 'legacy-tok' under monobank_personal_token and a secret-store double already holding 'encrypted-tok' under that same key",
      "when": "the migration is awaited",
      "then": "the secret-store value under monobank_personal_token equals the string it held before the migration",
      "expect": "encrypted-tok" },

    { "id": "AC-009",
      "surface": "the default plaintext MMKV instance",
      "given": "a plaintext-store double holding 'legacy-tok' under monobank_personal_token and a secret-store double already holding 'encrypted-tok' under that same key",
      "when": "the migration is awaited",
      "then": "the recorded plaintext delete key list contains monobank_personal_token",
      "expect": "monobank_personal_token" },

    { "id": "AC-010",
      "surface": "the default plaintext MMKV instance",
      "given": "a plaintext-store double holding 'legacy-tok' under monobank_personal_token and 'Ada Lovelace' under monobank_client_name, and a secret-store double whose set rejects with new Error('boom') for monobank_client_name only",
      "when": "the migration is awaited",
      "then": "the recorded plaintext delete key list contains monobank_personal_token",
      "expect": "monobank_personal_token" },

    { "id": "AC-011",
      "surface": "the default plaintext MMKV instance",
      "given": "a plaintext-store double holding 'legacy-tok' under monobank_personal_token and 'Ada Lovelace' under monobank_client_name, and a secret-store double whose set rejects with new Error('boom') for monobank_client_name only",
      "when": "the migration is awaited",
      "then": "the plaintext value under monobank_client_name equals the string it held before the migration",
      "expect": "Ada Lovelace" },

    { "id": "AC-012",
      "surface": "migrateMonobankSecrets",
      "given": "a plaintext-store double holding both Monobank storage keys and a secret-store double whose get and set both reject with new Error('boom')",
      "when": "the migration is awaited",
      "then": "returns undefined",
      "expect": "undefined" },

    { "id": "AC-013",
      "surface": "the encrypted SecretStore",
      "given": "a first migration run whose secret-store set rejected, leaving 'legacy-tok' under monobank_personal_token in the plaintext-store double, and the same secret-store double switched to accepting writes",
      "when": "the migration is awaited a second time",
      "then": "the secret-store value under monobank_personal_token equals the plaintext token",
      "expect": "legacy-tok" },

    { "id": "AC-014",
      "surface": "the encrypted SecretStore",
      "given": "a plaintext-store double holding 'legacy-tok' under monobank_personal_token and 'Ada Lovelace' under monobank_client_name, and a secret-store double that accepts every write and records every call",
      "when": "the migration is awaited twice in sequence",
      "then": "the recorded secret-store set call count equals 2",
      "expect": 2 },

    { "id": "AC-015",
      "surface": "the default plaintext MMKV instance",
      "given": "a plaintext-store double holding 'legacy-tok' under monobank_personal_token and the string [\"acc-1\"] under monobank_selected_account_ids, and an empty secret-store double",
      "when": "the migration is awaited",
      "then": "the plaintext value under monobank_selected_account_ids equals the string it held before the migration",
      "expect": "[\"acc-1\"]" },

    { "id": "AC-016",
      "surface": "src/services/monobank/CLAUDE.md",
      "given": "the Monobank layer documentation after this change",
      "when": "the file content is read",
      "then": "the file contains the text one-time migration",
      "expect": "one-time migration" }
  ],
  "assumptions": [
    { "id": "AS-001", "text": "The migration is exposed as one standalone async entry point that takes both stores as injected ports, so a test drives it directly; the ticket leaves its home open, and this spec assumes it lives in the Monobank module (src/services/monobank/) rather than inside the secret store's readiness step. If the plan station moves it, every criterion here applies unchanged to whatever entry point it exposes." },
    { "id": "AS-002", "text": "The migration touches exactly two storage keys by literal name — monobank_personal_token and monobank_client_name. It never enumerates the plaintext instance's keys and never matches by prefix." },
    { "id": "AS-003", "text": "Per storage key, 'already migrated' is decided solely by the plaintext key being absent. No migration-done flag, version number, or marker key is persisted anywhere." },
    { "id": "AS-004", "text": "A plaintext value is 'present' when the plaintext read returns anything other than undefined; the empty string counts as present and is migrated like any other value." },
    { "id": "AS-005", "text": "Read-back equality is strict string equality between the value written and the value the secret store's get resolves immediately afterwards. A read-back that resolves null blocks the plaintext delete exactly as a non-equal one does." },
    { "id": "AS-006", "text": "The encrypted-wins branch is decided by a secret-store get issued before any write for that key: a non-null existing value means no set is issued at all, and the plaintext copy is then deleted without a read-back, because the existing encrypted value is itself the proof the value survives in the encrypted store." },
    { "id": "AS-007", "text": "The two keys are evaluated independently in every branch — an encrypted token already present does not stop the client name from migrating, and vice versa." },
    { "id": "AS-008", "text": "Per key, every failure (a rejected get, a rejected set, a non-equal read-back, a throwing plaintext read) is caught inside the migration and never rethrown; the migration always resolves undefined and never rejects." },
    { "id": "AS-009", "text": "A per-key failure is reported through a console warning that names the storage key and contains neither the token value nor the client name value." },
    { "id": "AS-010", "text": "The migration is invoked once per app launch from the startup path and is not awaited by anything that blocks first render; a failure therefore cannot prevent the app from starting." },
    { "id": "AS-011", "text": "Nothing sequences MonobankTokenService.get() behind the migration. A read that races an in-flight migration may still resolve null; the value is picked up on the next read after the migration completes." },
    { "id": "AS-012", "text": "MonobankTokenService.save, get and clear keep the semantics OPES-58 gave them; get still decides presence from the token key alone and still never falls back to plaintext." },
    { "id": "AS-013", "text": "The token migrates before the client name. The order is fixed only so the shared-call-log criterion is deterministic; nothing else depends on it." },
    { "id": "AS-014", "text": "The plaintext port is the default MMKV instance reached through the same lazy-require plus typeof-jest pattern MonobankAccountSelectionService already uses, with an in-memory double under Jest." },
    { "id": "AS-015", "text": "MonobankAccountSelectionService keeps its value in the plaintext instance; monobank_selected_account_ids is not migrated by this ticket and is not a secret." },
    { "id": "AS-016", "text": "A plaintext read that throws is treated as that key failing, not as the key being absent, so no delete is issued for it and the next launch retries it." }
  ],
  "verification_gaps": [
    { "id": "VG-001", "text": "Both stores are in-memory doubles under Jest. A green suite would not prove the plaintext MMKV file on disk no longer holds the token, nor that the migrated copy is encrypted at rest — confirmed only by hand on a device." },
    { "id": "VG-002", "text": "The real upgrade path is not exercised: no test starts from a build made before OPES-58 with Monobank connected, upgrades in place, and observes the account still connected. That is a manual device check." },
    { "id": "VG-003", "text": "Crash-mid-migration is not exercised by killing a process. AC-006 and AC-007 pin the ordering and the read-back gate that make the property hold; durability of an MMKV write across a real process kill is not established here." },
    { "id": "VG-004", "text": "The startup wiring of AS-010 is not exercised by this suite. That the migration is invoked exactly once per launch, before the first token read that matters, and without blocking render, is a manual observation." },
    { "id": "VG-005", "text": "The race in AS-011 between an in-flight migration and a concurrent MonobankTokenService.get() is not exercised; what a user sees on the very first screen of the upgrade launch is not established by this cycle." },
    { "id": "VG-006", "text": "Nothing here establishes that the plaintext values never reach a log line, a crash report, or a redux/dev tool while in flight; AS-009 is asserted by no criterion." },
    { "id": "VG-007", "text": "AC-015 pins one neighbouring plaintext key. Nothing establishes that no other plaintext key anywhere in the app is deleted or overwritten — that rests on AS-002 being upheld by review." }
  ],
  "non_goals": [
    "Moving MonobankAccountSelectionService or any other plaintext value onto the encrypted store",
    "A persisted migration-version marker or a general migration framework for future keys",
    "Surfacing a failed migration in the UI",
    "Connect/disconnect ordering and failure presentation at the call sites (OPES-64)",
    "Any change to SecretStore itself — key bootstrap, rotation, and the absent-vs-transient classification stay as OPES-42 and OPES-58 left them",
    "Re-authenticating or validating the migrated token against the Monobank API"
  ] }
-->

# OPES-63 — One-time migration of the plaintext Monobank token into the encrypted store

OPES-58 moved new writes into the encrypted store but left the existing copy where it was, so a
user who connected before that change both reads as disconnected and still has the token sitting in
plaintext MMKV. This cycle moves the two Monobank storage keys across on first run and deletes the
plaintext originals — per key, independently, and only after the encrypted write has been read back
equal.

The destructive half is what the criteria are shaped around: AC-006 pins that the plaintext delete
is immediately preceded by the encrypted read-back, and AC-007 pins that a non-equal read-back
deletes nothing, because those two together are the only reason a crash mid-migration cannot lose
the token. Everything else — fresh install writes nothing, encrypted wins, one key failing leaves
the other's plaintext copy in place — is a per-key branch stated once.

Two things this cannot establish and a human must check on a device: that the plaintext file on
disk truly stops holding the token (VG-001), and that a real pre-OPES-58 install upgrades into a
still-connected account (VG-002). Under Jest both stores are Maps, so the read-back gate is
verified as a control-flow property, not as evidence about real storage.
