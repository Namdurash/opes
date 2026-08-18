/**
 * OPES-61 — the pure test-convention guard.
 *
 * Classifies repo-relative POSIX path STRINGS against the test-file naming and
 * placement convention. Never touches the filesystem, never imports
 * `node:path` — every path is split on '/' and compared as a string, so the
 * same logic works whether the caller runs on macOS, Linux or Windows.
 *
 * The one allowed form is `<Source>.test.ts` or `<Source>.test.tsx`, living
 * under `src/`, under `scripts/`, or directly at the repository root, and
 * never inside a `__tests__/` or `__mocks__/` directory. Anything that reads
 * as a test by name (`.test.`, `.tests.`, `.spec.` infix, any extension) or by
 * location (under `__tests__/` or `__mocks__/`, any file, any depth) but
 * misses that one allowed form is a violation. A file that is not a test at
 * all — no infix, not under either directory — is never flagged.
 */

const RESTRICTED_DIRECTORIES = ['__tests__', '__mocks__'];
const ALLOWED_TEST_ROOTS = ['src', 'scripts'];

// Matches the LAST dot-delimited infix on the basename: `.test.`, `.tests.`
// or `.spec.`, followed by a single extension segment with no further dots.
const TEST_INFIX_PATTERN = /\.(test|tests|spec)\.[^.]+$/;

const splitPath = (path: string): string[] => path.split('/');

const basenameOf = (path: string): string => {
  const segments = splitPath(path);
  return segments[segments.length - 1];
};

const directorySegmentsOf = (path: string): string[] => splitPath(path).slice(0, -1);

const isUnderRestrictedDirectory = (path: string): boolean =>
  directorySegmentsOf(path).some(segment => RESTRICTED_DIRECTORIES.includes(segment));

const hasTestInfix = (basename: string): boolean => TEST_INFIX_PATTERN.test(basename);

/** Whether `path` names a test file at all, by name or by location. */
export const isTestFile = (path: string): boolean =>
  hasTestInfix(basenameOf(path)) || isUnderRestrictedDirectory(path);

const isAllowedTestLocation = (path: string): boolean => {
  const segments = splitPath(path);
  if (segments.length === 1) {
    return true; // a bare filename — directly at the repository root
  }
  return ALLOWED_TEST_ROOTS.includes(segments[0]);
};

const isAllowedTestForm = (path: string): boolean => {
  const basename = basenameOf(path);
  const hasAllowedName = basename.endsWith('.test.ts') || basename.endsWith('.test.tsx');
  return hasAllowedName && !isUnderRestrictedDirectory(path) && isAllowedTestLocation(path);
};

/** The subset of `paths` that breaks the test-file convention, input order kept. */
export const findTestConventionViolations = (paths: string[]): string[] =>
  paths.filter(path => isTestFile(path) && !isAllowedTestForm(path));
