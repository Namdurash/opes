<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-60",
  "lang": "uk",
  "risk": "medium",
  "surfaces": [
    "src/services/monobank — getMonobankService()",
    "src/services/monobank/sandbox — SandboxMonobankService",
    "src/features/monobank — useMonobankStore.connect()",
    "src/features/transactions — useTransactionsStore.syncFromMonobank()"
  ],
  "acceptance": [
    { "id": "AC-001",
      "surface": "src/services/monobank — getMonobankService()",
      "given": "a non-sandbox build",
      "when": "getMonobankService('any-token') is called",
      "then": "the returned value's instanceof MonobankService equals true",
      "expect": true },
    { "id": "AC-002",
      "surface": "src/services/monobank/sandbox — SandboxMonobankService",
      "given": "a sandbox build and the service obtained from getMonobankService for the token TEST-USER-1",
      "when": "getClientInfo() is called",
      "then": "raises a MonobankError carrying the code UNAUTHORIZED",
      "expect": "UNAUTHORIZED" },
    { "id": "AC-003",
      "surface": "src/features/monobank — useMonobankStore.connect()",
      "given": "a sandbox build",
      "when": "connect(userId, 'uKqRr3fLxYt0') completes",
      "then": "the store's errorMessage equals MONOBANK_UNAUTHORIZED_MESSAGE",
      "expect": "MONOBANK_UNAUTHORIZED_MESSAGE" },
    { "id": "AC-004",
      "surface": "src/features/monobank — useMonobankStore.connect()",
      "given": "a sandbox build",
      "when": "connect(userId, '  test-user-1  ') completes",
      "then": "the store's status equals connected",
      "expect": "connected" },
    { "id": "AC-005",
      "surface": "src/features/monobank — useMonobankStore.connect()",
      "given": "a sandbox build with global.fetch replaced by a spy",
      "when": "connect(userId, 'test-user-1') settles together with the sync it triggers",
      "then": "the fetch spy call count equals zero",
      "expect": 0 },
    { "id": "AC-006",
      "surface": "src/features/monobank — useMonobankStore.connect()",
      "given": "a sandbox build with an empty database",
      "when": "connect(userId, 'test-user-1') completes",
      "then": "cardsRepository.getMonobankCards(userId) returns one card",
      "expect": 1 },
    { "id": "AC-007",
      "surface": "src/features/monobank — useMonobankStore.connect()",
      "given": "a sandbox build with an empty database",
      "when": "connect(userId, 'test-user-1') settles together with the sync it triggers",
      "then": "the transactions row count equals 44",
      "expect": 44 },
    { "id": "AC-008",
      "surface": "src/services/monobank/sandbox — SandboxMonobankService",
      "given": "a sandbox build and the service obtained from getMonobankService for the token test-user-1",
      "when": "getStatements(accountId, one day before the call moment, the call moment) is called",
      "then": "returns 44 statements",
      "expect": 44 },
    { "id": "AC-009",
      "surface": "src/services/monobank/sandbox — SandboxMonobankService",
      "given": "a sandbox build and the service obtained from getMonobankService for the token test-user-1",
      "when": "getStatements(accountId, one day before the call moment, the call moment) is called",
      "then": "the count of returned statements dated on the call day equals 4",
      "expect": 4 },
    { "id": "AC-010",
      "surface": "src/services/monobank/sandbox — SandboxMonobankService",
      "given": "a sandbox build and the service obtained from getMonobankService for the token test-user-1",
      "when": "getStatements(accountId, one day before the call moment, the call moment) is called",
      "then": "the count of returned statements dated after the call moment equals zero",
      "expect": 0 },
    { "id": "AC-011",
      "surface": "src/services/monobank/sandbox — SandboxMonobankService",
      "given": "a sandbox build and the service obtained from getMonobankService for the token test-user-1",
      "when": "getStatements(accountId, one day before the call moment, the call moment) is called",
      "then": "the count of distinct calendar months among the returned statement dates equals 3",
      "expect": 3 },
    { "id": "AC-012",
      "surface": "src/services/monobank/sandbox — SandboxMonobankService",
      "given": "a sandbox build and the service obtained from getMonobankService for the token test-user-1",
      "when": "getStatements(accountId, one day before the call moment, the call moment) is called",
      "then": "the count of returned statements whose MCC resolves through resolveCategoryByMcc to donations equals 4",
      "expect": 4 },
    { "id": "AC-013",
      "surface": "src/features/transactions — useTransactionsStore.syncFromMonobank()",
      "given": "a sandbox build where connect(userId, 'test-user-1') already filled the database",
      "when": "syncFromMonobank(userId) runs a second time",
      "then": "the transactions row count equals 44",
      "expect": 44 },
    { "id": "AC-014",
      "surface": "src/features/transactions — useTransactionsStore.syncFromMonobank()",
      "given": "a sandbox build where connect(userId, 'test-user-1') already filled the database",
      "when": "syncFromMonobank(userId) runs a second time",
      "then": "the store's syncStatus equals idle",
      "expect": "idle" },
    { "id": "AC-015",
      "surface": "src/features/monobank — useMonobankStore.connect()",
      "given": "a sandbox build where connect(userId, 'test-user-1') already filled the database and resetSandboxEnvironment() then emptied it",
      "when": "connect(userId, 'test-user-1') settles together with the sync it triggers",
      "then": "the transactions row count equals 44",
      "expect": 44 }
  ],
  "assumptions": [
    { "id": "AS-001",
      "text": "The fake and its fixtures live in src/services/monobank/sandbox/ — SandboxMonobankService.ts plus a fixtures.ts holding the token map. The ticket left the path and the module name open; this is the choice, and only the monobank barrel and getMonobankService import it." },
    { "id": "AS-002",
      "text": "The shared contract is an exported interface (MonobankApi) declaring exactly getClientInfo and getStatements. MonobankService implements it unchanged, the fake implements it, and TransactionSyncService plus both stores are retyped from the concrete class to the interface. No inheritance, no changes to MonobankService's body." },
    { "id": "AS-003",
      "text": "getMonobankService keeps its signature and its per-token cache. In a sandbox build it returns the fake for any token string — the OPES-59 throw is replaced by the fake, not kept beside it. The fake validates the token on each call, not at construction, so an unknown token surfaces where a real 401 would." },
    { "id": "AS-004",
      "text": "The token map holds exactly one entry, 'test-user-1'. The comparison is exact and case-sensitive; trimming stays where it already is, in connect(). An entry carries the client name, the account fixture and the statement fixtures of that user." },
    { "id": "AS-005",
      "text": "The message the real service inlines in its 401 branch today (api.ts) is extracted into one exported constant, MONOBANK_UNAUTHORIZED_MESSAGE, in src/services/monobank. Its value is unchanged character for character — the narrative below records it — so this is a behavior-preserving extraction in the normal build. Both the 401 branch and the fake raise MonobankError('UNAUTHORIZED', MONOBANK_UNAUTHORIZED_MESSAGE), which is what keeps the two texts from drifting apart. The fake raises it from getClientInfo and from getStatements alike, so an unlisted token fails at whichever call reaches it first." },
    { "id": "AS-006",
      "text": "The fixture set is exactly 44 statements: 4 dated today and 40 spread across the previous month and the month before last. Each of those two months holds at least one calendar day carrying more than one statement." },
    { "id": "AS-007",
      "text": "The 4 statements dated today are dated at the call moment minus fixed minute offsets, floored at the start of the current day. That keeps them inside today at any hour of the day and puts nothing in the future by construction. Historical statements take a fixed day-of-month no greater than 28 in the two preceding months." },
    { "id": "AS-008",
      "text": "Exactly 4 statements carry a donations MCC, with both 8398 and 8661 present. Fixtures carry MCC only; no category, no merchant rule and no user override is seeded." },
    { "id": "AS-009",
      "text": "The fake ignores both the from/to range and the account id argument, returning the whole statement set of the token's user on every getStatements call. A test user has exactly one account, so no account-level routing exists yet." },
    { "id": "AS-010",
      "text": "The fake makes no HTTP call, keeps no module-level mutable state, writes nothing to MMKV and reads nothing from the database. Amounts, descriptions, MCCs and statement ids are fixed literals; only dates are derived from the system clock at call time." },
    { "id": "AS-011",
      "text": "The fake carries no rate limiter and no artificial delay — every call resolves immediately. The ticket left the delay question open; choosing none keeps the fake pure and keeps the false Too Many Requests off the post-connect double sync." },
    { "id": "AS-012",
      "text": "The client-info fixture holds exactly one account: currency 980, type black, one masked pan and one IBAN. The card is created only by the production upsertMonobankCards path; the fake creates no card itself." },
    { "id": "AS-013",
      "text": "Statement ids are fixed literals independent of the date, so upsertBatch updates the existing rows on every later sync and the row count stays at the fixture size." },
    { "id": "AS-014",
      "text": "The normal build's path is untouched: the sandbox branch is a runtime isSandboxBuild() check inside getMonobankService, in the same place OPES-59 put the throw. No feature screen, store action, validation schema or repository changes behavior." },
    { "id": "AS-015",
      "text": "Statement amounts carry both signs and span several non-donation categories; every statement uses currency 980, so the mapper's minor-unit conversion is the same for all of them." }
  ],
  "verification_gaps": [
    { "id": "VG-001",
      "text": "This cycle produces no build and installs nothing. That a developer typing test-user-1 on the real connect screen of the sandbox app sees a filled application is not established here." },
    { "id": "VG-002",
      "text": "The individual sync triggers are not each exercised: pull-to-refresh on Home and on Transactions, the on-open autosync and the silent foreground sync go unasserted one by one. Only the post-connect sync and a direct store call are." },
    { "id": "VG-003",
      "text": "No screen is rendered against the fixtures. The month filter, the transaction lists and the donations screen are not exercised; AC-012 asserts a property of the fixture data, not what the donations screen displays." },
    { "id": "VG-004",
      "text": "The double sync the ticket names — connect's own sync racing the screen's useEffect sync — is not reproduced. AC-013 and AC-014 run two sequential syncs, not two concurrent ones, so the syncStatus guard under an instantly-resolving fake stays unverified." },
    { "id": "VG-005",
      "text": "Crossing a month boundary between two syncs is not exercised. The accepted cost — historical dates shifting forward a month and upsertBatch rewriting them — is not observed by any assertion here." },
    { "id": "VG-006",
      "text": "Loading states are not exercised. With no artificial delay the spinners, skeletons and disabled buttons of the sandbox build are not observable, and nothing in this suite would go red if they never appeared." },
    { "id": "VG-007",
      "text": "That the fake is truly stateless is only observed through one reset-and-reconnect cycle (AC-015). A hidden persisted marker that survives resetSandboxEnvironment but not the process would not be caught." },
    { "id": "VG-008",
      "text": "Nothing here runs against api.monobank.ua. AC-001 asserts which class the factory constructs in the normal build, not that a request to the real API still works." },
    { "id": "VG-009",
      "text": "The account-sync toggle is not exercised against the fake. That switching the single account off makes the next sync bring no transactions rests on existing syncAllAccounts behavior, unasserted in this cycle." },
    { "id": "VG-010",
      "text": "Nothing establishes that the fake and its fixtures are absent from the normal build's JavaScript bundle — only that the factory does not return them while the flag is off." }
  ],
  "non_goals": [
    "A dev menu or any way to steer the fake's responses — rate limit, 401 on a working token, timeouts, partial account failures",
    "A rate limiter inside the fake",
    "Switching between test users or honest multi-user separation",
    "Seeding merchant rules or user overrides",
    "Screens for merchant rules or user overrides",
    "Any change to the normal build's connect, sync or token validation",
    "Rewriting the existing lists, filters or categorization",
    "New obligations for the OPES-59 reset action"
  ] }
-->

# OPES-60 — Фейковий Monobank і фікстури для тестової збірки

Специфікація описує підміну джерела даних в одній точці — `getMonobankService`,
де OPES-59 лишив виняток, тепер у тестовій збірці стоїть фейковий сервіс із
фіксованим набором фікстур. Токен `test-user-1` наповнює застосунок бойовим
шляхом (client-info → `upsertMonobankCards` → `TransactionSyncService` →
`upsertBatch`), будь-який інший токен піднімає рівно ту саму помилку, що й
справжній 401.

**Текст помилки — точний рядок.** AC-003 стверджує рівність не прозі, а
іменованій константі `MONOBANK_UNAUTHORIZED_MESSAGE`, яку треба винести з
inline-літерала в 401-гілці `src/services/monobank/api.ts` (винесення без зміни
поведінки: значення лишається символ у символ тим самим). Її значення —
character-for-character, разом із крапкою в кінці й без жодних інших символів:

```
Invalid or missing Monobank token.
```

Цю саму константу піднімає й фейк, тож тестова збірка показує рівно той текст, що
й бойова, і власного повідомлення для тестового режиму не існує. Станція тестів
перевіряє літерал тут: `MONOBANK_UNAUTHORIZED_MESSAGE` має дорівнювати наведеному
рядку, а `errorMessage` у стора — цій константі.

Щоб критерії були спростовними, набір фікстур зафіксовано числом: **44 виписки —
4 сьогоднішні й 40 у двох попередніх місяцях**, з яких 4 мають донатні MCC. Тікет
лишав конкретні значення відкритими, тож це рішення винесене в `assumptions`
(AS-006, AS-008) — саме воно перетворює «щонайменше 40» на літерал, який тест може
перевірити, і саме його варто відхилити, якщо число має бути іншим. Так само
рішенням, а не даністю, є відсутність штучної затримки (AS-011): тікет лишив це
свідомо відкритим, і ціна названа окремо розривом VG-006.

Найдорожче, чого цей цикл **не** встановлює: жодного екрана не відмальовано проти
фікстур (VG-003), подвійний синк після підключення не відтворено (VG-004), і
збірки немає — тож те, заради чого тікет існує, «ввів токен і побачив наповнений
застосунок», лишається ручною перевіркою (VG-001).
