<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-60",
  "spec_sha256": "3a5786fa3a604619c99b680486ab7a209324b13ffec26198f2d4226969874c0e",
  "risk": "medium",
  "files": {
    "create": [
      "src/services/monobank/sandbox/SandboxMonobankService.ts",
      "src/services/monobank/sandbox/fixtures.ts",
      "src/services/monobank/sandbox/index.ts"
    ],
    "change": [
      "src/services/monobank/types.ts",
      "src/services/monobank/api.ts",
      "src/services/monobank/serviceInstance.ts",
      "src/services/monobank/index.ts",
      "src/services/sync/TransactionSyncService.ts",
      "src/services/monobank/CLAUDE.md"
    ],
    "tests": [
      "src/services/monobank/serviceInstance.test.ts",
      "src/services/monobank/sandbox/SandboxMonobankService.test.ts",
      "src/features/monobank/state/useMonobankStore.test.ts",
      "src/features/transactions/state/useTransactionsStore.test.ts"
    ] },
  "decisions": [
    { "id": "D-001",
      "statement": "Declare `export interface MonobankApi` in src/services/monobank/types.ts: getClientInfo(): Promise<MonobankClientInfo> and getStatements(accountId, from, to): Promise<MonobankStatement[]>.",
      "because": "types.ts imports nothing, so neither the fake nor the sync service can close an import cycle through it" },
    { "id": "D-002",
      "statement": "Add `implements MonobankApi` to `export class MonobankService` in api.ts and change nothing else in that file but the 401 message literal.",
      "rejected": "Do not make the fake extend MonobankService — it would inherit the rate limiter and the token field." },
    { "id": "D-003",
      "statement": "Add `export const MONOBANK_UNAUTHORIZED_MESSAGE = 'Invalid or missing Monobank token.';` to types.ts and throw it from api.ts's 401 branch instead of the inline literal.",
      "because": "one literal with two throwers is what keeps the sandbox text from drifting off the production text" },
    { "id": "D-004",
      "statement": "Re-export from src/services/monobank/index.ts: `export type { MonobankApi }` and MONOBANK_UNAUTHORIZED_MESSAGE from './types', and SandboxMonobankService from './sandbox'.",
      "because": "AC-003 asserts against the constant, so it must be reachable through the barrel" },
    { "id": "D-005",
      "statement": "Retype both `monobankService` parameters in TransactionSyncService.ts to MonobankApi via `import type { MonobankApi } from '../monobank/types';`.",
      "rejected": "Do not edit either store — both already infer the service type from getMonobankService's return." },
    { "id": "D-006",
      "statement": "In getMonobankService return MonobankApi and construct `new SandboxMonobankService(token)` when isSandboxBuild() is true, `new MonobankService(token)` otherwise; delete the OPES-59 throw.",
      "because": "the sandbox branch replaces the throw in the same place, so no other caller changes" },
    { "id": "D-007",
      "statement": "Widen the module cache to `{ token, sandbox, service }` and rebuild it when the token or the current isSandboxBuild() differs from the cached pair.",
      "because": "the flag flips between test cases while the token stays the same, and a token-only key would hand back the wrong class" },
    { "id": "D-008",
      "statement": "Import the fake as `import { SandboxMonobankService } from './sandbox';` and give that folder an index.ts barrel re-exporting the class and the SandboxTestUser type.",
      "because": "every folder in this repo exposes a barrel, and the barrel is the only import path besides the monobank barrel" },
    { "id": "D-009",
      "statement": "Construct SandboxMonobankService with `(private readonly token: string)` and resolve the token to a test user on every call, never in the constructor.",
      "because": "an unknown token must surface where a real 401 would, not at getMonobankService" },
    { "id": "D-010",
      "statement": "Throw `new MonobankError('UNAUTHORIZED', MONOBANK_UNAUTHORIZED_MESSAGE)` from one private requireUser() called by both getClientInfo and getStatements.",
      "because": "an unlisted token then fails at whichever call reaches it first" },
    { "id": "D-011",
      "statement": "Hold the fixtures as raw API shapes (MonobankRawClientInfo, MonobankRawStatementItem) and return them through transformClientInfo / transformStatements imported from '../transformers'.",
      "because": "the fake then runs the production minor-unit and currency-symbol conversion instead of restating it",
      "rejected": "Do not hand back ready-made MonobankClientInfo / MonobankStatement objects." },
    { "id": "D-012",
      "statement": "Export the token map from fixtures.ts as `SANDBOX_TEST_USERS = new Map<string, SandboxTestUser>([['test-user-1', TEST_USER_1]])`.",
      "because": "a Map lookup is exact, case-sensitive and carries no prototype keys",
      "rejected": "Do not trim, lowercase or normalise the token inside the fake — connect() already trims." },
    { "id": "D-013",
      "statement": "Shape the entry as `interface SandboxTestUser { clientInfo: MonobankRawClientInfo; buildStatements: (now: Date) => MonobankRawStatementItem[] }`.",
      "because": "a second test user then needs one more Map entry and no restructuring" },
    { "id": "D-014",
      "statement": "Ignore `_accountId`, `_from` and `_to` in getStatements and return the user's whole statement set on every call.",
      "because": "the first sync asks for 30 days and would otherwise drop two of the three fixture months" },
    { "id": "D-015",
      "statement": "Give the fake no RateLimiter, no timer and no module-level mutable state; only statement dates derive from the clock, at call time.",
      "rejected": "Do not add an artificial delay — it would put a false Too Many Requests on the post-connect sync." },
    { "id": "D-016",
      "statement": "Build the 4 current-day statements as `Math.max(startOfDay(now).getTime(), now.getTime() - minutesAgo * 60000)` with fixed offsets 35, 200, 430 and 700 minutes.",
      "because": "the floor keeps all four inside today at any hour and puts nothing in the future by construction" },
    { "id": "D-017",
      "statement": "Build the 40 historical statements as `new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, hour)`, 20 with monthsAgo 1 and 20 with monthsAgo 2, every day literal ≤ 28.",
      "because": "the Date constructor normalises a negative month index across the year boundary" },
    { "id": "D-018",
      "statement": "Repeat at least one day value inside each historical month's day list so both months carry a calendar day holding more than one statement." },
    { "id": "D-019",
      "statement": "Carry a donations MCC on exactly 4 statements — 8398 today, 8661 and 8398 in month-1, 8661 in month-2 — and let no other fixture use 8398 or 8661.",
      "because": "AC-012 counts resolveCategoryByMcc hits over the whole returned set" },
    { "id": "D-020",
      "statement": "Give every statement currencyCode 980, hold false, amounts in minor units of both signs, and a fixed literal id of the form `sandbox-u1-t01` / `sandbox-u1-m1-01`.",
      "because": "stable ids are what makes upsertBatch update rather than insert on the second sync" },
    { "id": "D-021",
      "statement": "Give the client-info fixture exactly one account: id 'sandbox-acc-1', type 'black', currencyCode 980, one maskedPan entry and one iban.",
      "rejected": "Do not create the card inside the fake — upsertMonobankCards is the production path AC-006 exercises." },
    { "id": "D-022",
      "statement": "Leave useMonobankStore.connect()'s fire-and-forget `syncFromMonobank(userId).catch(() => {})` byte for byte as it is.",
      "rejected": "Do not await it or return its promise to make the triggered sync easier to observe." },
    { "id": "D-023",
      "statement": "Update src/services/monobank/CLAUDE.md: the factory returns MonobankApi, sandbox/ holds the fake and its fixtures, and the fake carries no rate limiter." } ],
  "ac_coverage": {
    "AC-001": ["src/services/monobank/serviceInstance.ts", "src/services/monobank/api.ts", "src/services/monobank/types.ts", "src/services/monobank/index.ts"],
    "AC-002": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts"],
    "AC-003": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts", "src/services/sync/TransactionSyncService.ts"],
    "AC-004": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts", "src/services/sync/TransactionSyncService.ts"],
    "AC-005": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts", "src/services/sync/TransactionSyncService.ts"],
    "AC-006": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts", "src/services/sync/TransactionSyncService.ts"],
    "AC-007": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts", "src/services/sync/TransactionSyncService.ts"],
    "AC-008": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts"],
    "AC-009": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts"],
    "AC-010": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts"],
    "AC-011": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts"],
    "AC-012": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts"],
    "AC-013": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts", "src/services/sync/TransactionSyncService.ts"],
    "AC-014": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts", "src/services/sync/TransactionSyncService.ts"],
    "AC-015": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts", "src/services/sync/TransactionSyncService.ts"] },
  "uncovered": [],
  "surface_map": {
    "src/services/monobank — getMonobankService()": ["src/services/monobank/serviceInstance.ts", "src/services/monobank/api.ts", "src/services/monobank/types.ts", "src/services/monobank/index.ts"],
    "src/services/monobank/sandbox — SandboxMonobankService": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts"],
    "src/features/monobank — useMonobankStore.connect()": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts", "src/services/sync/TransactionSyncService.ts"],
    "src/features/transactions — useTransactionsStore.syncFromMonobank()": ["src/services/monobank/sandbox/SandboxMonobankService.ts", "src/services/monobank/sandbox/fixtures.ts", "src/services/monobank/sandbox/index.ts", "src/services/monobank/serviceInstance.ts", "src/services/monobank/types.ts", "src/services/sync/TransactionSyncService.ts"] },
  "external": [
    { "name": "react-native-config — default export Config, read as Config.OPES_ENV inside isSandboxBuild()" },
    { "name": "@nozbe/watermelondb — Database.write/batch, Collection.query and prepareCreate, reached through upsertMonobankCards and upsertBatch",
      "ac": "AC-007" },
    { "name": "@nozbe/watermelondb/adapters/lokijs — LokiJSAdapter constructor, the adapter every database-backed case runs on",
      "ac": "AC-006" },
    { "name": "zustand — create() and getState() on useMonobankStore and useTransactionsStore",
      "ac": "AC-014" },
    { "name": "global.fetch — the runtime global MonobankService.request() uses and the fake must never reach",
      "ac": "AC-005" },
    { "name": "Date — new Date(year, monthIndex, day, hour) month normalisation, getFullYear/getMonth/getTime, toISOString",
      "ac": "AC-011" },
    { "name": "react-native-mmkv — createMMKV(), reached on device by monobankTokenService.save/get; under jest the in-memory branch runs instead" } ] }
-->

# OPES-60 — plan

Підміна стоїть в одній точці. `getMonobankService` більше не кидає виняток у
пісочниці, а повертає `SandboxMonobankService` — той самий тип, що й справжній
сервіс, бо обидва тепер реалізують новий інтерфейс `MonobankApi` з `types.ts`.
Далі бойовий код іде без змін: `connect` тягне client-info, `upsertMonobankCards`
робить картку, `TransactionSyncService` мапить виписки й пише їх через
`upsertBatch`. Єдина правка поза monobank — тип параметра в
`TransactionSyncService`; жоден стор, екран, схема валідації чи репозиторій не
редагується.

**Текст помилки — одна константа.** `MONOBANK_UNAUTHORIZED_MESSAGE` живе в
`types.ts` поруч із `MonobankError`, значення `Invalid or missing Monobank token.`
(символ у символ, з крапкою). 401-гілка `api.ts` і фейк кидають саме її, тож
`errorMessage` у стора однаковий у обох збірках.

**Фікстури — рівно 44 виписки.** 4 датовані сьогодні (`now` мінус фіксовані 35,
200, 430, 700 хвилин, з підлогою на початку доби — тому вони завжди в межах
сьогоднішнього дня й ніколи в майбутньому), 20 у минулому місяці й 20 у
позаминулому (`new Date(y, m - 1 | m - 2, day ≤ 28, hour)`). Донатних MCC рівно
4: 8398 сьогодні, 8661 і 8398 у минулому місяці, 8661 у позаминулому — і жодна
інша виписка цих кодів не несе. У кожному з двох історичних місяців є день, на
який припадає більш ніж одна виписка. Id фіксовані (`sandbox-u1-t01`,
`sandbox-u1-m1-01`), тому повторний синк оновлює рядки, а не додає нові.

**Фейк — чиста функція від фікстур і годинника.** Токен резолвиться на кожному
виклику через `Map` (точне порівняння з урахуванням регістру), а не в
конструкторі. Діапазон дат і `accountId` ігноруються — інакше з трьох місяців
доїхав би один. Rate limiter, затримки й модульного стану немає. Фікстури
зберігаються в сирих формах API і віддаються через продові `transformClientInfo`
/ `transformStatements`, тож конвертація мінорних одиниць і символ валюти
беруться з бойового коду.

**Шви для тестів.** Пісочниця вмикається мутацією `Config.OPES_ENV` (об'єкт із
`test/setup.js`), знімається — `delete` у `afterEach`. Кеш фабрики тепер
враховує й прапорець (D-007), але `clearMonobankService()` між випадками все одно
потрібен. База — `jest.mock('src/services/database/database')` плюс
`createTestDatabase()` з `test/db`, як у `CardsRepository.test.ts`; для AC-006/007
`useTransactionsStore` підміняти не можна — саме його синк наповнює базу, а
`monobankTokenService` під jest тримає токен у пам'яті сам. `connect` синк не
чекає (D-022), тому спостерігати його доводиться прогоном мікрозадач.

**Чого немає в маніфесті.** Жодного екрана — VG-003. Жодного нового `.env`,
жодної правки збірки — цей цикл нічого не встановлює (VG-001). `react-native-config`
під jest замінений на `{}`, а MMKV-гілка не виконується взагалі: обидва лишаються
в `external` без валідатора свідомо.
