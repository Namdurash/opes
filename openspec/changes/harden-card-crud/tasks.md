## 1. Dependency & test infra

- [ ] 1.1 Add `react-native-fs` to `package.json` (pinned), run `bundle exec pod install`, and confirm autolink/build on iOS + Android
- [ ] 1.2 Add a `react-native-fs` mock to `jest.setup.js` (alongside the existing native-module mocks) so store/repository tests run without the native module

## 2. Shared helpers (no DB/UI deps)

- [ ] 2.1 Add `src/shared/files/` with `persistImageToAppStorage(uri): Promise<string>` (copy into `<DocumentDir>/card-images/<uuid>.<ext>`, base64 read/write fallback for content-scheme URIs) and `deletePersistedImage(path): Promise<void>` (best-effort), plus a barrel `index.ts`
- [ ] 2.2 Add a supported-currency list (`as const`: UAH 980/₴, USD 840/$, EUR 978/€, …) reusing the glyphs in `shared/utils/money.ts`; export through the appropriate barrel
- [ ] 2.3 Extend `createCardSchema` in `src/shared/validation/cardSchema.ts`: `title` max length, `moneyAmount` finite + bounded magnitude, and a `currency` field; update the inferred `CreateCardFormValues` type
- [ ] 2.4 Add unit tests for the file helper (copy vs. fallback path) and the extended schema (title length, non-numeric amount, decimal handling)

## 3. Repository (models/)

- [ ] 3.1 Extend `CreateCardInput` and `UpdateCardInput` with optional `currencyCode` / `currencySymbol`; persist them in `createCard` / `updateCard` (default UAH when unset)
- [ ] 3.2 Add `src/models/cards/CardsRepository.test.ts` covering `sortOrder` assignment on create, `reorderCards` batching, and `updateCard` / `deleteCard` (mock the WatermelonDB collection)

## 4. Currency in the create/edit flow (features/)

- [ ] 4.1 Add currency state to `useCreateCardStore` (selected currency, `setCurrency`, included in `createCard` payload and `resetForm`)
- [ ] 4.2 Add a currency button-group to `CreateCardScreen` (mirror the existing `type` selector); normalize `moneyAmount` to 2 decimals before passing to the store/`updateCard`; prefill currency in edit mode
- [ ] 4.3 Verify `CardItem` and `CardDetailScreen` render the chosen currency via `formatMoney` (no change expected — confirm with a card in a non-default currency)
- [ ] 4.4 Update store tests in `useCardsStore.test.ts` to assert currency is passed through create/update

## 5. Image persistence wiring (features/)

- [ ] 5.1 In `useCreateCardStore.createCard`, copy the picked image via `persistImageToAppStorage` and persist the returned path instead of the raw picker URI
- [ ] 5.2 In the edit path (`useCardsStore.updateCard` / `CreateCardScreen`), persist a newly picked image and `deletePersistedImage` the previous file on replace (best-effort)
- [ ] 5.3 On card delete, best-effort `deletePersistedImage` for the card's image
- [ ] 5.4 Assert in tests that the store passes a copied path (not a `content://`/`file://` picker URI) to the repository

## 6. UX polish (features/)

- [ ] 6.1 Home: render `EmptyState` + the create action when `cards.length === 0` (replace the bare button-only state)
- [ ] 6.2 Delete undo: defer the `repository.deleteCard` commit behind an undo window in `useCardsStore.deleteCard`; show a bottom-sheet notification with an Undo action; restore on undo, commit on expiry/background
- [ ] 6.3 Unsaved-changes guard: subscribe to React Navigation `beforeRemove` in `CreateCardScreen`; when the form is dirty (RHF `isDirty` or changed `type`/`image`/`currency`), show a "Discard changes?" confirm bottom-sheet and only leave on confirm
- [ ] 6.4 Add/adjust store tests for the deferred-delete + undo behavior

## 7. Definition of Done

- [ ] 7.1 Update layer `CLAUDE.md` files if a documented rule changed (new `src/shared/files/` helper; `react-native-fs` mock in jest setup)
- [ ] 7.2 `npx tsc --noEmit` (strict) passes
- [ ] 7.3 `npm run lint` passes (no unused imports/exports)
- [ ] 7.4 `npm test` passes (file helper, schema, repository, store suites)
