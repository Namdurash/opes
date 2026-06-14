Ticket: OPES-36

> Backfilled retrospectively: this change documents work already implemented and
> committed as `feat(OPES-36)`. Tasks are checked because the code already landed.

## Why

Cards on Home are display-only: a user can create and reorder cards but cannot open one to see its details, fix a typo, change its balance, or remove it. Manual cards (created in-app) therefore accumulate with no way to correct or delete them. Monobank-synced cards, by contrast, are owned by the sync source and must stay read-only.

## What Changes

- Tapping a card on Home opens a new `CardDetail` screen (route `CardDetail { cardId }`) showing the card visual plus balance, type, created date, and — for synced cards — masked PAN / IBAN / credit limit.
- `CardsRepository` gains `findById`, `updateCard(cardId, fields)`, and `deleteCard(cardId)` (`destroyPermanently`, since the local DB is the offline-only source of truth).
- `useCardsStore` gains optimistic `updateCard` / `deleteCard` actions with rollback on failure, mirroring the existing `reorderCards` action.
- Edit and Delete are offered ONLY for manual cards (no `monobank_account_id`). Edit reuses the existing CreateCard form in an edit mode via an optional `cardId` route param; Delete asks for confirmation first. Monobank cards show a read-only detail with no edit/delete.
- `CardStack` composes a tap handler with the existing long-press drag gesture so reorder still works.

## Capabilities

### New Capabilities
- `card-management`: a user SHALL be able to view a card's details and, for manual cards, edit or delete them; Monobank-synced cards SHALL remain read-only.

### Modified Capabilities
- _None — card creation and reorder behavior is unchanged._

## Impact

- `features/cards` (new `CardDetailScreen`, edit-mode `CreateCardScreen`, tappable `CardStack`), `features/home` (tap → detail), `models/cards` (repository CRUD), `app/navigation` (new `CardDetail` route; `CreateCard` param gains optional `cardId`).
- No `domain/` change, no new dependency, no WatermelonDB schema-version bump or migration (delete uses `destroyPermanently` on existing columns).

## Non-goals

- Editing or deleting Monobank-synced cards (owned by the sync source).
- A separate edit screen — edit reuses the CreateCard form.
- Bulk delete, archive/soft-delete, or undo beyond the optimistic rollback.
