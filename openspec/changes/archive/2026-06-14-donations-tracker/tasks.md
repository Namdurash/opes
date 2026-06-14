## 1. Stats helper (features/donations/utils)

- [x] 1.1 Add `computeDonationStats` (total of magnitudes, count, average; 0 when empty)
- [x] 1.2 Unit-test the helper (empty, single, multiple)

## 2. Store (features/donations/state)

- [x] 2.1 Add `useDonationsStore`: load all transactions, `resolveCategories`, filter to `donations`, expose donations + `isLoading` with error sheet

## 3. UI (features/donations)

- [x] 3.1 Add `DonationJar` SVG component (react-native-svg)
- [x] 3.2 Add `DonationsScreen` (+ styles): jar visual, total/count/average summary, list using the shared money formatter, empty state
- [x] 3.3 Barrel `index.ts`

## 4. Navigation (app/navigation, features/home)

- [x] 4.1 Append the `Donations` route and register `DonationsScreen`
- [x] 4.2 Add a Home entry point to Donations

## 5. Definition of Done

- [x] 5.1 `npx tsc --noEmit`, `npm run lint`, and `npm test` all pass
