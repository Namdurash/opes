<!-- aif:meta
{ "schema": 2,
  "ticket": "OPES-64",
  "ticket_sha256": "77b41ac39dc8033b52985604c03f5c8cb1fcfd60f010a52dd913e24e2ab995d1",
  "lang": "en",
  "risk": "medium",
  "surfaces": [
    "src/shared/ui/bottom-sheet/index.ts",
    "useMonobankStore.disconnect",
    "useMonobankStore.connect"
  ],
  "acceptance": [
    { "id": "AC-001",
      "surface": "src/shared/ui/bottom-sheet/index.ts",
      "given": "the bottom-sheet store holds no config",
      "when": "the general error sheet helper exported from the bottom-sheet barrel is invoked once",
      "then": "the bottom-sheet store's `config.title` equals `Something went wrong`",
      "expect": "`Something went wrong`",
      "from": "A new general error sheet says **\"Something went wrong\"**, and both a failed `clear` and a" },

    { "id": "AC-002",
      "surface": "src/shared/ui/bottom-sheet/index.ts",
      "given": "the bottom-sheet store holds no config",
      "when": "the general error sheet helper exported from the bottom-sheet barrel is invoked once",
      "then": "the bottom-sheet store's `config.variant` equals `error`",
      "expect": "`error`",
      "from": "AS-002" },

    { "id": "AC-003",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected`, clientName `Ada`, one account whose monobankAccountId is `acc-1`, selectedAccountIds holding `acc-1`, errorMessage `prior-message`, and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the store's `status` equals `connected`",
      "expect": "`connected`",
      "from": "as it was — still `connected`, same `clientName`, same `accounts`, same `selectedAccountIds`," },

    { "id": "AC-004",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected`, clientName `Ada`, one account whose monobankAccountId is `acc-1`, selectedAccountIds holding `acc-1`, errorMessage `prior-message`, and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the store's `clientName` equals `Ada`",
      "expect": "`Ada`",
      "from": "as it was — still `connected`, same `clientName`, same `accounts`, same `selectedAccountIds`," },

    { "id": "AC-005",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected`, clientName `Ada`, one account whose monobankAccountId is `acc-1`, selectedAccountIds holding `acc-1`, errorMessage `prior-message`, and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the store's `errorMessage` equals `prior-message`",
      "expect": "`prior-message`",
      "from": "same `errorMessage`. There is no half-disconnected state" },

    { "id": "AC-006",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected`, clientName `Ada`, one account whose monobankAccountId is `acc-1`, selectedAccountIds holding `acc-1`, errorMessage `prior-message`, and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the length of the store's `accounts` equals 1",
      "expect": 1,
      "from": "as it was — still `connected`, same `clientName`, same `accounts`, same `selectedAccountIds`," },

    { "id": "AC-007",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected`, clientName `Ada`, one account whose monobankAccountId is `acc-1`, selectedAccountIds holding `acc-1`, errorMessage `prior-message`, and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the store's `selectedAccountIds` contains `acc-1`",
      "expect": "`acc-1`",
      "from": "as it was — still `connected`, same `clientName`, same `accounts`, same `selectedAccountIds`," },

    { "id": "AC-008",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected` and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the `clearMonobankService` call count equals 0",
      "expect": 0,
      "from": "they are not. The three tear-down side effects — `clearMonobankService`, the account-selection" },

    { "id": "AC-009",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected` and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the `monobankAccountSelectionService.clear` call count equals 0",
      "expect": 0,
      "from": "they are not. The three tear-down side effects — `clearMonobankService`, the account-selection" },

    { "id": "AC-010",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected` and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the `useTransactionsStore.reset` call count equals 0",
      "expect": 0,
      "from": "clear and the transactions reset — do not run, because the secret is still stored." },

    { "id": "AC-011",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected`, the bottom-sheet store holds no config, and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the bottom-sheet store's `config.title` equals `Something went wrong`",
      "expect": "`Something went wrong`",
      "from": "**`clear` rejects** — nothing in the store moves, no side effect runs, the general sheet is" },

    { "id": "AC-012",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected` and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is called and its returned promise is awaited to settlement",
      "then": "the settlement state of the promise returned by `disconnect()` equals `fulfilled`",
      "expect": "`fulfilled`",
      "from": "resolves rather than rejecting, so the Disconnect button keeps handing the action straight to" },

    { "id": "AC-013",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected` and monobankTokenService.clear returns a promise that resolves",
      "when": "disconnect() is awaited to completion",
      "then": "the store's `status` equals `idle`",
      "expect": "`idle`",
      "from": "**`clear` resolves** — side effects run, status becomes `idle`." },

    { "id": "AC-014",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected` and monobankTokenService.clear returns a promise that resolves",
      "when": "disconnect() is awaited to completion",
      "then": "the `clearMonobankService` call count equals 1",
      "expect": 1,
      "from": "**A successful disconnect is unchanged.** `clear()` resolves, the side effects run, the store" },

    { "id": "AC-015",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected` and monobankTokenService.clear returns a promise that resolves",
      "when": "disconnect() is awaited to completion",
      "then": "the `monobankAccountSelectionService.clear` call count equals 1",
      "expect": 1,
      "from": "**A successful disconnect is unchanged.** `clear()` resolves, the side effects run, the store" },

    { "id": "AC-016",
      "surface": "useMonobankStore.disconnect",
      "given": "the store holds status `connected` and monobankTokenService.clear returns a promise that resolves",
      "when": "disconnect() is awaited to completion",
      "then": "the `useTransactionsStore.reset` call count equals 1",
      "expect": 1,
      "from": "**A successful disconnect is unchanged.** `clear()` resolves, the side effects run, the store" },

    { "id": "AC-017",
      "surface": "useMonobankStore.connect",
      "given": "the Monobank service resolves client info and monobankTokenService.save returns a promise that rejects with an Error",
      "when": "connect(userId, token) is awaited to completion",
      "then": "the bottom-sheet store's `config.title` equals `Something went wrong`",
      "expect": "`Something went wrong`",
      "from": "**`save` rejects inside `connect`** — the general sheet, not \"Connection Failed\"." },

    { "id": "AC-018",
      "surface": "useMonobankStore.connect",
      "given": "the Monobank service's getClientInfo returns a promise that rejects with a MonobankError",
      "when": "connect(userId, token) is awaited to completion",
      "then": "the bottom-sheet store's `config.title` equals `Connection Failed`",
      "expect": "`Connection Failed`",
      "from": "**The Monobank API rejects inside `connect`** — still \"Connection Failed\"; that path is" },

    { "id": "AC-019",
      "surface": "useMonobankStore.connect",
      "given": "the Monobank service's getClientInfo returns a promise that rejects with a TypeError, which is not a MonobankError",
      "when": "connect(userId, token) is awaited to completion",
      "then": "the bottom-sheet store's `config.title` equals `Connection Failed`",
      "expect": "`Connection Failed`",
      "from": "AS-003" },

    { "id": "AC-020",
      "surface": "useMonobankStore.connect",
      "given": "the Monobank service resolves client info and monobankTokenService.save returns a promise that rejects with an Error",
      "when": "connect(userId, token) is awaited to completion",
      "then": "the store's `status` equals `error`",
      "expect": "`error`",
      "from": "AS-004" }
  ],
  "assumptions": [
    { "id": "AS-001",
      "text": "The new helper is exported from the bottom-sheet barrel as `showGeneralErrorBottomSheet`, and it owns the fixed title `Something went wrong` — neither call site passes a title.",
      "because": "the ticket says where the sheet lives and what its title reads, but names neither the export nor whether the title is a parameter.",
      "instead_of": "a title-taking helper that each call site defaults, which would let the two call sites drift to different words for the same failure.",
      "affects": ["AC-001", "AC-002", "AC-011", "AC-017"] },

    { "id": "AS-002",
      "text": "The general sheet reuses the existing `error` BottomSheetVariant rather than introducing a fourth variant.",
      "because": "the ticket calls it a general error sheet without saying how it renders, and BottomSheetVariant today offers `error`, `success` and `info`.",
      "instead_of": "adding a new variant member, which would pull useBottomSheetStore and GlobalBottomSheet into a change the ticket scopes to two files.",
      "affects": ["AC-002"] },

    { "id": "AS-003",
      "text": "Which sheet `connect` raises is decided by the step that failed, not by the class of the thrown error: everything coming out of the Monobank API call keeps `Connection Failed`, including errors that are not MonobankError, and only a rejecting local `save` raises the general sheet.",
      "because": "the ticket separates a failed local write from a Monobank API failure, but `connect` today runs both through one catch that branches on `error instanceof MonobankError`.",
      "instead_of": "routing every non-MonobankError to the general sheet, which would silently move today's network-failure copy off `Connection Failed`.",
      "affects": ["AC-019"] },

    { "id": "AS-004",
      "text": "The save branch of `connect` keeps writing the store state it writes today — status `error` with a message — and only the sheet it raises changes.",
      "because": "the ticket pins which sheet a failed `save` shows and says nothing about the store state that branch already writes.",
      "instead_of": "extending the disconnect rule — change nothing at all — to `connect`, which would leave the store at `connecting` after a save that will never complete.",
      "affects": ["AC-020"] }
  ],
  "verification_gaps": [
    { "id": "VG-001",
      "text": "Every criterion runs against a doubled monobankTokenService, so a green suite would not establish that a resolved `clear` removed the token from the Keychain-backed store on a device.",
      "leaves": ["AC-013", "AC-014", "AC-015", "AC-016"] },

    { "id": "VG-002",
      "text": "The failure is injected as a rejected promise from a double; no criterion reproduces a real condition under which `clear` fails, so nothing here establishes that a genuine Keychain failure rejects at all rather than resolving silently.",
      "leaves": ["AC-003", "AC-004", "AC-005", "AC-006", "AC-007", "AC-008", "AC-009", "AC-010", "AC-011", "AC-012"] },

    { "id": "VG-003",
      "text": "The sheet is observed as the config handed to the bottom-sheet store, never as rendered output, so nothing here establishes that the user sees the general sheet or can dismiss it.",
      "leaves": ["AC-001", "AC-002", "AC-011", "AC-017", "AC-018", "AC-019"] },

    { "id": "VG-004",
      "text": "Only the general sheet's title is pinned; its body text and button label are established by nothing in this cycle, because the ticket puts the rest of the copy out of scope.",
      "leaves": [] },

    { "id": "VG-005",
      "text": "What the user can do after a failed disconnect is not exercised: no criterion presses Disconnect a second time, so recovery from the failure is unproven even though the store is left connected.",
      "leaves": [] }
  ],
  "non_goals": [
    "Retrying a failed clear or a failed save automatically",
    "Any change to MonobankTokenService, its storage keys, or the OPES-63 migration",
    "Any new MonobankConnectionStatus value",
    "Changing loadSavedToken, loadAccounts, toggleAccount, or the two screens",
    "The exact copy beyond the sheet's Something went wrong title",
    "The rest of the async work OPES-58 deferred here, which the ticket records as already in place"
  ] }
-->

# OPES-64 — A failed disconnect is visible, and changes nothing

`disconnect` awaits `monobankTokenService.clear()` with no `try`/`catch`, so a rejecting clear
becomes an unhandled rejection: the user presses Disconnect, nothing moves, and nothing tells
them their token is still on disk. This spec pins the two edits that fix it — a failed `clear`
leaves all five store fields exactly as they were with none of the three tear-down side effects
run, and the failure raises a new general sheet titled "Something went wrong" rather than the
network-flavoured "Connection Failed" that a local write failure does not deserve.

The load-bearing criteria are AC-003 to AC-007: an implementation that sets a status, or clears
`clientName`, produces exactly the half-disconnected state this ticket exists to rule out, and
only asserting each preserved field catches it. Everything else OPES-58 deferred here — the
`types.ts` signatures, the screens' `.catch` handlers, `loadSavedToken`, `syncFromMonobank` —
the ticket records as already in place, so it gets no criterion.
