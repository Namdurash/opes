# Global stores

Cross-feature Zustand stores. A store lives here only when more than one feature truly shares the same state — otherwise it belongs in `src/features/<feature>/state/`.

Current global stores: [useUserStore.ts](useUserStore.ts), [useBottomSheetStore.ts](useBottomSheetStore.ts).

## Rules

- **Stores expose minimal state + explicit actions.** State is serializable when possible. Actions: `setX`, `reset`, `load`, `refresh`, `invalidate`, and CRUD methods that delegate writes to repositories.
- **Stores do not mirror domain tables.** The DB is the source of truth. Keep only the working set the UI needs (e.g. current user, transient bottom-sheet config).
- **Repositories/services are instantiated at module scope**, then composed inside actions. Same pattern as feature stores — see [../features/CLAUDE.md](../features/CLAUDE.md) and [../features/transactions/state/useTransactionsStore.ts](../features/transactions/state/useTransactionsStore.ts).
- **Prefer many small stores over one mega-store.** A new global concern that doesn't fit an existing store gets its own file.
- **Selecting multiple values?** Use `useShallow` from `zustand/shallow` to group them into one hook call:
  ```ts
  import { useShallow } from 'zustand/shallow';
  const { status, clientName, loadSavedToken } = useMonobankStore(
    useShallow(state => ({
      status: state.status,
      clientName: state.clientName,
      loadSavedToken: state.loadSavedToken,
    })),
  );
  ```
- **Forms:** Zustand never holds form field values — React Hook Form does. Store actions receive validated form data as parameters. See [../features/CLAUDE.md](../features/CLAUDE.md).
- **Invalidation:** after a repository write, the action updates relevant UI state (close modal, clear draft) and triggers `invalidate()` / `refresh()` for dependent selectors.
