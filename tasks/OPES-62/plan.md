<!-- aif:meta
{
  "schema": 2,
  "ticket": "OPES-62",
  "risk": "low",
  "files": {
    "create": [],
    "change": [
      "src/features/home/HomeScreen.tsx"
    ],
    "tests": [
      "src/features/home/HomeScreen.test.tsx"
    ]
  },
  "decisions": [
    {
      "id": "D-001",
      "statement": "Замінити ефект читання карток (HomeScreen.tsx:46-50) на useFocusEffect із тим самим тілом; окремого читання на монтуванні не лишати.",
      "because": "рішення людини в тікеті фіксує механізм, а розділене читання давало б два звернення до бази на холодному старті",
      "serves": [
        "AC-001",
        "AC-002",
        "AC-003"
      ],
      "rejected": "Дописати loadCardsByUser у наявний ефект на monobankStatus."
    },
    {
      "id": "D-002",
      "statement": "Обгорнути фокусний колбек у useCallback із залежностями [currentUserId, loadCardsByUser].",
      "because": "useFocusEffect перепідписується щоразу, коли змінюється ідентичність колбека (node_modules/@react-navigation/core/src/useFocusEffect.tsx:112), тож інлайнова стрілка читала б картки на кожен рендер",
      "serves": [
        "AC-004",
        "AC-005",
        "D-001"
      ]
    },
    {
      "id": "D-003",
      "statement": "Дати колбеку тіло-блок, що викликає loadCardsByUser(currentUserId) і нічого не повертає.",
      "because": "useFocusEffect логує console.error на повернутий Promise (useFocusEffect.tsx:50), а оператор void заборонений у CLAUDE.md",
      "serves": [
        "D-001"
      ]
    },
    {
      "id": "D-004",
      "statement": "Не чіпати ефект на monobankStatus, handlePullToRefresh і handleForeground (HomeScreen.tsx:52-82) — жоден із них карток не перечитує.",
      "because": "upsertMonobankCards викликається рівно всередині connect, тож синхронізація карток не створює",
      "serves": [
        "AC-004",
        "AC-006",
        "AC-007"
      ]
    },
    {
      "id": "D-005",
      "statement": "Замокати '@react-navigation/native' так, щоб useFocusEffect був react.useEffect(cb, [focusTick]), а useNavigation повертав { navigate }.",
      "because": "у тесті екрана немає навігатора, а єдиний фокусний тест у репозиторії (useTransactionsViewModel.test.tsx:35-43) підробляє фокус саме лічильником",
      "serves": [
        "AC-001",
        "AC-002",
        "AC-003"
      ]
    },
    {
      "id": "D-006",
      "statement": "Мокати '../cards/state/useCardsStore' і '../cards' окремими jest.mock.",
      "because": "HomeScreen бере стор із глибокого шляху (рядок 12), а CardStack — із барелю (рядок 6), тож мок лише барелю лишив би справжній стор із WatermelonDB",
      "serves": [
        "AC-001",
        "AC-003"
      ]
    },
    {
      "id": "D-007",
      "statement": "Рахувати картки через підмінений CardStack, що рендерить по одному View з testID=\"home-card\" на картку.",
      "because": "справжній CardStack тягне reanimated shared values і PanResponder, і жоден продакшн-елемент не має testID для підрахунку",
      "serves": [
        "AC-003"
      ],
      "rejected": "Додати testID у src/features/cards/components/CardStack.tsx."
    },
    {
      "id": "D-008",
      "statement": "Зробити мок loadCardsByUser таким, що переписує фікстуру карток наступним значенням (порожньо → одна картка), і читати список після повторного фокуса.",
      "because": "стор підроблений селектором, тож лише саме читання може змінити те, що рендериться",
      "serves": [
        "AC-003"
      ]
    },
    {
      "id": "D-009",
      "statement": "Замокати селекторними дублями '../../stores/useUserStore', '../monobank', '../transactions/state/useTransactionsStore' і '../../app/navigation' (лише ROOT_ROUTES).",
      "because": "барель навігації тягне RootNavigator і WatermelonDB у jest — TransactionsScreen.test.tsx:36-38 обходить це тим самим requireActual на app/navigation/routes",
      "serves": [
        "AC-001",
        "AC-004",
        "AC-005"
      ]
    },
    {
      "id": "D-010",
      "statement": "Замокати '../transactions/hooks/useAppForegroundSync', зберігаючи переданий onForeground, і викликати його вручну для сценарію повернення на передній план.",
      "because": "хук слухає AppState, подію якого в jest інакше довелося б емулювати нативним модулем",
      "serves": [
        "AC-007"
      ]
    }
  ],
  "ac_coverage": {
    "AC-001": [
      "src/features/home/HomeScreen.tsx"
    ],
    "AC-002": [
      "src/features/home/HomeScreen.tsx"
    ],
    "AC-003": [
      "src/features/home/HomeScreen.tsx"
    ],
    "AC-004": [
      "src/features/home/HomeScreen.tsx"
    ],
    "AC-005": [
      "src/features/home/HomeScreen.tsx"
    ],
    "AC-006": [
      "src/features/home/HomeScreen.tsx"
    ],
    "AC-007": [
      "src/features/home/HomeScreen.tsx"
    ]
  },
  "uncovered": [],
  "external": [
    {
      "name": "react",
      "ac": "AC-001"
    },
    {
      "name": "@react-navigation/native"
    }
  ],
  "ticket_sha256": "614b43ac46d7cc07fe71c535b858ddcc6fd5322277437286a116300dd8872478"
}
-->

# OPES-62 — plan

Зміна одна і вона в одному файлі. У `src/features/home/HomeScreen.tsx` ефект
читання карток (рядки 46-50) перестає бути ефектом монтування і стає фокусним:
`useFocusEffect` із `@react-navigation/native` — той самий імпорт, що вже дає
`useNavigation` на рядку 3 — обгортає `useCallback(() => { if (currentUserId)
{ loadCardsByUser(currentUserId); } }, [currentUserId, loadCardsByUser])`.
`useCallback` уже імпортований на рядку 1; `React.useEffect` тут зникає, решта
трьох ефектів лишається дослівно як є.

Мемоізація — не стиль, а умова: `useFocusEffect` тримає колбек у залежностях
свого внутрішнього `useEffect`, тож нестабільна стрілка читала б базу на кожен
рендер і зламала б AC-004 і AC-005. Тіло має бути блоком без `return`:
повернутий Promise хук зустрічає `console.error`, а `void` у цьому проєкті
заборонений.

Нічого іншого Home не отримує. Статус Monobank, pull-to-refresh і повернення на
передній план карток не перечитують — `upsertMonobankCards` живе лише в
`connect`, і AC-004, AC-006, AC-007 саме це й фіксують як «лічильник не зріс».

Тест — новий `src/features/home/HomeScreen.test.tsx`, поруч із екраном. Фокус
підроблений так само, як у `useTransactionsViewModel.test.tsx`: мок
`@react-navigation/native`, де `useFocusEffect` — це `useEffect(cb, [focusTick])`,
а `focusTick` інкрементує сам тест перед `rerender`. Червоним на сьогоднішньому
коді має бути саме перехід (AC-002, AC-003), а не кінцевий стан. Усі стори
підміняються селекторними дублями на хойстнутому `var`-кнобі, `CardStack` —
заглушкою з `testID="home-card"` на картку, рендер іде через `ThemeProvider` і
`await render(...)` (RNTL 14 повертає Promise).

Перевірочні прогалини тікета лишаються прогалинами: справжнього навігаційного
переходу тут не відбувається, і зелений сьют не доводить, що після реального
connect картка зʼявиться на екрані — це перевіряється на симуляторі.
