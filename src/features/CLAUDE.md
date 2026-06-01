# Features

One folder per product feature. Each is self-contained: screens, sub-components, feature-scoped state, types, utils.

## Folder shape

```
src/features/<feature>/
  <FeatureName>Screen.tsx          # screen component
  <FeatureName>Screen.styles.ts    # styles for the screen (mandatory)
  components/                      # sub-components used only within this feature
  hooks/                           # feature-scoped hooks (optional)
  state/
    use<Feature>Store.ts           # Zustand store(s) for this feature
  types.ts                         # feature-specific TS types
  utils.ts                         # feature-specific pure helpers
  index.ts                         # barrel — public API of the feature
```

## Styling rules

- **No `StyleSheet.create(...)` inline in a feature component.** Every component with styles has a sibling `*.styles.ts` matching the component name (`TransactionsScreen.tsx` ↔ `TransactionsScreen.styles.ts`).
- **No hardcoded colors, font sizes, spacing, or radii.** Use `theme.*` tokens via `useTheme()` or `makeStyles((theme) => ...)`. See [../shared/theme/CLAUDE.md](../shared/theme/CLAUDE.md).
- **Use `shared/ui` primitives** (`Screen`, `AppText`, `Button`, `Input`/`FormInput`, `Header`, `Icon`) rather than raw RN components. See [../shared/ui/CLAUDE.md](../shared/ui/CLAUDE.md).

## Data access rules

- **Components never call repositories, services, or the database directly.** They call store actions only.
- **Feature stores live in `state/use<Feature>Store.ts`** and instantiate repositories/services at module scope. Canonical pattern: [transactions/state/useTransactionsStore.ts](transactions/state/useTransactionsStore.ts) — repositories created once, `TransactionSyncService` composed per call.
- **Stores do not mirror domain tables.** They hold UI state (filters, sort, selection), process state (sync status, errors), and only the working set of data the current screen needs. The DB is the source of truth.
- **Avoid one mega-store.** Split per feature; share via global stores under `src/stores/` only when more than one feature truly needs the same state.

## Forms

- **React Hook Form owns field values and validation.** Use `useForm` + `yupResolver`. Schemas live in [../shared/validation/](../shared/validation/).
- **Use `<FormInput>` for RHF-connected fields**, `<Input>` for standalone inputs without RHF. **Never use raw `TextInput` from `react-native`** in a feature screen.
- **Store `create` / `submit` actions accept validated form data as parameters** — they don't hold field state. Non-input form state (image pickers, button-group selection, submission flags) lives in the Zustand store.

## Boundaries

- **Every feature exposes a barrel `index.ts`.** Import a feature through its barrel from outside.
- **Never import another feature's `utils.ts`** or internal modules. If a helper has a second consumer, promote it to `src/shared/utils/`.
- **Do not create navigators inside a feature.** Feature screens use `useNavigation` / `useRoute` (typed). See [../app/CLAUDE.md](../app/CLAUDE.md).
