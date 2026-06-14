## Context

Transactions live in WatermelonDB and are categorized at read time by `CategorizationService` (override → merchant rule → MCC → fallback), which already includes a `donations` category. A donations view is purely derived data — no new persistence.

## Goals / Non-Goals

**Goals:** a read-only donations summary + list on top of the existing category; reuse categorization, the transactions repository, the money formatter, and `react-native-svg`.

**Non-Goals:** goals/targets/sharing, a new table or transaction type, editing.

## Decisions

- **Feature-local store (`useDonationsStore`)** following the module-scope-repository pattern: instantiate `TransactionsRepository` + `CategorizationService` once, load all transactions, `resolveCategories` (batch), filter to the `donations` category, and expose the donation transactions + `isLoading`. Errors surface via `showErrorBottomSheet`.
- **Stats are a pure helper (`computeDonationStats`)** over the donation transactions: `total` = sum of `|amount|`, `count`, `average` = `total / count` (0 when empty). Pure and unit-tested.
- **The donation jar is drawn with `react-native-svg`** (already a dependency) — a clipped liquid fill plus a heart, parameterized by a decorative `fillRatio` (clamped to a visible range). It is intentionally not tied to a goal (goals are post-MVP).
- **Reachable from Home via a new `Donations` route** (append-only nav).

## Risks / Trade-offs

- [Categorizing all transactions on each load] → uses the batch `resolveCategories` (two bulk queries); acceptable for MVP volumes, and the screen is read-only and loaded on demand.
- [Donations are outflows stored negative] → stats use magnitudes (`Math.abs`) so totals read naturally as positive amounts.
