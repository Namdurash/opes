## Context

Cards render in a draggable `CardStack` on Home. The store (`useCardsStore`) already follows the optimistic-update + rollback pattern (see `reorderCards`), and `CardsRepository` already owns all DB access for the `cards` table. Adding detail/edit/delete is additive: new repository methods, new store actions, one new screen, and a tap entry point — no schema change.

## Goals / Non-Goals

**Goals:**
- View any card's details; edit/delete manual cards; keep Monobank cards read-only.
- Reuse existing patterns (store optimistic+rollback, repository contract+class+`toDomain`, the CreateCard form).
- Preserve the long-press drag-to-reorder gesture.

**Non-Goals:**
- Editing synced cards, a bespoke edit screen, soft-delete/undo.

## Decisions

- **Reuse the CreateCard form for edit via an optional `cardId` param** rather than a second screen. The `CreateCard` route param becomes `{ cardId?: string } | undefined` (backward-compatible — existing `navigate(CREATE_CARD)` calls still type-check). When `cardId` is present the screen prefills from the store, switches copy to "Edit card" / "Save changes", and calls `updateCard` instead of `createCard`. The prefill effect reads the working set imperatively (`useCardsStore.getState()`) keyed on `cardId` so it does not re-run on every cards-array update.
- **Optimistic store actions with rollback**, mirroring `reorderCards`: snapshot `cards`, apply the change, call the repository, reconcile with the returned record (update) or leave it removed (delete); on failure restore the snapshot and surface `showErrorBottomSheet`.
- **`deleteCard` uses `destroyPermanently`** — the local WatermelonDB is the only source of truth for manual cards; there is no remote to reconcile a soft-delete against.
- **Manual vs. synced is decided by `monobankAccountId == null`**, the same signal the repository already sets. The detail screen branches on it to show actions vs. a read-only note.
- **Tap composes with drag** by adding `onPress` to the existing `Pressable` in `CardStack` (long-press still starts the drag; the PanResponder only captures once long-press is active), so a short tap navigates and a hold reorders.

## Risks / Trade-offs

- [Optimistic delete then navigate back] → if the repository delete fails the card is restored in the store and an error sheet is shown; the user is already back on Home but the card reappears, which is the correct rollback signal.
- [Reusing one form for create+edit] → slightly more branching in `CreateCardScreen`, accepted over duplicating the form in a second screen.
