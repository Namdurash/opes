<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-59",
  "spec_sha256": "e8f47282c669510e9555fa6701d004d02e41975655f9b8e94be206979fd90851",
  "risk": "high",
  "files": {
    "create": [
      "src/services/database/createSqliteAdapter.ts",
      "src/models/maintenance/DatabaseMaintenanceRepository.ts",
      "src/models/maintenance/index.ts",
      "src/services/sandbox/resetSandboxEnvironment.ts",
      "src/services/sandbox/index.ts"
    ],
    "change": [
      "src/shared/env/env.ts",
      "src/services/database/database.ts",
      "src/services/monobank/serviceInstance.ts",
      "src/features/settings/state/useSettingsStore.ts",
      "src/features/settings/SettingsScreen.tsx",
      "android/app/build.gradle",
      "package.json"
    ],
    "tests": [
      "src/shared/env/env.test.ts",
      "src/services/database/createSqliteAdapter.test.ts",
      "src/features/monobank/state/useMonobankStore.test.ts",
      "src/features/transactions/state/useTransactionsStore.test.ts",
      "src/services/sandbox/resetSandboxEnvironment.test.ts",
      "src/features/settings/SettingsScreen.test.tsx"
    ] },
  "decisions": [
    { "id": "D-001",
      "statement": "Add `export const isSandboxBuild = (): boolean => Config.OPES_ENV === 'sandbox';` to src/shared/env/env.ts, beside the existing `env` export.",
      "because": "the folder barrel already re-exports env.ts, so no barrel edit is needed" },
    { "id": "D-002",
      "statement": "Read `Config.OPES_ENV` inside the function body on every call; never hoist it to a module-level constant.",
      "because": "AS-003, and it is the seam every sandbox test uses" },
    { "id": "D-003",
      "statement": "Leave src/shared/env/react-native-config.d.ts alone; NativeConfig already carries `[name: string]: string | undefined`, which types OPES_ENV honestly.",
      "rejected": "Do not declare `OPES_ENV: string` — AC-001's precondition is an absent key." },
    { "id": "D-004",
      "statement": "In createSqliteAdapter.ts export `type SqliteAdapterConstructor<TAdapter> = new (options: Record<string, unknown>) => TAdapter` and a generic `createSqliteAdapter<TAdapter>(Adapter)`.",
      "because": "the generic lets a recording constructor be passed with no cast" },
    { "id": "D-005",
      "statement": "Build the whole options object inside createSqliteAdapter: schema: databaseSchema, migrations: databaseMigrations, jsi: true, dbName: resolveDatabaseName(), onSetUpError rethrowing.",
      "because": "AC-002/AC-003 read dbName off the options the constructor received" },
    { "id": "D-006",
      "statement": "Keep `resolveDatabaseName = (): string => (isSandboxBuild() ? 'opes_sandbox' : 'opes')` module-private in createSqliteAdapter.ts and let 'opes' appear as a literal nowhere else.",
      "because": "one literal is the whole protection against the irreversible error" },
    { "id": "D-007",
      "statement": "Reduce the device branch of database.ts to two statements: require the sqlite adapter module and `return createSqliteAdapter(SQLiteAdapter)`; move every option out.",
      "because": "VG-003 — that branch runs in no test, so it must be as thin as the extraction allows" },
    { "id": "D-008",
      "statement": "Leave the jest/LokiJS branch of database.ts and the `typeof jest !== 'undefined'` test exactly as they are.",
      "rejected": "Do not make the adapter choice configurable or injectable." },
    { "id": "D-009",
      "statement": "Guard getMonobankService: when isSandboxBuild() is true, throw `new MonobankError('FORBIDDEN', 'Monobank is unavailable in the sandbox build.')` before the cache is consulted.",
      "because": "AS-009 — no MonobankService instance ever exists, so no fetch can be reached" },
    { "id": "D-010",
      "statement": "Change no line of useMonobankStore.ts or useTransactionsStore.ts; both already funnel through getMonobankService and their catch blocks surface the thrown MonobankError.",
      "rejected": "Do not add a sandbox check inside connect() or syncFromMonobank()." },
    { "id": "D-011",
      "statement": "Give DatabaseMaintenanceRepository one method, `wipeAllData(): Promise<void>`, implemented as `await database.write(async () => { await database.unsafeResetDatabase(); })`.",
      "because": "unsafeResetDatabase asserts it is inside a writer" },
    { "id": "D-012",
      "statement": "Import `database` in the repository from '../../services/database' (the barrel), matching CardsRepository, so a test can replace '../../services/database/database'.",
      "because": "that inner-module mock is the only seam the repository tests have" },
    { "id": "D-013",
      "statement": "Define and export `SandboxOnlyError extends Error` inside resetSandboxEnvironment.ts and re-export it from src/services/sandbox/index.ts; give it no separate file.",
      "because": "the manifest has no room and it has exactly one thrower" },
    { "id": "D-014",
      "statement": "Order resetSandboxEnvironment as: throw SandboxOnlyError unless isSandboxBuild(); await wipeAllData(); monobankTokenService.clear(); monobankAccountSelectionService.clear().",
      "because": "AS-013 — non-atomic, and a second run reaches the same end state" },
    { "id": "D-015",
      "statement": "Instantiate `new DatabaseMaintenanceRepository()` at module scope in resetSandboxEnvironment.ts and keep the exported function zero-argument.",
      "rejected": "Do not add an injected-dependency parameter; the ACs call resetSandboxEnvironment()." },
    { "id": "D-016",
      "statement": "Import the two key-value singletons deep — '../monobank/MonobankTokenService' and '../monobank/MonobankAccountSelectionService' — not through the monobank barrel.",
      "because": "AC-009/AC-010 assert on those same singletons and the barrel drags api.ts in" },
    { "id": "D-017",
      "statement": "Add `resetSandbox: () => Promise<void>` and `isResettingSandbox: boolean` to useSettingsStore; the action awaits resetSandboxEnvironment(), then calls useMonobankStore.getState().disconnect().",
      "because": "disconnect() returns the monobank and transactions stores to defaults, which is AS-016" },
    { "id": "D-018",
      "statement": "Import the store as `import { useMonobankStore } from '../../monobank/state/useMonobankStore'`, deep, exactly as useMonobankStore imports useTransactionsStore.",
      "because": "the monobank barrel exports ConnectMonobankScreen and would close a cycle back through app/navigation" },
    { "id": "D-019",
      "statement": "Catch inside resetSandbox, report through showErrorBottomSheet with title 'Reset Failed', and always resolve; never rethrow to the screen.",
      "because": "AC-011 must observe navigation.reset unconditionally after the press" },
    { "id": "D-020",
      "statement": "Render the reset block in SettingsScreen behind `isSandboxBuild() && (...)`, as a third section after Data export.",
      "because": "AC-014 and AC-015 are the same element counted under the two flag states" },
    { "id": "D-021",
      "statement": "Make the reset item a react-native `Pressable` carrying `testID=\"sandbox-reset-item\"` and `style={styles.card}`, wrapping an AppText label and an AppText caption.",
      "rejected": "Do not add a testID prop to shared/ui Button — it is outside this manifest." },
    { "id": "D-022",
      "statement": "Reuse the existing style keys section, card, settingInfo; add no key to SettingsScreen.styles.ts, which is outside this manifest.",
      "because": "the reset row needs no geometry the settings rows do not already have" },
    { "id": "D-023",
      "statement": "Call `navigation.reset({ index: 0, routes: [{ name: ROOT_ROUTES.WELCOME }] })` from the screen after the action resolves; import ROOT_ROUTES from '../../app/navigation'.",
      "because": "AC-011 reads the first route name off the stubbed navigation object" },
    { "id": "D-024",
      "statement": "In android/app/build.gradle set `project.ext.envConfigFiles = [standard: \".env\", sandbox: \".env.sandbox\"]` on the line ABOVE the existing dotenv.gradle apply.",
      "because": "dotenv.gradle calls loadDotEnv() at apply time and reads that property then" },
    { "id": "D-025",
      "statement": "Add `flavorDimensions \"env\"` with flavors standard (dimension only) and sandbox (dimension, applicationIdSuffix \".sandbox\", resValue \"string\", \"app_name\", \"Opes Sandbox\").",
      "because": "AS-004/AS-005 — one configuration carries both the flag and the identifier" },
    { "id": "D-026",
      "statement": "Set `debuggableVariants = [\"standardDebug\", \"sandboxDebug\", \"standardDebugOptimized\", \"sandboxDebugOptimized\"]` inside the existing react { } block.",
      "because": "its convention is ['debug','debugOptimized'], which no flavoured variant name matches any more" },
    { "id": "D-027",
      "statement": "Rewrite the android script to `react-native run-android --mode standardDebug` and add `android:sandbox` as `react-native run-android --mode sandboxDebug --appIdSuffix sandbox`.",
      "because": "the flavor dimension renames the default variant and would break npm run android" },
    { "id": "D-028",
      "statement": "Leave the ios script untouched and add no ios:sandbox script.",
      "rejected": "Do not ship `ENVFILE=.env.sandbox react-native run-ios` — it sets the flag without the separate bundle identifier, which AS-005 forbids." },
    { "id": "D-029",
      "statement": "Create no .env file of any kind; .gitignore excludes `.env` and `.env.*`, so .env.sandbox is a developer-local file the Android flavor merely points at.",
      "because": "an ignored path cannot be committed and would look like a silently missing file" },
    { "id": "D-030",
      "statement": "Edit nothing under ios/; the OpesSandbox scheme and its build configuration are out of this manifest and are done by hand in Xcode.",
      "because": "a blind text edit to project.pbxproj can corrupt the project and no gate in this cycle builds iOS" },
    { "id": "D-031",
      "statement": "Add neither folder to the root barrels src/services/index.ts and src/models/index.ts; import through src/services/sandbox and src/models/maintenance directly.",
      "because": "src/services/index.ts already omits secret-storage, so this matches the tree as it is" } ],
  "ac_coverage": {
    "AC-001": ["src/shared/env/env.ts"],
    "AC-002": ["src/services/database/createSqliteAdapter.ts", "src/services/database/database.ts"],
    "AC-003": ["src/services/database/createSqliteAdapter.ts", "src/services/database/database.ts"],
    "AC-004": ["src/services/monobank/serviceInstance.ts"],
    "AC-005": ["src/services/monobank/serviceInstance.ts"],
    "AC-006": ["src/services/monobank/serviceInstance.ts"],
    "AC-007": ["src/services/sandbox/resetSandboxEnvironment.ts", "src/services/sandbox/index.ts", "src/models/maintenance/DatabaseMaintenanceRepository.ts", "src/models/maintenance/index.ts"],
    "AC-008": ["src/services/sandbox/resetSandboxEnvironment.ts", "src/services/sandbox/index.ts", "src/models/maintenance/DatabaseMaintenanceRepository.ts", "src/models/maintenance/index.ts"],
    "AC-009": ["src/services/sandbox/resetSandboxEnvironment.ts", "src/services/sandbox/index.ts", "src/models/maintenance/DatabaseMaintenanceRepository.ts", "src/models/maintenance/index.ts"],
    "AC-010": ["src/services/sandbox/resetSandboxEnvironment.ts", "src/services/sandbox/index.ts", "src/models/maintenance/DatabaseMaintenanceRepository.ts", "src/models/maintenance/index.ts"],
    "AC-011": ["src/features/settings/SettingsScreen.tsx", "src/features/settings/state/useSettingsStore.ts"],
    "AC-012": ["src/services/sandbox/resetSandboxEnvironment.ts", "src/services/sandbox/index.ts", "src/models/maintenance/DatabaseMaintenanceRepository.ts", "src/models/maintenance/index.ts"],
    "AC-013": ["src/services/sandbox/resetSandboxEnvironment.ts", "src/services/sandbox/index.ts", "src/models/maintenance/DatabaseMaintenanceRepository.ts", "src/models/maintenance/index.ts"],
    "AC-014": ["src/features/settings/SettingsScreen.tsx", "src/features/settings/state/useSettingsStore.ts"],
    "AC-015": ["src/features/settings/SettingsScreen.tsx", "src/features/settings/state/useSettingsStore.ts"] },
  "uncovered": [],
  "surface_map": {
    "src/shared/env — isSandboxBuild()": ["src/shared/env/env.ts"],
    "src/services/database — createSqliteAdapter()": ["src/services/database/createSqliteAdapter.ts", "src/services/database/database.ts"],
    "src/features/monobank — useMonobankStore.connect()": ["src/services/monobank/serviceInstance.ts"],
    "src/features/transactions — useTransactionsStore.syncFromMonobank()": ["src/services/monobank/serviceInstance.ts"],
    "src/services/sandbox — resetSandboxEnvironment()": ["src/services/sandbox/resetSandboxEnvironment.ts", "src/services/sandbox/index.ts", "src/models/maintenance/DatabaseMaintenanceRepository.ts", "src/models/maintenance/index.ts"],
    "src/features/settings — SettingsScreen": ["src/features/settings/SettingsScreen.tsx", "src/features/settings/state/useSettingsStore.ts"] },
  "external": [
    { "name": "react-native-config — default export Config, read as Config.OPES_ENV" },
    { "name": "@nozbe/watermelondb — Database.write() and Database.unsafeResetDatabase()",
      "ac": "AC-007" },
    { "name": "@nozbe/watermelondb/adapters/lokijs — LokiJSAdapter constructor",
      "ac": "AC-007" },
    { "name": "@nozbe/watermelondb/adapters/sqlite — SQLiteAdapter constructor and its options object" },
    { "name": "react-native-mmkv — createMMKV(), reached through monobankTokenService.clear() and monobankAccountSelectionService.clear()" },
    { "name": "@react-navigation/native — useNavigation()" },
    { "name": "@react-navigation/native-stack — NativeStackNavigationProp.reset(state)" },
    { "name": "react-native — Pressable, View, ScrollView, Switch",
      "ac": "AC-011" },
    { "name": "global.fetch — the runtime global the Monobank HTTP boundary uses",
      "ac": "AC-006" },
    { "name": "zustand — create() and getState() in useSettingsStore" },
    { "name": "Android Gradle Plugin — flavorDimensions, productFlavors, applicationIdSuffix, resValue overriding main/res app_name" },
    { "name": "react-native-config dotenv.gradle — project.ext.envConfigFiles" },
    { "name": "@react-native/gradle-plugin — react { debuggableVariants }" },
    { "name": "@react-native-community/cli — run-android --mode and --appIdSuffix" } ] }
-->

# OPES-59 — plan

Прапорець `isSandboxBuild()` живе в `src/shared/env/env.ts` і читає
`Config.OPES_ENV` на кожному виклику. Ім'я файлу бази виноситься з `database.ts`
у новий `createSqliteAdapter(Adapter)`: цей модуль сам збирає опції й бере
`dbName` з єдиного приватного резолвера. Блок Monobank ставиться в
`getMonobankService`. Скидання — новий `src/services/sandbox`, який складає
витирання бази (через новий репозиторій `src/models/maintenance`) з чисткою
key-value; екран налаштувань показує пункт скидання лише при піднятому прапорці
й після завершення дії сам робить `navigation.reset` на `Welcome`.

**Дві властивості, за якими цей план оцінювати.**

1. **`opes` лишається `opes`.** Літерал імені звичайної бази існує рівно в одному
   місці — `resolveDatabaseName()` у `createSqliteAdapter.ts` (D-006). AC-002
   читає `dbName` з опцій, які отримав конструктор, тому підміна повз резолвер
   теж червоніє.
2. **Гілка пристрою тонка (VG-003).** Після D-007 у `database.ts` на
   SQLite-гілці лишається `require` модуля адаптера й передача конструктора —
   більше нічого. Усе, що можна перевірити в процесі, перевіряється в
   `createSqliteAdapter.ts`; поза покриттям лишається два рядки.

**Шви для тестів.** `isSandboxBuild()` читає властивість у момент виклику, тож
sandbox-збірку в тесті вмикають або мутацією `Config.OPES_ENV` (об'єкт з
`test/setup.js` — той самий), або `jest.mock('../../shared/env')`. Базу
підмінюють, як у `CardsRepository.test.ts`: `jest.mock` на
`src/services/database/database` плюс `createTestDatabase()` з `test/db`.
`monobankTokenService` і `monobankAccountSelectionService` під jest тримають
дані в пам'яті — саме на цих сінглтонах стверджують AC-009/AC-010.
`clearMonobankService()` знімає кеш сервісу між випадками AC-006.

**Чого в маніфесті немає — навмисно, і це видно.**

- **iOS-схема `OpesSandbox`** та її build configuration (D-030). `project.pbxproj`
  редагується руками в Xcode; сліпа текстова правка ламає проєкт, а жоден гейт
  цього циклу iOS не збирає. Android-половина (флейвор + npm-скрипти) в
  маніфесті є й дає встановлювану пісочницю на одній платформі.
- **`.env.sandbox`** (D-029) — під `.gitignore`, файл локальний для розробника.
  `.env.example` у репозиторії відсутній і тут не з'являється.
- **`android/app/build.gradle` і `package.json`** не покриті жодним критерієм:
  VG-001 каже, що цей цикл нічого не збирає. Разом з ними без валідатора
  лишається все, що перелічено в `external` без `check`/`ac`.
- **CLAUDE.md шарів** (`src/services/database`, `src/models`, `src/services`) не
  оновлюються — місця в маніфесті немає; це залишається за людиною разом з
  iOS-схемою.
