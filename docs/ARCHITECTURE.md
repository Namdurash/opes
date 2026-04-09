# Architecture (MVP, Offline-First)

## Goals

- Build a local-first personal finance manager that works fully offline.
- Keep architecture minimal now, but easy to scale later.
- Avoid backend assumptions.

## High-Level Approach

- UI-driven React Native app with feature-based modules.
- App state managed with Zustand — feature stores for screen-local state, global stores for cross-feature concerns.
- Data persistence accessed only through a repository layer backed by WatermelonDB.
- No network dependency in core flows.

## Folder Structure

```text
src/
  app/        # App shell, entry point, and navigation wiring (routes, typed ParamList)
  domain/     # Pure TypeScript types only — no React Native or storage dependencies
  features/   # One folder per product feature; screens, components, and feature stores
  models/     # Repository classes — the only layer allowed to read/write the database
  services/   # Infrastructure: WatermelonDB setup, auth token storage
  shared/     # Design tokens, theme primitives, and reusable UI components
  stores/     # Global cross-feature Zustand stores (auth, settings)
```

Each feature folder may contain:

```text
src/features/<feature>/
  <FeatureName>Screen.tsx          # Screen component(s)
  <FeatureName>Screen.styles.ts    # Styles for the screen
  components/                      # Sub-components used only within this feature
  state/
    use<Feature>Store.ts           # Zustand store(s) for this feature
  types.ts                         # Feature-specific TypeScript interfaces and types
  utils.ts                         # Feature-specific pure utility functions
  index.ts                         # Barrel — public API of the feature
```

### Types and Interfaces

- If a feature has its own types or interfaces, define them in `src/features/<feature>/types.ts`.
- Export them through the feature's `index.ts` barrel.
- Cross-feature or domain-level types belong in `src/domain/`.

### Utility Functions

- Feature-specific pure functions belong in `src/features/<feature>/utils.ts`.
- Functions used across multiple features or in shared modules belong in `src/shared/utils/`.
- Never import a feature's `utils.ts` from outside that feature — promote to `src/shared/utils/` instead.

## Language & Code Style

### JavaScript / ES6+

- **Arrow functions everywhere.** Never use the `function` keyword — not for components, helpers, store factories, or callbacks. Every callable is a `const` arrow:
  ```typescript
  export const MyComponent = () => { ... };
  export const createStore = (deps: Deps) => create(...);
  const helper = (x: number): string => String(x);
  ```

- **`const` and `let` only.** Never use `var`.

- **`async`/`await` over `.then()` chains.** All asynchronous logic must use `async`/`await`. `.catch()` is allowed only as a terminal error sink on fire-and-forget calls.

- **Destructuring by default.** Prefer destructuring for function parameters and local variables:
  ```typescript
  const { token, clientName } = monobankTokenService.get() ?? {};
  const [first, ...rest] = items;
  ```

- **Template literals over concatenation.** Always use template literals when embedding expressions in strings.

- **Spread syntax for objects and arrays.** Use `{ ...obj }` and `[...arr]` instead of `Object.assign` or `Array.prototype.concat`.

- **Optional chaining and nullish coalescing.** Use `?.` and `??` to handle nullable values — never manual `&&` / `||` null guards for this purpose:
  ```typescript
  // ✓
  const name = user?.profile?.name ?? 'Anonymous';
  // ✗
  const name = user && user.profile && user.profile.name || 'Anonymous';
  ```
  Use `??` (not `||`) when the fallback must only trigger on `null`/`undefined`, not on other falsy values like `0` or `""`.

- **No `void` operator.** Do not use `void expr` to discard a promise return value. Use a statement-body arrow instead:
  ```typescript
  // ✓
  onPress={() => { connect(); }}
  // ✗
  onPress={() => void connect()}
  ```

- **`as const` for literal objects.** Mark fixed constant maps and tuples with `as const` to narrow their types:
  ```typescript
  export const ROOT_ROUTES = { HOME: 'Home', ... } as const;
  ```

---

### TypeScript

- **Strict mode is on.** All code must pass `tsc --noEmit` with `strict: true`. Never suppress errors with `@ts-ignore` or `@ts-expect-error` without a comment explaining why.

- **No `any`.** Use `unknown` for genuinely dynamic data and narrow it before use. Use precise union types instead of widening to `any`.

- **`interface` for object shapes; `type` for unions and aliases.**
  ```typescript
  interface MonobankStoreState { token: string; status: ConnectionStatus; }
  type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';
  ```

- **Explicit return types on exported functions and public class methods.** Infer return types for internal/private helpers where the type is obvious:
  ```typescript
  // exported — annotate
  export const hashPassword = (password: string): string => { ... };
  // internal helper — inference is fine
  const toMajorUnits = (amount: number, code: number) => amount / 10 ** (MINOR_UNITS[code] ?? 2);
  ```

- **`import type` for type-only imports.** Prevents runtime bloat and makes dependency intent explicit:
  ```typescript
  import type { MonobankStatement } from './types';
  ```

- **Generics for reusable utilities.** Use bounded generics rather than loose types:
  ```typescript
  export const makeStyles = <T extends StyleSheet.NamedStyles<T>>(factory: (theme: Theme) => T) => ...
  ```

- **`Pick`, `Partial`, `Readonly`, and other utility types** over manually duplicating shapes.

- **Discriminated unions over boolean flags** when state has mutually exclusive modes:
  ```typescript
  // ✓
  type Status = 'idle' | 'loading' | 'success' | 'error';
  // ✗
  isLoading: boolean; isError: boolean; isSuccess: boolean;
  ```

---

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

- **Domain data** must be read/written via repositories (`src/models/**`) only.
- **Zustand stores** must not contain direct storage calls in components; use store actions that call repositories.
- **Feature-specific UI state** should live in a feature store under `src/features/<feature>/state/`.
- **Cross-feature global state** lives under `src/stores/` (settings/theme/global filters/jobs).
- All repositories should be placed in `/src/models` folder.

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
- When selecting multiple values from a store in a single component, use `useShallow` from `zustand/shallow` to group them into one hook call. This avoids both excessive hook declarations and unnecessary re-renders:
  ```typescript
  import { useShallow } from 'zustand/shallow';
  const { status, clientName, loadSavedToken } = useMonobankStore(
    useShallow(state => ({ status: state.status, clientName: state.clientName, loadSavedToken: state.loadSavedToken })),
  );
  ```

### Invalidation / Refresh Strategy

- If using non-reactive storage (e.g., SQLite without live queries), stores must expose `invalidate()` / `refresh()` methods.
- After repository writes, actions should:
  - update relevant UI state (e.g. close modal, clear draft)
  - trigger `invalidate()` for dependent selectors/screens
- If storage is reactive (Realm/WatermelonDB), store state can be reduced to UI and subscription lifecycle management.

## Local Storage Strategy

- Persistent storage uses **WatermelonDB** (SQLite-backed) via the database singleton at `src/services/database/`.
- Schema is defined in `src/services/database/schema.ts` and versioned migrations live in `src/services/database/migrations.ts`.
- Repositories (`src/models/**`) map domain entities to WatermelonDB models and are the only layer allowed to access the database.

### Storage Design Rules

- Repository APIs must be asynchronous (`Promise`-based).
- Domain entities generate their own IDs and timestamps at creation time.
- Database models must not contain business logic — they are data-access objects only.
- UI components must never access storage directly — only through repositories.

## Navigation

- MVP uses React Navigation as the source of truth for navigation.
- Root navigation is defined in `src/app/navigation/`.
- Use a typed ParamList (TypeScript) for all routes.
- Feature modules must not own navigation structure; they only define screens.
- Navigation should remain replaceable without changing feature business logic.
- All route names should be listed in separated const variable in separated module.

## Forms & Inputs

- Forms use **React Hook Form** (`useForm`) for field state, validation, and submission. **Yup** schemas (via `@hookform/resolvers`) define validation rules.
- **RHF owns form field values and errors.** Zustand stores do NOT hold form field state — they handle only async submission, side effects, and non-input UI state (e.g. image picker, button-group selection).
- Store `create`/`submit` actions receive already-validated form values as parameters.
- Validation schemas live in `src/shared/validation/`.

### Input System

`src/shared/ui/Input.tsx` — themed input primitive wrapping RN `TextInput`.

- Props: `label`, `error`, `disabled`, `leftIcon`, `rightIcon`, plus all `TextInputProps`.
- Visual states: default, focused (`primary` border), error (`error` border), disabled (opacity).
- Supports `forwardRef` for programmatic focus.

`src/shared/ui/FormInput.tsx` — generic `Controller` wrapper connecting `Input` to RHF.

- Props: `control`, `name` (type-safe via `FieldPath<T>`), plus all `InputProps` except `value`/`onChangeText`/`error`.
- Never use raw `TextInput` in feature screens — always use `Input` or `FormInput`.

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

## Screen Component

`Screen` is the root layout wrapper for every screen. It accepts:

- `background?: ScreenBackground` — `'blank'` (default, solid white) or `'gradient'` (LinearGradient)
- `headerLeft?`, `headerCenter?`, `headerRight?` — `ReactNode` slots; header is only rendered when at least one is provided

Header config lives on `Screen`, not composed manually inside the screen body. React Navigation's built-in `header` option is not used — it renders outside `Screen` and breaks background inheritance.

## Header System

`src/shared/ui/header/` — slot-based: `left`, `center`, `right`.

- `center` is absolutely positioned across the full width, guaranteeing true centering regardless of side content.
- `left` and `right` are rows with gap, supporting 1–3 icon buttons each.

Sub-components: `HeaderTitle`, `HeaderBackButton`, `HeaderIconButton`.

## Icon System

`src/shared/ui/icons/` — SVG files transformed by `react-native-svg-transformer` into React components.

- SVG assets live in `src/shared/ui/icons/assets/`
- Each icon has a wrapper component accepting `{ size, color }`
- All icons are registered in `registry.ts`; `IconName` is derived from its keys automatically
- Public API: `<Icon name="..." size="sm|md|lg" color="..." />`

To add an icon: drop the `.svg` in `assets/`, create a wrapper component, add it to `registry.ts`.
