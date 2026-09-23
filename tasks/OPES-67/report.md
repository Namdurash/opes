# OPES-67 — built

- branch `aif/OPES-67` · 8 files changed, 504 insertions(+), 11 deletions(-) · 16 min · 3 dispatch(es) · stage `done`
- built against `ticket.md` sha256 `f7e2bd42760b90b5c21b719f31061ef236e18e01686d30c7b5ebf9d855214778`

## Stations

| station | attempts | turns | output tokens | cost |
|---|---|---|---|---|
| plan | 1 | 20 | 19606 | tokens only |
| tests | 1 | 31 | 40138 | tokens only |
| implement | 1 | 31 | 12055 | tokens only |

_Costs come from `.aif/prices.json`; a model missing there prints "tokens only". Tokens are always recorded. Each station's own account of what it did is kept in `stations/`._

## Stations that ended with a runner error

The runner reported a failure for these dispatches. Their artifacts were still
judged by the gate — the gate is the verdict — so a station can appear here and
have been admitted anyway. Read it next to the diff.

- `tests` attempt 1 — no result field
- `implement` attempt 1 — no result field

## Decisions the plan made

- **D-001** Add getAllKeys(): string[] to EncryptedStoreInstance and implement it in both backends: [...data.keys()] in memory, mmkv.getAllKeys() on device.
  - because: the snapshot of surviving secrets cannot be taken without enumerating the instance, and the interface has no such member today
  - rather than: Do not have SecretStore track written keys in a field of its own to avoid the enumeration.
- **D-002** Add a public async SecretStore.purgeDeletedRecords(): snapshot every key via getAllKeys/getString, call encrypted.wipe(), reopen, then re-set the snapshot through the fresh instance.
  - because: the decided mechanism is the OPES-63 rebuild behind an explicit method, and only SecretStore holds both the backend and the key it was opened with
  - rather than: Do not put the rebuild on EncryptedStoreBackend and do not make it synchronous — every other SecretStore method is async.
- **D-003** Record the base64 key that open() resolved in a private SecretStore field and reopen with that field inside the purge; never read the Keychain between wipe and restore.
  - because: a Keychain rejection after the wipe would leave the survivors with no copy anywhere
  - rather than: Do not null readiness and re-run bootstrap to get the rebuilt instance.
- **D-004** Assign this.readiness = Promise.resolve(<the instance just reopened>) immediately after the wipe and before writing the survivors back.
  - because: readiness memoizes the instance the wipe invalidated, so every later get/set would run through a dead handle
- **D-005** Return from purgeDeletedRecords resolving undefined as soon as a snapshot getString yields undefined, before wipe is reached.
  - because: the decided answer is fail closed — leave the residue rather than lose a secret the rebuild could not read back
  - rather than: Do not skip the unreadable key and rebuild from the rest.
- **D-006** In createMMKVEncryptedStore.open, resolve the instance per operation via createMMKV({ id, encryptionKey, encryptionType }) instead of capturing the handle open() created.
  - because: deleteMMKV silently invalidates every handle taken before it — writes through a stale one are dropped, not rejected (the OPES-63 rule in migrateMonobankSecrets.ts)
  - rather than: Do not keep the captured handle and reopen only inside the purge.
- **D-007** Add purgeDeletedRecords(): Promise<void> as a required member of SecretStorePort and implement it as an empty no-op on the Jest InMemorySecretStore.
  - because: clear() reaches the store only through that port, and a Map has no append log so the rebuild is already true of it
  - rather than: Do not declare it optional and call it with ?. — a missing implementation would leave the residue silently.
- **D-008** Have MonobankTokenService.clear() await this.storage.purgeDeletedRecords() exactly once, after both deletes, with no try/catch.
  - because: the decided answer puts one explicit purge after both deletes, and the service carries no try/catch anywhere by rule
  - rather than: Do not purge between the two deletes and do not swallow its rejection.
- **D-009** Leave SecretStore.delete() as a bare store.delete(key): it calls neither purgeDeletedRecords nor wipe, on an absent key or a present one.
  - because: a rebuild inside delete would run twice per disconnect, which the decided answer rules out
  - rather than: Do not purge from inside delete when the enumeration comes back empty.
- **D-010** Declare getAllKeys(): string[] on the hand-written MMKVInstance interface in encryptedStore.ts, copying the declaration in migrateMonobankSecrets.ts verbatim.
  - because: the package is reached through a lazy require cast tsc cannot reconcile, and that file is the repository's own device-verified caller of getAllKeys
  - rather than: Do not invent a keys()/allKeys() name and do not widen the cast to any.
- **D-011** Let a throw from wipe, from the reopen or from a restore set propagate out of purgeDeletedRecords uncaught.
  - because: AC-004 requires clear() to reject when the purge throws, and disconnect already awaits clear() with no try/catch
- **D-012** Document purgeDeletedRecords in the API block of src/services/secret-storage/CLAUDE.md and in the Token storage section of src/services/monobank/CLAUDE.md.
  - because: the Definition of Done requires the layer doc to change when the contract it states changes, and both docs state the method list

## Decided with the analyst

- Яким механізмом прибирати залишок: перебудовою сховища чи ротацією ключа Keychain? → Перебудова сховища у формі OPES-63: знімок вцілілих секретів, deleteMMKV(id), повторне відкриття, відновлення. Прецедент уже в коді (migrateMonobankSecrets.purgeDeletedRecords), і лише так виконується заявлена вимога картки — байтів немає у файлі, а не «вони нечитні». Ротація ключа лишає байти на диску й на півдорозі здатна втратити живий токен _(architecture)_
- Коли запускається ерейз і як це виглядає в API: усередині delete чи окремим методом? → Окремий явний метод SecretStore.purgeDeletedRecords(), який MonobankTokenService.clear() кличе один раз після обох delete. Усередині delete перебудова спрацювала б двічі за одне відключення; варіант «лише коли сховище спорожніло» лишає залишок токена назавжди, якщо поруч лежить сторонній секрет _(architecture)_
- Що робити, якщо під час знімка якийсь вцілілий секрет не читається? → Fail closed — не чіпати нічого й лишити залишок. Точно як OPES-63: leave the residue rather than lose it. Невиконаний ерейз не гірший за той, що не запускався, а втрачений живий секрет — гірший

## Not verified by this run

- [ ] **ticket VG-001** Під Jest зашифрований бекенд — це in-memory Map без append-лога, тож залишку в ньому не існує за побудовою. Жоден критерій тут не доводить, що байти зникли з opes.secret-storage; вони перевіряють лише, що перебудову викликано і що вцілілі секрети її пережили
- [ ] **ticket VG-002** Реконструкція метаданих — перерахунок actualSize і CRC із файлу даних — не перевіряється нічим у цьому циклі. Це можливо лише на пристрої з побайтовим порівнянням
- [ ] **ticket VG-003** Поведінка MMKV, коли файл видалено під живим хендлом, під Jest не відтворюється: Map лишається робочою. Правило «резолвити інстанс на кожен виклик» перевіряється лише поведінково, а не проти справжнього нативного модуля
- [ ] **plan react-native-mmkv (createMMKV, deleteMMKV, instance.getAllKeys/remove/set/getString)** external dependency with no check and no criterion — nothing in this run exercised it
- [ ] **tests migrateMonobankSecrets on a fresh install AC-001 — writes nothing to the encrypted store when no plaintext copy exists::migrateMonobankSecrets on a fresh install AC-001 — writes nothing to the encrypted store when no plaintext copy exists** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets with a legacy plaintext copy AC-002 — copies the plaintext token into the encrypted store::migrateMonobankSecrets with a legacy plaintext copy AC-002 — copies the plaintext token into the encrypted store** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets with a legacy plaintext copy AC-003 — copies the plaintext client name into the encrypted store::migrateMonobankSecrets with a legacy plaintext copy AC-003 — copies the plaintext client name into the encrypted store** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets with a legacy plaintext copy AC-004 — deletes the plaintext token once it is safely across::migrateMonobankSecrets with a legacy plaintext copy AC-004 — deletes the plaintext token once it is safely across** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets with a legacy plaintext copy AC-005 — deletes the plaintext client name once it is safely across::migrateMonobankSecrets with a legacy plaintext copy AC-005 — deletes the plaintext client name once it is safely across** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets — the read-back gate before the destructive step AC-006 — deletes the plaintext token immediately after reading it back::migrateMonobankSecrets — the read-back gate before the destructive step AC-006 — deletes the plaintext token immediately after reading it back** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets — the read-back gate before the destructive step AC-007 — deletes nothing when the read-back differs from what was written::migrateMonobankSecrets — the read-back gate before the destructive step AC-007 — deletes nothing when the read-back differs from what was written** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets when the encrypted store already holds a value AC-008 — leaves the encrypted token untouched rather than overwriting it::migrateMonobankSecrets when the encrypted store already holds a value AC-008 — leaves the encrypted token untouched rather than overwriting it** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets when the encrypted store already holds a value AC-009 — still deletes the stale plaintext token::migrateMonobankSecrets when the encrypted store already holds a value AC-009 — still deletes the stale plaintext token** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets when one key fails AC-010 — migrates the token even though the client name write rejects::migrateMonobankSecrets when one key fails AC-010 — migrates the token even though the client name write rejects** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets when one key fails AC-011 — leaves the plaintext copy of the failed key where it is::migrateMonobankSecrets when one key fails AC-011 — leaves the plaintext copy of the failed key where it is** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets when one key fails AC-012 — resolves rather than rejecting when the encrypted store is unusable::migrateMonobankSecrets when one key fails AC-012 — resolves rather than rejecting when the encrypted store is unusable** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets run more than once AC-013 — retries a key whose earlier run failed::migrateMonobankSecrets run more than once AC-013 — retries a key whose earlier run failed** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets run more than once AC-014 — writes each key exactly once across two runs::migrateMonobankSecrets run more than once AC-014 — writes each key exactly once across two runs** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets and its plaintext neighbours AC-015 — leaves the selected-account ids in plaintext untouched::migrateMonobankSecrets and its plaintext neighbours AC-015 — leaves the selected-account ids in plaintext untouched** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets and the bytes left behind by a delete AC-017 — rebuilds the plaintext store once it has deleted something::migrateMonobankSecrets and the bytes left behind by a delete AC-017 — rebuilds the plaintext store once it has deleted something** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets and the bytes left behind by a delete AC-017 — rebuilds only after the last delete, never between the two keys::migrateMonobankSecrets and the bytes left behind by a delete AC-017 — rebuilds only after the last delete, never between the two keys** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets and the bytes left behind by a delete AC-018 — rebuilds nothing on a fresh install, where it deleted nothing::migrateMonobankSecrets and the bytes left behind by a delete AC-018 — rebuilds nothing on a fresh install, where it deleted nothing** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets and the bytes left behind by a delete AC-018 — rebuilds nothing when the read-back failed and nothing was deleted::migrateMonobankSecrets and the bytes left behind by a delete AC-018 — rebuilds nothing when the read-back failed and nothing was deleted** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests migrateMonobankSecrets and the bytes left behind by a delete AC-019 — a rebuild that throws does not fail the migration::migrateMonobankSecrets and the bytes left behind by a delete AC-019 — a rebuild that throws does not fail the migration** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests src/services/monobank/CLAUDE.md AC-016 — documents the legacy plaintext migration::src/services/monobank/CLAUDE.md AC-016 — documents the legacy plaintext migration** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests SecretStore resolves null when nothing is stored under the key::SecretStore resolves null when nothing is stored under the key** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests SecretStore round-trips a value through set then get::SecretStore round-trips a value through set then get** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests SecretStore removes a stored value on delete::SecretStore removes a stored value on delete** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests SecretStore is a silent no-op deleting an absent key::SecretStore is a silent no-op deleting an absent key** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests SecretStore rejects get when the Keychain read fails transiently::SecretStore rejects get when the Keychain read fails transiently** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests SecretStore generates the encryption key exactly once for concurrent first callers::SecretStore generates the encryption key exactly once for concurrent first callers** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests SecretStore retries bootstrap and resolves after a transient failure recovers::SecretStore retries bootstrap and resolves after a transient failure recovers** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests SecretStore rejects set when the encryption-key write fails::SecretStore rejects set when the encryption-key write fails** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests SecretStore never writes plaintext when the encryption-key write fails::SecretStore never writes plaintext when the encryption-key write fails** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests SecretStore regenerates the key and wipes stale ciphertext on a genuinely absent entry::SecretStore regenerates the key and wipes stale ciphertext on a genuinely absent entry** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests SecretStore preserves the stored value across a transient Keychain read failure::SecretStore preserves the stored value across a transient Keychain read failure** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests cryptoKey.generateKey produces a 32-byte raw key before base64 encoding::cryptoKey.generateKey produces a 32-byte raw key before base64 encoding** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests cryptoKey.generateKey never draws key material from Math.random::cryptoKey.generateKey never draws key material from Math.random** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests keychainKeyStore.writeKey writes the key device-only, not synchronizable to iCloud::keychainKeyStore.writeKey writes the key device-only, not synchronizable to iCloud** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests package.json declares react-native-keychain as a dependency::package.json declares react-native-keychain as a dependency** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests MonobankTokenService.save AC-001 — writes the token argument under monobank_personal_token::MonobankTokenService.save AC-001 — writes the token argument under monobank_personal_token** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests MonobankTokenService.save AC-002 — writes the client name argument under monobank_client_name::MonobankTokenService.save AC-002 — writes the client name argument under monobank_client_name** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests MonobankTokenService.save AC-008 — lets a rejected write reach the caller unchanged::MonobankTokenService.save AC-008 — lets a rejected write reach the caller unchanged** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests MonobankTokenService.get AC-003 — resolves the token held in the secret store::MonobankTokenService.get AC-003 — resolves the token held in the secret store** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests MonobankTokenService.get AC-004 — resolves the client name held in the secret store::MonobankTokenService.get AC-004 — resolves the client name held in the secret store** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests MonobankTokenService.get AC-005 — resolves null rather than falling back to the plaintext copy::MonobankTokenService.get AC-005 — resolves null rather than falling back to the plaintext copy** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests MonobankTokenService.get AC-009 — lets a rejected read reach the caller unchanged::MonobankTokenService.get AC-009 — lets a rejected read reach the caller unchanged** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests MonobankTokenService.clear AC-006 — deletes monobank_personal_token::MonobankTokenService.clear AC-006 — deletes monobank_personal_token** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests MonobankTokenService.clear AC-007 — deletes monobank_client_name::MonobankTokenService.clear AC-007 — deletes monobank_client_name** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests the repository after the await propagation AC-013 — type-checks with every awaited call site in place::the repository after the await propagation AC-013 — type-checks with every awaited call site in place** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests src/services/monobank/CLAUDE.md AC-014 — documents the token as living in secret-storage::src/services/monobank/CLAUDE.md AC-014 — documents the token as living in secret-storage** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition

## Gates

- ready: pass — ready: 9 criteria · 3 decided · 3 gap(s)
- plan: pass — plan: 5 implementation file(s), 4 test file(s), 9 criteria covered
- verify-red: pass — verify-red: 9 new test(s) red for the right reason, all criteria covered
- green: pass — green: suite passes, and the covering tests depend on the implementation, 1 check(s) green
- scope: pass — scope: change confined to the plan (139 lines)

---
_Written by `aif work`. Review the diff on the branch; merge when it is what you meant, or send the ticket back through the analyst with what was wrong._
