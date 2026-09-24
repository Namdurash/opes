# OPES-68 — built

- branch `aif/OPES-68` · 5 files changed, 283 insertions(+), 77 deletions(-) · 12 min · 3 dispatch(es) · stage `done`
- built against `ticket.md` sha256 `5f05b29a7acc3e81aa16c60bf5621369854d84f59d90f18f5ba4815d44defd08`

## Stations

| station | attempts | turns | output tokens | cost |
|---|---|---|---|---|
| plan | 2 | 59 | 34513 | tokens only |
| tests | 4 | 135 | 121139 | tokens only |
| implement | 2 | 57 | 18195 | tokens only |

_Costs come from `.aif/prices.json`; a model missing there prints "tokens only". Tokens are always recorded. Each station's own account of what it did is kept in `stations/`._

## Decisions the plan made

- **D-001** Wrap CardItem's header and its type-tile block in one `<View testID="card-content">`, and render the Disconnected badge and the delete control as siblings after it, outside that view.
  - because: AC-004 measures opacity on the group holding name, amount and type tile, and the decided answer keeps badge and Delete at full opacity on top of it
- **D-002** Style that view `[styles.cardContent, inactive ? styles.cardContentInactive : null]`, with `cardContent: { flex: 1, opacity: 1 }` and `cardContentInactive: { opacity: 0.5 }`.
  - because: AC-014 expects the literal number 1 on the connected render, so the base style must declare opacity instead of leaving it undefined
  - rather than: Write the opacity inline in CardItem.tsx as `{ opacity: inactive ? 0.5 : 1 }`.
- **D-003** Build that group inside CardItem's shared `content` element, so the ImageBackground branch and the plain View branch both return it unchanged.
  - because: the type tile lives in `imageContent` on one branch and in `body` on the other, and AC-004 names the tile either way
- **D-004** Delete the `testID="card-inactive"` View from CardItem and the `inactiveOverlay` entry from CardItem.styles.ts.
  - because: that wash is the defect the ticket sent back — #FAFAFA at 0.75 over a #FFFFFF card, painted under the very content it was meant to dim
  - rather than: Keep the overlay node alongside the new opacity group.
- **D-005** Drop the now-unused `import { StyleSheet } from 'react-native'` from CardItem.styles.ts.
  - because: `inactiveOverlay` was its only consumer and the required `lint` check fails the green phase on an unused import
- **D-006** Keep the badge as `<AppText testID="card-disconnected-badge">Disconnected</AppText>` in its pill and the control as `<Pressable testID="card-delete">`, both rendered only while `inactive`.
  - because: AC-003, AC-008 and AC-009 already hold on this shape and the ticket confines this round to the greying
- **D-007** Keep CardItem's `confirmDelete` calling showBottomSheet with title 'Delete card?' and a Delete action invoking `onDelete?.()`, which CardStack routes to useCardsStore.deleteCard.
  - because: the decided answer reuses CardDetailScreen's confirmation and names reworking that screen a non-goal
  - rather than: Extract a shared confirm helper and repoint CardDetailScreen at it.
- **D-008** Leave CardStack as it stands: derived `inactive = monobankStatus !== 'connected' && card.type === 'monobank'`, `onPress={inactive ? undefined : onCardPress}`, long-press and PanResponder untouched.
  - because: AC-005, AC-006 and AC-007 were confirmed on the live build and only the presentation came back from Review
- **D-009** Leave CardsRepository.deleteCard's single `database.write` cascade and its exact `Q.where('card_id', cardId)` predicate byte-unchanged.
  - because: destroyPermanently has no undo, AC-012 guards the neighbouring card's rows, and the manual sandbox run already closed VG-003 on this code
  - rather than: Move the cascade into useCardsStore or widen the predicate to the user's monobank cards.
- **D-010** Leave useMonobankStore.connect and useMonobankStore.disconnect unchanged — disconnect must still touch no table at all.
  - because: AC-001, AC-002, AC-013 and AC-015 pin behaviour that is already correct, and AC-015 is the OPES-64 guarantee
- **D-011** Add no column to the cards schema and no migration; inactivity stays derived at render from useMonobankStore.status.
  - because: a stored flag would survive a failed clear() and grey a card whose status never changed, breaking AC-015

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
- **by default, not by the human:** Як саме картка сіріє, щоб це можна було виміряти? → Непрозорість 0.5 на групі, що тримає назву, суму і плитку типу картки. НЕ заливка-оверлей: перша спроба клала #FAFAFA з opacity 0.75 поверх картки з фоном #FFFFFF, та ще й першим нащадком — тож назва, сума і бірюзова плитка малювалися над нею на повному контрасті, і на екрані не мінялося нічого. Непрозорість на самій групі гасить і плитку теж _(architecture)_
- **by default, not by the human:** Бейдж і контрол видалення теж гаснуть? → Ні. Вони лежать поза цією групою і лишаються на повній непрозорості: це живі елементи керування на мертвій картці, і саме їх користувач має побачити першими
- **by default, not by the human:** Що поступилося місцем новому критерію, бо ліміт — 15? → AC-014 більше не рахує бейджі після реконекту, а міряє непрозорість. Бейдж і Delete рендеряться одним умовним блоком, і його вимкнений стан уже стереже AC-008; непрозорість — окремий стильовий шлях, у якого сторожа не було взагалі, і саме там стався дефект
- **by default, not by the human:** Чи перевикористовувати наявне підтвердження видалення? → Так. showBottomSheet({ title: 'Delete card?' }) з CardDetailScreen і useCardsStore.deleteCard з його оптимістичним відкотом — нове підтвердження не вводиться

## Not verified by this run

- [ ] **ticket VG-001** Що 0.5 справді читається як мертва картка, а бейдж і Delete лишаються помітними поверх пригашеного вмісту, зелений прогін не доводить — це видно лише оком на складеному білді. Саме цей розрив спрацював минулого разу: критерій міряв булевий прапорець, suite був зелений, а на екрані не мінялося нічого
- [ ] **ticket VG-002** Реконект перевіряється на підробному сервісі Monobank, не на живому API — що справжній акаунт повернеться з тим самим id, цикл не встановлює
- [ ] **ticket VG-003** Каскадне видалення перевіряється на тестовій базі з одиницями рядків. Що на реальному пристрої з місяцями імпортованої історії воно зносить рівно ті рядки й нічого більше, зелений прогін не доводить — потрібне справжнє відключення й видалення на sandbox-білді з уже імпортованими транзакціями
- [ ] **ticket VG-004** Перетяг надгробка і розташування бейджа з Delete на ЗГОРНУТІЙ картці стосу перевірені лише в jest. На білді в стосі була одна картка, тож ні те, ні те подивитися не вдалося; обидва елементи рендеряться поза гілкою collapsed, тож на не-верхній картці вони опиняються під сусідньою
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
- [ ] **tests CardsRepository delete cascade AC-011 — destroys the deleted card's transactions with it::CardsRepository delete cascade AC-011 — destroys the deleted card's transactions with it** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository delete cascade AC-012 — leaves the other card and its transactions untouched::CardsRepository delete cascade AC-012 — leaves the other card and its transactions untouched** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository test-database isolation writes a card that the next case must not see::CardsRepository test-database isolation writes a card that the next case must not see** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardsRepository test-database isolation starts from an empty table despite the previous case writing one::CardsRepository test-database isolation starts from an empty table despite the previous case writing one** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardItem when Monobank is disconnected AC-003 — badges the monobank card Disconnected::CardItem when Monobank is disconnected AC-003 — badges the monobank card Disconnected** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardItem when Monobank is disconnected AC-009 — tapping the delete control asks Delete card? and deletes on confirm::CardItem when Monobank is disconnected AC-009 — tapping the delete control asks Delete card? and deletes on confirm** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardItem while Monobank is connected AC-008 — shows no delete control on a live monobank card::CardItem while Monobank is connected AC-008 — shows no delete control on a live monobank card** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.connect when saving the token rejects AC-017 — raises the general error sheet, not "Connection Failed"::useMonobankStore.connect when saving the token rejects AC-017 — raises the general error sheet, not "Connection Failed"** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.connect when saving the token rejects AC-020 — puts the store in the error status::useMonobankStore.connect when saving the token rejects AC-020 — puts the store in the error status** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.connect when the Monobank API rejects AC-018 — keeps "Connection Failed" for a MonobankError::useMonobankStore.connect when the Monobank API rejects AC-018 — keeps "Connection Failed" for a MonobankError** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.connect when the Monobank API rejects AC-019 — keeps "Connection Failed" for an error that is not a MonobankError::useMonobankStore.connect when the Monobank API rejects AC-019 — keeps "Connection Failed" for an error that is not a MonobankError** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests useMonobankStore.connect reconnecting the account a disconnect left behind AC-013 — leaves one card for the account instead of adding a second::useMonobankStore.connect reconnecting the account a disconnect left behind AC-013 — leaves one card for the account instead of adding a second** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardStack while Monobank is disconnected AC-005 — does not open the disconnected monobank card when its body is tapped::CardStack while Monobank is disconnected AC-005 — does not open the disconnected monobank card when its body is tapped** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardStack while Monobank is disconnected AC-006 — still opens a manual card in the same stack::CardStack while Monobank is disconnected AC-006 — still opens a manual card in the same stack** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
- [ ] **tests CardStack while Monobank is disconnected AC-007 — still reorders when the disconnected card is dragged down the stack::CardStack while Monobank is disconnected AC-007 — still reorders when the disconnected card is dragged down the stack** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition
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
- [ ] **tests useMonobankStore.disconnect as the source of the tombstone state OPES-68 AC-015 — leaves the status at connected when clearing the token rejects::useMonobankStore.disconnect as the source of the tombstone state OPES-68 AC-015 — leaves the status at connected when clearing the token rejects** green at freeze — never proven red; this run accepted its criterion without a red-to-green transition

## Gates

- ready: pass — ready: 15 criteria · 10 decided · 3 gap(s)
- plan: pass — plan: 5 implementation file(s), 5 test file(s), 15 criteria covered
- verify-red: fail — REJECT tests: 2 problem(s)
- verify-red: fail — REJECT coverage: 2 problem(s)
- verify-red: pass — verify-red: 7 new test(s) red for the right reason, all criteria covered
- green: pass — green: suite passes, and the covering tests depend on the implementation, 1 check(s) green
- scope: pass — scope: change confined to the plan (116 lines)
- ready: pass — ready: 15 criteria · 13 decided · 4 gap(s)
- plan: pass — plan: 5 implementation file(s), 5 test file(s), 15 criteria covered
- verify-red: pass — verify-red: 3 new test(s) red for the right reason, all criteria covered
- green: pass — green: suite passes, and the covering tests depend on the implementation, 1 check(s) green
- scope: pass — scope: change confined to the plan (80 lines)

---
_Written by `aif work`. Review the diff on the branch; merge when it is what you meant, or send the ticket back through the analyst with what was wrong._
