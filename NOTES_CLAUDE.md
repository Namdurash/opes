# Claude's Notes on Opes

> Written: 2026-03-27. These are observations, opinions, and ideas — not tasks unless the team picks them up.

---

## Opinion

Opes is a clean, well-structured early-stage project. The architecture is intentional: the offline-first stance is enforced by real constraints (WatermelonDB, no network layer), not just stated as a goal. The team clearly cares about conventions — `ARCHITECTURE.md` and `README_AI.md` are detailed and actively followed. The design token system and strict separation of styles into `.styles.ts` files show a maturity that most MVPs skip entirely.

The card drag-and-reorder implementation (`CardStack.tsx`) is more sophisticated than what you usually see at this stage — managing both `PanResponder` and `react-native-reanimated` shared values correctly is non-trivial.

~~The main risk is scope creep in `useCardsStore`: it currently mixes form draft state with domain list state in one store.~~ Fixed — split into `useCardsStore` (list) and `useCreateCardStore` (form).

---

> Updated: 2026-03-30. Reflecting changes since the last entry: Monobank API integration, connect UI, transaction history on HomeScreen, `useShallow` adoption, `types.ts`/`utils.ts` feature modules, full ES6+ arrow function refactor, and ARCHITECTURE.md language section.

The codebase has grown meaningfully in a short time while staying coherent. The Monobank service layer (`api.ts`, `rateLimiter.ts`, `transformers.ts`) is well-designed — the separation between raw API types and internal domain types is clean, and the rate limiter and error taxonomy show forward thinking. The `MonobankTokenService` pattern mirrors `TokenStorageService` well, keeping storage concerns isolated.

The `useShallow` adoption is a good call. Zustand v5 makes it easy to over-subscribe — grouping related selectors per store into one `useShallow` call is the right trade-off between readability and re-render safety.

The `types.ts` / `utils.ts` per-feature pattern and the new ARCHITECTURE section make the project significantly more AI-agent-friendly. Future contributors (human or AI) won't have to infer conventions from reading code.

One architectural concern worth flagging: **the `MonobankService` rate limiter is instance-level, but services are instantiated fresh on every action call** (`connect()`, `loadTransactions()`). Each new instance starts with a clean rate limiter, so the 60-second cooldown never actually enforces across calls. The limiter needs to be either a module-level singleton or the service instance needs to be cached in the store. This is the most meaningful open defect right now.

The `HomeScreen` is starting to feel like a composition screen rather than a feature screen, which is the right direction — but it will need `CardsSection` and `TransactionHistorySection` properly extracted before it grows further.

---

## Findings (Bugs / Issues)

### ~~F1. Rate limiter is ineffective — `MonobankService` is re-instantiated on every call~~ ✅ Fixed

**Fixed in:** `src/services/monobank/serviceInstance.ts` — module-level cache keyed by token. Both stores now call `getMonobankService(token)` instead of `new MonobankService(token)`. The instance is reused across calls so the `RateLimiter` state persists. `clearMonobankService()` is called on disconnect to drop the cached instance.

## Scalability Audit (2026-04-09)

> Goal: identify architectural decisions that would force big refactors when adding new entities (budgets, categories, recurring transactions), new data sources (additional banks), or new features. Findings are grouped by severity tier.

---

### Tier 1 — Domain Layer: Monobank Leaking Into Core Types

**S1. `Card` domain type is polluted with Monobank-specific fields**

**File:** [src/domain/cards/types.ts](src/domain/cards/types.ts)

The `Card` interface carries 6 nullable Monobank-specific fields: `monobankAccountId`, `currencyCode`, `currencySymbol`, `iban`, `maskedPan`, `creditLimit`, `monobankBalance`. If PrivatBank is added, these fields either balloon (`privatAccountId`, `privatBalance`, …) or become ambiguously shared. The domain `Card` should represent a financial card generically; bank-specific metadata belongs in a separate linked entity (e.g. `BankAccountLink`).

Additionally, `CardType` at line 1 includes `'monobank'` as a literal union member. Adding banks grows this union with vendor names instead of a generic label like `'linked'` or `'external'`.

**S2. `Transaction` has no source discriminator**

**File:** [src/domain/transactions/types.ts](src/domain/transactions/types.ts)

The `Transaction` interface is clean but has no way to tell where a transaction came from. When transactions arrive from manual entry, CSV import, or another bank, there is no `source` field to differentiate them. A discriminator like `source: 'manual' | 'monobank' | 'import'` would future-proof the type.

---

### Tier 2 — Repository Layer: Missing Abstractions & Vendor Coupling

**S3. Monobank types imported into repository contracts**

**File:** [src/models/cards/CardsRepository.ts](src/models/cards/CardsRepository.ts)

- Line 3: imports `MonobankAccount` from the services layer — a service type crossing into the repository contract.
- Lines 19–21: the `CardsRepositoryContract` exposes `findByMonobankAccountId()`, `upsertMonobankCards(accounts: MonobankAccount[])`, and `getMonobankCards()`. These are vendor-specific methods in what should be a generic domain repository.
- Lines 42–46: `buildMonobankCardTitle()` is Monobank business logic living inside the repository.

**Fix direction:** Extract bank-specific upsert/title logic into an adapter layer. The contract should expose a generic `upsertExternalCards(userId, ExternalAccountData[])`.

**S4. No base repository abstraction — boilerplate × N**

All three repositories repeat identical patterns:

| Pattern                               | UsersRepository      | CardsRepository             | TransactionsRepository |
| ------------------------------------- | -------------------- | --------------------------- | ---------------------- |
| `database.get<Model>('table')`        | lines 27, 42, 49, 60 | lines 50, 59, 80, 94, 103   | lines 30, 39, 50, 96   |
| `toDomain(model)` mapper              | line 18              | line 24                     | line 13                |
| `database.write(async () => { ... })` | lines 30, 70         | lines 64, 82, 115, 125, 131 | line 55                |

Adding 5 new entities means repeating each pattern 5 more times with no shared foundation.

**S5. Inconsistent ID generation strategy**

- **Users & Cards:** auto-generated UUIDs by WatermelonDB.
- **Transactions:** external IDs forced via `r._raw.id = tx.id` ([TransactionsRepository.ts:76](src/models/transactions/TransactionsRepository.ts#L76)) — directly accessing WatermelonDB internals.
- No documented convention for when to use auto vs. external IDs. Future entities (budgets with user-provided names? attachments with file hashes?) have no established pattern to follow.

**S6. No cross-repository atomic operations**

Each repository can batch its own entity writes (e.g. `CardsRepository.reorderCards`, `TransactionsRepository.upsertBatch`), but there is no `UnitOfWork` or cross-repository transaction support. Risk: creating a Budget + its Categories as two separate `database.write()` calls could leave orphans if the second write fails.

---

### Tier 3 — Services Layer: Tight Coupling, No Interfaces

**S7. No `BankService` interface — concrete types everywhere**

- [src/services/monobank/api.ts](src/services/monobank/api.ts) — `MonobankService` is a concrete class (~120 lines) with no interface. Adding PrivatBank means duplicating the entire class with different URLs, error codes, and auth headers.
- [src/services/sync/TransactionSyncService.ts:5,45](src/services/sync/TransactionSyncService.ts) — `syncAllAccounts()` accepts `MonobankService` by concrete type: `monobankService: MonobankService`. Should accept a `BankService` interface instead.

**S8. Rate limiter hardcoded for Monobank**

**File:** [src/services/monobank/rateLimiter.ts](src/services/monobank/rateLimiter.ts)

`RATE_LIMIT_MS = 60_000` is hardcoded at the top. Different banks have different rate limits (PrivatBank might use 120s, or use token-bucket instead of fixed-window). The `RateLimiter` class should accept `limitMs` as a constructor parameter.

**S9. Two competing key-value storage abstractions**

- [src/services/storage/StorageGateway.ts](src/services/storage/StorageGateway.ts) — defines an async `StorageGateway` interface (`getItem`, `setItem`, `removeItem`).
- [src/services/monobank/MonobankTokenService.ts:4-8](src/services/monobank/MonobankTokenService.ts) — defines a _different_ sync `KeyValueStorage` interface (`set`, `getString`, `delete`).

Two abstractions solving the same problem. `MonobankTokenService` should use `StorageGateway`, or both should be unified.

**S10. Token storage is vendor-specific**

**File:** [src/services/monobank/MonobankTokenService.ts:1-2](src/services/monobank/MonobankTokenService.ts)

Keys are hardcoded: `'monobank_personal_token'`, `'monobank_client_name'`. Adding another bank requires creating an entirely new `PrivatBankTokenService` class. A generic `BankTokenService` parameterized by bank type would eliminate this duplication.

**S11. TransactionSyncService mixes infrastructure and business rules**

**File:** [src/services/sync/TransactionSyncService.ts:9](src/services/sync/TransactionSyncService.ts)

`HISTORY_DAYS = 30` is a business rule (how far back to sync) living in the infrastructure layer. This should be configurable or live in the feature/domain layer. The sync service should receive the date range, not decide it.

**S12. Error types are Monobank-specific**

`MonobankError` (with codes like `'RATE_LIMITED'`, `'UNAUTHORIZED'`) is checked via `instanceof` in multiple stores:

- [useMonobankStore.ts:38](src/features/monobank/state/useMonobankStore.ts#L38)
- [useTransactionsStore.ts:68](src/features/transactions/state/useTransactionsStore.ts#L68)

Adding another bank means stores must handle `MonobankError | PrivatBankError | ...`. A generic `BankApiError` base class with shared error codes would let stores handle errors uniformly.

---

### Tier 4 — Stores & Features: Cross-Store Coupling, Missing Patterns

**S13. Direct store-to-store calls create hard cross-feature dependencies**

**File:** [src/features/monobank/state/useMonobankStore.ts](src/features/monobank/state/useMonobankStore.ts)

- Line 35: `useTransactionsStore.getState().syncFromMonobank(userId).catch(() => {})` — monobank feature cannot function without transactions feature.
- Line 48: `useTransactionsStore.getState().reset()` called on disconnect.

This creates a directed dependency graph between features. As features grow, these direct `.getState()` calls will form a tangled web. An event/callback pattern or coordinator would decouple them.

**S14. Store calls UI presentation directly**

**File:** [src/features/transactions/state/useTransactionsStore.ts:71-76](src/features/transactions/state/useTransactionsStore.ts)

The store action calls `showErrorBottomSheet()` to display UI. Stores should set error state; screens should decide how to present it. This couples business logic to a specific UI component.

**S15. Inconsistent async action patterns across stores**

| Store                  | Loading field     | Error field      | Uses `finally`? |
| ---------------------- | ----------------- | ---------------- | --------------- |
| `useCardsStore`        | `isLoading`       | `errorMessage`   | Yes             |
| `useTransactionsStore` | `isLoadingFromDb` | (none for loads) | No              |
| `useCreateCardStore`   | `isSubmitting`    | `errorMessage`   | Yes             |

Three different approaches for the same try/loading/catch/error/finally pattern. A shared `createAsyncAction` helper would standardize this.

**S16. Inconsistent dependency injection**

- `useCardsStore` uses a proper factory pattern: `createCardsStore(deps)` with injected repository — testable.
- `useMonobankStore` uses `create()` directly with module-level concrete imports — not testable without module mocking.
- `useTransactionsStore` instantiates `new TransactionsRepository()` and `new CardsRepository()` at module level (lines 30–31) — same problem.

All stores should follow the factory + DI pattern that `useCardsStore` already demonstrates.

**S17. Legacy `card_name` field without deprecation plan**

- [src/services/database/models/CardModel.ts](src/services/database/models/CardModel.ts) — `@field('card_name') legacyCardName` still defined.
- [src/models/cards/CardsRepository.ts:27](src/models/cards/CardsRepository.ts#L27) — fallback `model.title || model.legacyCardName` still in mapper.
- [src/services/database/schema.ts:18](src/services/database/schema.ts#L18) — `card_name` column still in schema.

This field was replaced by `title` in migration v2 but never cleaned up. As the schema grows, legacy fields accumulate without a deprecation/removal process.

---

### Summary: What breaks first when scaling

| Scenario                                                               | What breaks                                                                                                                   | Findings                     |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Add a second bank (PrivatBank)                                         | Domain types balloon, repository contracts need vendor methods, no service interface, duplicate token/error/rate-limiter code | S1, S3, S7, S8, S9, S10, S12 |
| Add 5 new entities (budgets, categories, tags, recurring, attachments) | Repository boilerplate × 5, no base class, no cross-repo transactions, inconsistent ID strategy                               | S4, S5, S6                   |
| Add manual transaction entry                                           | No source discriminator on Transaction                                                                                        | S2                           |
| Add more features with stores                                          | Cross-store coupling grows, inconsistent async/DI patterns, stores call UI                                                    | S13, S14, S15, S16           |

---

## Maintainability Audit (2026-04-15)

> Goal: identify code-quality, readability, testability, and consistency issues that make the codebase harder to modify, debug, or onboard into. Grouped by severity.

---

### Critical — Will Bite You in Production

**M1. No React error boundary — render errors crash the app**

**File:** [App.tsx](App.tsx)

There is no `ErrorBoundary` component wrapping the app or its navigation tree. Any unhandled exception during render (bad data shape, null dereference in a component) produces an unrecoverable white screen. React Native does not recover from render errors automatically.

**Fix:** Add an `ErrorBoundary` around `<AppShell />` (or at minimum around `<RootNavigator />`) with a fallback "something went wrong" screen and a restart button.

**M2. `formatMoneyAmount` hardcodes USD currency**

**File:** [src/features/cards/components/CardItem.tsx:12-17](src/features/cards/components/CardItem.tsx#L12-L17)

```typescript
const formatMoneyAmount = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
```

This is the only money formatter in the app, and it's hardcoded to USD with `en-US` locale. Monobank returns UAH amounts. Every card displays the wrong currency symbol. This function should:

- Accept a currency code parameter (or read it from the `Card.currencySymbol` field)
- Live in a shared utility, not inline in a component
- Be reused by `TransactionItem` as well (which currently has no formatting)

---

### High — Actively Hurts Day-to-Day Development

**M3. HomeScreen orchestrates too much logic**

**File:** [src/features/home/HomeScreen.tsx](src/features/home/HomeScreen.tsx)

This 132-line screen subscribes to **4 separate stores** (lines 21–44), runs **3 `useEffect` hooks** (lines 47–62), manages pull-to-refresh (lines 64–75), foreground sync (lines 77–83), and renders cards, transactions, and quick actions.

Issues:

- Hard to test: you need to mock 4 stores and track 3 effect chains
- Hard to reason about: changing the sync flow requires understanding all the interactions
- Loading/empty/error states are fragmented (loading text on line 100, error on line 101, but no empty state when `cards.length === 0` and not loading)

**Fix direction:** Extract a `useHomeScreenData()` custom hook that orchestrates all data loading and returns a unified state. The screen becomes purely presentational.

**M4. Dead "New Transaction" button**

**File:** [src/features/transactions/TransactionsScreen.tsx:120](src/features/transactions/TransactionsScreen.tsx#L120)

```typescript
<Button title="New Transaction" onPress={() => {}} variant="primary" />
```

A visible, tappable button with an empty handler. This confuses users (nothing happens on press) and confuses developers (is this intentional? WIP? forgotten?). Either implement it, hide it behind a feature flag, or remove it with a TODO comment.

**M5. Two unresolved TODOs left in TransactionsScreen**

**File:** [src/features/transactions/TransactionsScreen.tsx:73,97](src/features/transactions/TransactionsScreen.tsx#L73)

```typescript
// TODO: Replace ActivityIndicator with custom branded loader
```

Both loaders are raw `ActivityIndicator` with no branding. If the intent is to keep them, remove the TODO. If the intent is to replace them, do it — stale TODOs erode trust in comments.

**M6. Inefficient double `database.write()` in `upsertMonobankCards`**

**File:** [src/models/cards/CardsRepository.ts:115-127](src/models/cards/CardsRepository.ts#L115-L127)

```typescript
const updated = await database.write(async () => {
  return existing[0].prepareUpdate(r => { ... });
});
await database.write(async () => {
  await database.batch(updated);
});
```

`prepareUpdate` is wrapped in one `database.write()`, then the batch is executed in a _second_ `database.write()`. This is redundant — both should be a single write transaction. Each `database.write()` acquires a write lock, so this doubles the locking overhead for every existing card update.

---

### Medium — Inconsistency That Accumulates

**M7. `AppTextVariant` missing `'button'` despite token existing**

**Files:** [src/shared/ui/AppText.tsx:5](src/shared/ui/AppText.tsx#L5) and [src/shared/theme/tokens.ts:55-59](src/shared/theme/tokens.ts#L55-L59)

The tokens define `typography.button` (fontSize 15, fontWeight 600), but `AppTextVariant` only includes `'h1' | 'h2' | 'body' | 'caption'`. The `Button` component uses `variant="body"` for its label text, ignoring the button-specific typography token. This means button text uses fontSize 16/fontWeight 400 instead of the intended fontSize 15/fontWeight 600.

**Fix:** Either add `'button'` to the `AppTextVariant` union and use it in `Button.tsx`, or remove the unused `button` entry from tokens to avoid confusion.

**M8. `CardItem.type.slice(0, 1).toUpperCase()` — magic inline expression**

**File:** [src/features/cards/components/CardItem.tsx:41](src/features/cards/components/CardItem.tsx#L41)

```typescript
{
  card.type.slice(0, 1).toUpperCase();
}
```

This renders a single-letter type initial as placeholder text. The intent isn't obvious without reading surrounding context. Should be a named utility (e.g., `getCardTypeInitial(type)`) in `src/features/cards/utils.ts` — both for readability and so it can be reused if card types appear elsewhere.

**M9. Missing accessibility attributes on drag-to-reorder cards**

**File:** [src/features/cards/components/CardStack.tsx:81](src/features/cards/components/CardStack.tsx#L81)

```typescript
<Pressable onLongPress={() => onLongPress(index)} delayLongPress={400}>
```

No `accessibilityRole`, `accessibilityLabel`, or `accessibilityHint`. Screen readers won't know this is draggable or what the long-press does. Every interactive element needs at minimum an `accessibilityLabel`.

**M10. CardStack mixes animation, gesture, and business logic in one 216-line file**

**File:** [src/features/cards/components/CardStack.tsx](src/features/cards/components/CardStack.tsx)

While `DraggableCardItem` is correctly extracted as a sub-component (line 27), all three concerns live in the same file:

- Animation: `useAnimatedReaction`, `useAnimatedStyle`, spring config (lines 38–78)
- Gesture handling: `PanResponder.create()` with 4 callbacks (lines 127–186)
- Business logic: `reorderCards(next)` call and array splice (lines 169–174)

This isn't blocking but is the hardest file to modify safely. Extracting `usePanResponder()` or the reorder logic into helpers would reduce cognitive load.

**M11. `CardItem.styles.ts` has hardcoded dimensions**

**File:** [src/features/cards/components/CardItem.styles.ts:5,19,62-63](src/features/cards/components/CardItem.styles.ts#L5)

```typescript
minHeight: 160,     // line 5 — card height
minHeight: 40,      // line 19 — header min height
width: 56,          // line 62 — placeholder size
height: 56,         // line 63 — placeholder size
```

These are layout constants that should either live in the theme as `components.card.height` or be extracted as named constants with comments explaining why they're those specific values. The `CARD_HEIGHT = 160` in `CardStack.styles.ts` duplicates the same value — a change in one must be mirrored in the other.

---

### Low — Polish Items

**M12. `GlobalBottomSheet` returns `null` vs `undefined` inconsistently**

**File:** [src/shared/ui/bottom-sheet/GlobalBottomSheet.tsx:76-77](src/shared/ui/bottom-sheet/GlobalBottomSheet.tsx#L76-L77)

```typescript
const iconName = config ? VARIANT_ICON[config.variant] : null;
const iconColor = config
  ? getVariantIconColor(config.variant, theme.colors)
  : undefined;
```

One returns `null`, the other `undefined` for the same "no config" scenario. Standardize to `null` (React convention for "intentionally empty").

**M13. `Button` uses `array index` as key in `GlobalBottomSheet`**

**File:** [src/shared/ui/bottom-sheet/GlobalBottomSheet.tsx:106](src/shared/ui/bottom-sheet/GlobalBottomSheet.tsx#L106)

```typescript
config.actions.map((action, index) => (
  <Button key={index} ... />
```

Using array index as `key` is fine here (actions don't reorder), but if action arrays change between renders the stale key can cause incorrect state retention. Using `action.label` as key would be safer.

**M14. Barrel export gap: `iconRegistry` not exported**

**File:** [src/shared/ui/icons/index.ts](src/shared/ui/icons/index.ts)

Only exports `Icon` and `types`. The `iconRegistry` object (from `registry.ts`) is not exported, so consumers can't inspect available icons at runtime or in tests. Add `export { iconRegistry } from './registry'`.

---

### Summary: Maintainability Risk Areas

| Area                     | Risk                                   | Findings    |
| ------------------------ | -------------------------------------- | ----------- |
| Production resilience    | No crash recovery                      | M1          |
| Data correctness         | Wrong currency display                 | M2          |
| Dead/stale code          | Confusing future contributors          | M3, M4, M5  |
| Screen complexity        | Hardest files to change safely         | M11         |
| Design system compliance | Token violations undermine consistency | M8, M12     |
| Performance              | Unnecessary double writes              | M6          |
| Cross-screen consistency | Each screen invents its own patterns   | M7, M13     |
| Accessibility            | Screen reader users blocked            | M10         |

---

## Improvement Ideas

### B. Add `deleteCard` and `updateCard` to the repository and store

Currently only create and reorder are supported. Deleting a card requires both repository and store methods. This is the most immediately missing CRUD operation.

---

### C. Extract the `HomeScreen` card section into a dedicated component

**File:** [src/features/home/HomeScreen.tsx](src/features/home/HomeScreen.tsx)

The loading/error/empty/loaded states for cards are handled inline in `HomeScreen`. A `CardsSection` component would clean this up and make the home screen purely compositional.

---

### D. Add typed errors to repositories

All `catch` blocks currently swallow the error and set a generic string message. A lightweight `RepositoryError` type (or even a typed `Result<T, E>`) would let the UI differentiate "not found" from "DB write failed" from "permission denied."

---

### E. Cache `MonobankService` instance in the store

Related to F1. The store should hold a `service: MonobankService | null` field, initialize it on `connect()` or `loadSavedToken()`, and reuse it for subsequent calls. This makes the rate limiter actually effective and avoids redundant object construction.

---

### F. `useTransactionsStore` uses `MonobankStatement` directly — not the domain `Transaction` type

**File:** `src/features/transactions/state/useTransactionsStore.ts`

The store holds `MonobankStatement[]` from `src/services/monobank/types.ts`. Domain data should flow through `src/domain/transactions/Transaction`, with a transformer mapping Monobank statements to domain transactions. This decouples the transactions feature from the Monobank service and prepares it for other data sources (manual entry, CSV import).

---

### G. `HomeScreen` needs composition — extract `CardsSection`

(Extends idea C from above.) Now that `TransactionHistorySection` is also rendered inline, `HomeScreen` is managing loading/error/empty states for two separate data concerns. Extract a `CardsSection` component to match the pattern established by `TransactionHistorySection`. The screen should then just orchestrate layout and navigation.

---

## New Feature Ideas

### 1. Transactions (already stubbed)

The `src/features/transactions/` folder and `TransactionsRepository` exist but are mostly empty. The natural next step: link transactions to cards (a transaction belongs to a card), add a transaction list screen, and add income/expense entry.

### 2. Card balance history

Store a snapshot of `moneyAmount` per card per day. Show a simple sparkline or balance chart on the card detail. Requires a new `card_balance_snapshots` table.

### 3. Budget envelopes / spending limits

Allow the user to set a monthly spending limit on a card. Show a progress bar on the card when approaching the limit. Purely local calculation — no backend needed.

### 4. Data export (JSON / CSV)

Since all data is local, an export screen that dumps all cards and transactions to a shareable file is high-value for users concerned about lock-in. React Native's `Share` API makes this straightforward.

### 5. Dark / light theme toggle

The design system is built to support theme switching (`ThemeProvider`, tokens). A settings screen with a theme toggle would be a fast win that shows off the token architecture. State would live in a `useSettingsStore` (global store, already planned in the architecture).

### 6. Card detail / edit screen

Currently cards can only be created and reordered. A detail screen (tap a card to open it) with an edit form would complete the CRUD loop and is the most natural UX next step after the stack is implemented.

### 7. PIN / biometric lock

Since user data is fully local and there's already a password-based auth, an optional app-level PIN or biometric lock (Face ID / fingerprint) would meaningfully improve the privacy story without requiring a backend.

### 8. Persist Monobank transactions to WatermelonDB

The current integration fetches from the API on every mount and keeps results only in Zustand. The natural next step: add a `transactions` table to the WatermelonDB schema, write a `TransactionsRepository`, and store fetched statements locally. HomeScreen then reads from the DB (fast, offline-capable) and background-syncs from the API.

### 9. Monobank account selector

`getStatements` is currently called with account `'0'` (default). The client-info response already includes all accounts. A small account picker in the Monobank connect screen (or a dedicated screen) would let the user choose which account's transactions to track.

### 10. Background sync / pull-to-refresh for transactions

Once transactions are persisted locally, a background sync job (triggered on app foreground or explicit pull-to-refresh) would keep data fresh without blocking the UI. The architecture already plans for this with `useJobsStore` (process/sync state).
