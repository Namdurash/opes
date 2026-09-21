<!-- aif:meta
{ "schema": 1, "ticket": "OPES-64", "lang": "en", "risk": "medium" }
-->

# OPES-64 — Make a failed disconnect visible instead of silent

## Why

`useMonobankStore.disconnect` awaits `monobankTokenService.clear()` with no `try`/`catch`:

```ts
async disconnect() {
  await monobankTokenService.clear();   // if this rejects, everything below is skipped
  monobankAccountSelectionService.clear();
  clearMonobankService();
  useTransactionsStore.getState().reset();
  set({ status: 'idle', clientName: null, errorMessage: null, accounts: [], selectedAccountIds: null });
},
```

The screen hands this straight to `onPress={disconnect}`, so a rejecting `clear` becomes an
unhandled promise rejection. The user presses Disconnect, nothing happens, and nothing tells
them anything. Their token is still on disk and they have no way to know.

That is the whole of this ticket. Everything else OPES-58 deferred here is already in place
and needs no change: `types.ts` already declares `disconnect(): Promise<void>` and
`loadSavedToken(): Promise<string | null>`, `connect` already awaits `save` before announcing
`connected`, `HomeScreen` and `ConnectMonobankScreen` already carry their `.catch`, and
`useTransactionsStore.syncFromMonobank` already awaits the token read.

## What should be true after

**A failed disconnect changes nothing at all.** If `clear()` rejects, the store is left exactly
as it was — still `connected`, same `clientName`, same `accounts`, same `selectedAccountIds`,
same `errorMessage`. There is no half-disconnected state: either the user is disconnected or
they are not. The three tear-down side effects — `clearMonobankService`, the account-selection
clear and the transactions reset — do not run, because the secret is still stored.

**A failed disconnect is visible.** The failure raises a bottom sheet. `disconnect` itself
resolves rather than rejecting, so the Disconnect button keeps handing the action straight to
`onPress` with no wrapper.

**A successful disconnect is unchanged.** `clear()` resolves, the side effects run, the store
resets to `idle`.

**The sheet for a failed local write is not the network one.** Today `connect`'s catch raises
`title: 'Connection Failed'` with "check your token and try again". That is a lie when what
failed was a local write to the secret store — the network was fine and the token was fine.
A new general error sheet says **"Something went wrong"**, and both a failed `clear` and a
failed `save` use it. A genuine Monobank API failure keeps the existing "Connection Failed"
sheet, because for that one the message is true.

## Surfaces the change is seen through

- `src/shared/ui/bottom-sheet/index.ts` — the new general error sheet, alongside
  `showErrorBottomSheet` and `showSuccessBottomSheet`.
- `src/features/monobank/state/useMonobankStore.ts` — `disconnect`, and the save branch of
  `connect`.

## Edge cases that matter

- **`clear` rejects** — nothing in the store moves, no side effect runs, the general sheet is
  shown, `disconnect` resolves.
- **`clear` resolves** — side effects run, status becomes `idle`.
- **`save` rejects inside `connect`** — the general sheet, not "Connection Failed".
- **The Monobank API rejects inside `connect`** — still "Connection Failed"; that path is
  unchanged.

## Risk

Medium. It is one `try`/`catch` and one new sheet variant. The part worth pinning is that a
failed `clear` leaves the store *untouched* — an implementation that sets a status, or clears
`clientName`, would produce exactly the half-state this ticket exists to rule out.

## Non-goals

- Retrying a failed `clear` or a failed `save` automatically.
- Any change to `MonobankTokenService`, its storage keys, or the OPES-63 migration.
- Any new `MonobankConnectionStatus` value.
- Changing `loadSavedToken`, `loadAccounts`, `toggleAccount`, or the two screens.
- The exact copy beyond the sheet's "Something went wrong" title.

## Rework requested at approve

- Тікет роздутий: 28 критеріїв на один відсутній try/catch у disconnect, решта вже працює з OPES-58. Три конкретні правки. (1) Bottom sheet на невдалий локальний запис не може бути мережевим 'Connection Failed' — це не помилка мережі, а помилка звичайної функції. Потрібен окремий загальний тип шита: 'Something went wrong'. (2) Користувач не може бути частково відʼєднаним — це нелогічно і створює проблеми на рівному місці. Або відʼєднується повністю, або не відʼєднується взагалі: при відмові clear() не змінюється НІЧОГО, показується загальний шит. (3) Скоротити обсяг до того, чим тікет є насправді.
