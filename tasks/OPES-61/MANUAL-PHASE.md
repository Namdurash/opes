# OPES-61 — manual-phase handoff

Written by the aif orchestrator when it stopped so you could do the manual half by
hand. The foundry cycle for the **guard** is spec'd, planned and judged (all committed);
it is blocked at `verify-red` because the guard can only go green on a convention-clean
tree, and cleaning the tree is this ticket's manual work (deletions/renames that the
`scope` gate rejects by design — that is *why* the ticket makes them manual).

## Where the foundry is right now

Committed on this branch (`chore/opes-61-unit-testing-architecture`):

- `919ae15` spec (attempt 2 — trimmed 16→15 ACs), `cd79e3c` spec-judge (PASS),
  approval recorded (assumptions + 8 gaps acknowledged), `dd9eb6a` plan,
  `590cbf2` plan-judge (PASS).
- Machine scope is the **test-convention guard only**: a pure function
  `findTestConventionViolations(paths) => string[]` + `isTestFile`, and a CLI that reads
  `git ls-files` and calls it. Lives in `scripts/`, TS, run via existing `tsx`, wired into
  `npm run lint`. 15 ACs: AC-001..010 the function, AC-011..015 the CLI.

`verify-red` reject that stopped us: the plan's `files.tests` lists **both**
`__tests__/App.test.tsx` and `App.test.tsx`, but plan decision **D-012** deletes the
former — `verify-red` (`.aif/gates/verify-red.sh:61-67`) requires every declared test
file to exist, so it can't be satisfied. And even fixed, green's `lint` runs the guard
over the whole tree, which still holds `__mocks__/` violations (below) → `lint` exits 1 →
green fails. Both are the same root cause: the foundry was started before the manual
tree-cleaning.

The tests station's uncommitted output was set aside (ephemeral scratchpad) — ignore it;
the foundry regenerates the guard tests when you resume.

## Baseline to capture BEFORE your first manual commit (for VG-004)

RNTL-migration equivalence is verified by a JUnit diff: describe/test names **and their
counts** must match 1:1 between "before first manual commit" and "at the end", with only
two expected differences (App's new suite path, and any brand-new suites). Capture it now:

```sh
JEST_JUNIT_OUTPUT_FILE=/tmp/opes61-junit-baseline.xml \
  npx jest --ci --reporters=default --reporters=jest-junit
```

Observed baseline: **15 suites / 88 tests, all green**. That 15 = the **9 real worktree
suites** + **6 stale copies** under `.claude/worktrees/admiring-stonebraker-1f61ac/`. The
9 real suites:

- `__tests__/App.test.tsx`
- `src/features/cards/state/useCardsStore.test.ts`
- `src/features/donations/utils.test.ts`
- `src/features/settings/utils.test.ts`
- `src/features/transactions/TransactionsScreen.test.tsx`
- `src/features/transactions/state/useTransactionsViewModel.test.tsx`
- `src/services/monobank/MonobankAccountSelectionService.test.ts`
- `src/services/secret-storage/SecretStore.test.ts`
- `src/shared/utils/money.test.ts`

Cold-cache warnings to make disappear (VG-002) — run `npx jest --clearCache` first to see
them: `jest-haste-map: Haste module naming collision: opes` and
`duplicate manual mock found: ground_truth` / `mock_transactions`. All three come from the
`.claude/worktrees/` copies shadowing the root files. `.git/info/exclude` already ignores
`.claude/worktrees/` and `node_modules`.

## Manual-phase commit plan (each gated by `npx tsc --noEmit` + `npm run lint` + `npm test`)

Ordering matters — the test base must exist before the App test can move onto it, and the
tree must be clean before `test.roots`/`testMatch` tighten.

1. **`chore(OPES-61): isolate jest from external worktrees`** — `jest.config.js`: add
   `modulePathIgnorePatterns: ['/\\.claude/']`. Removes the worktree copies from the Haste
   map → kills the `opes` collision, the duplicate-mock warnings, and foreign-suite
   collection at once. Keep `forceExit: true` for now (App test still leaks handles).
   Verify: `npx jest --clearCache && npm test` → 9 suites, no collision/dup-mock warnings.

2. **`refactor(OPES-61): rename subscriptionDetective __mocks__ to fixtures`** — `git mv
   src/agents/subscriptionDetective/__mocks__ src/agents/subscriptionDetective/fixtures`;
   update the one importer `transactionSource.ts:2`
   (`./__mocks__/mock_transactions.json` → `./fixtures/mock_transactions.json`). These are
   dev-harness data, not test doubles; renaming stops jest registering them as manual
   mocks and removes a guard `__mocks__/` violation. Do NOT move them into `test/`.

3. **`test(OPES-61): add shared test/ root — db helper, factories, doubles, setup`** —
   create `test/` at repo root holding ONLY test support (no `*.test.ts`):
   - **DB helper**: builds a fresh in-memory DB per case from the **product schema** and
     tears it down. Construct `new Database({ adapter: new LokiJSAdapter({ schema:
     databaseSchema, migrations: databaseMigrations, useWebWorker: false,
     useIncrementalIndexedDB: false }), modelClasses: [UserModel, CardModel,
     TransactionModel, UserOverrideModel, MerchantRuleModel] })` — the same construction
     `src/services/database/database.ts:15-53` does under jest, but per-instance. Assert
     the created DB's schema `version` equals `databaseSchema.version` (currently **7**;
     `src/services/database/schema.ts:4`). Do **not** run the migration chain (no v1
     snapshot exists — honest gap, deferred).
   - **Factories**: `makeCard(overrides)` (domain `Card`, 16 fields —
     `src/domain/cards/types.ts`) and `makeTransaction(overrides)` (collapses the three
     duplicated `makeTx` in donations/settings/useTransactionsViewModel tests).
   - **Repository double**: `makeCardsRepositoryStub(overrides)` returning all 9
     `CardsRepositoryContract` methods (`src/models/cards/CardsRepository.ts:22-32`) as
     typed `jest.fn()`s — property: adding a contract method must not require touching any
     test. Decide the default return of an unstubbed method.
   - Decide whether `jest.setup.js` moves into `test/` or stays at root.

4. **`refactor(OPES-61): relocate App smoke test beside App.tsx on the test base`** —
   move `__tests__/App.test.tsx` → `App.test.tsx`, rewrite imports (`../App`→`./App`,
   `../src/...`→`./src/...`), and switch it onto the new DB helper so it no longer leaks
   handles; then **remove `forceExit: true`** from `jest.config.js` and delete the now-empty
   `__tests__/`. Do NOT migrate its `react-test-renderer` usage yet (that's commit 8).
   Verify: `npm test` self-exits with no open-handle warning.

5. **`chore(OPES-61): point test.roots at test/`** — `.aif/project.json`
   `test.roots: ["__tests__"]` → `["test"]`. (`__tests__` is gone after commit 4.) This is
   the foundry's frozen-file net for the shared harness.

6. **`chore(OPES-61): narrow jest testMatch to .test.ts(x)`** — `jest.config.js` add a
   `testMatch` allowing only `.test.ts`/`.test.tsx` (form, not location — root `App.test.tsx`
   and `scripts/` tests stay collected).

7. **`chore(OPES-61): add lint rules enforcing the test convention`** — `.eslintrc.js`
   (currently just `extends: '@react-native'`): (a) ban importing `react-test-renderer`
   (and subpaths) repo-wide; (b) forbid product code importing from `test/`; (c) a `var`
   exception scoped to test files, `test/`, and root jest files (`jest.config.js`,
   `jest.setup.js`) for the hoisted-mock pattern. Update root `CLAUDE.md`'s "Never var"
   text to match (commit 11 documents the whole convention).

8. **`refactor(OPES-61): migrate tests off react-test-renderer to @testing-library/rn`** —
   add `@testing-library/react-native` v13 (the ONE new dep); drop `react-test-renderer`
   and `@types/react-test-renderer` from `package.json`. Migrate the 3 renderer suites:
   - `useTransactionsViewModel.test.tsx` — replace the `Host`+`vmRef` probe with RNTL's
     `renderHook`; drop manual `renderer.update`.
   - `TransactionsScreen.test.tsx` — replace `root.findAll`/testID traversal with RNTL
     queries (`getByTestId`, `getByText`).
   - `App.test.tsx` — replace `ReactTestRenderer.create/act/unmount` with RNTL `render`.
   Completeness criterion is **no test imports `react-test-renderer`** (pure store/util
   tests may need no change). Then diff the end JUnit vs the baseline — only the two
   expected differences allowed.

9. **`test(OPES-61): rewrite useCardsStore.test.ts onto shared factories/doubles`** — this
   file inlines the 9-method Cards stub **10×** (lines 27-37, 48-58, …, 245-255). Replace
   each with `makeCardsRepositoryStub({ methodUnderTest: … })` and use `makeCard`.

10. **`test(OPES-61): add CardsRepository pilot on the test base`** — first real
    `src/models/` test. Happy path of each public method + empty-table + not-found, each
    case on a fresh in-memory DB from the helper. Include a pair proving isolation (case A
    writes a row, case B asserts the table is empty). Honest gap: this exercises LokiJS,
    not the device SQLite adapter.

11. **`docs(OPES-61): document the test convention`** — record location/name rule and the
    `var` exception in `CLAUDE.md` (root and/or `src/features/CLAUDE.md`, or a `test/CLAUDE.md`)
    as a description of what the machine already enforces — not a substitute for it.

## Resuming the foundry for the guard (after the tree is clean)

The committed plan is now partly stale (it tried to absorb D-012). Before re-running:

1. Revise `tasks/OPES-61/plan.md`: **remove D-012** and drop `__tests__/App.test.tsx` +
   `App.test.tsx` from `files.tests` (App is handled manually now) — `files.tests` becomes
   the two guard suites only. Keep `files.create` (the two guard modules) and
   `files.change` (`package.json` lint wiring). Recompute nothing by hand — re-run the
   `plan` station so `spec_sha256` stays bound, then `plan-judge`.
2. `aif _state OPES-61` and follow it: `plan` → `plan-judge` → `tests` (writes the guard
   suites, red because the modules don't exist) → `verify-red` (now freezes on a clean
   tree) → `implement` (writes `scripts/testConventionGuard.ts` +
   `scripts/checkTestConvention.ts`, wires `lint`) → `green`.
3. Re-run `aif run OPES-61` from a session started by `aif run` (so `AIF_RUN=1` and the
   stations dispatch normally).

## Assumptions the guard spec locked (already approved)

- Exit code **1** for every CLI failure (violations, zero tests, git unavailable).
- Allowed location for a bare `.test.ts(x)`: any depth under `src/` or `scripts/`, or the
  repo-root dir itself — nowhere else.
- Function matches the path string (no fs); CLI feeds it git-tracked paths.
- `__tests__`/`__mocks__` at any depth → everything beneath is a violation, any extension.
- Violations printed to stdout; all of them, not just the first.
