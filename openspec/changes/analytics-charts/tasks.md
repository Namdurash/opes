## 1. Feature scaffold & types

- [ ] 1.1 Create `src/features/analytics/` with an `index.ts` barrel (start with the feature's public exports stubbed) following `src/features/CLAUDE.md`
- [ ] 1.2 Define feature types in `types.ts`: `AnalyticsMonth` (year+month), `CategorySlice` (`categoryId`, `label`, `color`, `amount`, `share`), `MonthSummary` (`income`, `expenses`, `net`), and the screen view-model (`primaryCurrencySymbol`, `slices`, `summary`, `topCategories`, `hiddenCount`, `isEmpty`)

## 2. Pure aggregation helpers (primary test target)

- [ ] 2.1 `utils.ts`: month helpers — `currentMonth()`, `addMonths(month, delta)`, `isCurrentMonth(month)`, `formatMonthLabel(month)` (e.g. "June 2026")
- [ ] 2.2 `utils.ts`: `resolvePrimaryCurrency(transactions)` — most frequent `currencyCode`, ties broken by the most recent transaction's currency
- [ ] 2.3 `utils.ts`: `selectMonthTransactions(transactions, month, currencyCode)` — filter to the month (via `occurredAtIso`) and the primary `currencyCode`; also return the count excluded by currency
- [ ] 2.4 `utils.ts`: `computeCategoryBreakdown(categorizedExpenses)` — group expenses by `CategoryId`, sum amounts, attach category `color`/`label`, compute each slice's share of total expenses
- [ ] 2.5 `utils.ts`: `computeMonthSummary(transactions)` — totals for income, expenses, and net (income − expenses)
- [ ] 2.6 `utils.ts`: `topCategories(slices, limit = 5)` — sort by amount descending, cap at `limit`

## 3. Feature store

- [ ] 3.1 Create `state/useAnalyticsStore.ts` using the store-factory pattern from `features/transactions/state/useTransactionsStore.ts`: instantiate the transactions repository and categorization service at module scope
- [ ] 3.2 State + actions: `selectedMonth` (defaults to current month), `load()` (read transactions, resolve categories via the service, build the view-model with the `utils` helpers), `selectPreviousMonth()`, `selectNextMonth()` (no-op/disabled when already on the current month)

## 4. UI components

- [ ] 4.1 `components/MonthSwitcher` — prev/next controls + formatted month label; next disabled on the current month; theme tokens + `shared/ui` primitives only
- [ ] 4.2 `components/CategoryDonut` — `react-native-svg` ring (`<Circle>` slices via `strokeDasharray`/`strokeDashoffset`), center total, per-slice category color; handle single-category (full ring) and zero-expense cases
- [ ] 4.3 `components/CategoryDonut` legend — list each category with label, amount, and percentage share
- [ ] 4.4 `components/IncomeExpenseBars` — selected month's income, expenses, and net (net may be negative)
- [ ] 4.5 `components/TopCategoriesList` — ranked rows (amount + share) using `shared/ui` list rows

## 5. Screen, navigation & entry point

- [ ] 5.1 `AnalyticsScreen.tsx` + `AnalyticsScreen.styles.ts` — compose `MonthSwitcher` + the three widgets; empty state when the month has no primary-currency data; show the "N transactions in other currencies hidden" note when applicable
- [ ] 5.2 Register the route: add `ANALYTICS` to `app/navigation/routes.ts`, extend `RootStackParamList` in `app/navigation/types.ts`, add a `<Stack.Screen>` in `RootNavigator.tsx`
- [ ] 5.3 Add an "Analytics" button to `HomeScreen` Quick Actions using `navigation.navigate(ROOT_ROUTES.ANALYTICS)`
- [ ] 5.4 Export the screen through `src/features/analytics/index.ts` and confirm no other feature imports its internals

## 6. Tests & Definition of Done

- [ ] 6.1 `utils.test.ts` (jest, like `features/donations/utils.test.ts`): primary-currency selection incl. tie-break, month+currency filtering with hidden count, category breakdown + shares, month summary incl. negative net, top-5 ranking, and the empty-month case
- [ ] 6.2 `npx tsc --noEmit` passes (strict)
- [ ] 6.3 `npm run lint` passes — no unused imports/exports
- [ ] 6.4 `npm test` passes
- [ ] 6.5 Update `src/features/CLAUDE.md` only if a documented rule/structure changed (the new feature follows the existing folder shape, so likely no change)
