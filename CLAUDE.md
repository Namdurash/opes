# CLAUDE.md

Guidance for Claude Code when working in this repository. Rules scoped to a specific layer live in a `CLAUDE.md` inside that layer's folder — Claude Code loads them automatically when reading files there. This root file holds project-wide rules: commands, code style, layer contracts, Definition of Done.

## Project context

- Platform: React Native CLI (TypeScript)
- Product: Offline-first personal finance manager (MVP)
- Scope: Local-only app, no backend, no auth. Monobank is an optional sync source, not a dependency of core flows.

## Commands

```sh
npm start            # Metro dev server
npm run ios          # build + run iOS (first run: bundle install && bundle exec pod install)
npm run android      # build + run Android
npm run lint         # eslint .
npm test             # jest (all)
npm test -- useCardsStore           # single test file by name pattern
npm test -- -t "rate limit"         # single test by name
npx tsc --noEmit     # strict type-check (no dedicated npm script)
```

## Engineering principles

- Keep changes small, explicit, and scoped to the requested task. Prefer additive edits over refactors.
- Prefer simple implementations over abstractions unless the abstraction has immediate value.
- Do not rewrite large existing files unless explicitly requested. If a structural refactor is necessary, propose it before implementing.
- Never introduce a new dependency without first explaining why it is needed and what problem it solves. Prefer built-in React Native APIs and existing project patterns.

## Layer architecture (enforced, not aspirational)

The app is offline-first: the local WatermelonDB database is the source of truth for domain data. Data flows in one direction:

```
UI (features/) → Zustand store actions → repositories (models/) → WatermelonDB
                              ↘ services/ (sync, categorization, monobank) ↗
```

Cross-cutting rules — each layer's own `CLAUDE.md` expands on these:

- **Components never touch repositories, services, or the DB directly.** They call store actions only.
- **Repositories (`src/models/<entity>/`) are the only code allowed to read/write the DB.** They return `domain/` types, never WatermelonDB models. All methods are async.
- **`domain/` is pure TypeScript types** — no React, RN, or storage imports. WatermelonDB `*Model` classes live separately in `src/services/database/models/`.
- **Stores instantiate repositories/services at module scope** and wire them inside actions. Canonical example: [src/features/transactions/state/useTransactionsStore.ts](src/features/transactions/state/useTransactionsStore.ts).
- **Every folder exposes a barrel `index.ts`.** Import features/layers through their barrel. Never import another feature's `utils.ts` — promote shared helpers to `src/shared/utils/`.

## Language & code style

These rules apply across every `.ts` / `.tsx` file in the project.

### JavaScript / ES6+

- **Arrow functions everywhere.** Never use the `function` keyword — not for components, helpers, store factories, or callbacks. Every callable is a `const` arrow.
- **`const` and `let` only.** Never `var`.
- **`async`/`await` over `.then()` chains.** `.catch()` is allowed only as a terminal error sink on fire-and-forget calls.
- **Destructuring by default** for function parameters and local variables.
- **Template literals over string concatenation.**
- **Spread syntax** for objects and arrays — not `Object.assign` or `Array.concat`.
- **Optional chaining and nullish coalescing.** Use `?.` and `??` — never `&&`/`||` chains as null guards. Use `??` (not `||`) when the fallback must only trigger on `null`/`undefined`, not on `0` or `""`.
- **No `void` operator.** Don't write `onPress={() => void connect()}` — use a statement-body arrow instead.
- **`as const` for fixed literal maps and tuples.**

### TypeScript

- **Strict mode is on.** All code must pass `tsc --noEmit` with `strict: true`. Never suppress with `@ts-ignore` / `@ts-expect-error` without an explanatory comment.
- **No `any`.** Use `unknown` for genuinely dynamic data and narrow it before use.
- **`interface` for object shapes; `type` for unions and aliases.**
- **Explicit return types on exported functions and public class methods.** Infer for internal helpers where the type is obvious.
- **`import type` for type-only imports.**
- **Generics for reusable utilities** — bounded, not loose.
- **`Pick`, `Partial`, `Readonly`, etc.** over duplicating shapes.
- **Discriminated unions over boolean flags** when state has mutually exclusive modes.

## Definition of Done

- `npx tsc --noEmit` passes (strict).
- `npm run lint` passes.
- `npm test` passes (or any deviation is documented).
- No unused imports/exports added.
- New files follow the folder conventions in this repo (see layer `CLAUDE.md` files).
- User-visible behavior for the requested task is complete (no unfinished core flow).
- Layer-specific `CLAUDE.md` was updated when the structure or rule it documents changed.

## Where to find layer-specific rules

| Layer | File | What it covers |
|---|---|---|
| App shell + navigation | [src/app/CLAUDE.md](src/app/CLAUDE.md) | Root navigator, typed routes, header convention |
| Domain types | [src/domain/CLAUDE.md](src/domain/CLAUDE.md) | Purity rules — no React/RN/storage |
| Feature screens | [src/features/CLAUDE.md](src/features/CLAUDE.md) | Feature folder shape, styles, forms, store usage |
| Repositories | [src/models/CLAUDE.md](src/models/CLAUDE.md) | Contract + class + `toDomain` mapper pattern |
| WatermelonDB | [src/services/database/CLAUDE.md](src/services/database/CLAUDE.md) | Schema versioning, migrations, adapter swap |
| Monobank | [src/services/monobank/CLAUDE.md](src/services/monobank/CLAUDE.md) | Service singleton, rate limiter, token storage |
| Sync | [src/services/sync/CLAUDE.md](src/services/sync/CLAUDE.md) | TransactionSyncService behavior |
| Categorization | [src/services/categorization/CLAUDE.md](src/services/categorization/CLAUDE.md) | Resolution precedence, batch API |
| Design system | [src/shared/ui/CLAUDE.md](src/shared/ui/CLAUDE.md) | Screen, Header, Icon, UI state patterns |
| Theme tokens | [src/shared/theme/CLAUDE.md](src/shared/theme/CLAUDE.md) | Token usage rules |
| Validation | [src/shared/validation/CLAUDE.md](src/shared/validation/CLAUDE.md) | Yup schema location |
| Global stores | [src/stores/CLAUDE.md](src/stores/CLAUDE.md) | Cross-feature Zustand stores |
