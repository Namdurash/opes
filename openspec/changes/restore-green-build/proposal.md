Ticket: OPES-34

## Why

The repository fails its own Definition of Done: `npx tsc --noEmit` reports 5 errors, `npm run lint` reports 3 errors, and all 4 jest suites fail to run. Until the build is green the AI SDLC's per-phase Definition-of-Done gate (`/sdlc:commit`) blocks every commit. The breakage is fallout from the deleted `registration`/`sign-in` auth features plus a missing jest native-module setup.

## What Changes

- Remove the orphaned `./registration` and `./sign-in` exports from `src/features/index.ts` (those feature folders were deleted).
- Delete the dead auth test files `__tests__/registration.store.test.ts` and `__tests__/sign-in.store.test.ts`, which import removed stores and `hashPassword`.
- Remove three unused imports in `scripts/runAgentDev.ts` (`Anthropic`, `fetchInRange`, `getTransactionsTool`) — the lint errors.
- Add a jest setup that mocks the native modules pulled in via `react-native-gesture-handler` / `@gorhom/bottom-sheet`, so `__tests__/App.test.tsx` and `src/features/cards/state/useCardsStore.test.ts` run.
- Result: `tsc --noEmit`, `lint`, and `test` all pass — the Definition of Done is met.

## Capabilities

### New Capabilities
- `build-integrity`: the codebase SHALL satisfy the Definition of Done — `tsc --noEmit`, `lint`, and the jest suite all pass.

### Modified Capabilities
- _None — no product feature behavior changes._

## Impact

- `src/features/index.ts` (feature barrel), `scripts/runAgentDev.ts` (dev-only script), `__tests__/` (remove dead suites), `jest.config.js` + a new `jest.setup.js`.
- No runtime/app behavior change. No `domain/`, repository (`models/`), `services/`, or WatermelonDB changes; no schema-version bump or migration.

## Non-goals

- Re-introducing the removed `registration` / `sign-in` auth features.
- Fixing pre-existing lint *warnings* (inline styles, unused eslint-disable) — `eslint .` already exits 0 with only warnings, so they do not block the Definition of Done.
- Adding new test coverage beyond making the existing suites run.
