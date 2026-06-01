# Transaction sync

Orchestrates pulling Monobank statements into the local DB. Composed per call by store actions; not a singleton.

## TransactionSyncService behavior

[TransactionSyncService.ts](TransactionSyncService.ts):

- **Fetches each account in parallel** using `Promise.all`. Don't serialize them — the rate limiter is per-endpoint and parallel fetches against different accounts are still 1 request each.
- **Incremental sync per card:** starts from the latest stored `occurredAtIso` for that card, falling back to **30 days** when there's no prior data.
- **Atomic batch:** if any account fails, the whole batch aborts and **nothing is saved**. No partial writes. Surface the failure as a `MonobankError` for the store to display via `showErrorBottomSheet`.
- **Composed at the call site**, not held in module scope — the store action constructs the service with the relevant repositories. See [../../features/transactions/state/useTransactionsStore.ts](../../features/transactions/state/useTransactionsStore.ts) for the canonical wiring.

## Mappers

[mappers.ts](mappers.ts) holds pure functions translating Monobank statement rows → domain `Transaction` objects. Keep them pure and unit-testable — no DB or network calls.
