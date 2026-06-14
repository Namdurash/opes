## 1. Repository (models/cards)

- [x] 1.1 Add `UpdateCardInput` and extend `CardsRepositoryContract` with `findById`, `updateCard`, `deleteCard`
- [x] 1.2 Implement `findById` (return `null` on a missing id), `updateCard` (`database.write` + `record.update`), and `deleteCard` (`destroyPermanently`)

## 2. Store (features/cards/state)

- [x] 2.1 Add an optimistic `updateCard` action with rollback + error sheet
- [x] 2.2 Add an optimistic `deleteCard` action with rollback + error sheet

## 3. Navigation (app/navigation)

- [x] 3.1 Append the `CARD_DETAIL` route, type its params `{ cardId: string }`, and add `CardDetailScreenNavigationProp`
- [x] 3.2 Make the `CreateCard` param `{ cardId?: string } | undefined` and register `CardDetailScreen` in `RootNavigator`

## 4. Screens (features/cards, features/home)

- [x] 4.1 Add `CardDetailScreen` (+ styles): card visual, detail rows, manual → Edit/Delete (with confirm), synced → read-only note
- [x] 4.2 Extend `CreateCardScreen` with an edit mode (prefill, copy, `updateCard`)
- [x] 4.3 Add `onCardPress` to `CardStack` composed with the drag gesture and wire the Home tap → `CardDetail`

## 5. Definition of Done

- [x] 5.1 Add store tests for optimistic update/delete + rollback
- [x] 5.2 `npx tsc --noEmit`, `npm run lint`, and `npm test` all pass
