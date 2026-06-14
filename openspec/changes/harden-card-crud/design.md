## Context

Manual-card CRUD already works end to end (create/edit/delete/reorder, optimistic store with rollback, monobank read-only guard) but predates the OpenSpec workflow and has no capability spec. Two defects are user-visible — transient image URIs that break after restart, and the inability to set a currency on a manual card — plus weaker validation, a bare empty-state, no delete-undo, and no unsaved-changes guard. This design covers HOW to close those gaps while reusing the existing layer architecture (UI → store → repository → DB; helpers on the side) and changing as little of the working code as possible.

Relevant current state:
- `CardModel` / schema v7 already define `image`, `currency_code`, `currency_symbol` columns — **no migration is required** for either fix.
- `formatMoney` (`src/shared/utils/money.ts`) already resolves a glyph from `currencyCode` (ISO-4217 numeric) and falls back to the alpha `currencySymbol`, defaulting to ₴. It needs no change — manual cards simply never populate those fields today.
- Images are stored as the raw picker URI in `useCreateCardStore` and written straight through `CardsRepository.createCard`.
- No project code performs filesystem IO; there is no toast/snackbar primitive — notifications go through the existing bottom-sheet (`showBottomSheet` / `showErrorBottomSheet`).

## Goals / Non-Goals

**Goals:**
- Picked images survive app restart and OS cache eviction.
- A manual card can be created/edited in a user-chosen currency, shown consistently wherever money renders.
- Card forms reject over-long titles and malformed/extreme amounts, normalizing amounts to 2 decimals.
- Home shows a friendly empty-state; deletes are undoable in-session; editing warns on unsaved changes.
- `CardsRepository` gains test coverage. Definition of Done stays green.

**Non-Goals:**
- Any mutation of monobank-synced cards (stay read-only); FX/multi-currency conversion; soft-delete/trash; image cropping/compression; touching the drag-reorder interaction or the monobank upsert path.

## Decisions

### 1. Image persistence — copy to app document storage via `react-native-fs`

When the user picks an image, copy it from the picker's transient URI into the app's document directory (e.g. `<DocumentDir>/card-images/<uuid>.<ext>`) and persist that stable path on the card instead of the picker URI.

- **Why a new dependency.** React Native ships no filesystem copy API; `react-native-image-picker` only returns a transient URI (a cache `file://` that can be evicted, or an Android `content://` whose grant the OS can revoke). Persisting the bytes is the only correct fix, and nothing in the project does file IO today. `react-native-fs` is the de-facto RN filesystem library and exposes `copyFile` + `DocumentDirectoryPath`.
- **Alternatives considered.** (a) Base64-encode the image into the existing `image` string column — rejected: bloats the WatermelonDB row, hurts query/load performance, and WatermelonDB is not meant for blobs. (b) `@react-native-camera-roll` / vision-camera — heavier, wrong problem. (c) Write our own native module — unjustified for a one-call copy.
- **Layering.** Filesystem IO is a side-effect, not data access, so it must not live in the repository (DB-only, no RN imports). Add a thin helper module `src/shared/files/` exposing `persistImageToAppStorage(uri): Promise<string>` and `deletePersistedImage(path): Promise<void>`. The **store action** orchestrates: copy first, then pass the returned local path to `repository.createCard` / `updateCard`. UI → store → (shared file helper) + repository → DB stays intact.
- **Lifecycle.** On edit that replaces the image, delete the previous file (best-effort). On card delete, best-effort delete the associated file. Orphans are a bounded, harmless storage leak.
- **Android `content://`.** `RNFS.copyFile` accepts content URIs on modern RN; if a copy rejects, fall back to `readFile`/`writeFile` (base64) into the destination path. Spec'd as a scenario.
- **Testing.** Mock `react-native-fs` in `jest.setup.js` (same pattern already used for native modules) so store tests run; the helper itself is covered by asserting the store passes a copied path, not a raw URI.

### 2. Currency selection — reuse existing columns + glyph map

Add a `currency` choice to the create/edit form. Persist both `currencyCode` (ISO-4217 numeric) and `currencySymbol` (alpha, e.g. `"USD"`) on the card, mirroring how monobank cards are stored, so `formatMoney` resolves the glyph with no change.

- A small `as const` list of supported currencies (UAH 980/₴, USD 840/$, EUR 978/€, …) lives next to the form or in `shared/` and reuses the glyphs already in `money.ts`. Selection renders with the existing button-group pattern used for card `type` (no new UI dependency).
- `CreateCardInput` and `UpdateCardInput` gain optional `currencyCode` / `currencySymbol`; `createCard` / `updateCard` persist them. Default to UAH when unset for backward compatibility (existing manual cards keep rendering ₴).
- `CardItem` and `CardDetailScreen` already call `formatMoney` with the card's currency, so they update automatically once the fields are populated.

### 3. Validation hardening — extend `createCardSchema`

Extend the Yup schema in place (still the single source for RHF):
- `title`: required, trimmed, **max length** (e.g. 60 chars).
- `moneyAmount`: required, must be a finite number, bounded magnitude (reject absurd values), and **normalized to 2 decimal places** before it reaches the store. Normalization happens in the store/submit mapping so the persisted number is clean.
- Add the `currency` field to the schema/inferred type.

### 4. Empty-state — reuse `EmptyState`

On Home, when `cards.length === 0`, render the existing `EmptyState` component with a short message plus the existing "Create card" button (today only the bare button shows). No new component.

### 5. Delete undo — defer the repository commit

Keep hard-delete, but defer it. On confirm, optimistically remove the card from the store and show a bottom-sheet notification with an **Undo** action; the repository `deleteCard` is only committed after the undo window elapses (or the sheet is dismissed). Undo restores the card to the store and skips the repository call. Commit early if the app backgrounds.

- **Why not a recycle bin.** Out of scope (non-goal) and heavier; a deferred-commit window is the lightest correct undo and needs no schema change.
- **Surface.** Reuse the existing bottom-sheet notification with an action button — avoids adding a snackbar/toast dependency. (Open question below on exact ergonomics.)

### 6. Unsaved-changes guard — `beforeRemove`

On the edit screen, subscribe to React Navigation's `beforeRemove` event. If the RHF form `isDirty` or the store-held `type`/`image`/`currency` changed, prevent the default, show a "Discard changes?" confirm bottom-sheet, and only pop on confirm. Reuses `useNavigation` + `showBottomSheet`; no new dependency.

## Risks / Trade-offs

- **New native dependency (`react-native-fs`) requires a Pod install + autolink + jest mock.** → Pin the version, run `bundle exec pod install`, add the mock to `jest.setup.js` alongside the other native mocks; document in the layer `CLAUDE.md` if a rule changes.
- **Orphaned image files** if a delete fails or the app is killed mid-flow. → Best-effort cleanup on delete; leak is bounded (one small file per abandoned card) and never corrupts data.
- **Android `content://` copy edge cases.** → `copyFile` first, base64 read/write fallback; covered by a scenario.
- **Deferred-delete window vs. app kill.** → If the app is killed during the undo window the card simply persists (safe, reappears on next load); commit on background to shrink the window.
- **Currency is per-card, never converted.** → Mixed-currency card lists show each card in its own currency; any future aggregate total is explicitly out of scope here.

## Migration Plan

- **No schema migration** — `image`, `currency_code`, `currency_symbol` already exist (schema v7). No `version` bump.
- Add `react-native-fs`, run pod install, add jest mock. Rollback = revert the commit; persisted image files and any currency values already written remain harmless and ignored by the reverted code.

## Open Questions

- `moneyAmount` bounds: exact max magnitude, and whether negative balances are permitted (e.g. for `credit` cards carrying debt) or clamped to ≥ 0.
- Undo ergonomics: bottom-sheet-with-action vs. introducing a lightweight in-house snackbar (no dependency) — pick during apply.
- Initial currency list to expose (UAH/USD/EUR only, or the full glyph set in `money.ts`).
