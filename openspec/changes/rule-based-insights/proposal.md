Ticket: OPES-44

## Why

`analytics-charts` (OPES-43) shows the user _what_ their month looks like in numbers — a category donut, income-vs-expenses, top categories — but it never tells them _what to notice_. The user still has to read the charts and draw their own conclusions ("is that a lot?", "is that more than last month?"). A small set of deterministic, on-device rules can turn the data analytics already aggregates into a few plain-language takeaways ("you spent more than you earned", "Dining is 38% of your spending", "groceries up 60% vs last month"), fully offline, with no new dependency and no LLM.

## What Changes

- New **Insights strip** rendered at the **top of the existing Analytics screen**, above the charts: a short, ranked list of plain-language insight cards for the selected month.
- A new **pure rules engine** (`buildInsights`) that runs a fixed set of deterministic rules over the month's already-aggregated data plus the **previous month** (for comparisons), reusing `analytics-charts`' pure helpers — no extra DB read.
- **v1 rule set (5 rules):** net result (saved vs overspent), spending trend vs last month, top-category dominance, category spike vs last month, and the single largest expense. Each rule is a pure function with documented thresholds and guards; thresholds are tunable constants.
- Insights are modeled as a **discriminated union** carrying raw numbers/labels (not pre-formatted strings); the card component formats currency via the existing shared `formatMoney` helper and colors the card by `severity` (`positive` / `neutral` / `warning`).
- The engine **ranks** insights (by severity, then magnitude) and **caps** how many are shown; when the month has no data or nothing clears a threshold, the strip simply does not render — consistent with the analytics empty state.
- `useAnalyticsStore`'s view-model gains an `insights` field, computed inside its existing load/select actions. No second store; components still call store actions only.

## Capabilities

### New Capabilities
- `rule-based-insights`: Deterministic, fully-offline insight cards derived from the selected month's local transactions (and the previous month for comparison) by a fixed rules engine, surfaced as a ranked strip atop the Analytics screen. No LLM, no network, no persistence.

### Modified Capabilities
<!-- None. This change is additive: it extends the analytics feature surface but changes
     no existing spec's requirements. analytics-charts (OPES-43) is a prerequisite, not a
     capability being modified here. -->

## Impact

- **Prerequisite — OPES-43 `analytics-charts` must be implemented first.** This change extends that feature: it reuses the analytics screen, its `useAnalyticsStore` (selected-month state + already-loaded working set), and its pure aggregation helpers (`selectMonthTransactions`, `computeCategoryBreakdown`, `computeMonthSummary`, `topCategories`, `addMonths`). It cannot be applied before OPES-43.
- **features/** — extends `src/features/analytics/` only: new `insights.ts` (pure rules engine) + `insights.test.ts` (primary test target), new `components/InsightsStrip` + `components/InsightCard`, an `Insight` union added to `types.ts`, an `insights` field added to the `useAnalyticsStore` view-model, and the strip rendered atop `AnalyticsScreen`. Delivered inside the analytics feature (not a new `src/features/insights/`) to reuse its pure helpers without violating the no-cross-feature-`utils.ts` rule. See `design.md`.
- **Reads from** — `src/shared/utils/money.ts` (`formatMoney`), plus the transactions repository and categorization service already wired by OPES-43. No writes.
- **Data model** — none. No WatermelonDB schema-version bump, no migration; read-only over existing transactions.
- **Dependencies** — none added. No `@anthropic-ai/sdk`, no network, no charting or notification library.

## Non-goals

- No LLM, no network, no API key — this is the deterministic, on-device counterpart to the dev-only subscription-detective agent, which it neither touches nor replaces.
- No Home-screen placement, no separate Insights screen, and no drill-down from an insight into the underlying transactions (deferred).
- No user-configurable rules or thresholds, no insight history/persistence, and no notifications/push — fixed constants, computed live for the selected month.
- No i18n framework — English copy, formatted through the existing shared helper.
- No multi-currency aggregation — insights inherit analytics' primary-currency scoping and never sum across currencies.
- No new charts or changes to how categories are resolved or how the month is aggregated (consumed from analytics as-is).
