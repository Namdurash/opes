# Claude's Notes on Opes

> Written: 2026-03-27. These are observations, opinions, and ideas — not tasks unless the team picks them up.

---

## Opinion

Opes is a clean, well-structured early-stage project. The architecture is intentional: the offline-first stance is enforced by real constraints (WatermelonDB, no network layer), not just stated as a goal. The team clearly cares about conventions — `ARCHITECTURE.md` and `README_AI.md` are detailed and actively followed. The design token system and strict separation of styles into `.styles.ts` files show a maturity that most MVPs skip entirely.

The card drag-and-reorder implementation (`CardStack.tsx`) is more sophisticated than what you usually see at this stage — managing both `PanResponder` and `react-native-reanimated` shared values correctly is non-trivial.

~~The main risk is scope creep in `useCardsStore`: it currently mixes form draft state with domain list state in one store.~~ Fixed — split into `useCardsStore` (list) and `useCreateCardStore` (form).

---

## Findings (Bugs / Issues)

// --- SHOULD FILL IF FIND BUGS OR ISSUES --- //

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
