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
      "statement": "Derive inactivity in CardStack as `monobankStatus !== 'connected' && card.type === 'monobank'`, reading status from useMonobankStore.",
      "because": "the human decided the state is derived at render with no cards column, and CardStack is the one place that already owns press and drag",
      "serves": [
        "AC-003",
        "AC-004",
        "AC-005",
        "AC-006",
        "AC-008",
        "AC-014"
      ]
    },
    {
      "id": "D-002",
      "statement": "Import the store deep in CardStack: `import { useMonobankStore } from '../../monobank/state/useMonobankStore'`.",
      "because": "the monobank barrel re-exports ConnectMonobankScreen, which imports app/navigation and cycles back into the cards barrel",
      "serves": [
        "D-001"
      ],
      "rejected": "Import useMonobankStore from the '../../monobank' barrel."
    },
    {
      "id": "D-003",
      "statement": "Give CardItem two new optional props, `inactive?: boolean` (default false) and `onDelete?: () => void`, and keep it free of any store import.",
      "because": "CardItem also renders inside CardDetailScreen, where no Monobank status applies, and the features layer rule keeps it presentational",
      "serves": [
        "D-001",
        "AC-004"
      ]
    },
    {
      "id": "D-004",
      "statement": "When `inactive`, render `<View testID=\"card-inactive\" pointerEvents=\"none\" style={styles.inactiveOverlay} />` as the first child of CardItem's content, before badge and delete control.",
      "because": "AC-004 needs one queryable node, and both render branches (ImageBackground and plain View) must grey identically; later siblings paint above the wash",
      "serves": [
        "AC-004"
      ]
    },
    {
      "id": "D-005",
      "statement": "When `inactive`, render a pill holding `<AppText testID=\"card-disconnected-badge\">Disconnected</AppText>` — that literal string, no other copy.",
      "because": "AC-003 asserts the text and AC-014 counts the badge by testID",
      "serves": [
        "AC-003",
        "AC-014"
      ]
    },
    {
      "id": "D-006",
      "statement": "Render the delete control as `<Pressable testID=\"card-delete\" accessibilityLabel=\"Delete card\">` with an AppText label 'Delete', whenever `inactive` is true and regardless of whether onDelete was passed.",
      "because": "AC-008 counts controls by testID and AC-009 taps one, so presence must depend on `inactive` alone",
      "serves": [
        "AC-008",
        "AC-009"
      ],
      "rejected": "Add a trash icon to src/shared/ui/icons/registry.ts — it needs a new SVG asset."
    },
    {
      "id": "D-007",
      "statement": "On delete-control press CardItem calls showBottomSheet with variant 'error', title 'Delete card?', a Delete action (variant 'danger') invoking `onDelete?.()` and a Cancel action.",
      "because": "the ticket reuses CardDetailScreen's existing confirmation and names reworking that screen a non-goal, so the config is copied, not extracted",
      "serves": [
        "AC-009"
      ],
      "rejected": "Extract a shared confirm helper and repoint CardDetailScreen at it."
    },
    {
      "id": "D-008",
      "statement": "CardStack passes `onDelete={() => deleteCard(card.id)}`, taking deleteCard from useCardsStore beside the existing reorderCards selector.",
      "because": "useCardsStore.deleteCard already owns the optimistic removal and its rollback sheet",
      "serves": [
        "AC-010",
        "AC-011"
      ]
    },
    {
      "id": "D-009",
      "statement": "Block the tap by handing DraggableCardItem `onPress={inactive ? undefined : onCardPress}`; leave onLongPress, delayLongPress and the PanResponder byte-unchanged.",
      "because": "the human kept long-press reorder for tombstones, so only the press path may be gated",
      "serves": [
        "AC-005",
        "AC-006",
        "AC-007"
      ]
    },
    {
      "id": "D-010",
      "statement": "Cascade inside CardsRepository.deleteCard: in one database.write, fetch the card and its transactions, then database.batch(...transactions.map(t => t.prepareDestroyPermanently()), card.prepareDestroyPermanently()).",
      "because": "the ticket requires one models-layer operation, and a store gluing two repositories cannot share a writer without leaking WatermelonDB models out of the layer",
      "serves": [
        "AC-010",
        "AC-011",
        "AC-012"
      ],
      "rejected": "Add deleteByCardId to TransactionsRepository and call it from useCardsStore before deleteCard."
    },
    {
      "id": "D-011",
      "statement": "Query the cascaded rows with exactly `Q.where('card_id', cardId)` on the 'transactions' collection — no user-wide, type-wide or monobank-wide predicate.",
      "because": "destroyPermanently has no backup and AC-012 guards the neighbouring card's rows",
      "serves": [
        "AC-012"
      ]
    },
    {
      "id": "D-012",
      "statement": "Leave useMonobankStore.connect, useMonobankStore.disconnect and useCardsStore.deleteCard unchanged.",
      "because": "AC-001, AC-002, AC-013 and AC-015 pin behaviour that is already correct — disconnect must keep touching no table at all",
      "serves": [
        "AC-001",
        "AC-002",
        "AC-013",
        "AC-015"
      ]
    },
    {
      "id": "D-013",
      "statement": "Style the grey with existing tokens — surface for the overlay, border for its edge, textMuted for the badge text — and add no token and no schema migration.",
      "because": "a new token must be declared in both palettes in tokens.ts, and the human ruled out a stored flag",
      "serves": [
        "AC-004",
        "D-004"
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
      "src/features/cards/components/CardItem.styles.ts",
      "src/features/cards/components/CardStack.tsx"
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
      "src/features/cards/components/CardStack.tsx"
    ],
    "AC-015": [
      "src/features/monobank/state/useMonobankStore.ts"
    ]
  },
  "uncovered": [],
  "external": [
    {
      "name": "@nozbe/watermelondb",
      "ac": "AC-011"
    },
    {
      "name": "react-native",
      "ac": "AC-005"
    },
    {
      "name": "zustand",
      "ac": "AC-010"
    },
    {
      "name": "react-native-reanimated"
    }
  ],
  "ticket_sha256": "07abfa58d41b5fc96872c81b57209a5c3face0c6f50ae7121b7d54b7e8e763b4"
}
-->

# OPES-68 — plan

Картка Monobank лишається в базі після відключення; змінюється лише її подання й з'являється
явне видалення.

`CardStack` додатково підписується на `useMonobankStore.status` і рахує на рендері
`inactive = status !== 'connected' && card.type === 'monobank'`. Цей прапорець іде пропом у
`CardItem`, і він же вимикає `onPress` (D-009) — довгий натиск і `PanResponder` лишаються як є,
тож перетягування надгробка працює.

`CardItem` при `inactive` малює три речі поверх наявного вмісту: сіру заливку
`testID="card-inactive"`, пілюлю з текстом `Disconnected` (`testID="card-disconnected-badge"`) і
контрол видалення `testID="card-delete"`. Тап по контролу відкриває копію наявного
підтвердження `Delete card?`, чия дія Delete викликає проп `onDelete`, який `CardStack` веде в
`useCardsStore.deleteCard`. Екран деталей картки не чіпаємо.

Каскад живе в `CardsRepository.deleteCard`: один `database.write`, у ньому вибірка транзакцій
рівно за `Q.where('card_id', cardId)` і єдиний `database.batch` із
`prepareDestroyPermanently()` для транзакцій та для самої картки. Це закриває і другий вхід —
видалення з `CardDetailScreen`.

`useMonobankStore` і `useCardsStore` не змінюються: AC-001, AC-002, AC-013 і AC-015 стережуть
уже наявну поведінку, і головне з неї — `disconnect` не звертається до бази взагалі.
