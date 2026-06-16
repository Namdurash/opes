<!-- Prerequisite: OPES-43 `analytics-charts` must be applied first. This change extends
     src/features/analytics/ (its screen, useAnalyticsStore, utils.ts, types.ts). Do not start
     until that feature exists on main. -->

## 1. Types & insight model

- [ ] 1.1 In `src/features/analytics/types.ts`, add the `Insight` discriminated union (keyed by `type`) with variants `netResult`, `spendingTrend`, `topCategory`, `categorySpike`, `largestExpense`; each variant carries a stable `id`, a `severity` (`'positive' | 'neutral' | 'warning'`), and its raw data fields (numbers/labels) — no pre-formatted strings
- [ ] 1.2 Add an `InsightContext` type capturing what the engine needs for one month plus the previous month (per-month `MonthSummary`, category breakdown `CategorySlice[]`, the month's expense transactions, and the resolved primary currency `{ code, symbol }`)

## 2. Pure rules engine (primary test target)

- [ ] 2.1 Create `src/features/analytics/insights.ts` with threshold constants as `as const`: `SPENDING_TREND_MIN_DELTA_PCT = 0.15`, `TOP_CATEGORY_MIN_SHARE = 0.30`, `CATEGORY_SPIKE_MIN_DELTA_PCT = 0.40`, `CATEGORY_SPIKE_MIN_SHARE = 0.05`, `INSIGHTS_MAX = 4`
- [ ] 2.2 Implement one pure `(ctx) => Insight | null` rule per insight: net result, spending trend, top-category dominance, category spike, largest expense — each with the guards from `design.md` D5 (previous month must have expenses for comparisons; relative noise floor for spikes; never divide by zero)
- [ ] 2.3 Implement `buildInsights(ctx): Insight[]` — run all rules, drop `null`s, sort by severity (warning → positive → neutral) with ties broken by the fixed rule order, cap at `INSIGHTS_MAX`; deterministic ordering
- [ ] 2.4 Write `src/features/analytics/insights.test.ts` (plain jest, like `features/donations/utils.test.ts`): each rule's fire/suppress boundaries, comparison guards (no previous month, divide-by-zero), spike noise floor, ranking order, the four-item cap, and the empty/insufficient-data → `[]` case

## 3. Store view-model

- [ ] 3.1 In `src/features/analytics/state/useAnalyticsStore.ts`, build the previous-month aggregation from the already-loaded working set (`selectMonthTransactions(workingSet, addMonths(selectedMonth, -1), primaryCurrency)` + the existing breakdown/summary helpers) — no new repository call
- [ ] 3.2 Assemble the current- and previous-month `InsightContext`, call `buildInsights`, and expose the result as an `insights: Insight[]` field on the store's view-model; recompute it in the existing `load()` / month-select actions

## 4. UI components

- [ ] 4.1 `components/InsightCard` — switch on `insight.type` for copy; format amounts via `formatMoney(amount, { code, symbol }, { showSign })` from `src/shared/utils/money.ts` (`showSign` for `net`), format percents inline; map `severity` to a theme token for the accent color; `shared/ui` primitives + theme tokens only, no hardcoded colors
- [ ] 4.2 `components/InsightsStrip` — read `insights` from the store and render an `InsightCard` per item; render nothing when `insights` is empty

## 5. Screen wiring

- [ ] 5.1 Render `InsightsStrip` at the top of `AnalyticsScreen`, above the existing donut / income-vs-expenses / top-categories widgets
- [ ] 5.2 Export any new public surface through `src/features/analytics/index.ts`; confirm no other feature imports the analytics feature's internals

## 6. Definition of Done

- [ ] 6.1 `npx tsc --noEmit` passes (strict) — no `any`, explicit return types on exports, `import type` for type-only imports
- [ ] 6.2 `npm run lint` passes — no unused imports/exports
- [ ] 6.3 `npm test` passes (including `insights.test.ts`)
- [ ] 6.4 Update `src/features/CLAUDE.md` only if a documented rule/structure changed (likely none — the work stays inside the existing analytics feature folder shape)
