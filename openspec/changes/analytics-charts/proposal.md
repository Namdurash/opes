Ticket: OPES-43

## Why

The app syncs and lists transactions but gives users no way to _understand_ their spending. You can scroll individual transactions, yet you can't answer "where did my money go this month?" or "did I spend more than I earned?". Transactions are already categorized — an Analytics screen turns that existing local data into at-a-glance monthly insights, fully offline, with no new dependency.

## What Changes

- New **Analytics** screen, reachable from Home → Quick Actions, scoped to one selected month.
- **Month switcher** (`‹ Month Year ›`, prev/next) that drives every widget on the screen; defaults to the current month.
- **Spending-by-category donut** (drawn with the already-installed `react-native-svg`): expenses of the selected month grouped by resolved `Category`, slices colored from the existing categorization palette, with a center total and a legend (amount + percent).
- **Income vs expenses** summary for the selected month: total income vs total expenses, plus the net figure.
- **Top categories** list: ranked top 5 expense categories for the month, each with amount and share of total.
- **Primary-currency-only** aggregation: include only transactions in the user's most common `currencyCode`; show a small note with the count of hidden other-currency transactions so the numbers stay honest. No FX conversion.
- New `useAnalyticsStore` that loads transactions via the existing transactions repository and resolves categories via the existing categorization service; all math lives in pure functions in the feature's `utils.ts`.
- New `ANALYTICS` route wired through `ROOT_ROUTES`, `RootStackParamList`, and `RootNavigator`, plus a Quick Actions entry on Home.

## Capabilities

### New Capabilities
- `analytics-charts`: Monthly spending analytics computed from local transactions — category-breakdown donut, income-vs-expenses summary, and top-categories ranking, with month-by-month navigation and single (primary) currency scoping.

### Modified Capabilities
<!-- None. This change is additive and read-only over existing transactions/categorization;
     it changes no existing spec's requirements. -->

## Impact

- **features/** — new `src/features/analytics/`: `AnalyticsScreen` (+ styles), `components/` (`MonthSwitcher`, `CategoryDonut`, `IncomeExpenseBars`, `TopCategoriesList`), `state/useAnalyticsStore.ts`, pure `utils.ts`, `types.ts`, `index.ts` barrel. One new button in `HomeScreen` Quick Actions.
- **app/** — new `ANALYTICS` route across `navigation/routes.ts`, `navigation/types.ts`, and `RootNavigator.tsx`.
- **Reads from** — `domain/transactions`, `domain/categorization`, `services/categorization`, and the transactions repository. No writes.
- **Data model** — none. No WatermelonDB schema-version bump and no migration; the feature is read-only over existing transactions.
- **Dependencies** — none added. Charts reuse the already-installed `react-native-svg`.

## Non-goals

- Balance-trend line chart over time (deferred — was explicitly dropped from this MVP).
- Multi-currency aggregation or FX conversion — primary currency only.
- Multi-month trend bars, weekly/yearly presets, or custom date ranges.
- Drill-down from a chart slice/legend row into the underlying transactions.
- Budgets, forecasting, and exporting or sharing analytics.
