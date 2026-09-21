<!-- aif:meta
{ "schema": 2,
  "ticket": "OPES-64",
  "spec_sha256": "5ac9430667e1ca922c63341a4c6a9e0bbbbc0a9f93edbb0ed27ca38e40868ca4",
  "risk": "medium",
  "files": {
    "create": [],
    "change": [
      "src/shared/ui/bottom-sheet/index.ts",
      "src/features/monobank/state/useMonobankStore.ts",
      "src/shared/ui/CLAUDE.md"
    ],
    "tests": [
      "src/shared/ui/bottom-sheet/index.test.ts",
      "src/features/monobank/state/useMonobankStore.disconnect.test.ts",
      "src/features/monobank/state/useMonobankStore.connect.test.ts"
    ] },
  "decisions": [
    { "id": "D-001",
      "statement": "Add `export const showGeneralErrorBottomSheet = (): void => {...}` to src/shared/ui/bottom-sheet/index.ts, taking no parameters.",
      "because": "AS-001 fixes the export name and makes the helper own its title, so no call site can pass one.",
      "serves": ["AC-001", "AC-002"],
      "rejected": "Do not give it a title, message, buttonTitle or onPress parameter." },

    { "id": "D-002",
      "statement": "Implement it as one call to the existing showErrorBottomSheet with title 'Something went wrong', message 'Please try again.', buttonTitle 'OK', onPress `() => {}`.",
      "because": "AS-002 keeps the existing `error` variant, which showErrorBottomSheet already applies.",
      "serves": ["AC-001", "AC-002"],
      "rejected": "Do not add a fourth BottomSheetVariant, and do not touch useBottomSheetStore or GlobalBottomSheet." },

    { "id": "D-003",
      "statement": "Write 'Something went wrong' as an inline literal inside the helper and export no title constant.",
      "because": "AC-001 pins that literal, and a shared constant would let the test assert the helper against itself.",
      "serves": ["AC-001"] },

    { "id": "D-004",
      "statement": "Add showGeneralErrorBottomSheet to the existing bottom-sheet import line of useMonobankStore.ts and add nothing to src/shared/ui/index.ts.",
      "because": "that barrel already carries `export * from './bottom-sheet'`, so the new helper re-exports itself.",
      "serves": ["AC-011", "AC-017"] },

    { "id": "D-005",
      "statement": "In disconnect, wrap only `await monobankTokenService.clear()` in a try/catch and leave the three tear-down side effects and the set() below the try.",
      "because": "AC-008 to AC-010 require those side effects not to run when clear rejects, and a wider try would swallow their own failures too.",
      "serves": ["AC-008", "AC-009", "AC-010", "AC-013", "AC-014", "AC-015", "AC-016"],
      "rejected": "Do not wrap the whole body of disconnect in one try/catch." },

    { "id": "D-006",
      "statement": "In that catch call showGeneralErrorBottomSheet() and then `return`, issuing no set() at all.",
      "because": "AC-003 to AC-007 require all five store fields to still hold the values they had.",
      "serves": ["AC-003", "AC-004", "AC-005", "AC-006", "AC-007", "AC-011"],
      "rejected": "Do not write a status, an errorMessage or any flag on the failed path." },

    { "id": "D-007",
      "statement": "Use a binding-less `catch {` in disconnect and rethrow nothing, so the returned promise fulfils.",
      "because": "AC-012 requires disconnect to resolve, because the Disconnect button hands the action straight to onPress with no wrapper.",
      "serves": ["AC-012"],
      "rejected": "Do not rethrow, and do not console.warn or console.log the caught error." },

    { "id": "D-008",
      "statement": "Nest a try/catch around exactly the `await monobankTokenService.save(...)` call in connect; the cards upsert, the connected set() and the sync trigger stay under the outer catch.",
      "because": "AS-003 decides the sheet by the step that failed, and today one catch serves both steps.",
      "serves": ["AC-017", "AC-018", "AC-019", "AC-020"],
      "rejected": "Do not branch the outer catch on the error's class to tell a failed save from a failed API call." },

    { "id": "D-009",
      "statement": "In that inner catch set status 'error' with CONNECT_FAILURE_MESSAGE, call showGeneralErrorBottomSheet(), then return.",
      "because": "AS-004 keeps the store state this branch writes today and changes only the sheet it raises.",
      "serves": ["AC-017", "AC-020"],
      "rejected": "Do not invent new errorMessage copy for the save branch and do not fall through into the outer catch." },

    { "id": "D-010",
      "statement": "Hoist today's fallback copy 'Failed to connect. Please check your token and try again.' to a module-scope const CONNECT_FAILURE_MESSAGE and read it from both catches.",
      "because": "D-009 must write the exact string the outer catch already falls back to, and two literals in one file drift.",
      "serves": ["D-009"] },

    { "id": "D-011",
      "statement": "Leave the outer catch as it is — MonobankError message or the fallback, status 'error', showErrorBottomSheet titled 'Connection Failed'.",
      "because": "AC-018 and AC-019 are regression guards on today's API-failure path, non-MonobankError included.",
      "serves": ["AC-018", "AC-019"],
      "rejected": "Do not route a non-MonobankError out of getClientInfo to the general sheet." },

    { "id": "D-012",
      "statement": "Add no MonobankConnectionStatus member and no disconnect-specific state; src/features/monobank/types.ts is untouched.",
      "because": "a declared non-goal, and AC-003 requires status to still read 'connected' after a failed clear.",
      "serves": ["AC-003", "AC-013"],
      "rejected": "Do not introduce a 'disconnecting' status or a second error field." },

    { "id": "D-013",
      "statement": "Rewrite the Errors bullet in src/shared/ui/CLAUDE.md to name both helpers and say which failure each is for.",
      "because": "the project Definition of Done requires the layer document to change when the rule it states changes, and that bullet names showErrorBottomSheet as the only error path.",
      "serves": ["D-001"] },

    { "id": "D-014",
      "statement": "Put this ticket's tests in the three new files named in files.tests and add nothing to src/features/monobank/state/useMonobankStore.test.ts.",
      "because": "verify-red requires every test in a declared file to be red, and that file's six inherited sandbox tests are green and already carry the markers AC-003 to AC-007 and AC-015.",
      "serves": ["AC-003", "AC-004", "AC-005", "AC-006", "AC-007", "AC-015"],
      "rejected": "Do not extend, rename or renumber the existing sandbox suite." },

    { "id": "D-015",
      "statement": "Mock the bottom-sheet barrel in neither new suite; read the sheet from useBottomSheetStore.getState().config.",
      "because": "AC-001, AC-002, AC-011 and AC-017 assert on the bottom-sheet store's own config, which the jest.fn() double the sibling suite installs never writes.",
      "serves": ["AC-001", "AC-002", "AC-011", "AC-017"],
      "rejected": "Do not copy the `jest.mock('../../../shared/ui/bottom-sheet', ...)` block from the sibling suite." },

    { "id": "D-016",
      "statement": "Create no new source file — the helper goes into the existing bottom-sheet barrel and both store edits into the existing store file.",
      "because": "plan-form revalidates files.create against the working tree on every run, so a plan that orders a file into existence is invalid the moment the implement station creates it.",
      "serves": ["AC-001", "AC-002"],
      "rejected": "Do not put the helper in a new module beside index.ts." },

    { "id": "D-017",
      "statement": "Inject both rejections with jest.spyOn on the exported monobankTokenService singleton, and count clearMonobankService by jest.mock of the serviceInstance module.",
      "because": "the store imports that singleton object and that named function directly and offers no injection seam for either.",
      "serves": ["AC-003", "AC-008", "AC-009", "AC-010", "AC-014", "AC-015", "AC-016", "AC-017"] },

    { "id": "D-018",
      "statement": "Stub the database singleton in both new suites with `jest.mock('../../../services/database/database', () => ({ database: {} }))` and build no test database.",
      "because": "importing the store loads CardsRepository and the database barrel, which opens a live LokiJS instance with a 500 ms autosave that outlives the suite; no criterion here reaches a repository call.",
      "serves": ["AC-003", "AC-004", "AC-005", "AC-006", "AC-007", "AC-008", "AC-009", "AC-010", "AC-011", "AC-012", "AC-013", "AC-014", "AC-015", "AC-016", "AC-017", "AC-018", "AC-019", "AC-020"],
      "rejected": "Do not copy createTestDatabase and its teardown from the sibling suite." } ],
  "ac_coverage": {
    "AC-001": ["src/shared/ui/bottom-sheet/index.ts"],
    "AC-002": ["src/shared/ui/bottom-sheet/index.ts"],
    "AC-003": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-004": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-005": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-006": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-007": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-008": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-009": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-010": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-011": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-012": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-013": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-014": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-015": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-016": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-017": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-018": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-019": ["src/features/monobank/state/useMonobankStore.ts"],
    "AC-020": ["src/features/monobank/state/useMonobankStore.ts"] },
  "uncovered": [],
  "surface_map": {
    "src/shared/ui/bottom-sheet/index.ts": [
      "src/shared/ui/bottom-sheet/index.ts",
      "src/shared/ui/CLAUDE.md" ],
    "useMonobankStore.disconnect": ["src/features/monobank/state/useMonobankStore.ts"],
    "useMonobankStore.connect": ["src/features/monobank/state/useMonobankStore.ts"] },
  "external": [
    { "name": "zustand — create() and the set() useMonobankStore writes its five fields through",
      "ac": "AC-013" },
    { "name": "@gorhom/bottom-sheet — BottomSheetModal, which GlobalBottomSheet renders the general sheet through; the edited barrel loads it at import time" },
    { "name": "react-native-keychain — the Keychain-backed SecretStore behind monobankTokenService.clear() and .save() on device; under Jest an in-memory port stands in" },
    { "name": "react-native-mmkv — the plaintext store behind monobankAccountSelectionService.clear() on the successful disconnect path; under Jest an in-memory map stands in" } ] }
-->

# OPES-64 — plan

Two edits and a doc bullet. `src/shared/ui/bottom-sheet/index.ts` gains a third helper
beside `showSuccessBottomSheet` and `showErrorBottomSheet`; `useMonobankStore` gains one
`try`/`catch` in `disconnect` and one nested `try`/`catch` around the `save` call in
`connect`. Nothing else moves — no new file, no new `BottomSheetVariant`, no new
`MonobankConnectionStatus`, no change to `types.ts` or to either screen.

## The helper

Appended to the bottom-sheet barrel, after `showErrorBottomSheet`:

```ts
export const showGeneralErrorBottomSheet = (): void => {
  showErrorBottomSheet({
    title: 'Something went wrong',
    message: 'Please try again.',
    buttonTitle: 'OK',
    onPress: () => {},
  });
};
```

No parameters at all: the point of AS-001 is that two call sites cannot drift to two
words for the same failure. The body copy and the button label are mine to choose — no
criterion pins them (VG-004) — and they are chosen here so the implementer does not
choose again. Delegating to `showErrorBottomSheet` is what gives AC-002 its `error`
variant without touching `useBottomSheetStore` or `GlobalBottomSheet`.
`src/shared/ui/index.ts` already re-exports the folder with `export *`, so it needs no
edit.

## disconnect

```ts
async disconnect() {
  try {
    await monobankTokenService.clear();
  } catch {
    showGeneralErrorBottomSheet();
    return;
  }

  monobankAccountSelectionService.clear();
  clearMonobankService();
  useTransactionsStore.getState().reset();
  set({ status: 'idle', clientName: null, errorMessage: null, accounts: [], selectedAccountIds: null });
}
```

The `try` ends at the `await`. That placement is the whole ticket: the three tear-down
side effects sit outside it, so a rejecting `clear` skips them (AC-008 to AC-010) while a
resolving one still runs them (AC-014 to AC-016), and none of their own failures get
swallowed. **The catch issues no `set` of any kind** — not a status, not an
`errorMessage`, not a flag. AC-003 to AC-007 assert each of the five fields separately
precisely because a helpful half-reset is the failure mode this ticket exists to rule out.
The `return` (rather than a rethrow) is what makes `disconnect` fulfil for AC-012.

## connect

Only the `save` step changes hands. Hoist the fallback copy to module scope beside
`const cardsRepository = new CardsRepository();`:

```ts
const CONNECT_FAILURE_MESSAGE = 'Failed to connect. Please check your token and try again.';
```

and nest one catch inside the existing `try`, between `getClientInfo` and the cards upsert:

```ts
try {
  await monobankTokenService.save(trimmed, clientInfo.name);
} catch {
  set({ status: 'error', errorMessage: CONNECT_FAILURE_MESSAGE });
  showGeneralErrorBottomSheet();
  return;
}
```

The outer catch keeps its `error instanceof MonobankError` ternary, its `set` and its
`showErrorBottomSheet({ title: 'Connection Failed', ... })` byte for byte. AC-018 and
AC-019 are regression guards on it: which sheet appears is decided by *the step that
failed*, never by the class of the error, so a `TypeError` out of `getClientInfo` still
reads "Connection Failed". The store state the save branch writes is deliberately today's
state, message included (AS-004) — nothing renders `errorMessage` on
`ConnectMonobankScreen`, and inventing copy for it would be scope the spec closed.

## Where the tests go

Three new files, and **not** `useMonobankStore.test.ts`. That suite's six inherited
sandbox cases are green and already carry the markers `AC-003`…`AC-007` and `AC-015` from
OPES-58 — declaring it would both fail verify-red's every-test-is-red rule and let a stale
marker stand in for one of this ticket's criteria. `useMonobankStore.disconnect.test.ts`
and `useMonobankStore.connect.test.ts` are siblings of their source and end in `.test.ts`,
which is what `scripts/checkTestConvention.ts` enforces.

Both new suites must stub `src/services/database/database` with `{ database: {} }` —
importing the store pulls in `CardsRepository` and the database barrel, which opens a live
LokiJS instance — and must **not** mock `src/shared/ui/bottom-sheet`. Every sheet
criterion reads `useBottomSheetStore.getState().config`, which a `jest.fn()` double never
writes; the real barrel loads cleanly under Jest today, as `App.test.tsx` rendering
`GlobalBottomSheet` already shows. Rejections go in through
`jest.spyOn(monobankTokenService, 'clear' | 'save')` on the exported singleton;
`clearMonobankService` is counted by `jest.mock` of `services/monobank/serviceInstance`,
since the store imports it as a named binding.

## Coverage

`ac_coverage` maps each criterion to the file that must **change** for it to pass, which
is why AC-011 and AC-017 point at the store rather than at both files: the barrel change
they lean on is the same one AC-001 and AC-002 already pin, and the work those two
criteria direct is the `showGeneralErrorBottomSheet()` call inside the store. That keeps
one file set per surface. `src/shared/ui/CLAUDE.md` serves the bottom-sheet surface and no
criterion; it is in the manifest because the Definition of Done requires the layer
document to move when the rule it states does.

What none of this establishes: every criterion drives a doubled `monobankTokenService`, so
a green suite says nothing about the Keychain either clearing the token (VG-001) or
failing at all (VG-002), and the sheet is only ever observed as a config object, never as
something a user can see or dismiss (VG-003). Those, plus pressing Disconnect a second
time after a failure (VG-005), are device checks.
