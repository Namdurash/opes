# Architecture (MVP, Offline-First)

## Goals

- Build a local-first personal finance manager that works fully offline.
- Keep architecture minimal now, but easy to scale later.
- Avoid backend assumptions.

## High-Level Approach

- UI-driven React Native app with feature-based modules.
- App state managed in React (Context + reducer or feature hooks).
- Data persistence accessed only through a storage abstraction layer.
- No network dependency in core flows.

## Proposed Folder Structure

```text
src/
  app/
    AppShell.tsx
    navigation/
      types.ts
  features/
    home/
      HomeScreen.tsx
      index.ts
    transactions/
      TransactionsScreen.tsx
      components/
        TransactionListPlaceholder.tsx
      index.ts
  domain/
    transactions/
      types.ts
      index.ts
  stores/
    store.ts
    index.ts
  services/
    storage/
      StorageGateway.ts
      InMemoryStorage.ts
      index.ts
    transactions/
      TransactionsRepository.ts
      index.ts
  shared/
    ui/
      ScreenContainer.tsx
      index.ts
```

## State Management (Zustand)

- We use Zustand for application state orchestration.
- Local database remains the source of truth for domain data (transactions, accounts, categories).
- Zustand is NOT a mirror of the database. It stores:
  - UI state (filters, sort, selected period, modal state)
  - Cross-feature concerns (theme, settings)
  - Long-running processes (import/sync jobs, progress, error states)
  - Draft/temporary states (forms, multi-step flows) before persisting to DB
  - Optional derived/cache state for performance (aggregations, computed summaries), with explicit invalidation

### State Boundaries

- **Domain data** must be read/written via repositories (`src/services/**`) only.
- **Zustand stores** must not contain direct storage calls in components; use store actions that call repositories.
- **Feature-specific UI state** should live in a feature store under `src/features/<feature>/state/`.
- **Cross-feature global state** lives under `src/stores/` (settings/theme/global filters/jobs).

### Store Design Rules

- Stores must expose:
  - `state` (minimal, serializable when possible)
  - `actions` (imperative methods that change state and call repositories)
- Prefer multiple small stores over one large global store.
- Keep actions predictable:
  - `setX(...)` for pure UI state
  - `loadX(...)`, `refreshX(...)` for repository-driven reads
  - `create/update/delete` methods call repositories and then update UI state / trigger invalidation
- Avoid storing large lists in global state unless required for UX/performance. Prefer querying DB per screen and using local selectors.

### Invalidation / Refresh Strategy

- If using non-reactive storage (e.g., SQLite without live queries), stores must expose `invalidate()` / `refresh()` methods.
- After repository writes, actions should:
  - update relevant UI state (e.g. close modal, clear draft)
  - trigger `invalidate()` for dependent selectors/screens
- If storage is reactive (Realm/WatermelonDB), store state can be reduced to UI and subscription lifecycle management.

## Local Storage Strategy

- Use a storage gateway interface (`StorageGateway`) with minimal CRUD methods.
- Start with in-memory adapter for scaffolding and tests.
- Later swap to persistent adapter (for example MMKV/SQLite/AsyncStorage) without changing feature logic.
- Repositories (`src/services/transactions`) map domain entities to storage records.

### Storage Design Rules

- Repository APIs must be asynchronous (`Promise`-based), even if the underlying storage is synchronous (e.g. in-memory).
- Domain entities generate their own IDs (UUID) and timestamps at creation time.
- Storage adapters must not contain business logic.
- UI components must never access storage directly — only through repositories.

## Navigation

- MVP uses React Navigation as the source of truth for navigation.
- Root navigation is defined in `src/app/navigation/`.
- Use a typed ParamList (TypeScript) for all routes.
- Feature modules must not own navigation structure; they only define screens.
- Navigation should remain replaceable without changing feature business logic.
- All route names should be listed in separated const variable in separated module.

## Testing Strategy

- Keep existing render test for `App`.
- Add unit tests for reducer and repositories as they gain behavior.
- Add focused component tests for feature screens with meaningful logic.
- Prefer deterministic tests that do not depend on device state or network.

## Scalability Notes

- Feature-first organization keeps business context local.
- Storage abstraction prevents vendor lock-in.
- Reducer/action model keeps transitions auditable as complexity grows.

## Design System

- The app uses a token-based design system to keep UI consistent and easily changeable.
- Tokens live in `src/shared/theme/` and are the only source of truth for:
- colors, typography, spacing, radii, shadows
- Feature screens must never hardcode styling constants (no raw hex colors, no direct font sizes).
- Shared UI primitives in `src/shared/ui/` wrap React Native components and apply tokens by default.
- A ThemeProvider provides `theme` via context and a `useTheme()` hook.
