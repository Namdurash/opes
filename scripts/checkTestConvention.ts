/**
 * OPES-61 — the test-convention guard CLI.
 *
 * A thin script, not a library: requiring/running this file performs the
 * check as a side effect and terminates the process. It is wired into
 * `npm run lint` (`eslint . && tsx scripts/checkTestConvention.ts`) so a test
 * file that drifts from the naming/placement convention fails lint the same
 * way a type error or an unused import does.
 *
 * - Reads the tracked paths from `git ls-files`.
 * - Exits 1 if git itself fails (not a repo, git missing, non-zero exit).
 * - Exits 1 if not a single tracked path looks like a test at all — a broken
 *   traversal returns an empty, and therefore falsely "clean", tree.
 * - Otherwise runs the pure guard (scripts/testConventionGuard.ts) over the
 *   tracked tree: prints every violating path and exits 1, or exits 0.
 */

import { execSync } from 'node:child_process';
import { findTestConventionViolations, isTestFile } from './testConventionGuard';

const readTrackedPaths = (): string[] => {
  const output = execSync('git ls-files', { encoding: 'utf8' });
  return output.split('\n').filter(path => path.length > 0);
};

const main = (): void => {
  let trackedPaths: string[];

  try {
    trackedPaths = readTrackedPaths();
  } catch {
    process.exit(1);
    return;
  }

  if (!trackedPaths.some(isTestFile)) {
    process.exit(1);
    return;
  }

  const violations = findTestConventionViolations(trackedPaths);

  if (violations.length > 0) {
    violations.forEach(violation => console.log(violation));
    process.exit(1);
    return;
  }

  process.exit(0);
};

main();
