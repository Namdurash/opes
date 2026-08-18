# WatermelonDB

Singleton database wired up here. Schema is versioned; column changes require a migration.

## Adapter swap

[database.ts](database.ts) chooses the adapter at module load:

- **Jest:** LokiJS adapter (pure JS, no native module). This is why the test suite runs without iOS/Android linkage.
- **Device:** SQLite (JSI) adapter.

Apply the same Jest-vs-device branch pattern when adding any native-backed storage (see [../monobank/MonobankTokenService.ts](../monobank/MonobankTokenService.ts) for the in-memory-vs-MMKV variant). Tests must not require native modules.

## Schema & migrations

- Schema is defined in [schema.ts](schema.ts), **currently version 7**.
- **Any column change requires bumping the version** in `schema.ts` AND **adding a migration** in [migrations.ts](migrations.ts) — including renames, type changes, defaults.
- **Column names are `snake_case`** (DB convention). Domain field names are `camelCase`. The mapping lives in repository `toDomain(...)` functions (see [../../models/CLAUDE.md](../../models/CLAUDE.md)).
- Models in [models/](models/) are thin data-access objects — no business logic. They are consumed by repositories and never exposed outside `src/models/**`.

## Usage

- Import the singleton: `import { database } from 'src/services/database'`. Never construct a `Database` directly — with exactly one exception, `createTestDatabase` in [../../../test/db](../../../test/CLAUDE.md), which exists to give each test case its own.
- Don't read or write the database outside of `src/models/**` repositories.

## Testing against this layer

Repository tests do **not** mock the database — talking to WatermelonDB is the whole
job of the layer above, so a mock would leave nothing worth asserting. They use
`createTestDatabase` from [../../../test/db](../../../test/CLAUDE.md): a throwaway
in-memory instance per test case, torn down after each.

Two properties of that helper are load-bearing here:

- **It builds from [schema.ts](schema.ts) and [migrations.ts](migrations.ts) directly,
  never a copy**, and refuses to open if the adapter's version differs from
  `databaseSchema.version`. So the version bump this file demands for every column
  change also breaks the test suite if the two drift apart.
- **It does not replay the migration chain.** The repo keeps only the current schema
  while [migrations.ts](migrations.ts) starts at `toVersion: 2`, so there is no
  version-1 snapshot to migrate from — migrations stay unverified. Establishing that
  needs a historical snapshot and is its own ticket.

Because the repository reaches the database through the module singleton rather than an
injected handle, a test points it at the throwaway instance by replacing
[database.ts](database.ts) — not the barrel, which also re-exports the schema and model
classes the helper itself needs. Canonical example:
[../../models/cards/CardsRepository.test.ts](../../models/cards/CardsRepository.test.ts).

Teardown closes the Loki instance, not just its rows: WatermelonDB starts Loki with
`autosave: true, autosaveInterval: 500`, and that interval outlives the suite. Leaving
it open is what previously forced `forceExit: true` in `jest.config.js`.
