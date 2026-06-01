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

- Import the singleton: `import { database } from 'src/services/database'`. Never construct a `Database` directly.
- Don't read or write the database outside of `src/models/**` repositories.
