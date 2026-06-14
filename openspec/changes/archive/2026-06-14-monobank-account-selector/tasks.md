## 1. Persistence (services/monobank)

- [x] 1.1 Add `MonobankAccountSelectionService` (MMKV + jest in-memory fallback): get/set/clear selected account ids; `null` = sync all
- [x] 1.2 Unit-test the service (default `null`, set/get, clear, malformed value)
- [x] 1.3 Export it from the monobank barrel

## 2. Sync honors the selection (services/sync, features/transactions)

- [x] 2.1 Add an optional `selectedAccountIds` param to `syncAllAccounts` and filter the Monobank cards
- [x] 2.2 Read the persisted selection in `syncFromMonobank` and pass it to the sync service

## 3. Selector (features/monobank)

- [x] 3.1 Extend `useMonobankStore` with `accounts` + `selectedAccountIds`, `loadAccounts`, `toggleAccount` (persist); clear on `disconnect`
- [x] 3.2 Add the per-account on/off switch list to the Connect Monobank screen (shown when connected)

## 4. Definition of Done

- [x] 4.1 `npx tsc --noEmit`, `npm run lint`, and `npm test` all pass
