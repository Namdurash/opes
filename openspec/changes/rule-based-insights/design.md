## Context

`analytics-charts` (OPES-43) introduces `src/features/analytics/`: a read-only screen that loads the user's transactions once into `useAnalyticsStore`, resolves their categories via the categorization service, and aggregates the selected month with pure helpers in `utils.ts` (`selectMonthTransactions`, `computeCategoryBreakdown`, `computeMonthSummary`, `topCategories`, `addMonths`, …). It renders a category donut, an income-vs-expenses summary, and a top-categories list — all scoped to a single primary currency.

That feature surfaces numbers but not conclusions. `rule-based-insights` adds a thin, deterministic layer on top: a pure rules engine that reads the same aggregated month (and the previous month, for comparisons) and emits a few plain-language insight cards shown as a strip at the top of the Analytics screen.

This change is **additive and entirely local**. It introduces no backend, no schema change, no new dependency, and — explicitly — no LLM. It must obey the enforced one-directional architecture: the new components call store actions only; `useAnalyticsStore` orchestrates the existing repository + categorization service (already wired by OPES-43); every rule is a pure function over domain data.

**Prerequisite:** OPES-43 must be implemented first. `src/features/analytics/` does not exist on `main` yet; this design assumes its screen, store, `utils.ts`, and `types.ts` are in place and extends them.

## Goals / Non-Goals

**Goals:**

- A ranked strip of short, plain-language insight cards atop the Analytics screen for the selected month.
- A pure, deterministic rules engine (`buildInsights`) as the primary unit-test target — no RN, no DB, no network, no LLM.
- Reuse of analytics' already-loaded working set and pure aggregation helpers for both the current and previous month — zero extra DB reads.
- Honest scoping: insights inherit analytics' primary-currency selection and never aggregate across currencies.
- Zero new dependencies; currency formatting via the existing shared `formatMoney`.

**Non-Goals:**

- Any LLM/network path, or any change to the dev-only subscription-detective agent.
- Home placement, a dedicated Insights screen, insight persistence/history, notifications, or drill-down into transactions.
- User-configurable rules or thresholds; multi-currency aggregation; i18n.
- Changing how categories are resolved or how the month is aggregated (consumed from analytics as-is).

## Decisions

### D1: Deliver inside the analytics feature, not a new `src/features/insights/`

The engine needs analytics' pure aggregation helpers, and the project rule forbids importing another feature's `utils.ts` ("promote shared helpers to `src/shared/`"). Two options:

- **(chosen) Extend `src/features/analytics/`** — add `insights.ts`, `insights.test.ts`, and two components alongside the existing analytics code. The engine calls the same-feature helpers directly; nothing crosses a feature boundary; the change stays small and additive.
- **(rejected) New `src/features/insights/`** — would require promoting analytics' aggregation helpers into `src/shared/utils/` (a refactor of OPES-43's surface) so a second feature could consume them. Heavier, and unjustified while insights surface only inside Analytics.

`rule-based-insights` remains a distinct **capability** (its own delta spec); only the code's physical home is the analytics feature. Revisit the split if insights ever need to appear outside Analytics (e.g. on Home).

### D2: A pure rules engine; `Insight` is a discriminated union of raw data, not strings

`buildInsights(ctx)` is a pure function in `insights.ts`; each rule is a pure `(ctx) => Insight | null`. The engine returns `Insight[]` already ranked and capped. This mirrors `features/donations/utils.ts` + `utils.test.ts` and makes the whole rule set testable with plain jest.

`Insight` is a **discriminated union keyed by `type`** carrying the raw numbers/labels a rule produced (e.g. `net`, `deltaPct`, `share`, `amount`, category `label`/`color`), plus a shared `id` and `severity: 'positive' | 'neutral' | 'warning'`. It deliberately carries **no pre-formatted display string** — keeping money/percent formatting out of the pure layer (the M2 lesson: formatting is locale/currency-specific and belongs in the UI). `InsightCard` maps each variant to copy and formats via `formatMoney`. Discriminated union over boolean flags is also the house style for mutually-exclusive modes.

### D3: Comparisons reuse analytics' helpers for the previous month — no extra DB read

Several rules compare against last month. Analytics already loads the entire working set once and aggregates in memory per selected month (its own risk mitigation). The engine therefore builds a small `InsightContext` for **both** months from that same working set:

- current = the month/currency slice analytics already computed (summary, category breakdown, top categories, the expense transactions);
- previous = the same helpers applied to `addMonths(selectedMonth, -1)` with the same primary currency.

No new repository call, no new query — just two in-memory aggregations over data already in the store.

### D4: Extend the analytics view-model with `insights` — no second store

`useAnalyticsStore`'s existing `load()` / month-select actions compute the current- and previous-month aggregations and call `buildInsights`, storing the result as an `insights: Insight[]` field on the view-model. No new store, no new repository wiring, no cross-store calls. Components subscribe to `insights` via the store and render the strip. This honors D2 of OPES-43 (the store orchestrates; math is pure) without coupling anything new.

### D5: The v1 rule set — five deterministic rules with explicit thresholds and guards

All thresholds are `as const` constants in `insights.ts` (easy to tune). Every comparison rule is guarded so it never divides by zero and never fires on absent/empty prior data.

| # | Rule (`type`) | Fires when | Severity | Carries |
|---|---|---|---|---|
| 1 | `netResult` | month has ≥1 primary-currency transaction | `positive` if `net ≥ 0`, else `warning` | `net` |
| 2 | `spendingTrend` | previous month has expenses (`previousExpenses > 0`) **and** `\|deltaPct\| ≥ 15%` | `warning` if up, `positive` if down | `currentExpenses`, `previousExpenses`, `deltaPct` |
| 3 | `topCategory` | month has expenses **and** top category `share ≥ 30%` | `neutral` | `categoryId`, `label`, `color`, `amount`, `share` |
| 4 | `categorySpike` | a category present in both months with `previousAmount > 0`, `deltaPct ≥ 40%`, **and** current `share ≥ 5%` of the month's expenses (relative floor → currency-agnostic noise guard); the single largest qualifying increase wins | `warning` | `categoryId`, `label`, `color`, `currentAmount`, `previousAmount`, `deltaPct` |
| 5 | `largestExpense` | month has ≥1 expense | `neutral` | `amount`, `title`, `categoryLabel` |

Constants: `SPENDING_TREND_MIN_DELTA_PCT = 0.15`, `TOP_CATEGORY_MIN_SHARE = 0.30`, `CATEGORY_SPIKE_MIN_DELTA_PCT = 0.40`, `CATEGORY_SPIKE_MIN_SHARE = 0.05`, `INSIGHTS_MAX = 4`.

### D6: Deterministic ranking and a hard cap; insufficient data → no strip

`buildInsights` runs all rules, drops `null`s, then sorts by severity (`warning` → `positive` → `neutral`), breaking ties by a fixed rule order (the table above), and caps at `INSIGHTS_MAX`. The order is fully deterministic so it can be asserted in tests. When the month has no primary-currency data, or nothing clears a threshold, the result is `[]` and `InsightsStrip` renders nothing — consistent with analytics' own empty state (no duplicate "no data" messaging).

### D7: Presentation — `InsightsStrip` + `InsightCard`, formatting stays in the UI

`InsightsStrip` reads `insights` from the store and renders an `InsightCard` per item (horizontal row or stacked list — decided during apply against the design system). `InsightCard` switches on `insight.type` for its copy, formats amounts with `formatMoney(amount, { code, symbol }, { showSign })` (using the store's resolved primary currency; `showSign` for `net`), formats percents inline, and maps `severity` to a theme token for the accent color. The pure engine never formats — only the card does. Theme tokens only; no hardcoded colors.

### D8: Offline-and-deterministic by construction; distinct from the subscription-detective

The engine imports nothing from `src/agents/`, `@anthropic-ai/sdk`, or any network/storage module — it operates purely on in-memory domain data passed in by the store. Given the same transactions and selected month it always yields the same insights. The subscription-detective (a dev-only LLM harness on mock data) is untouched and unrelated; this is its on-device, rule-based sibling.

## Risks / Trade-offs

- **Thresholds are guesses for an MVP** (15% / 30% / 40% / 5%) → centralize them as named `as const` constants and cover boundary cases in `insights.test.ts`; trivial to retune without touching call sites.
- **A "spike" on a tiny category reads as noise** → the relative `CATEGORY_SPIKE_MIN_SHARE` floor (≥5% of the month's expenses) suppresses small-base percentage blowups without a currency-specific absolute threshold.
- **First-ever month has no previous month** → comparison rules (`spendingTrend`, `categorySpike`) are guarded on `previous > 0` and simply don't fire; non-comparative rules still produce useful cards.
- **Insights could contradict the charts if computed differently** → they are computed from the *same* helpers and the *same* working set, so the strip and the donut/summary can never disagree.
- **`Transaction` has no merchant field** → `largestExpense` uses `title` (the row's display name) plus the resolved category label; acceptable and already what the lists show.
- **Hard dependency on OPES-43** → called out in the proposal, here, and at the top of `tasks.md`; this change must be sequenced after analytics-charts is applied.

## Open Questions

Resolved with defaults so implementation is unblocked; flagged for the maintainer to veto on review:

- **Threshold values** → defaults in D5; tune on real data.
- **How many cards to show** → `INSIGHTS_MAX = 4`.
- **Strip layout** (horizontal scroller vs stacked cards) → decide during apply against the design system; spec is layout-agnostic.
- **Copy wording/tone** → concise English strings finalized during apply; the spec asserts the data each card conveys, not its exact words.
