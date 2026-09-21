/**
 * OPES-64 — the general error sheet, the one the bottom-sheet barrel owns.
 *
 * `showGeneralErrorBottomSheet` takes no arguments at all (AS-001). A failed local
 * write is the same failure wherever it happens, and two call sites each passing a
 * title is exactly how one failure grows two names for itself — so the title is the
 * helper's, and this file is the only place it is pinned.
 *
 * The sheet is observed here as the config handed to `useBottomSheetStore`, never as
 * rendered output (VG-003): nothing below establishes that a user can see the sheet
 * or dismiss it. Its body copy and button label are pinned by nothing in this cycle
 * (VG-004) and are deliberately not asserted.
 *
 * Two things about the shape of this file are deliberate.
 *
 * 1. The helper under test is reached by `require` inside `loadHelper`, NOT by a
 *    top-level `import` of `./index`. It is not exported yet, and a static ES import
 *    of a missing export is a compile error: `npx tsc --noEmit` would go red, and
 *    MonobankTokenService.test.ts ("AC-013 — type-checks with every awaited call site
 *    in place", OPES-58) shells out to exactly that command and asserts exit code 0 —
 *    so one static import here turns a green pre-existing test red for every other
 *    ticket. A `require` of a string literal is not resolved by the compiler, so the
 *    type-check stays green while both tests below still fail at runtime on a helper
 *    that is not a function. The `ShowGeneralErrorBottomSheet` type declared here is
 *    the contract this file is written against; when the export appears, the cast in
 *    `loadHelper` is what holds it to that shape — no parameters, no return value.
 *    This is the pattern migrateMonobankSecrets.test.ts (OPES-63) established.
 *
 * 2. The barrel is resolved per test rather than once at load, for the same reason:
 *    resolution failure belongs to the test that needed it, not to the whole suite.
 *    `useBottomSheetStore` is imported statically because it already exists, and no
 *    test resets the module registry — so the store instance the barrel writes
 *    through is the same one the assertions read.
 */
import { useBottomSheetStore } from '../../../stores/useBottomSheetStore';

/** AS-001 — the helper owns its title, so it takes nothing and returns nothing. */
type ShowGeneralErrorBottomSheet = () => void;

/** See note 1 in the file header — resolved per test, not at load. */
const loadHelper = (): ShowGeneralErrorBottomSheet => {
  const { showGeneralErrorBottomSheet } = require('./index') as {
    showGeneralErrorBottomSheet: ShowGeneralErrorBottomSheet;
  };
  return showGeneralErrorBottomSheet;
};

beforeEach(() => {
  // The `given` of both criteria — the store holds no config. Without it a sheet
  // left over from the previous case would satisfy the assertions below.
  useBottomSheetStore.setState({ visible: false, config: null });
});

describe('showGeneralErrorBottomSheet', () => {
  it('AC-001 — titles the sheet "Something went wrong"', () => {
    expect(useBottomSheetStore.getState().config).toBeNull();
    const showGeneralErrorBottomSheet = loadHelper();

    showGeneralErrorBottomSheet();

    expect(useBottomSheetStore.getState().config?.title).toBe(
      'Something went wrong',
    );
  });

  it('AC-002 — raises it on the existing error variant', () => {
    expect(useBottomSheetStore.getState().config).toBeNull();
    const showGeneralErrorBottomSheet = loadHelper();

    showGeneralErrorBottomSheet();

    // AS-002: the general sheet reuses the `error` BottomSheetVariant rather than
    // introducing a fourth one — that is what keeps useBottomSheetStore and
    // GlobalBottomSheet out of a change the ticket scopes to two files.
    expect(useBottomSheetStore.getState().config?.variant).toBe('error');
  });
});
