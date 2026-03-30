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
