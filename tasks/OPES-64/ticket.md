<!-- aif:meta
{ "schema": 1, "ticket": "OPES-64", "lang": "en", "risk": "high" }
-->

# OPES-64 — Pin the async Monobank connect/disconnect semantics

## Why

OPES-58 makes `MonobankTokenService.get` / `save` / `clear` async and mechanically awaits them
at every call site. It deliberately does not decide what the Monobank store should do when one
of those calls **fails**, or in what **order** the store's status may change relative to the
secret actually being written or removed.

Those are the security-visible parts. A store that announces `connected` before the token is
persisted, or `idle` before the token is removed from disk, is lying to the user about where
their secret is. This ticket pins that behaviour.

It depends on OPES-58.

## What should be true after

**Connect never announces success ahead of the write.** `useMonobankStore.connect` awaits
`monobankTokenService.save(...)` before it sets `status: 'connected'`. While the save is still
pending the status is still the in-flight status (`connecting`) — never `connected`.

**A failed save is a failed connection.** If `save(...)` rejects, `connect` surfaces it as a
connection failure — `status: 'error'` with a message, an existing `MonobankConnectionStatus`
value — rather than an unhandled promise rejection.

**Disconnect never reports the secret gone before it is gone.** `useMonobankStore.disconnect`
becomes async (`Promise<void>`) and awaits `monobankTokenService.clear()` before it resets the
store state. While the clear is still pending the status is still `connected`. Its signature in
`src/features/monobank/types.ts` and its call site in `ConnectMonobankScreen.tsx` are updated
accordingly.

**A failed clear is surfaced actively, and nothing is torn down.** If `clear()` rejects:

- the store sets `status: 'error'` with a message — the user is **not** presented as
  disconnected while the token is still on disk;
- the follow-on side effects are **skipped**: `clearMonobankService`, the account-selection
  clear, and the transactions reset do not run, because the secret is still stored;
- the failure is **also raised through the existing error bottom sheet**
  (`showErrorBottomSheet`), not left to the store status alone. A silent status change is not
  enough for a security-visible action the user explicitly asked for.

**Saved-token restoration is async end to end.**

- `useMonobankStore.loadSavedToken` becomes `async` returning `Promise<string | null>`; its
  signature in `src/features/monobank/types.ts` is updated to match.
- The `HomeScreen.tsx` startup effect calls it fire-and-forget with a `.catch` — its return
  value is already unused — and produces no unhandled rejection.
- The `ConnectMonobankScreen.tsx` effect awaits it and then `setValue`s the restored token. On
  `null` (no saved token) the field is left empty. On a rejection (a transient error) the
  rejection is caught and the field is left empty rather than blocking the form with an error —
  this restoration path is the one place a failure is **not** surfaced to the user.
- `useTransactionsStore.syncFromMonobank` (already an async context) awaits the
  `monobankTokenService.get()` call and passes the resolved token onward.

## Surfaces the change is seen through

- `useMonobankStore` — `connect`, `disconnect`, `loadSavedToken`.
- `src/features/monobank/types.ts` — `loadSavedToken` and `disconnect` signatures.
- `ConnectMonobankScreen.tsx` — the restore effect and the disconnect call site.
- `HomeScreen.tsx` — the startup effect.
- `useTransactionsStore.syncFromMonobank`.

## Edge cases that matter

- **Save still pending** — status is `connecting`, never `connected`.
- **Save rejects** — `status: 'error'`, no unhandled rejection.
- **Clear still pending** — status is still `connected`.
- **Clear rejects** — `status: 'error'`, side effects skipped, error bottom sheet shown, user not
  presented as disconnected.
- **Clear resolves** — status becomes `idle` and the side effects run.
- **`loadSavedToken` resolves `null`** — the Connect screen field is left empty, no error shown.
- **`loadSavedToken` rejects** — the field is left empty, no bottom sheet, and no unhandled
  rejection on Home.

## Risk

High. Every criterion here is about ordering and failure presentation on a flow that decides
whether the user is told their secret is stored or gone. Ordering must be pinned as an
observation of the intermediate state — status while the promise is still pending — not as a
promise about the final state, which would pass regardless of order.

## Deliberately left open

- The exact wording of the error messages, provided each failure branch sets a message and the
  disconnect failure also reaches `showErrorBottomSheet`.
