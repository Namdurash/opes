/**
 * OPES-61 — the test-convention guard CLI (AC-011..AC-015).
 *
 * The executable oracle for scripts/checkTestConvention.ts, the thin wrapper the
 * plan wires into `npm run lint`. Companion to scripts/testConventionGuard.test.ts,
 * which covers the pure function underneath (AC-001..AC-010). Written before the
 * CLI exists, so it must fail red against its absence.
 *
 * As in that file, the module under test is pulled in with `require` INSIDE the
 * runner rather than by a top-level `import`. Two reasons, both load-bearing:
 *
 *   1. A top-level import of a missing module takes the whole suite down ("Test
 *      suite failed to run") and then no criterion reports its own state. A lazy
 *      require lets every test fail on its own — on "Cannot find module" now, on
 *      an assertion once the CLI exists.
 *   2. `npx tsc --noEmit` type-checks the scripts folder, and a static import of
 *      a file nobody has written yet breaks that type-check while the suite is
 *      red.
 *
 * So the contract is pinned here instead (D-007..D-010) — that is what
 * scripts/checkTestConvention.ts must do to make these pass:
 *
 *   - Requiring the module RUNS the check, as a module side effect. It is a
 *     script, not a library: there is no exported entry point to call.
 *   - It reads the tracked paths from `execSync('git ls-files', …)` of
 *     `node:child_process`, mocked below — no git process is ever spawned, so
 *     the tree each test describes is exactly the tree the CLI sees.
 *   - It ends the run through `process.exit(code)`: 0 on a clean tree, 1 on
 *     violations, 1 when git throws, 1 when no tracked path is a test file.
 *   - It prints every violating path to standard output. `console.log` and
 *     `process.stdout.write` both count — the runner captures both.
 *
 * `process.exit` is stubbed to throw a sentinel rather than to return quietly:
 * the real call never returns, and the code after it must not run. The FIRST
 * recorded code is the one reported, because in a real process the first exit is
 * the only one that happens.
 *
 * What this suite deliberately does not prove: that a real `git ls-files` and a
 * real exit code behave as mocked here. That is the job of the `lint` check on
 * the green phase, where the CLI runs for real against the tracked tree.
 */

// The knob the mocked git call reads. `var`, because the jest.mock factories
// below are hoisted above every declaration and may only close over a name that
// already exists at that point — see the test-file exception in .eslintrc.js.
var mockGitLsFiles: () => string;

// Both specifiers, deliberately: jest keys a core-module mock by the literal
// module name (jest-resolve hands core names back verbatim as the module id), so
// mocking 'child_process' would NOT cover a `node:child_process` import, nor the
// other way round. Whichever one the CLI reaches for, it gets the fake.
jest.mock('node:child_process', () => ({
  execSync: () => mockGitLsFiles(),
}));
jest.mock('child_process', () => ({
  execSync: () => mockGitLsFiles(),
}));

/** Thrown in place of the real process.exit, which never returns. */
const PROCESS_EXITED = Symbol('process.exit');

interface CliRun {
  /** The code the CLI terminated with — its first process.exit, else 0. */
  exitCode: number;
  /** Everything the CLI wrote to standard output, one call per line. */
  stdout: string;
}

/** What `git ls-files` hands back: one path per line, trailing newline and all. */
const gitLsFiles = (paths: string[]): string => `${paths.join('\n')}\n`;

const runCli = (): CliRun => {
  const printed: string[] = [];
  const previousExitCode = process.exitCode;

  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const writeSpy = jest.spyOn(process.stdout, 'write');
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
    throw PROCESS_EXITED;
  });

  let exitCode = 0;
  try {
    jest.resetModules();
    require('./checkTestConvention');
  } catch (error) {
    // Anything that is not the stubbed exit — the missing module while this
    // suite is red, a genuine defect once it is green — belongs to the test.
    if (error !== PROCESS_EXITED) {
      throw error;
    }
  } finally {
    logSpy.mock.calls.forEach(call => {
      printed.push(call.map(arg => String(arg)).join(' '));
    });
    writeSpy.mock.calls.forEach(call => {
      printed.push(String(call[0]));
    });
    const codes = exitSpy.mock.calls.map(call => Number(call[0] ?? 0));
    exitCode = codes.length > 0 ? codes[0] : Number(process.exitCode ?? 0);
    process.exitCode = previousExitCode;
    exitSpy.mockRestore();
    writeSpy.mockRestore();
    logSpy.mockRestore();
  }

  return { exitCode, stdout: printed.join('\n') };
};

describe('checkTestConvention CLI', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exits 0 when every tracked test is in the allowed form (AC-011)', () => {
    // AC-011 — a `<Source>.test.ts(x)` under src/, one under scripts/, one at
    // the repository root, plus ordinary source: nothing to report, so the CLI
    // terminates with code 0 and `npm run lint` carries on.
    mockGitLsFiles = () =>
      gitLsFiles([
        'App.test.tsx',
        'src/features/cards/state/useCardsStore.test.ts',
        'scripts/checkTestConvention.test.ts',
        'src/shared/utils/money.ts',
      ]);

    const { exitCode } = runCli();

    expect(exitCode).toBe(0);
  });

  it('exits 1 when a tracked test breaks the convention (AC-012)', () => {
    // AC-012 — one violating path is enough to fail the run. App.test.tsx keeps
    // the tree from being empty of tests, so the non-zero code is attributable
    // to the __tests__/ segment and not to the "no tests at all" rule below.
    mockGitLsFiles = () =>
      gitLsFiles(['App.test.tsx', 'src/features/__tests__/Foo.test.ts']);

    const { exitCode } = runCli();

    expect(exitCode).toBe(1);
  });

  it('prints every violating path, not only the first (AC-013)', () => {
    // AC-013 — two violations go in and the SECOND one has to come back out:
    // that is what proves the CLI reports the whole list rather than bailing on
    // the first (D-010). Standard output, so one captured stream shows them all
    // (AS-005) — a developer fixes the tree in one pass, not one path per run.
    mockGitLsFiles = () =>
      gitLsFiles(['App.test.tsx', 'src/a.spec.ts', 'src/b.spec.ts']);

    const { stdout } = runCli();

    expect(stdout).toContain('src/b.spec.ts');
    expect(stdout).toContain('src/a.spec.ts');
  });

  it('exits 1 when the tree holds no test file at all (AC-014)', () => {
    // AC-014 — nothing here violates the convention, but nothing here is a test
    // either. A broken traversal returns exactly this: an empty, therefore
    // "clean", tree. Fail closed instead, so the guard cannot pass vacuously
    // (D-009).
    mockGitLsFiles = () =>
      gitLsFiles(['src/shared/utils/money.ts', 'package.json', 'README.md']);

    const { exitCode } = runCli();

    expect(exitCode).toBe(1);
  });

  it('exits 1 when git is unavailable (AC-015)', () => {
    // AC-015 — git missing, or the CLI run outside a repository, throws instead
    // of listing anything. That must not read as a clean tree either: the guard
    // fails closed on the failure it cannot see past (D-008).
    mockGitLsFiles = () => {
      throw new Error('spawnSync git ENOENT');
    };

    const { exitCode } = runCli();

    expect(exitCode).toBe(1);
  });
});
