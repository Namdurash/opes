## Context

The repo fails its Definition of Done: 5 `tsc` errors, 3 `lint` errors, and 4 failing jest suites. Two root causes: (1) dead references to the removed `registration`/`sign-in` auth features (a barrel export and two `*.store.test.ts` files), and (2) `jest.config.js` has no `setupFiles`, so importing `react-native-gesture-handler` (directly in `App.tsx`, transitively via `@gorhom/bottom-sheet` in `useCardsStore`) throws `Invariant: 'RNGestureHandlerModule' could not be found` before any test runs.

## Goals / Non-Goals

**Goals:**
- `tsc --noEmit`, `lint`, and `npm test` all green.
- Remove dead code rather than stub it.
- A minimal, conventional jest native-module setup future component/store tests can rely on.

**Non-Goals:**
- Re-adding auth features or new test coverage.
- Reworking `transformIgnorePatterns` or the jest preset beyond what is needed to run the existing suites.

## Decisions

- **Delete dead code, don't stub.** Drop the `./registration`/`./sign-in` exports from `src/features/index.ts` and remove the two auth `*.store.test.ts` files. They reference modules that no longer exist; stubs would be dead weight.
- **Mock native modules via a jest setup file, not per-test.** Add `jest.setup.js` referenced from `jest.config.js` `setupFiles`, using `react-native-gesture-handler/jestSetup` (the library's official mock). This fixes `App.test.tsx` and `useCardsStore.test.ts` together and is the RN-conventional approach. Alternative considered: per-file `jest.mock('react-native-gesture-handler')` — rejected (repetitive, easy to forget in new suites).
- **Lint fix is deletion, not disable.** Remove the three unused imports in `scripts/runAgentDev.ts` rather than adding an eslint-disable.

## Risks / Trade-offs

- [The bottom-sheet chain may also need `react-native-reanimated`'s jest mock] → if a suite still fails on reanimated after the gesture-handler mock, add reanimated's standard mock to the same `jest.setup.js`. Verified by running `npm test` to green before the change is complete.
- [Deleting test files lowers the suite count] → acceptable: they exercise removed features and currently only emit errors.
