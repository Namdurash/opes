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
  state/
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

## State Management

- MVP: local React state managed centrally in app-level state (`src/state/store.ts`).
- Pattern: reducer + actions to keep state transitions explicit.
- Feature components receive data/actions via props or hooks.
- This avoids external state libraries while staying scalable.

### State Boundaries

- Global app state (`src/state`) is reserved only for cross-feature concerns (e.g. settings, selected filters, theme).
- Feature-specific data (e.g. transactions list) should be accessed via repositories and feature-level hooks.
- Avoid putting all domain data into a single global reducer.

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

- MVP: no external navigation library.
- Navigation state is managed in `AppShell.tsx` with a strictly limited route union type (e.g. `home`, `transactions`).
- Hard rule: This approach is allowed only while the app has ≤ 2 primary routes.
- Once the app grows beyond 2–3 screens or requires nested flows, we migrate to a dedicated navigation library (e.g. React Navigation).
- Navigation logic must remain isolated from feature logic to allow future migration without rewriting features.

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
