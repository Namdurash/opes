# Repositories

This is the only layer allowed to read or write the WatermelonDB database. Everything else goes through a repository (typically called by a Zustand store action).

## Pattern

Each entity has its own folder (`cards`, `transactions`, `merchantRules`, `userOverrides`, `users`) with three things:

```
src/models/<entity>/
  <Entity>Repository.ts   # contract interface + class + toDomain mapper
  index.ts                # barrel
```

Inside `<Entity>Repository.ts`:

1. **`XxxRepositoryContract` interface** — the public API. All methods return `Promise<...>`.
2. **`toDomain(model)` mapper** — converts a WatermelonDB `*Model` (from [../services/database/models/](../services/database/models/)) into a plain `domain/` type. This is where `snake_case` columns become `camelCase` domain fields.
3. **Class implementing the contract.** Reads `database` from [../services/database](../services/database/), gets the typed collection, runs queries, returns domain objects.

Canonical examples: [cards/CardsRepository.ts](cards/CardsRepository.ts), [transactions/TransactionsRepository.ts](transactions/TransactionsRepository.ts).

## Rules

- **Repositories return domain types, never WatermelonDB models.** A `*Model` must not leak out of this layer.
- **All methods are async** (return `Promise`), even when the implementation is in-memory or trivially synchronous.
- **No business logic in repositories** — they are data-access objects. Categorization, sync orchestration, validation belong in `src/services/**` or store actions.
- **No UI imports** — `react`, `react-native`, theme, etc. are off-limits here.
- **IDs and timestamps are generated at creation time** by the repository, not by the database.
- **Define a `CreateXxxInput` (or similar) type** for create methods rather than passing wide objects — see `CreateCardInput` in [cards/CardsRepository.ts](cards/CardsRepository.ts).
- **Batch operations belong on the repository.** If a store action calls a repository in a loop, add a batch method instead (e.g. `upsertBatch`, `upsertMonobankCards`).
