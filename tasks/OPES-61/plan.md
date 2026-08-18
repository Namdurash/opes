<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-61",
  "spec_sha256": "a2085115ed5ca149591e50bf5bc25dd13a7de1b026dc09764b48da30052f0eb4",
  "risk": "medium",
  "files": {
    "create": ["scripts/testConventionGuard.ts", "scripts/checkTestConvention.ts"],
    "change": ["package.json"],
    "tests":  ["scripts/testConventionGuard.test.ts", "scripts/checkTestConvention.test.ts"] },
  "decisions": [
    { "id": "D-001",
      "statement": "Place the pure guard in scripts/testConventionGuard.ts exporting findTestConventionViolations(paths: string[]): string[] and a predicate isTestFile(path: string): boolean.",
      "because": "the CLI stays thin and the classification is unit-tested without spawning git" },
    { "id": "D-002",
      "statement": "Classify as a violation any path with a directory segment named __tests__ or __mocks__ at any depth, regardless of file extension.",
      "rejected": "do not narrow the rule to a root-level __tests__ only" },
    { "id": "D-003",
      "statement": "Treat a path as a test file when its basename carries the infix .test., .tests. or .spec. (any extension) or it lives under __tests__/ or __mocks__/.",
      "because": "AC-014 needs a notion of \"at least one test exists\"" },
    { "id": "D-004",
      "statement": "Allow only a basename ending exactly in .test.ts or .test.tsx, outside __tests__/__mocks__, located under src/, under scripts/, or at the repo root; every other test-by-name path is a violation.",
      "rejected": "do not accept .test.js or .test.jsx as an allowed form" },
    { "id": "D-005",
      "statement": "Never flag a non-test path: a file with no test infix and outside __tests__/__mocks__ (e.g. src/shared/utils/money.ts) is not added to the violations list." },
    { "id": "D-006",
      "statement": "Normalise every path by splitting on '/' (POSIX) and matching the string only; do not import node:path and do not touch the filesystem." },
    { "id": "D-007",
      "statement": "In scripts/checkTestConvention.ts obtain tracked paths via execSync('git ls-files', { encoding: 'utf8' }), split on newlines and drop empty lines." },
    { "id": "D-008",
      "statement": "On any git failure (thrown error or non-zero exit) terminate the process with exit code 1." },
    { "id": "D-009",
      "statement": "When no tracked path satisfies isTestFile, terminate with exit code 1 so a broken traversal cannot pass as a clean tree." },
    { "id": "D-010",
      "statement": "Print each violating path to stdout on its own line and exit 1 when violations exist, otherwise exit 0." },
    { "id": "D-011",
      "statement": "Change the package.json lint script to \"eslint . && tsx scripts/checkTestConvention.ts\" so the guard runs inside npm run lint via the existing tsx.",
      "because": "the spec requires the guard wired into lint with no new dependency" },
    { "id": "D-012",
      "statement": "Touch no file other than scripts/testConventionGuard.ts, scripts/checkTestConvention.ts and package.json; the tracked tree is already convention-clean, so move, rename or delete nothing.",
      "because": "the manual half of OPES-61 is already committed on this branch — no __tests__/, no __mocks__/, no .spec./.test.js path is tracked",
      "rejected": "do not relocate or delete any existing test file to make the newly wired lint pass" } ],
  "ac_coverage": {
    "AC-001": ["scripts/testConventionGuard.ts"],
    "AC-002": ["scripts/testConventionGuard.ts"],
    "AC-003": ["scripts/testConventionGuard.ts"],
    "AC-004": ["scripts/testConventionGuard.ts"],
    "AC-005": ["scripts/testConventionGuard.ts"],
    "AC-006": ["scripts/testConventionGuard.ts"],
    "AC-007": ["scripts/testConventionGuard.ts"],
    "AC-008": ["scripts/testConventionGuard.ts"],
    "AC-009": ["scripts/testConventionGuard.ts"],
    "AC-010": ["scripts/testConventionGuard.ts"],
    "AC-011": ["scripts/checkTestConvention.ts"],
    "AC-012": ["scripts/checkTestConvention.ts"],
    "AC-013": ["scripts/checkTestConvention.ts"],
    "AC-014": ["scripts/checkTestConvention.ts"],
    "AC-015": ["scripts/checkTestConvention.ts"] },
  "uncovered": [],
  "surface_map": {
    "test-convention guard function": ["scripts/testConventionGuard.ts"],
    "test-convention guard CLI": ["scripts/checkTestConvention.ts", "package.json"] },
  "external": [
    { "name": "git", "check": "lint" },
    { "name": "node:child_process", "check": "lint" },
    { "name": "node:process", "check": "lint" } ] }
-->

# OPES-61 — plan

Машинний обсяг циклу — лише guard тестової конвенції, дві частини під `scripts/`
(поряд з наявним `runAgentDev.ts`), на TypeScript, запуск через наявний `tsx`.

Чиста функція `scripts/testConventionGuard.ts` отримує перелік repo-відносних
POSIX-шляхів і повертає перелік порушень, не торкаючись ФС. Порушення: будь-який
шлях під сегментом `__tests__`/`__mocks__` (будь-яка глибина, будь-яке
розширення); базове ім'я з інфіксом `.spec.` чи `.tests.`; `.test.js`/`.test.jsx`;
а також валідний за іменем тест (`.test.ts`/`.test.tsx`) поза дозволеним місцем.
Дозволене місце — `src/`, `scripts/` або корінь репозиторію. Нетестові файли
(напр. `money.ts`) ігноруються. Модуль також експортує предикат `isTestFile`.

Тонкий CLI `scripts/checkTestConvention.ts` бере шляхи з `git ls-files`, кличе
функцію і завершує процес: код 1 за наявних порушень (кожен друкує у stdout),
код 1 коли жодного тест-файлу немає (`isTestFile`), код 1 за недоступного git,
інакше код 0. CLI підключається у `npm run lint`:
`eslint . && tsx scripts/checkTestConvention.ts` — і саме цей запуск (check
`lint` на фазі green) звіряє звернення до git, `node:child_process` і кодів
виходу з реальними, а не з підробкою.

Ручна половина тікета вже закомічена на гілці `chore/opes-61-unit-testing-architecture`:
теки `__tests__/` немає, `App.test.tsx` лежить у корені й переведений на RNTL,
`__mocks__` агента перейменовано на `fixtures`. Тому дерево, яке побачить
щойно підключений гард, уже чисте — переносити, перейменовувати чи видаляти
нічого не треба (D-012). Решта роботи тікета (jest-ізоляція, корінь `test/`,
фабрики, дублери, тестова база, пілот `CardsRepository`) — поза машинним
обсягом і зафіксована у verification_gaps специфікації.
