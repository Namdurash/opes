# Claude's Notes on Opes

> Written: 2026-03-25. These are observations, opinions, and ideas — not tasks unless the team picks them up.

---

## Opinion

Opes is a clean, well-structured early-stage project. The architecture is intentional: the offline-first stance is enforced by real constraints (WatermelonDB, no network layer), not just stated as a goal. The team clearly cares about conventions — `ARCHITECTURE.md` and `README_AI.md` are detailed and actively followed. The design token system and strict separation of styles into `.styles.ts` files show a maturity that most MVPs skip entirely.

The card drag-and-reorder implementation (`CardStack.tsx`) is more sophisticated than what you usually see at this stage — managing both `PanResponder` and `react-native-reanimated` shared values correctly is non-trivial.

The main risk is scope creep in `useCardsStore`: it currently mixes form draft state with domain list state in one store. It works now, but will become painful as the cards feature grows.

---

## Findings (Bugs / Issues)

### 1. `LinearGradient` renders with no size — visually invisible
**File:** [src/features/home/HomeScreen.tsx](src/features/home/HomeScreen.tsx#L33)

```tsx
<LinearGradient colors={[theme.colors.secondary, theme.colors.subtle]} />
```

No `style` prop is passed, so the gradient has zero dimensions and is not visible. Likely intended to be a full-screen background but was wired up without the `StyleSheet` position.

---

### 2. `database.batch()` is not awaited inside `reorderCards`
**File:** [src/models/cards/CardsRepository.ts](src/models/cards/CardsRepository.ts#L74-L75)

```ts
const preparedUpdates = await Promise.all(updates);
database.batch(...preparedUpdates); // ← Promise returned but not awaited
```

`database.batch()` is async. If it rejects, the error is swallowed silently. The write transaction may also complete before the batch finishes.

---

### 3. `Card` domain type lives inside `domain/auth`
**File:** [src/domain/auth/types.ts](src/domain/auth/types.ts)

`User`, `Card`, and `CardType` are all exported from `domain/auth`. Cards are a separate domain concept and should live in `src/domain/cards/`. Mixing them here will make imports confusing as the domain grows.

---

### 4. `card_name` column is a dead-weight legacy field
**File:** [src/services/database/schema.ts](src/services/database/schema.ts#L19) | [src/models/cards/CardsRepository.ts](src/models/cards/CardsRepository.ts#L53)

The schema has both `card_name` and `title`. The repository writes both (`legacyCardName` and `title`) on every `createCard`. The `toDomain` mapper falls back to `legacyCardName` if `title` is empty. This dual-write will live forever unless a migration cleans up the legacy column.

---

### 5. `useCardsStore` mixes form draft state with domain list state
**File:** [src/features/cards/state/useCardsStore.ts](src/features/cards/state/useCardsStore.ts)

`cards`, `isLoading`, and `errorMessage` (domain/list state) live alongside `title`, `moneyAmount`, `type`, `image` (create-card form draft). `ARCHITECTURE.md` explicitly says to prefer multiple small stores. When a second form (edit card) is added, this will require surgery.

---

### 6. `reorderCards` optimistically updates but never rolls back on failure
**File:** [src/features/cards/state/useCardsStore.ts](src/features/cards/state/useCardsStore.ts#L113-L120)

The store sets `cards: newOrder` before the DB write completes. On failure, only `errorMessage` is set — the displayed order does not revert to the previous state. The user sees a wrong order with an error message and no recovery path.

---

### 7. Architecture doc folder structure is out of date
**File:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#L18-L52)

The proposed structure still references `src/services/storage/` (the old `StorageGateway`/`InMemoryStorage` abstraction), but the actual implementation uses WatermelonDB directly via `src/services/database/`. The gateway layer was superseded but the docs were not updated.

---

## Improvement Ideas

### A. Split `useCardsStore` into two stores
- `useCardsStore` — list state only: `cards`, `isLoading`, `errorMessage`, `loadCardsByUser`, `reorderCards`
- `useCreateCardStore` (or `useCardFormStore`) — form draft only: `title`, `moneyAmount`, `type`, `image`, `createCard`, `resetForm`

This aligns with architecture rules and makes both stores independently testable.

---

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

### E. Update `ARCHITECTURE.md` to reflect the real folder structure
The docs reference `src/services/storage/StorageGateway.ts` but the actual storage is WatermelonDB under `src/services/database/`. New contributors will be confused. Either remove the gateway section or document the actual adapter pattern used.

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
