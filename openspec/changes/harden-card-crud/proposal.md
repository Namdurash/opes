Ticket: OPES-41

<!-- OPES-41 = highest OPES-NN in git log (OPES-40) + 1, per the autonomous ticket-numbering rule in CLAUDE.md. -->

## Why

Manual-card CRUD shipped ad-hoc before the OpenSpec workflow (commits OPES-36 card detail/edit/delete, OPES-39 monobank cards), so it has **no capability spec** and carries known defects. The two worst are user-visible: a card's picked image is stored as a transient `content://`/`file://` URI that the OS can revoke or clear — so images silently vanish after a restart — and a manually created card can never represent anything but ₴/UAH because the create flow never sets a currency. This change formalizes the first `cards` spec and fixes the accumulated gaps in one pass, without rebuilding the working CRUD.

## What Changes

- **Persist picked images.** Copy the selected photo into the app's own document directory at create/edit time and store that stable local path instead of the picker's transient URI. Images survive app restarts and cache eviction. Requires a file-system capability (no project code copies files today) — justified in `design.md`.
- **Currency on manual cards.** Add a currency choice (UAH / USD / EUR / …) to the create/edit form; persist `currencyCode` + `currencySymbol` on the card and surface it everywhere money is shown (`CardItem`, `CardDetailScreen`). Reuses the existing `currency_code` / `currency_symbol` columns — **no schema migration**.
- **Harden validation.** Add a `title` max length and `moneyAmount` bounds + normalization to 2 decimal places in `createCardSchema`.
- **UX polish.** A friendly empty-state on Home when the user has no cards (today there is only a bare "Create card" button), an undo affordance after a delete, and an unsaved-changes guard when leaving the edit screen with pending edits.
- **Repository tests.** Add `CardsRepository` tests covering `sortOrder` assignment on create, `reorderCards` batching, and `updateCard`/`deleteCard` — the repository currently has zero coverage.

## Capabilities

### New Capabilities
- `cards`: the manual-card lifecycle (create, view, edit, delete, reorder), image persistence into app storage, per-card currency selection, and the field-validation rules for card forms. Monobank-synced cards remain read-only.

### Modified Capabilities
<!-- None — no existing capability spec governs cards; `cards` is introduced new above. -->
- _None._

## Impact

- **features/** — `cards/state/useCreateCardStore.ts` (image copy + currency state), `cards/CreateCardScreen.tsx` (currency picker, unsaved-changes guard), `cards/CardDetailScreen.tsx` + `components/CardItem.tsx` (show currency), `cards/state/useCardsStore.ts` (delete-undo support); `home/HomeScreen.tsx` (empty-state).
- **models/** — `cards/CardsRepository.ts`: `CreateCardInput` / `UpdateCardInput` gain `currencyCode` / `currencySymbol`; `createCard` / `updateCard` persist them. New `CardsRepository` test file.
- **shared/** — `shared/validation/cardSchema.ts` (title length, amount bounds + 2-decimal normalize, currency field); a small file-copy helper under `shared/` wrapping the file-system dependency; `shared/utils/money.ts` is reused as-is (already currency-aware).
- **domain/** — no new fields: `Card` already carries `currencyCode`, `currencySymbol`, and `image`.
- **Data model / migration** — **none.** The `cards` table already has `image`, `currency_code`, and `currency_symbol` columns (schema v7); no schema-version bump or migration.
- **Dependencies** — one new file-system library (e.g. `react-native-fs`) for the image copy, justified in `design.md`; native autolink + a Pod install.

## Non-goals

- Editing, currency selection, or any mutation of **monobank-synced** cards — they stay read-only.
- Multi-currency conversion / FX rates / aggregating mixed-currency totals — each card keeps its own currency; no conversion.
- Soft-delete / trash / recoverable bin — delete stays a permanent hard-delete (the undo is an in-session pre-commit affordance, not a recycle bin).
- Image cropping, resizing, or compression — only a verbatim copy into app storage.
- Reworking the monobank `upsertMonobankCards` sync path or the drag-reorder interaction.
