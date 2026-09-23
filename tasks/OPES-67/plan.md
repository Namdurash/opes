<!-- aif:meta
{
  "schema": 2,
  "ticket": "OPES-67",
  "risk": "high",
  "files": {
    "create": [],
    "change": [
      "src/services/secret-storage/SecretStore.ts",
      "src/services/secret-storage/encryptedStore.ts",
      "src/services/monobank/MonobankTokenService.ts",
      "src/services/secret-storage/CLAUDE.md",
      "src/services/monobank/CLAUDE.md"
    ],
    "tests": [
      "src/services/secret-storage/SecretStore.test.ts",
      "src/services/secret-storage/encryptedStore.test.ts",
      "src/services/monobank/MonobankTokenService.test.ts",
      "src/services/monobank/migrateMonobankSecrets.test.ts"
    ]
  },
  "decisions": [
    {
      "id": "D-001",
      "statement": "Add getAllKeys(): string[] to EncryptedStoreInstance and implement it in both backends: [...data.keys()] in memory, mmkv.getAllKeys() on device.",
      "because": "the snapshot of surviving secrets cannot be taken without enumerating the instance, and the interface has no such member today",
      "serves": [
        "AC-009",
        "AC-003",
        "D-002"
      ],
      "rejected": "Do not have SecretStore track written keys in a field of its own to avoid the enumeration."
    },
    {
      "id": "D-002",
      "statement": "Add a public async SecretStore.purgeDeletedRecords(): snapshot every key via getAllKeys/getString, call encrypted.wipe(), reopen, then re-set the snapshot through the fresh instance.",
      "because": "the decided mechanism is the OPES-63 rebuild behind an explicit method, and only SecretStore holds both the backend and the key it was opened with",
      "serves": [
        "AC-003",
        "AC-006",
        "AC-008"
      ],
      "rejected": "Do not put the rebuild on EncryptedStoreBackend and do not make it synchronous — every other SecretStore method is async."
    },
    {
      "id": "D-003",
      "statement": "Record the base64 key that open() resolved in a private SecretStore field and reopen with that field inside the purge; never read the Keychain between wipe and restore.",
      "because": "a Keychain rejection after the wipe would leave the survivors with no copy anywhere",
      "serves": [
        "AC-003",
        "AC-008",
        "D-002"
      ],
      "rejected": "Do not null readiness and re-run bootstrap to get the rebuilt instance."
    },
    {
      "id": "D-004",
      "statement": "Assign this.readiness = Promise.resolve(<the instance just reopened>) immediately after the wipe and before writing the survivors back.",
      "because": "readiness memoizes the instance the wipe invalidated, so every later get/set would run through a dead handle",
      "serves": [
        "AC-008",
        "AC-003"
      ]
    },
    {
      "id": "D-005",
      "statement": "Return from purgeDeletedRecords resolving undefined as soon as a snapshot getString yields undefined, before wipe is reached.",
      "because": "the decided answer is fail closed — leave the residue rather than lose a secret the rebuild could not read back",
      "serves": [
        "AC-006"
      ],
      "rejected": "Do not skip the unreadable key and rebuild from the rest."
    },
    {
      "id": "D-006",
      "statement": "In createMMKVEncryptedStore.open, resolve the instance per operation via createMMKV({ id, encryptionKey, encryptionType }) instead of capturing the handle open() created.",
      "because": "deleteMMKV silently invalidates every handle taken before it — writes through a stale one are dropped, not rejected (the OPES-63 rule in migrateMonobankSecrets.ts)",
      "serves": [
        "AC-008",
        "D-002"
      ],
      "rejected": "Do not keep the captured handle and reopen only inside the purge."
    },
    {
      "id": "D-007",
      "statement": "Add purgeDeletedRecords(): Promise<void> as a required member of SecretStorePort and implement it as an empty no-op on the Jest InMemorySecretStore.",
      "because": "clear() reaches the store only through that port, and a Map has no append log so the rebuild is already true of it",
      "serves": [
        "AC-001",
        "AC-002",
        "D-008"
      ],
      "rejected": "Do not declare it optional and call it with ?. — a missing implementation would leave the residue silently."
    },
    {
      "id": "D-008",
      "statement": "Have MonobankTokenService.clear() await this.storage.purgeDeletedRecords() exactly once, after both deletes, with no try/catch.",
      "because": "the decided answer puts one explicit purge after both deletes, and the service carries no try/catch anywhere by rule",
      "serves": [
        "AC-001",
        "AC-002",
        "AC-004"
      ],
      "rejected": "Do not purge between the two deletes and do not swallow its rejection."
    },
    {
      "id": "D-009",
      "statement": "Leave SecretStore.delete() as a bare store.delete(key): it calls neither purgeDeletedRecords nor wipe, on an absent key or a present one.",
      "because": "a rebuild inside delete would run twice per disconnect, which the decided answer rules out",
      "serves": [
        "AC-007"
      ],
      "rejected": "Do not purge from inside delete when the enumeration comes back empty."
    },
    {
      "id": "D-010",
      "statement": "Declare getAllKeys(): string[] on the hand-written MMKVInstance interface in encryptedStore.ts, copying the declaration in migrateMonobankSecrets.ts verbatim.",
      "because": "the package is reached through a lazy require cast tsc cannot reconcile, and that file is the repository's own device-verified caller of getAllKeys",
      "serves": [
        "D-001",
        "D-006"
      ],
      "rejected": "Do not invent a keys()/allKeys() name and do not widen the cast to any."
    },
    {
      "id": "D-011",
      "statement": "Let a throw from wipe, from the reopen or from a restore set propagate out of purgeDeletedRecords uncaught.",
      "because": "AC-004 requires clear() to reject when the purge throws, and disconnect already awaits clear() with no try/catch",
      "serves": [
        "AC-004",
        "AC-005"
      ]
    },
    {
      "id": "D-012",
      "statement": "Document purgeDeletedRecords in the API block of src/services/secret-storage/CLAUDE.md and in the Token storage section of src/services/monobank/CLAUDE.md.",
      "because": "the Definition of Done requires the layer doc to change when the contract it states changes, and both docs state the method list",
      "serves": [
        "D-002",
        "D-008"
      ]
    }
  ],
  "ac_coverage": {
    "AC-001": [
      "src/services/monobank/MonobankTokenService.ts"
    ],
    "AC-002": [
      "src/services/monobank/MonobankTokenService.ts"
    ],
    "AC-003": [
      "src/services/secret-storage/SecretStore.ts",
      "src/services/secret-storage/encryptedStore.ts",
      "src/services/monobank/MonobankTokenService.ts"
    ],
    "AC-004": [
      "src/services/monobank/MonobankTokenService.ts"
    ],
    "AC-005": [
      "src/services/monobank/MonobankTokenService.ts",
      "src/services/secret-storage/SecretStore.ts"
    ],
    "AC-006": [
      "src/services/secret-storage/SecretStore.ts"
    ],
    "AC-007": [
      "src/services/secret-storage/SecretStore.ts"
    ],
    "AC-008": [
      "src/services/secret-storage/SecretStore.ts",
      "src/services/secret-storage/encryptedStore.ts"
    ],
    "AC-009": [
      "src/services/secret-storage/encryptedStore.ts"
    ]
  },
  "uncovered": [],
  "external": [
    {
      "name": "react-native-mmkv (createMMKV, deleteMMKV, instance.getAllKeys/remove/set/getString)"
    },
    {
      "name": "typeof jest runtime global (backend selection in createEncryptedStore)",
      "ac": "AC-009"
    }
  ],
  "ticket_sha256": "f7e2bd42760b90b5c21b719f31061ef236e18e01686d30c7b5ebf9d855214778"
}
-->

# OPES-67 — plan

Перебудова зашифрованого сховища, запущена явним методом.

`EncryptedStoreInstance` отримує `getAllKeys()` — без переліку ключів знімок вцілілих
секретів неможливий. `SecretStore` отримує публічний `purgeDeletedRecords()`, який знімає
знімок усіх ключів через `getAllKeys`/`getString`, кличе `encrypted.wipe()` (це
`deleteMMKV(id)`), відкриває інстанс наново тим самим ключем і записує знімок назад у
свіжий інстанс. `MonobankTokenService.clear()` кличе цей метод рівно один раз після обох
`delete`. Порожній знімок — нормальний випадок: після `clear()` без сусідніх секретів
сховище перебудовується у порожній файл.

Дві пастки з тікета закриваються явно. `readiness` кешує інстанс, який `wipe()` щойно
зробив мертвим, — одразу після `wipe()` у `readiness` кладеться свіжовідкритий інстанс, і
саме через нього йде відновлення. А MMKV-бекенд більше не захоплює хендл у замиканні
`open()`: кожна операція резолвить інстанс через `createMMKV({ id, encryptionKey,
encryptionType })`, як це вже робить `migrateMonobankSecrets`.

Ключ, яким відкрито сховище, тримається у приватному полі `SecretStore` і береться звідти
при повторному відкритті. Між `wipe()` і відновленням не читається Keychain: відмова там
лишила б вцілілі секрети без жодної копії.

Fail closed — точно як в OPES-63: якщо будь-який `getString` під час знімка повернув
`undefined`, метод виходить до `wipe()` і резолвиться `undefined`, лишаючи залишок.
Натомість кидок із `wipe`, з повторного відкриття чи з відновлення не глушиться — він
доходить до `clear()`, який уже сьогодні ніде не має try/catch.

`SecretStore.delete()` не змінюється: жодного `purgeDeletedRecords`, жодного `wipe`.
Метод публічний і звичайний, тож його виклики рахуються через `jest.spyOn(store,
'purgeDeletedRecords')`.

`purgeDeletedRecords(): Promise<void>` додається до `SecretStorePort` як обов'язковий член,
з порожньою реалізацією у Jest-дублі `InMemorySecretStore`. Через це два наявні тестові
файли, де класи-дублі оголошені через `implements SecretStorePort`
(`MonobankTokenService.test.ts` і `migrateMonobankSecrets.test.ts`), дістають той самий
порожній метод — інших правок у `migrateMonobankSecrets.test.ts` немає. Барель
`secret-storage/index.ts` не змінюється: метод належить уже експортованому класу.
