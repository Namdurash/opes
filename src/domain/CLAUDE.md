# Domain types

Pure TypeScript types describing the domain entities (`auth`, `cards`, `categorization`, `transactions`). This layer is the contract every other layer agrees on.

## Rules

- **Pure TypeScript only.** No imports from `react`, `react-native`, `@nozbe/watermelondb`, MMKV, or any storage/UI library. If a domain type needs a runtime helper, it belongs elsewhere.
- **No WatermelonDB models here.** Database `*Model` classes live in [../services/database/models/](../services/database/models/). Domain types are the *target* of repository `toDomain(model)` mappers — never the source of DB schema.
- **Cross-feature types belong here.** A type used by one feature only stays in `src/features/<feature>/types.ts`. Promote to `domain/` only when a second consumer appears.
- **Field naming is `camelCase`.** DB column names are `snake_case` — the mapping happens in repositories.
- **Export through the per-entity barrel and the root [index.ts](index.ts).**
