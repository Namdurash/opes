## Context

The app already persists categorized transactions in WatermelonDB and resolves a `Category` for each one (precedence: user override → merchant rule → MCC) via the categorization service. Nothing surfaces this as insight — Home and Transactions only list rows. `analytics-charts` is a new, read-only feature that aggregates the existing local data into a monthly view. It introduces no backend, no schema change, and no new dependency: `react-native-svg` (already used by `DonationJar` and the icon system) covers the charts.

The feature must obey the enforced one-directional architecture: `AnalyticsScreen` and its sub-components call **store actions only**; the store reads through the existing transactions repository and the categorization service; all numeric aggregation lives in pure, unit-tested functions.

## Goals / Non-Goals

**Goals:**

- A single Analytics screen, scoped to one selected month, reachable from Home → Quick Actions.
- Three widgets driven by one month switcher: spending-by-category donut, income-vs-expenses summary, top-5 categories.
- Honest single-currency numbers (primary currency only) with a hidden-count note.
- Pure aggregation helpers in `utils.ts` as the primary test target (mirroring `donations/utils.ts`).
- Zero new dependencies; reuse `react-native-svg`, the repository pattern, and the categorization service.

**Non-Goals:**

- Balance-trend line chart, multi-month trend bars, weekly/yearly presets, custom date ranges.
- Multi-currency aggregation or FX conversion.
- Drill-down from a slice into transactions; budgets; forecasting; export/share of analytics.
- Any change to how categories are resolved (we consume the existing service as-is).

## Decisions

### D1: Charts use the already-installed `react-native-svg` — no charting library

The MVP needs a donut ring and (optionally) two bars. These are trivial to draw directly. Pulling in `victory-native`, `react-native-gifted-charts`, or `react-native-chart-kit` would add a dependency (and, for some, `react-native-reanimated`/Skia) for shapes we can render in a few `<Circle>`/`<Rect>` elements.

- **Donut:** a single `<Circle>` per slice using `strokeDasharray`/`strokeDashoffset` on a shared radius, slices laid end-to-end around the ring. Simpler than computing `<Path>` arc geometry and good enough for an MVP ring.
- **Bars:** `<Rect>` heights proportional to income/expense totals. If two themed `<View>` bars read better with the design system, that is an acceptable equivalent — decide during apply, justify in code.
- **Alternatives considered:** `victory-native` (heavy, animation-focused), `chart-kit` (opinionated styling, harder to theme). Rejected for an MVP of static shapes.

### D2: A new feature-local `useAnalyticsStore`, not an extension of the transactions store

`useAnalyticsStore` holds UI state (`selectedMonth`), the loaded working set, and a derived view-model; its actions orchestrate the repository + categorization service. This follows the canonical store factory in `features/transactions/state/useTransactionsStore.ts` (repositories/services instantiated at module scope, composed inside actions).

- **Why not compute in the component:** components may not touch repositories/services (layer rule).
- **Why not extend `useTransactionsStore`:** keeps concerns separate and avoids coupling the list screen to analytics view-model state; the transactions store stays focused on the list/sync working set.

### D3: All math is pure functions in `utils.ts`; the store only orchestrates

Aggregation (filter by month + primary currency, group expenses by category, totals, top-N, shares) is implemented as pure functions over domain `Transaction` + resolved `Category`. The store loads data, calls these helpers, and stores the result. This makes the logic unit-testable with plain jest (no RN/DB), exactly like `features/donations/utils.test.ts`.

### D4: Primary currency = the most frequent `currencyCode`

Transactions carry `currencyCode`/`currencySymbol` and can mix currencies. Summing across them is wrong. The primary currency is the `currencyCode` held by the most transactions, ties broken by the most recent transaction's currency (deterministic, zero-config). Everything else is excluded and counted in a "N transactions in other currencies hidden" note.

- **Alternatives considered:** a user setting (extra UI/state for an MVP), or the primary card's currency (cards don't reliably carry a currency today). Deferred; frequency is a good default and easy to revisit.

### D5: Income vs expenses is the selected month's two totals + net (not a multi-month trend)

Because the period control is a single-month switcher, "income vs expenses by month" is realized as the selected month's total income, total expenses, and net. A trailing multi-month bar trend is a deliberate future enhancement, not MVP — it would need its own multi-month period model and complicate the currency scoping.

### D6: Category resolution reuses the categorization service's batch API

For the month's transactions we resolve categories through the existing service (same precedence used elsewhere), then group by `CategoryId`. We do not reimplement or duplicate resolution. Uncategorized transactions fall to the existing `other` category.

### D7: Read-only; navigation added the standard three-edit way

No DB writes, no schema-version bump, no migration. The `ANALYTICS` route is added per `src/app/CLAUDE.md`: append to `ROOT_ROUTES`, extend `RootStackParamList`, register a `<Stack.Screen>`. Reached via `navigate` (not `replace`) so the back affordance is valid.

## Risks / Trade-offs

- **Re-resolving categories on every month switch could be wasteful** → load the working set once, keep it in the store, and filter/aggregate in memory per selected month; memoize the per-month view-model. Resolution runs over a month's slice, not the whole history, on demand.
- **Multi-currency users see "missing" money** → the hidden-count note makes exclusions explicit; primary-currency choice is deterministic and documented.
- **Donut edge cases** (single category = full ring; zero expenses; rounding so shares don't sum to exactly 100%) → handle explicitly (full-ring special case, empty state for zero) and cover with unit tests; legend shares are display-rounded and not asserted to sum to exactly 100.
- **No data when Monobank isn't connected and there are no manual transactions** → empty state, consistent with Home's gating; the feature never assumes Monobank.
- **`strokeDasharray` ring vs `<Path>` arcs** → dasharray is simpler but less flexible (no rounded slice caps / gaps without extra work); acceptable for MVP, revisit if design needs gaps.

## Open Questions

Resolved with defaults so implementation is unblocked; flagged for the maintainer to veto on review:

- **Income/expense visualization** → default to a compact summary (income, expenses, net) for the selected month; `<Rect>` bars only if they improve readability. (See D5.)
- **Primary-currency tie-break** → most recent transaction's currency. (See D4.)
- **Top-N size** → 5. Easy to change; not a spec-level constant.
