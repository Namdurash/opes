## 1. Remove dead auth-feature references

- [ ] 1.1 Remove the `./registration` and `./sign-in` exports from `src/features/index.ts`
- [ ] 1.2 Delete `__tests__/registration.store.test.ts` and `__tests__/sign-in.store.test.ts`
- [ ] 1.3 Confirm `npx tsc --noEmit` passes with zero errors

## 2. Fix lint errors

- [ ] 2.1 Remove the unused `Anthropic`, `fetchInRange`, and `getTransactionsTool` imports from `scripts/runAgentDev.ts`
- [ ] 2.2 Confirm `npm run lint` reports zero errors

## 3. Make the jest suites run

- [ ] 3.1 Add `jest.setup.js` importing `react-native-gesture-handler/jestSetup` (add the reanimated mock too if a suite still fails)
- [ ] 3.2 Reference it from `jest.config.js` via `setupFiles`
- [ ] 3.3 Confirm `npm test` runs every suite and all tests pass

## 4. Definition of Done

- [ ] 4.1 `npx tsc --noEmit`, `npm run lint`, and `npm test` all pass
