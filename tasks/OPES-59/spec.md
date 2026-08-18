<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-59",
  "lang": "uk",
  "risk": "high",
  "surfaces": [
    "src/shared/env — isSandboxBuild()",
    "src/services/database — createSqliteAdapter()",
    "src/features/monobank — useMonobankStore.connect()",
    "src/features/transactions — useTransactionsStore.syncFromMonobank()",
    "src/services/sandbox — resetSandboxEnvironment()",
    "src/features/settings — SettingsScreen"
  ],
  "acceptance": [
    { "id": "AC-001",
      "surface": "src/shared/env — isSandboxBuild()",
      "given": "react-native-config exposes no OPES_ENV key",
      "when": "isSandboxBuild() is called",
      "then": "returns false",
      "expect": false },
    { "id": "AC-002",
      "surface": "src/services/database — createSqliteAdapter()",
      "given": "a non-sandbox build and a recording constructor standing in for the SQLite adapter",
      "when": "createSqliteAdapter(recordingConstructor) is called",
      "then": "the dbName in the options the constructor received equals opes",
      "expect": "opes" },
    { "id": "AC-003",
      "surface": "src/services/database — createSqliteAdapter()",
      "given": "a sandbox build and a recording constructor standing in for the SQLite adapter",
      "when": "createSqliteAdapter(recordingConstructor) is called",
      "then": "the dbName in the options the constructor received equals opes_sandbox",
      "expect": "opes_sandbox" },
    { "id": "AC-004",
      "surface": "src/features/monobank — useMonobankStore.connect()",
      "given": "a sandbox build with global.fetch replaced by a spy",
      "when": "connect(userId, token) runs with a non-empty token",
      "then": "the fetch spy call count equals zero",
      "expect": 0 },
    { "id": "AC-005",
      "surface": "src/features/transactions — useTransactionsStore.syncFromMonobank()",
      "given": "a sandbox build, a token already written to the token storage, global.fetch replaced by a spy",
      "when": "syncFromMonobank(userId) runs",
      "then": "the fetch spy call count equals zero",
      "expect": 0 },
    { "id": "AC-006",
      "surface": "src/features/monobank — useMonobankStore.connect()",
      "given": "a non-sandbox build with global.fetch replaced by a spy that resolves a client-info payload",
      "when": "connect(userId, token) runs with a non-empty token",
      "then": "the first URL passed to the fetch spy contains the Monobank host",
      "expect": "api.monobank.ua" },
    { "id": "AC-007",
      "surface": "src/services/sandbox — resetSandboxEnvironment()",
      "given": "a sandbox build whose database holds one transaction row",
      "when": "resetSandboxEnvironment() completes",
      "then": "the transaction row count equals zero",
      "expect": 0 },
    { "id": "AC-008",
      "surface": "src/services/sandbox — resetSandboxEnvironment()",
      "given": "a sandbox build whose database holds one card row created through the ordinary card-creation path",
      "when": "resetSandboxEnvironment() completes",
      "then": "the card row count equals zero",
      "expect": 0 },
    { "id": "AC-009",
      "surface": "src/services/sandbox — resetSandboxEnvironment()",
      "given": "a sandbox build with a Monobank token in the token storage",
      "when": "resetSandboxEnvironment() completes",
      "then": "monobankTokenService.get() returns null",
      "expect": "null" },
    { "id": "AC-010",
      "surface": "src/services/sandbox — resetSandboxEnvironment()",
      "given": "a sandbox build with an account selection in the key-value storage",
      "when": "resetSandboxEnvironment() completes",
      "then": "monobankAccountSelectionService.getSelectedAccountIds() returns null",
      "expect": "null" },
    { "id": "AC-011",
      "surface": "src/features/settings — SettingsScreen",
      "given": "a sandbox build with SettingsScreen rendered against a stubbed navigation object",
      "when": "the reset item receives a press",
      "then": "navigation.reset receives a state whose first route name equals Welcome",
      "expect": "Welcome" },
    { "id": "AC-012",
      "surface": "src/services/sandbox — resetSandboxEnvironment()",
      "given": "a sandbox build where resetSandboxEnvironment() already completed once and a user row carrying the onboarding flag was written to the database afterwards",
      "when": "resetSandboxEnvironment() runs a second time",
      "then": "the user row count equals zero",
      "expect": 0 },
    { "id": "AC-013",
      "surface": "src/services/sandbox — resetSandboxEnvironment()",
      "given": "a non-sandbox build",
      "when": "resetSandboxEnvironment() runs",
      "then": "raises SandboxOnlyError",
      "expect": "SandboxOnlyError" },
    { "id": "AC-014",
      "surface": "src/features/settings — SettingsScreen",
      "given": "a sandbox build",
      "when": "SettingsScreen renders",
      "then": "contains an element carrying the reset testID",
      "expect": "sandbox-reset-item" },
    { "id": "AC-015",
      "surface": "src/features/settings — SettingsScreen",
      "given": "a non-sandbox build",
      "when": "SettingsScreen renders",
      "then": "the element count for testID sandbox-reset-item equals zero",
      "expect": 0 }
  ],
  "assumptions": [
    { "id": "AS-001",
      "text": "The build the ticket calls \"тестова збірка\" is named sandbox everywhere in code and configuration. Gradle forbids a product flavor whose name starts with test, so a literal test naming would not survive the Android side." },
    { "id": "AS-002",
      "text": "The environment variable is OPES_ENV, read through src/shared/env. Only the exact lowercase string sandbox turns the sandbox build on; an absent key, an empty string, Sandbox, true, or any other value means the normal build." },
    { "id": "AS-003",
      "text": "isSandboxBuild() reads the react-native-config object on each call rather than capturing the value in a module-load constant." },
    { "id": "AS-004",
      "text": "The sandbox identifier is the normal one plus a .sandbox suffix: applicationId com.opes.sandbox on Android, the same suffix on the iOS bundle identifier. The home-screen label is Opes Sandbox; the icon is unchanged." },
    { "id": "AS-005",
      "text": "One configuration sets both the flag and the identifier: an Android product flavor sandbox in a new env dimension beside standard (which points at its own env file and applies the applicationId suffix), and a dedicated iOS scheme OpesSandbox whose build configuration sets both ENVFILE and PRODUCT_BUNDLE_IDENTIFIER. No build can carry the flag without the separate identifier." },
    { "id": "AS-006",
      "text": "npm scripts: ios:sandbox and android:sandbox launch the sandbox build; ios and android keep launching the normal one. The android script gains an explicit variant argument because introducing a flavor dimension renames the default variant." },
    { "id": "AS-007",
      "text": "The sandbox database file is opes_sandbox. The normal build keeps the existing name opes, unchanged character for character." },
    { "id": "AS-008",
      "text": "Sandbox-only code ships in both bundles and is gated by a runtime flag check. Nothing is excluded at bundling time." },
    { "id": "AS-009",
      "text": "The block on Monobank is enforced in getMonobankService, which raises in a sandbox build so no MonobankService instance ever exists, and is observed at the HTTP boundary as global.fetch never being invoked." },
    { "id": "AS-010",
      "text": "Every sync trigger the ticket lists reaches Monobank only through getMonobankService, so guarding that one factory covers pull-to-refresh on Home and on Transactions, the autosync after connecting, the autosync on screen open, and the silent foreground sync." },
    { "id": "AS-011",
      "text": "A sandbox database file left by an older schema version runs the ordinary WatermelonDB migration list, the same one the real database uses. The file is never deleted automatically; the reset action is the deliberate way to start over." },
    { "id": "AS-012",
      "text": "The reset item runs immediately with no confirmation step. The sandbox build holds no data the user cannot recreate, and the ticket asks only that a repeated reset leave the app in a correct state." },
    { "id": "AS-013",
      "text": "The reset is not atomic. It wipes the database, then clears the key-value entries, then navigates; a partially completed reset is recovered by running it again, and a second run leaves the same end state as a first." },
    { "id": "AS-014",
      "text": "After the reset the app lands on Welcome, the initial route and the entry point of onboarding, which is where the Connect Monobank action lives. The ticket says \"екран підключення\"; landing directly on ConnectMonobank would skip the onboarding entry the ticket wants to exercise. Navigation uses navigation.reset, so no back-stack entry survives." },
    { "id": "AS-015",
      "text": "The reset clears the Monobank token, the client name, and the account selection from key-value storage, and clears the onboarding flag together with the database, because users.checked_in is a database column. The persisted theme mode survives the reset: it is a display preference, not part of any flow under test." },
    { "id": "AS-016",
      "text": "Clearing \"збережені фільтри\" means the in-memory transactions store state returns to its defaults. The reset clears no key-value entry for filters: transaction list filters live in route params and component state, and navigation.reset discards the stack that holds them." },
    { "id": "AS-017",
      "text": "The database-wide wipe is exposed through the repository layer, the only layer permitted to write the database; resetSandboxEnvironment() composes it with the key-value clears and owns no SQL of its own." },
    { "id": "AS-018",
      "text": "MMKV is not namespaced per build in code. The two installed apps are kept apart by the operating system because their identifiers differ." },
    { "id": "AS-019",
      "text": "The SQLite adapter is built by createSqliteAdapter(Adapter), which takes the adapter constructor as its argument, builds the options object itself, and reads dbName from a single build-flag-aware name resolver. The database file name therefore appears as a literal in exactly one place, and a test supplies a recording constructor in place of the real SQLite one. database.ts keeps only the jest-versus-device branch that decides which constructor is handed in." }
  ],
  "verification_gaps": [
    { "id": "VG-001",
      "text": "This cycle produces no build and installs nothing. The separate applicationId and bundle identifier, the Android flavor, the iOS scheme, and the home-screen label are not exercised by the suite." },
    { "id": "VG-002",
      "text": "That SQLite, handed dbName opes, opens the file named opes on a device is WatermelonDB's contract and is not exercised here. AC-002 and AC-003 establish the value our code produces; nothing establishes what the adapter does with it." },
    { "id": "VG-003",
      "text": "The suite never takes the SQLite path. database.ts selects the LokiJS adapter under jest, so the one branch that requires the real SQLite adapter module and passes it to createSqliteAdapter is not executed by any test here." },
    { "id": "VG-004",
      "text": "A green suite would not prove that a device carrying both apps keeps their database files and MMKV stores apart. That separation is a property of two operating-system sandboxes, not of this code." },
    { "id": "VG-005",
      "text": "react-native-config inlines the value at build time. The suite injects OPES_ENV through the jest mock, so the .env file, dotenv.gradle, and the iOS Config codegen build phase are not exercised." },
    { "id": "VG-006",
      "text": "Persistence across app restarts is not exercised. Jest runs in one process, so \"created in one session, still there in the next\" is not established." },
    { "id": "VG-007",
      "text": "Opening a sandbox database file written by an older schema version is not exercised; the test harness does not replay the migration chain, and no historical snapshot exists in the repository." },
    { "id": "VG-008",
      "text": "The individual sync triggers are not each exercised. Only the shared choke point is: pull-to-refresh on Home, pull-to-refresh on Transactions, the post-connect autosync, the on-open autosync, and the silent foreground sync go unasserted one by one." },
    { "id": "VG-009",
      "text": "Nothing establishes that sandbox-only code is absent from the normal build's JavaScript bundle — only that it does nothing while the flag is off." },
    { "id": "VG-010",
      "text": "Nothing here runs against api.monobank.ua in either build. AC-006 asserts against a stubbed fetch, so the normal build's real network path stays unverified by this cycle." },
    { "id": "VG-011",
      "text": "A reset that fails part-way (database wiped, key-value clear throws) is not exercised; only a clean run and a clean second run are." },
    { "id": "VG-012",
      "text": "Nothing here establishes that no filter state is persisted outside the database. AS-016 rests on a reading of today's code, not on an assertion: were a filter ever written to key-value storage, the reset would leave it in place and no test in this suite would go red." }
  ],
  "non_goals": [
    "A fake Monobank service, sandbox tokens, or fixtures — those are OPES-60",
    "Multi-user separation: no user_id on transactions, no query scoping",
    "Any change to the normal build's connect or sync behavior",
    "Rewriting the existing lists, filters, or categorization",
    "A confirmation step before the sandbox reset",
    "Seeding the sandbox database on first launch"
  ] }
-->

# OPES-59 — Тестова збірка: ізоляція збірки й даних

Специфікація закладає ізоляцію тестової (у коді — sandbox) збірки: прапорець
`OPES_ENV=sandbox`, окремий файл бази `opes_sandbox` при незмінному `opes` для
звичайної збірки, фізичну відсутність викликів до Monobank і повне скидання в
налаштуваннях, після якого застосунок сам повертається на екран онбордингу.
Перевіряється лише те, що видно з jest: ім'я бази в опціях адаптера, нульова
кількість викликів `fetch`, стан бази й сховища після скидання, наявність пункту
скидання в тестовій збірці та його відсутність у звичайній.

Три зміни за вашим зауваженням. **Картки** тепер має власний критерій: AC-008
стверджує, що після `resetSandboxEnvironment()` кількість рядків у `cards`
дорівнює нулю — саме те, що в OPES-59 можна створити руками. **AS-016** втратила
недоведену половину: твердження «нічого фільтрового не зберігається поза базою»
винесене окремим розривом VG-012, у самій AS-016 лишилось тільки рішення про
поведінку. **Ім'я файлу бази** тепер стверджується не на резолвері, а в точці,
де воно доходить до адаптера: `createSqliteAdapter()` приймає конструктор
адаптера аргументом, а тест підставляє записувальний конструктор і читає з нього
`dbName` — AC-002 для звичайної збірки (`opes`), AC-003 для тестової
(`opes_sandbox`). VG-002 після цього покриває лише чужий контракт («SQLite на
пристрої шанує `dbName`»), а те, що під jest гілка SQLite взагалі не виконується,
названо окремо в VG-003.

**Компроміс, який довелось зробити.** Стеля `spec_ac_max` — 15, попередня
специфікація вибрала всі 15. Щоб додати два критерії, я: (1) прибрав колишній
AC-001 (`OPES_ENV=sandbox` → `isSandboxBuild()` повертає `true`) — «вимкнений»
напрямок лишився як AC-001, бо він захищає від необоротної помилки, а
«увімкнений» перевіряється передумовою кожного sandbox-критерію: якщо прапорець
не вмикається, червоними стають AC-003, AC-004, AC-005, AC-014; (2) згорнув
колишні AC-003/AC-004 на `resolveDatabaseName()` у нову пару на опціях адаптера
— вона строго сильніша, бо ловить ще й зашите повз резолвер ім'я. Решта
`assumptions` — без змін, як ви їх прийняли.

**AC-012 пересіяно.** Передумова раніше нічого не створювала, тож критерій зеленів
проти бази, у якій рядка `users` не було ніколи. А `users.checked_in` (AS-015) і є
прапорцем онбордингу: скидання, яке лишає той рядок на місці, пройшло б увесь
набір і при цьому провело б застосунок повз онбординг на Home. Тепер передумова
сіє рядок користувача — так само, як AC-007 сіє транзакцію, а AC-008 картку.

**Пересів і повторний запуск лишились в одному критерії — свідомо.** Окремим
критерієм «повторний запуск» недоказовий: якщо друге скидання йде по порожній
базі, нульова кількість рядків — це рівно та сама тривіальна зеленість, яку ви
щойно забракували. Спостережуваною роботу другого виклику робить саме поява рядка
між викликами. Тому передумова AC-012 — «скидання вже відпрацювало один раз, після
чого записано рядок користувача»: це буквально той цикл, заради якого тікет просить
скидання (скинув → пройшов онбординг → скинув знову). Критерій червоніє і якщо
скидання не витирає `users`, і якщо другий виклик стає no-op або падає, тож
властивість повторного запуску не втрачена, а вперше стала спростовною. Стеля 15
тримається, обмін не знадобився — AC-014 лишається на місці. Межа чесності одна й
названа: AC-012 спостерігає тільки лічильник `users`, тому «друге скидання лишає
коректним усе інше» цим критерієм не встановлюється — так само, як і в попередній
редакції.

Усе, що живе в нативній конфігурації — окремий bundle id, флейвор, схема, підпис
на домашньому екрані, розділення пісочниць операційною системою, збереження
даних між запусками — цим циклом не встановлюється й винесене у
`verification_gaps` як ручний чекліст.
