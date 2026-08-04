<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-48",
  "spec_sha256": "b6de7493ef70ac883eaa8bac2d27ad988f325fbd29d38f7ffa62eee4465a367c",
  "risk": "low",
  "files": {
    "create": [
      "src/features/transactions/components/FilterChip.tsx",
      "src/features/transactions/components/FilterChip.styles.ts"
    ],
    "change": [
      "src/app/navigation/types.ts",
      "src/features/transactions/state/useTransactionsViewModel.ts",
      "src/features/transactions/TransactionsScreen.tsx",
      "src/features/transactions/utils.ts"
    ],
    "tests": [
      "src/features/transactions/state/useTransactionsViewModel.test.tsx",
      "src/features/transactions/TransactionsScreen.test.tsx"
    ] },
  "decisions": [
    { "id": "D-001",
      "statement": "Widen RootStackParamList[TRANSACTIONS] to `{ filter?: { categoryId?: string; month?: string } } | undefined` and keep the existing TransactionsScreenNavigationProp.",
      "because": "AS-001 fixes this shape as the interface OPES-49 must produce" },
    { "id": "D-002",
      "statement": "Read the incoming filter from route params inside useTransactionsViewModel via useRoute, and consume it once per focus with useFocusEffect.",
      "because": "AC-014/AC-015 make payload application a view-model surface responsibility" },
    { "id": "D-003",
      "statement": "On focus, if route params carry a filter, set it as the active filter then call navigation.setParams({ filter: undefined }); if no payload is present, reset the active filter to none.",
      "because": "clears on any payload-less arrival or tab refocus (AS-006) and re-applies an identical payload after a manual clear (AS-005)",
      "rejected": "Relying on route params persisting across focus to hold the filter." },
    { "id": "D-004",
      "statement": "Hold the active filter as `{ categoryId?: string; month?: string } | null` state; collapse it to null whenever neither dimension is set." },
    { "id": "D-005",
      "statement": "Match a transaction's category by comparing categoryMap.get(tx.id)?.id to the filter's categoryId, reusing the already-resolved category map." },
    { "id": "D-006",
      "statement": "Match a month by comparing tx.occurredAtIso.slice(0, 7) to the filter's YYYY-MM string with no timezone normalization.",
      "because": "AS-002; AC-005's +03:00 transaction must still match '2026-08'",
      "rejected": "Parsing occurredAtIso into a Date before comparing." },
    { "id": "D-007",
      "statement": "Resolve the category chip label via getCategoryById(categoryId).label from services/categorization, not from the per-transaction category map.",
      "because": "the chip must render even when the filter matches zero transactions (AC-013)",
      "rejected": "Reading the label from a matching entry in the per-transaction categoryMap." },
    { "id": "D-008",
      "statement": "Add formatMonthLabel(month: string) to transactions/utils.ts returning e.g. 'Aug 2026' via new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).",
      "because": "AS-003 requires the four-digit year in the month chip label" },
    { "id": "D-009",
      "statement": "Create FilterChip as a presentational component with props { label: string; onDismiss: () => void; testID?: string }, rendering the label via AppText and a Pressable '×' as the dismiss control.",
      "rejected": "Registering a new close/x icon in the icon registry." },
    { "id": "D-010",
      "statement": "Render the category chip before the month chip inside one chip-row View, so the category chip's index in the row is 0.",
      "because": "AC-008" },
    { "id": "D-011",
      "statement": "Tag the chip row testID 'transactions-filter-chips' and pass testID 'filter-chip-category' / 'filter-chip-month' to the two chips.",
      "because": "gives AC-008/AC-013 deterministic anchors for row membership and index" },
    { "id": "D-012",
      "statement": "Expose from the view-model: filteredTransactions, categoryChipLabel (string|null), monthChipLabel (string|null), dismissCategoryFilter, dismissMonthFilter; keep the existing returns." },
    { "id": "D-013",
      "statement": "Build the screen's SectionList sections from filteredTransactions instead of transactions, and render a chip only when its label is non-null." },
    { "id": "D-014",
      "statement": "dismissCategoryFilter and dismissMonthFilter each clear only their own dimension; when both dimensions become unset the active filter collapses to null and the full list shows.",
      "because": "AC-009/AC-010 keep the surviving dimension; AC-011 restores the full count" },
    { "id": "D-015",
      "statement": "Select empty-state copy by filter state in renderEmpty: 'No transactions match this filter.' when a filter is active, else the existing 'No transactions yet.'.",
      "because": "AC-012 asserts the filtered copy's distinctive prefix" },
    { "id": "D-016",
      "statement": "Style FilterChip via makeStyles as a pill row: flexDirection 'row', alignItems 'center', gap theme.spacing.xs, backgroundColor theme.colors.secondary, borderRadius theme.radii.pill.",
      "because": "D-009 committed to FilterChip.styles.ts but left its visual form unstated; mirrors the cashbackPill precedent in TransactionListItem.styles.ts, tokens only, no raw hex (features/ and theme/ CLAUDE.md)",
      "rejected": "Hardcoding colors/radius or inlining StyleSheet.create in the component." },
    { "id": "D-017",
      "statement": "Pad the FilterChip pill with paddingVertical theme.spacing.xs and paddingHorizontal theme.spacing.md; render its label via AppText with theme.typography.caption, color theme.colors.textSecondary.",
      "because": "keeps the label legible and the pill compact using existing typography and spacing tokens" },
    { "id": "D-018",
      "statement": "Render the FilterChip dismiss '×' as an AppText with theme.typography.body and color theme.colors.textMuted, wrapped in a Pressable with hitSlop theme.spacing.sm for a tappable target.",
      "because": "AppText is the required text primitive (never raw RN Text in a feature, per features/CLAUDE.md); gives AC-009/AC-010/AC-011 a concrete dismiss control with an adequate touch target and no new icon (D-009)" },
    { "id": "D-019",
      "statement": "Add a chipRow style: flexDirection 'row', alignItems 'center', gap theme.spacing.sm, flexWrap 'wrap', paddingHorizontal matching listContent, paddingVertical theme.spacing.sm.",
      "because": "the chip-row container layout was unstated; this lays the two chips out in one horizontal row per D-010" },
    { "id": "D-020",
      "statement": "Render the chip row as a sibling View directly above the SectionList inside Screen, not as ListHeaderComponent, so chips stay visible in the empty state.",
      "because": "AC-013 requires the category chip to remain in the chip row when the filtered list is empty",
      "rejected": "Placing the chip row in ListHeaderComponent, whose visibility relative to ListEmptyComponent is less predictable." } ],
  "ac_coverage": {
    "AC-001": ["src/features/transactions/state/useTransactionsViewModel.ts"],
    "AC-002": ["src/features/transactions/state/useTransactionsViewModel.ts"],
    "AC-003": ["src/features/transactions/state/useTransactionsViewModel.ts"],
    "AC-004": ["src/features/transactions/state/useTransactionsViewModel.ts"],
    "AC-005": ["src/features/transactions/state/useTransactionsViewModel.ts"],
    "AC-006": ["src/features/transactions/TransactionsScreen.tsx", "src/features/transactions/components/FilterChip.tsx"],
    "AC-007": ["src/features/transactions/TransactionsScreen.tsx", "src/features/transactions/utils.ts"],
    "AC-008": ["src/features/transactions/TransactionsScreen.tsx", "src/features/transactions/components/FilterChip.tsx"],
    "AC-009": ["src/features/transactions/state/useTransactionsViewModel.ts"],
    "AC-010": ["src/features/transactions/state/useTransactionsViewModel.ts"],
    "AC-011": ["src/features/transactions/state/useTransactionsViewModel.ts"],
    "AC-012": ["src/features/transactions/TransactionsScreen.tsx"],
    "AC-013": ["src/features/transactions/TransactionsScreen.tsx", "src/features/transactions/components/FilterChip.tsx"],
    "AC-014": ["src/features/transactions/state/useTransactionsViewModel.ts"],
    "AC-015": ["src/features/transactions/state/useTransactionsViewModel.ts", "src/app/navigation/types.ts"] }
}
-->

# OPES-48 — plan

Filtering is an in-memory selection in `useTransactionsViewModel` over the transactions and category map it already loads — no new query, repository method, or schema change. The Transactions route param is widened to `{ filter?: { categoryId?: string; month?: string } } | undefined` (D-001); the view-model reads that payload with `useRoute` and consumes it once per focus via `useFocusEffect` (D-002), setting an internal `{ categoryId?, month? } | null` active-filter state and immediately clearing the route param with `navigation.setParams`. A focus with no payload resets the filter to none, so any payload-less arrival or tab refocus shows the full list, while an identical payload after a manual clear still re-applies (D-003).

Selection ANDs the two dimensions: category by `categoryMap.get(tx.id)?.id === categoryId` (D-005), month by `tx.occurredAtIso.slice(0, 7) === month` as a plain string with no timezone handling (D-006). The view-model exposes `filteredTransactions` plus `categoryChipLabel`/`monthChipLabel` and `dismissCategoryFilter`/`dismissMonthFilter` (D-012). The category chip label comes from `getCategoryById(categoryId).label` so it renders even with zero matches (D-007); the month chip label comes from a new `formatMonthLabel` helper in `utils.ts` that yields e.g. `Aug 2026` (D-008). Each dismiss handler clears only its own dimension and the filter collapses to null when both are unset (D-014).

`TransactionsScreen` builds its `SectionList` sections from `filteredTransactions`, renders a chip row (`testID="transactions-filter-chips"`) as a sibling `View` directly above the list — category chip first (index 0), then month chip, each shown only when its label is non-null (D-010, D-013, D-019) — and switches the empty-state copy to `No transactions match this filter.` when a filter is active (D-015). Placing the row above the list as a sibling `View` rather than in `ListHeaderComponent` keeps the chips visible in the empty state (D-020, AC-013). The chips use a new presentational `FilterChip` component (label + Pressable `×`, no new icon) with a sibling `FilterChip.styles.ts` styled via `makeStyles` from theme tokens, mirroring the existing `cashbackPill` pill precedent — pill radius, `secondary` background, `caption` label, tokenised padding/gap, no raw hex (D-009, D-016, D-017, D-018).
