# OPES-68 — built

- branch `aif/OPES-68` · 8 files changed, 646 insertions(+), 11 deletions(-) · 45 min · 5 dispatch(es) · stage `done`
- built against `ticket.md` sha256 `07abfa58d41b5fc96872c81b57209a5c3face0c6f50ae7121b7d54b7e8e763b4`

## Stations

| station | attempts | turns | output tokens | cost |
|---|---|---|---|---|
| plan | 1 | 42 | 21443 | tokens only |
| tests | 3 | 93 | 87315 | tokens only |
| implement | 1 | 38 | 13057 | tokens only |

_Costs come from `.aif/prices.json`; a model missing there prints "tokens only". Tokens are always recorded. Each station's own account of what it did is kept in `stations/`._

## Stations that ended with a runner error

The runner reported a failure for these dispatches. Their artifacts were still
judged by the gate — the gate is the verdict — so a station can appear here and
have been admitted anyway. Read it next to the diff.

- `tests` attempt 1 — no result field
- `tests` attempt 2 — no result field
- `tests` attempt 3 — no result field

## Decisions the plan made

- **D-001** Derive inactivity in CardStack as `monobankStatus !== 'connected' && card.type === 'monobank'`, reading status from useMonobankStore.
  - because: the human decided the state is derived at render with no cards column, and CardStack is the one place that already owns press and drag
- **D-002** Import the store deep in CardStack: `import { useMonobankStore } from '../../monobank/state/useMonobankStore'`.
  - because: the monobank barrel re-exports ConnectMonobankScreen, which imports app/navigation and cycles back into the cards barrel
  - rather than: Import useMonobankStore from the '../../monobank' barrel.
- **D-003** Give CardItem two new optional props, `inactive?: boolean` (default false) and `onDelete?: () => void`, and keep it free of any store import.
  - because: CardItem also renders inside CardDetailScreen, where no Monobank status applies, and the features layer rule keeps it presentational
- **D-004** When `inactive`, render `<View testID="card-inactive" pointerEvents="none" style={styles.inactiveOverlay} />` as the first child of CardItem's content, before badge and delete control.
  - because: AC-004 needs one queryable node, and both render branches (ImageBackground and plain View) must grey identically; later siblings paint above the wash
- **D-005** When `inactive`, render a pill holding `<AppText testID="card-disconnected-badge">Disconnected</AppText>` — that literal string, no other copy.
  - because: AC-003 asserts the text and AC-014 counts the badge by testID
- **D-006** Render the delete control as `<Pressable testID="card-delete" accessibilityLabel="Delete card">` with an AppText label 'Delete', whenever `inactive` is true and regardless of whether onDelete was passed.
  - because: AC-008 counts controls by testID and AC-009 taps one, so presence must depend on `inactive` alone
  - rather than: Add a trash icon to src/shared/ui/icons/registry.ts — it needs a new SVG asset.
- **D-007** On delete-control press CardItem calls showBottomSheet with variant 'error', title 'Delete card?', a Delete action (variant 'danger') invoking `onDelete?.()` and a Cancel action.
  - because: the ticket reuses CardDetailScreen's existing confirmation and names reworking that screen a non-goal, so the config is copied, not extracted
  - rather than: Extract a shared confirm helper and repoint CardDetailScreen at it.
- **D-008** CardStack passes `onDelete={() => deleteCard(card.id)}`, taking deleteCard from useCardsStore beside the existing reorderCards selector.
  - because: useCardsStore.deleteCard already owns the optimistic removal and its rollback sheet
- **D-009** Block the tap by handing DraggableCardItem `onPress={inactive ? undefined : onCardPress}`; leave onLongPress, delayLongPress and the PanResponder byte-unchanged.
  - because: the human kept long-press reorder for tombstones, so only the press path may be gated
- **D-010** Cascade inside CardsRepository.deleteCard: in one database.write, fetch the card and its transactions, then database.batch(...transactions.map(t => t.prepareDestroyPermanently()), card.prepareDestroyPermanently()).
  - because: the ticket requires one models-layer operation, and a store gluing two repositories cannot share a writer without leaking WatermelonDB models out of the layer
  - rather than: Add deleteByCardId to TransactionsRepository and call it from useCardsStore before deleteCard.
- **D-011** Query the cascaded rows with exactly `Q.where('card_id', cardId)` on the 'transactions' collection — no user-wide, type-wide or monobank-wide predicate.
  - because: destroyPermanently has no backup and AC-012 guards the neighbouring card's rows
- **D-012** Leave useMonobankStore.connect, useMonobankStore.disconnect and useCardsStore.deleteCard unchanged.
  - because: AC-001, AC-002, AC-013 and AC-015 pin behaviour that is already correct — disconnect must keep touching no table at all
- **D-013** Style the grey with existing tokens — surface for the overlay, border for its edge, textMuted for the badge text — and add no token and no schema migration.
  - because: a new token must be declared in both palettes in tokens.ts, and the human ruled out a stored flag

## Decided with the analyst

- Чи виживає картка Monobank після відключення? → Так. Ні рядок картки, ні її транзакції не видаляються — disconnect не чіпає базу взагалі
- Якщо виживає — як вона подана на Home? → Сіра, з бейджем 'Disconnected', баланс заморожений на останньому синхронізованому, тіло картки не тапається
- Якщо не виживає — що стається з її транзакціями? → Відключення не видаляє нічого. Видалення стається лише коли користувач сам його попросив — і тоді транзакції йдуть каскадом разом із карткою
- Чи це вибір користувача, а не застосунку? → Так, і саме тому діалогу при відключенні немає: застосунок сам не видаляє нічого, тож питати нема про що. Видалення — окрема явна дія користувача на сірій картці
- Чи відновлює повторне підключення стару картку, чи створює нову? → Підхоплює стару за monobank_account_id, історія триває однією стрічкою — це вже поточна поведінка upsertMonobankCards
- Чи бере відключена картка участь у перетягуванні стосу (long-press reorder)? → Так, перетягування лишається як є. Блокується лише тап по тілу картки — саме він і створює ілюзію, що картка робоча
- Як користувач прибирає відключену картку з Home? → Контролом видалення на самій сірій картці: тап → наявне підтвердження 'Delete card?' → картка та її транзакції видаляються. Довгий натиск лишається за перетягуванням, тож конфлікту жестів немає
- **by default, not by the human:** Неактивність — похідний стан на рендері чи збережений прапорець у схемі cards? → Похідний на рендері з useMonobankStore.status. Без нової колонки і без міграції схеми: стан сам вмикається на відключенні й сам вимикається на реконекті, і при невдалому clear() (OPES-64) не вмикається взагалі, бо статус не змінився _(architecture)_
- **by default, not by the human:** Де живе каскад транзакцій при видаленні картки? → У шарі models — видалення картки та її транзакцій має бути однією операцією, а не двома викликами зі стора, інакше збій між ними лишає сиріт. Точне розміщення (розширити CardsRepository.deleteCard чи додати deleteByCardId у TransactionsRepository і склеїти їх одним database.write) вирішує план; контракт — AC-011 і AC-012 _(architecture)_
- **by default, not by the human:** Чи перевикористовувати наявне підтвердження видалення? → Так. showBottomSheet({ title: 'Delete card?' }) з CardDetailScreen і useCardsStore.deleteCard з його оптимістичним відкотом — нове підтвердження не вводиться

## Not verified by this run

- [ ] **ticket VG-001** Жоден тест не доводить, що сіре оформлення справді читається як 'неактивна' і що контрол видалення на ній помітний — це видно лише оком на складеному білді
- [ ] **ticket VG-002** Реконект перевіряється на підробному сервісі Monobank, не на живому API — що справжній акаунт повернеться з тим самим id, цикл не встановлює
- [ ] **ticket VG-003** Каскадне видалення перевіряється на тестовій базі з одиницями рядків. Що на реальному пристрої з місяцями імпортованої історії воно зносить рівно ті рядки й нічого більше, зелений прогін не доводить — потрібне справжнє відключення й видалення на sandbox-білді з уже імпортованими транзакціями
- [ ] **plan react-native-reanimated** external dependency with no check and no criterion — nothing in this run exercised it
- [ ] **tests CardsRepository reads returns an empty list for a user with no cards::CardsRepository reads returns an empty list for a user with no cards** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository reads returns the cards belonging to one user, in sort order::CardsRepository reads returns the cards belonging to one user, in sort order** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository reads finds a card by id::CardsRepository reads finds a card by id** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository reads returns null when the id does not exist::CardsRepository reads returns null when the id does not exist** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository reads returns null when no card carries the monobank account id::CardsRepository reads returns null when no card carries the monobank account id** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository writes creates a card with the given fields and appends it to the order::CardsRepository writes creates a card with the given fields and appends it to the order** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository writes updates only the fields it is given::CardsRepository writes updates only the fields it is given** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository writes deletes a card so it can no longer be found::CardsRepository writes deletes a card so it can no longer be found** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository writes rewrites sort order to match the given id sequence::CardsRepository writes rewrites sort order to match the given id sequence** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository monobank cards creates a monobank card from an account and finds it by account id::CardsRepository monobank cards creates a monobank card from an account and finds it by account id** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository monobank cards updates the existing card instead of adding a second one for the same account::CardsRepository monobank cards updates the existing card instead of adding a second one for the same account** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository monobank cards returns only the cards linked to a monobank account::CardsRepository monobank cards returns only the cards linked to a monobank account** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository delete cascade AC-010 — leaves the user no monobank cards once the disconnected one is deleted::CardsRepository delete cascade AC-010 — leaves the user no monobank cards once the disconnected one is deleted** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository delete cascade AC-012 — leaves the other card and its transactions untouched::CardsRepository delete cascade AC-012 — leaves the other card and its transactions untouched** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository test-database isolation writes a card that the next case must not see::CardsRepository test-database isolation writes a card that the next case must not see** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository test-database isolation starts from an empty table despite the previous case writing one::CardsRepository test-database isolation starts from an empty table despite the previous case writing one** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.connect when saving the token rejects AC-017 — raises the general error sheet, not "Connection Failed"::useMonobankStore.connect when saving the token rejects AC-017 — raises the general error sheet, not "Connection Failed"** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.connect when saving the token rejects AC-020 — puts the store in the error status::useMonobankStore.connect when saving the token rejects AC-020 — puts the store in the error status** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.connect when the Monobank API rejects AC-018 — keeps "Connection Failed" for a MonobankError::useMonobankStore.connect when the Monobank API rejects AC-018 — keeps "Connection Failed" for a MonobankError** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.connect when the Monobank API rejects AC-019 — keeps "Connection Failed" for an error that is not a MonobankError::useMonobankStore.connect when the Monobank API rejects AC-019 — keeps "Connection Failed" for an error that is not a MonobankError** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token rejects AC-003 — leaves the status at connected::useMonobankStore.disconnect when clearing the token rejects AC-003 — leaves the status at connected** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token rejects AC-004 — keeps the client name::useMonobankStore.disconnect when clearing the token rejects AC-004 — keeps the client name** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token rejects AC-005 — keeps the error message that was already there::useMonobankStore.disconnect when clearing the token rejects AC-005 — keeps the error message that was already there** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token rejects AC-006 — keeps the linked accounts::useMonobankStore.disconnect when clearing the token rejects AC-006 — keeps the linked accounts** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token rejects AC-007 — keeps the account selection::useMonobankStore.disconnect when clearing the token rejects AC-007 — keeps the account selection** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token rejects AC-008 — does not clear the cached Monobank service::useMonobankStore.disconnect when clearing the token rejects AC-008 — does not clear the cached Monobank service** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token rejects AC-009 — does not clear the account selection::useMonobankStore.disconnect when clearing the token rejects AC-009 — does not clear the account selection** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token rejects AC-010 — does not reset the transactions store::useMonobankStore.disconnect when clearing the token rejects AC-010 — does not reset the transactions store** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token rejects AC-011 — raises the general error sheet::useMonobankStore.disconnect when clearing the token rejects AC-011 — raises the general error sheet** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token rejects AC-012 — resolves rather than rejecting::useMonobankStore.disconnect when clearing the token rejects AC-012 — resolves rather than rejecting** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token resolves AC-013 — moves the status to idle::useMonobankStore.disconnect when clearing the token resolves AC-013 — moves the status to idle** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token resolves AC-014 — clears the cached Monobank service::useMonobankStore.disconnect when clearing the token resolves AC-014 — clears the cached Monobank service** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token resolves AC-015 — clears the account selection::useMonobankStore.disconnect when clearing the token resolves AC-015 — clears the account selection** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect when clearing the token resolves AC-016 — resets the transactions store::useMonobankStore.disconnect when clearing the token resolves AC-016 — resets the transactions store** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect against a database holding the imported card AC-001 — leaves the monobank card in the database::useMonobankStore.disconnect against a database holding the imported card AC-001 — leaves the monobank card in the database** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.disconnect against a database holding the imported card AC-002 — leaves the three imported transactions on that card::useMonobankStore.disconnect against a database holding the imported card AC-002 — leaves the three imported transactions on that card** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardStack while Monobank is disconnected AC-006 — still opens a manual card in the same stack::CardStack while Monobank is disconnected AC-006 — still opens a manual card in the same stack** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardStack while Monobank is disconnected AC-007 — still reorders when the disconnected card is dragged down the stack::CardStack while Monobank is disconnected AC-007 — still reorders when the disconnected card is dragged down the stack** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition

## Gates

- ready: pass — ready: 15 criteria · 10 decided · 3 gap(s)
- plan: pass — plan: 5 implementation file(s), 5 test file(s), 15 criteria covered
- verify-red: fail — REJECT tests: 2 problem(s)
- verify-red: fail — REJECT coverage: 2 problem(s)
- verify-red: pass — verify-red: 7 new test(s) red for the right reason, all criteria covered
- green: pass — green: suite passes, and the covering tests depend on the implementation, 1 check(s) green
- scope: pass — scope: change confined to the plan (116 lines)

---
_Written by `aif work`. Review the diff on the branch; merge when it is what you meant, or send the ticket back through the analyst with what was wrong._
