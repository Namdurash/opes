Ticket: OPES-38

> Backfilled retrospectively: this change documents work already implemented and
> committed as `feat(OPES-38)`. Tasks are checked because the code already landed.

## Why

The app already categorizes transactions, including a "donations" (Донати) category, but there is nowhere to see giving at a glance. Users who donate want a simple, read-only summary — how much, how often, on average — without any new data model.

## What Changes

- New `Donations` screen (route `Donations`) reachable from Home, built on top of the existing `donations` category.
- Read-only: it loads all transactions, categorizes them via `CategorizationService`, keeps those in the `donations` category, and computes total donated, count, and average (using transaction magnitudes, since donations are outflows stored negative).
- A "donation jar" visual rendered with the already-installed `react-native-svg`, plus a list of donation transactions formatted with the shared money formatter.

## Capabilities

### New Capabilities
- `donations-tracker`: a user SHALL see a read-only summary (total, count, average) and list of their donation-category transactions, with a donation-jar visual.

### Modified Capabilities
- _None._

## Impact

- New `features/donations` (screen + styles, `DonationJar` component, `useDonationsStore`, `utils` + tests), `app/navigation` (new `Donations` route), `features/home` (entry point).
- Reuses `CategorizationService`, `TransactionsRepository`, the shared money formatter, and `react-native-svg`. No `domain/` change, no new table, no schema-version bump, no new dependency.

## Non-goals

- Donation goals, targets, or sharing (post-MVP).
- A new schema/table or a dedicated "donation" transaction type — donations are just the existing `donations` category.
- Editing or recategorizing transactions from this screen (handled elsewhere).
