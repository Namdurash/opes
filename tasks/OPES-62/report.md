# OPES-62 — built

- branch `aif/OPES-62` · 2 files changed, 291 insertions(+), 2 deletions(-) · 10 min · 3 dispatch(es) · stage `done`
- built against `ticket.md` sha256 `614b43ac46d7cc07fe71c535b858ddcc6fd5322277437286a116300dd8872478`

## Stations

| station | attempts | turns | output tokens | cost |
|---|---|---|---|---|
| plan | 1 | 34 | 17076 | tokens only |
| tests | 1 | 42 | 31018 | tokens only |
| implement | 1 | 15 | 1921 | tokens only |

_Costs come from `.aif/prices.json`; a model missing there prints "tokens only". Tokens are always recorded. Each station's own account of what it did is kept in `stations/`._

## Decisions the plan made

- **D-001** Замінити ефект читання карток (HomeScreen.tsx:46-50) на useFocusEffect із тим самим тілом; окремого читання на монтуванні не лишати.
  - because: рішення людини в тікеті фіксує механізм, а розділене читання давало б два звернення до бази на холодному старті
  - rather than: Дописати loadCardsByUser у наявний ефект на monobankStatus.
- **D-002** Обгорнути фокусний колбек у useCallback із залежностями [currentUserId, loadCardsByUser].
  - because: useFocusEffect перепідписується щоразу, коли змінюється ідентичність колбека (node_modules/@react-navigation/core/src/useFocusEffect.tsx:112), тож інлайнова стрілка читала б картки на кожен рендер
- **D-003** Дати колбеку тіло-блок, що викликає loadCardsByUser(currentUserId) і нічого не повертає.
  - because: useFocusEffect логує console.error на повернутий Promise (useFocusEffect.tsx:50), а оператор void заборонений у CLAUDE.md
- **D-004** Не чіпати ефект на monobankStatus, handlePullToRefresh і handleForeground (HomeScreen.tsx:52-82) — жоден із них карток не перечитує.
  - because: upsertMonobankCards викликається рівно всередині connect, тож синхронізація карток не створює
- **D-005** Замокати '@react-navigation/native' так, щоб useFocusEffect був react.useEffect(cb, [focusTick]), а useNavigation повертав { navigate }.
  - because: у тесті екрана немає навігатора, а єдиний фокусний тест у репозиторії (useTransactionsViewModel.test.tsx:35-43) підробляє фокус саме лічильником
- **D-006** Мокати '../cards/state/useCardsStore' і '../cards' окремими jest.mock.
  - because: HomeScreen бере стор із глибокого шляху (рядок 12), а CardStack — із барелю (рядок 6), тож мок лише барелю лишив би справжній стор із WatermelonDB
- **D-007** Рахувати картки через підмінений CardStack, що рендерить по одному View з testID="home-card" на картку.
  - because: справжній CardStack тягне reanimated shared values і PanResponder, і жоден продакшн-елемент не має testID для підрахунку
  - rather than: Додати testID у src/features/cards/components/CardStack.tsx.
- **D-008** Зробити мок loadCardsByUser таким, що переписує фікстуру карток наступним значенням (порожньо → одна картка), і читати список після повторного фокуса.
  - because: стор підроблений селектором, тож лише саме читання може змінити те, що рендериться
- **D-009** Замокати селекторними дублями '../../stores/useUserStore', '../monobank', '../transactions/state/useTransactionsStore' і '../../app/navigation' (лише ROOT_ROUTES).
  - because: барель навігації тягне RootNavigator і WatermelonDB у jest — TransactionsScreen.test.tsx:36-38 обходить це тим самим requireActual на app/navigation/routes
- **D-010** Замокати '../transactions/hooks/useAppForegroundSync', зберігаючи переданий onForeground, і викликати його вручну для сценарію повернення на передній план.
  - because: хук слухає AppState, подію якого в jest інакше довелося б емулювати нативним модулем

## Decided with the analyst

- Яким механізмом перечитувати картки: додати виклик у наявний ефект на monobankStatus чи перевести читання карток на useFocusEffect? → useFocusEffect на читанні карток — Home перечитує їх при будь-якому поверненні на екран, а не лише після підключення. Патерн уже є в проєкті (useTransactionsViewModel.ts) разом із перевіреним способом його тестувати, тож це не нова конвенція. Читання на монтуванні замінюється фокусним, а не додається до нього
- Що має статися з карткою Monobank після відключення? disconnect не видаляє її з бази, тож Home показуватиме її й далі → У цьому тікеті — нічого. Картка лишається разом зі своєю історією транзакцій. Питання про долю даних Monobank при відключенні виноситься в окремий тікет OPES-68, щоб не загубитися

## Not verified by this run

- [ ] **ticket VG-001** Фокус у тестах підроблений: useFocusEffect мокається як useEffect із лічильником, який тест інкрементує вручну. Ніщо тут не проходить справжній навігаційний перехід, тож що Home справді отримує фокус при поверненні з екрана підключення — цей цикл не встановлює
- [ ] **ticket VG-002** Усі критерії виконуються на підроблених сторах і репозиторії. Зелений сьют не доводить, що після реального connect картка зʼявиться на екрані — для цього потрібен запуск на симуляторі
- [ ] **ticket VG-003** Ніщо не перевіряє, що фокусне читання не сповільнює повернення на Home при великій кількості карток — питання продуктивності цей цикл не торкається
- [ ] **plan @react-navigation/native** external dependency with no check and no criterion — nothing in this run exercised it

## Gates

- ready: pass — ready: 7 criteria · 2 decided · 3 gap(s)
- plan: pass — plan: 1 implementation file(s), 1 test file(s), 7 criteria covered
- verify-red: pass — verify-red: red (COARSE mode — no per-test detail)
- green: pass — green: suite passes (revert-recheck NOT done — the lock names no covering test, so there was nothing to revert-recheck (the lock is COARSE: the suite (exit 1) wrote no report at .aif/tmp/report.xml)), 1 check(s) green
- scope: pass — scope: change confined to the plan (6 lines)

---
_Written by `aif work`. Review the diff on the branch; merge when it is what you meant, or send the ticket back through the analyst with what was wrong._
