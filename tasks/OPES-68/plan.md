<!-- aif:meta
{
  "schema": 2,
  "ticket": "OPES-68",
  "risk": "high",
  "files": {
    "create": [],
    "change": [
      "src/features/cards/components/CardItem.tsx",
      "src/features/cards/components/CardItem.styles.ts",
      "src/features/cards/components/CardStack.tsx",
      "src/models/cards/CardsRepository.ts",
      "src/features/monobank/state/useMonobankStore.ts"
    ],
    "tests": [
      "src/features/cards/components/CardItem.test.tsx",
      "src/features/cards/components/CardStack.test.tsx",
      "src/models/cards/CardsRepository.test.ts",
      "src/features/monobank/state/useMonobankStore.disconnect.test.ts",
      "src/features/monobank/state/useMonobankStore.connect.test.ts"
    ]
  },
  "decisions": [
    {
      "id": "D-001",
      "statement": "Wrap CardItem's header and its type-tile block in one `<View testID=\"card-content\">`, and render the Disconnected badge and the delete control as siblings after it, outside that view.",
      "because": "AC-004 measures opacity on the group holding name, amount and type tile, and the decided answer keeps badge and Delete at full opacity on top of it",
      "serves": [
        "AC-004",
        "AC-014"
      ]
    },
    {
      "id": "D-002",
      "statement": "Style that view `[styles.cardContent, inactive ? styles.cardContentInactive : null]`, with `cardContent: { flex: 1, opacity: 1 }` and `cardContentInactive: { opacity: 0.5 }`.",
      "because": "AC-014 expects the literal number 1 on the connected render, so the base style must declare opacity instead of leaving it undefined",
      "serves": [
        "AC-004",
        "AC-014"
      ],
      "rejected": "Write the opacity inline in CardItem.tsx as `{ opacity: inactive ? 0.5 : 1 }`."
    },
    {
      "id": "D-003",
      "statement": "Build that group inside CardItem's shared `content` element, so the ImageBackground branch and the plain View branch both return it unchanged.",
      "because": "the type tile lives in `imageContent` on one branch and in `body` on the other, and AC-004 names the tile either way",
      "serves": [
        "AC-004",
        "D-001"
      ]
    },
    {
      "id": "D-004",
      "statement": "Delete the `testID=\"card-inactive\"` View from CardItem and the `inactiveOverlay` entry from CardItem.styles.ts.",
      "because": "that wash is the defect the ticket sent back — #FAFAFA at 0.75 over a #FFFFFF card, painted under the very content it was meant to dim",
      "serves": [
        "AC-004"
      ],
      "rejected": "Keep the overlay node alongside the new opacity group."
    },
    {
      "id": "D-005",
      "statement": "Drop the now-unused `import { StyleSheet } from 'react-native'` from CardItem.styles.ts.",
      "because": "`inactiveOverlay` was its only consumer and the required `lint` check fails the green phase on an unused import",
      "serves": [
        "D-004"
      ]
    },
    {
      "id": "D-006",
      "statement": "Keep the badge as `<AppText testID=\"card-disconnected-badge\">Disconnected</AppText>` in its pill and the control as `<Pressable testID=\"card-delete\">`, both rendered only while `inactive`.",
      "because": "AC-003, AC-008 and AC-009 already hold on this shape and the ticket confines this round to the greying",
      "serves": [
        "AC-003",
        "AC-008",
        "AC-009"
      ]
    },
    {
      "id": "D-007",
      "statement": "Keep CardItem's `confirmDelete` calling showBottomSheet with title 'Delete card?' and a Delete action invoking `onDelete?.()`, which CardStack routes to useCardsStore.deleteCard.",
      "because": "the decided answer reuses CardDetailScreen's confirmation and names reworking that screen a non-goal",
      "serves": [
        "AC-009",
        "AC-010"
      ],
      "rejected": "Extract a shared confirm helper and repoint CardDetailScreen at it."
    },
    {
      "id": "D-008",
      "statement": "Leave CardStack as it stands: derived `inactive = monobankStatus !== 'connected' && card.type === 'monobank'`, `onPress={inactive ? undefined : onCardPress}`, long-press and PanResponder untouched.",
      "because": "AC-005, AC-006 and AC-007 were confirmed on the live build and only the presentation came back from Review",
      "serves": [
        "AC-005",
        "AC-006",
        "AC-007",
        "D-001"
      ]
    },
    {
      "id": "D-009",
      "statement": "Leave CardsRepository.deleteCard's single `database.write` cascade and its exact `Q.where('card_id', cardId)` predicate byte-unchanged.",
      "because": "destroyPermanently has no undo, AC-012 guards the neighbouring card's rows, and the manual sandbox run already closed VG-003 on this code",
      "serves": [
        "AC-010",
        "AC-011",
        "AC-012"
      ],
      "rejected": "Move the cascade into useCardsStore or widen the predicate to the user's monobank cards."
    },
    {
      "id": "D-010",
      "statement": "Leave useMonobankStore.connect and useMonobankStore.disconnect unchanged — disconnect must still touch no table at all.",
      "because": "AC-001, AC-002, AC-013 and AC-015 pin behaviour that is already correct, and AC-015 is the OPES-64 guarantee",
      "serves": [
        "AC-001",
        "AC-002",
        "AC-013",
        "AC-015"
      ]
    },
    {
      "id": "D-011",
      "statement": "Add no column to the cards schema and no migration; inactivity stays derived at render from useMonobankStore.status.",
      "because": "a stored flag would survive a failed clear() and grey a card whose status never changed, breaking AC-015",
      "serves": [
        "AC-014",
        "AC-015"
      ]
    }
  ],
  "ac_coverage": {
    "AC-001": [
      "src/features/monobank/state/useMonobankStore.ts"
    ],
    "AC-002": [
      "src/features/monobank/state/useMonobankStore.ts"
    ],
    "AC-003": [
      "src/features/cards/components/CardItem.tsx",
      "src/features/cards/components/CardStack.tsx"
    ],
    "AC-004": [
      "src/features/cards/components/CardItem.tsx",
      "src/features/cards/components/CardItem.styles.ts"
    ],
    "AC-005": [
      "src/features/cards/components/CardStack.tsx"
    ],
    "AC-006": [
      "src/features/cards/components/CardStack.tsx"
    ],
    "AC-007": [
      "src/features/cards/components/CardStack.tsx"
    ],
    "AC-008": [
      "src/features/cards/components/CardItem.tsx"
    ],
    "AC-009": [
      "src/features/cards/components/CardItem.tsx"
    ],
    "AC-010": [
      "src/models/cards/CardsRepository.ts"
    ],
    "AC-011": [
      "src/models/cards/CardsRepository.ts"
    ],
    "AC-012": [
      "src/models/cards/CardsRepository.ts"
    ],
    "AC-013": [
      "src/models/cards/CardsRepository.ts",
      "src/features/monobank/state/useMonobankStore.ts"
    ],
    "AC-014": [
      "src/features/cards/components/CardItem.tsx",
      "src/features/cards/components/CardItem.styles.ts"
    ],
    "AC-015": [
      "src/features/monobank/state/useMonobankStore.ts"
    ]
  },
  "uncovered": [],
  "external": [
    {
      "name": "react-native",
      "ac": "AC-004"
    },
    {
      "name": "react",
      "ac": "AC-003"
    },
    {
      "name": "@nozbe/watermelondb",
      "ac": "AC-011"
    },
    {
      "name": "zustand",
      "ac": "AC-010"
    },
    {
      "name": "react-native-reanimated"
    }
  ],
  "ticket_sha256": "5f05b29a7acc3e81aa16c60bf5621369854d84f59d90f18f5ba4815d44defd08"
}
-->

# OPES-68 — plan

Тікет повернувся з Review з однією претензією: картка не сіріє. Каскад, жести, реконект
і гарантія OPES-64 підтверджені на живому білді, тож цей прогін міняє рівно подання
`CardItem` — решта файлів у маніфесті стоїть, щоб її поведінку стерегли ті самі критерії.

`CardItem` дістає одну нову групу: `<View testID="card-content">`, всередині якої лежать
`header` (назва і сума) та гілка з плиткою типу — `body` або `imageContent`. Стиль групи —
масив `[styles.cardContent, inactive ? styles.cardContentInactive : null]`, де базовий
`cardContent` явно несе `opacity: 1`, а `cardContentInactive` — `opacity: 0.5`. Явна
одиниця в базі обов'язкова: AC-014 міряє саме число, а не `undefined`. Група будується
в спільному `content`, тож обидві гілки рендеру (`ImageBackground` і звичайний `View`)
гаснуть однаково.

Заливка-оверлей `card-inactive` і стиль `inactiveOverlay` видаляються разом із
`StyleSheet`-імпортом, який більше нікому не потрібен (інакше падає `lint`). Бейдж
`Disconnected` і контрол `card-delete` лишаються там, де вони є, — сиблінгами **після**
групи, на повній непрозорості: це живі елементи керування на мертвій картці.

`CardStack`, `CardsRepository.deleteCard` і `useMonobankStore` не змінюються. Каскад
лишається одним `database.write` із предикатом рівно `Q.where('card_id', cardId)`,
`disconnect` і далі не звертається до бази, а неактивність лишається похідним станом на
рендері — без колонки й без міграції.
