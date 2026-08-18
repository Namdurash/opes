/**
 * OPES-61 — the pure test-convention guard (AC-001..AC-010).
 *
 * The executable oracle for scripts/testConventionGuard.ts. Written before that
 * module exists, so it must fail red against its absence.
 *
 * The module under test is pulled in with `require` INSIDE each test, never with
 * a top-level `import`. Two reasons, both load-bearing:
 *
 *   1. A top-level import of a missing module takes the whole suite down ("Test
 *      suite failed to run") and then no criterion reports its own state. A lazy
 *      require lets every test fail on its own — on "Cannot find module" now, on
 *      an assertion once a stub exists.
 *   2. `npx tsc --noEmit` type-checks the scripts folder, and a static import of
 *      a file nobody has written yet breaks that type-check while the suite is
 *      red.
 *
 * So the contract is pinned here instead, in the interface below (D-001) — that
 * is the shape scripts/testConventionGuard.ts must export.
 *
 * Every path below is a repo-relative POSIX string, never a fixture on disk: the
 * function classifies strings and does not touch the filesystem (D-003, D-006).
 */

interface TestConventionGuard {
  /** The subset of `paths` that breaks the test-file convention, in any order. */
  findTestConventionViolations: (paths: string[]) => string[];
  /** Whether `path` names a test file at all — the CLI's "any tests?" probe. */
  isTestFile: (path: string) => boolean;
}

const loadGuard = (): TestConventionGuard => require('./testConventionGuard');

describe('findTestConventionViolations — the allowed form', () => {
  it('accepts a .test.ts nested under src/ (AC-001)', () => {
    // AC-001 — a .test.ts sitting beside the source it exercises is the
    // canonical form; the list of violations comes back empty.
    const { findTestConventionViolations } = loadGuard();

    const violations = findTestConventionViolations([
      'src/features/cards/state/useCardsStore.test.ts',
    ]);

    expect(violations).toHaveLength(0);
  });

  it('accepts App.test.tsx at the repository root (AC-002)', () => {
    // AC-002 — the root-level smoke test is allowed where it lies; the guard
    // must not demand that every test live under src/.
    const { findTestConventionViolations } = loadGuard();

    const violations = findTestConventionViolations(['App.test.tsx']);

    expect(violations).toHaveLength(0);
  });

  it('accepts a .test.ts nested under scripts/ (AC-003)', () => {
    // AC-003 — tooling tests under scripts/ (this very file, for one) are an
    // allowed location.
    const { findTestConventionViolations } = loadGuard();

    const violations = findTestConventionViolations([
      'scripts/testConventionGuard.test.ts',
    ]);

    expect(violations).toHaveLength(0);
  });

  it('ignores a non-test source file (AC-010)', () => {
    // AC-010 — the guard constrains test files only. A source file with no test
    // of its own is not a violation (D-005) — that is a non-goal of the ticket.
    const { findTestConventionViolations } = loadGuard();

    const violations = findTestConventionViolations([
      'src/shared/utils/money.ts',
    ]);

    expect(violations).toHaveLength(0);
  });
});

describe('findTestConventionViolations — the violating forms', () => {
  it('flags both .spec. and .tests. infixes (AC-004)', () => {
    // AC-004 — two near-miss names in one list, and both come back: the guard
    // reports every violation it finds, not just the first.
    const { findTestConventionViolations } = loadGuard();

    const violations = findTestConventionViolations([
      'src/shared/utils/money.spec.ts',
      'src/shared/utils/money.tests.ts',
    ]);

    expect(violations).toHaveLength(2);
  });

  it('flags a .test.js (AC-005)', () => {
    // AC-005 — the right infix in the wrong language: TypeScript is the only
    // allowed extension for a test (D-004).
    const { findTestConventionViolations } = loadGuard();

    const violations = findTestConventionViolations([
      'src/shared/utils/money.test.js',
    ]);

    expect(violations).toContain('src/shared/utils/money.test.js');
  });

  it('flags a .test.jsx (AC-006)', () => {
    // AC-006 — same rule for the JSX flavour: .test.tsx is allowed, .test.jsx
    // is not.
    const { findTestConventionViolations } = loadGuard();

    const violations = findTestConventionViolations(['src/features/Foo.test.jsx']);

    expect(violations).toContain('src/features/Foo.test.jsx');
  });

  it('flags a correctly named test inside a __tests__ directory (AC-007)', () => {
    // AC-007 — the NAME is allowed but the enclosing __tests__/ segment is not:
    // tests live beside their source, not in a parallel folder (D-002).
    const { findTestConventionViolations } = loadGuard();

    const violations = findTestConventionViolations([
      'src/features/__tests__/Foo.test.ts',
    ]);

    expect(violations).toContain('src/features/__tests__/Foo.test.ts');
  });

  it('flags any file inside a __mocks__ directory (AC-008)', () => {
    // AC-008 — a __mocks__/ segment condemns everything beneath it whatever the
    // extension (D-002, AS-004): jest reads that directory as a manual-mock
    // registry, which is why the agent's data folder is called fixtures/.
    const { findTestConventionViolations } = loadGuard();

    const violations = findTestConventionViolations([
      'src/agents/subscriptionDetective/__mocks__/ground_truth.ts',
    ]);

    expect(violations).toContain(
      'src/agents/subscriptionDetective/__mocks__/ground_truth.ts',
    );
  });

  it('flags an allowed-name test outside every allowed location (AC-009)', () => {
    // AC-009 — .test.ts is the right name, but e2e/ is neither src/, nor
    // scripts/, nor the repository root, so the path is a violation (AS-002).
    const { findTestConventionViolations } = loadGuard();

    const violations = findTestConventionViolations(['e2e/flow.test.ts']);

    expect(violations).toContain('e2e/flow.test.ts');
  });
});
