<!-- aif:meta
{ "schema": 2,
  "ticket": "OPES-64",
  "ticket_sha256": "b79a04ebec432b58c39c7790971904e2c836471bd62df2dea210d6489a0e1c67",
  "lang": "en",
  "risk": "high",
  "surfaces": [
    "useMonobankStore.connect",
    "useMonobankStore.disconnect",
    "useMonobankStore.loadSavedToken",
    "src/features/monobank/types.ts",
    "ConnectMonobankScreen.tsx",
    "HomeScreen.tsx",
    "useTransactionsStore.syncFromMonobank"
  ],
  "acceptance": [
    { "id": "AC-001",
      "surface": "useMonobankStore.connect",
      "given": "the Monobank service resolves client info and monobankTokenService.save returns a promise that is still unsettled",
      "when": "connect(userId, token) runs up to the pending save",
      "then": "the store's status equals `connecting`",
      "expect": "`connecting`",
      "from": "**Save still pending** — status is `connecting`, never `connected`." },

    { "id": "AC-002",
      "surface": "useMonobankStore.connect",
      "given": "monobankTokenService.save returns a promise that rejects with an Error",
      "when": "connect(userId, token) is awaited to completion",
      "then": "the store's status equals `error`",
      "expect": "`error`",
      "from": "**Save rejects** — `status: 'error'`" },

    { "id": "AC-003",
      "surface": "useMonobankStore.connect",
      "given": "monobankTokenService.save returns a promise that rejects with an Error",
      "when": "connect(userId, token) is awaited to completion",
      "then": "the type of the store's `errorMessage` equals `string`",
      "expect": "`string`",
      "from": "AS-004" },

    { "id": "AC-004",
      "surface": "useMonobankStore.connect",
      "given": "monobankTokenService.save returns a promise that rejects with an Error",
      "when": "connect(userId, token) is awaited to completion",
      "then": "the rejection count recorded for the awaited `connect` call equals 0",
      "expect": 0,
      "from": "AS-001" },

    { "id": "AC-005",
      "surface": "useMonobankStore.connect",
      "given": "monobankTokenService.save returns a promise that rejects with an Error",
      "when": "connect(userId, token) is awaited to completion",
      "then": "the `showErrorBottomSheet` call count equals 1",
      "expect": 1,
      "from": "AS-003" },

    { "id": "AC-006",
      "surface": "useMonobankStore.disconnect",
      "given": "the store's status is connected and monobankTokenService.clear returns a promise that is still unsettled",
      "when": "disconnect() runs up to the pending clear",
      "then": "the store's status equals `connected`",
      "expect": "`connected`",
      "from": "**Clear still pending** — status is still `connected`." },

    { "id": "AC-007",
      "surface": "useMonobankStore.disconnect",
      "given": "the store's status is connected and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the store's status equals `error`",
      "expect": "`error`",
      "from": "**Clear rejects** — `status: 'error'`, side effects skipped, error bottom sheet shown" },

    { "id": "AC-008",
      "surface": "useMonobankStore.disconnect",
      "given": "the store's status is connected and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the type of the store's `errorMessage` equals `string`",
      "expect": "`string`",
      "from": "AS-004" },

    { "id": "AC-009",
      "surface": "useMonobankStore.disconnect",
      "given": "the store's status is connected and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the `clearMonobankService` call count equals 0",
      "expect": 0,
      "from": "the follow-on side effects are **skipped**: `clearMonobankService`" },

    { "id": "AC-010",
      "surface": "useMonobankStore.disconnect",
      "given": "the store's status is connected and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the `monobankAccountSelectionService.clear` call count equals 0",
      "expect": 0,
      "from": "`clearMonobankService`, the account-selection" },

    { "id": "AC-011",
      "surface": "useMonobankStore.disconnect",
      "given": "the store's status is connected and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the `useTransactionsStore.reset` call count equals 0",
      "expect": 0,
      "from": "the transactions reset do not run, because the secret is still stored" },

    { "id": "AC-012",
      "surface": "useMonobankStore.disconnect",
      "given": "the store's status is connected and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the `showErrorBottomSheet` call count equals 1",
      "expect": 1,
      "from": "the failure is **also raised through the existing error bottom sheet**" },

    { "id": "AC-013",
      "surface": "useMonobankStore.disconnect",
      "given": "the store's status is connected and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the rejection count recorded for the awaited `disconnect` call equals 0",
      "expect": 0,
      "from": "AS-002" },

    { "id": "AC-014",
      "surface": "useMonobankStore.disconnect",
      "given": "the store's status is connected with clientName set to Ada, and monobankTokenService.clear returns a promise that rejects with an Error",
      "when": "disconnect() is awaited to completion",
      "then": "the store's `clientName` equals `Ada`",
      "expect": "`Ada`",
      "from": "AS-005" },

    { "id": "AC-015",
      "surface": "useMonobankStore.disconnect",
      "given": "the store's status is connected and monobankTokenService.clear returns a promise that resolves",
      "when": "disconnect() is awaited to completion",
      "then": "the store's status equals `idle`",
      "expect": "`idle`",
      "from": "**Clear resolves** — status becomes `idle` and the side effects run." },

    { "id": "AC-016",
      "surface": "useMonobankStore.disconnect",
      "given": "the store's status is connected and monobankTokenService.clear returns a promise that resolves",
      "when": "disconnect() is awaited to completion",
      "then": "the `clearMonobankService` call count equals 1",
      "expect": 1,
      "from": "status becomes `idle` and the side effects run" },

    { "id": "AC-017",
      "surface": "useMonobankStore.loadSavedToken",
      "given": "monobankTokenService.get returns a promise that resolves null",
      "when": "loadSavedToken() is awaited",
      "then": "the awaited value is null",
      "expect": "`null`",
      "from": "`useMonobankStore.loadSavedToken` becomes `async` returning `Promise<string | null>`" },

    { "id": "AC-018",
      "surface": "useMonobankStore.loadSavedToken",
      "given": "monobankTokenService.get returns a promise that resolves a record whose token field holds saved-token",
      "when": "loadSavedToken() is awaited",
      "then": "the awaited value equals `saved-token`",
      "expect": "`saved-token`",
      "from": "`useMonobankStore.loadSavedToken` becomes `async` returning `Promise<string | null>`" },

    { "id": "AC-019",
      "surface": "src/features/monobank/types.ts",
      "given": "a type-level fixture assigning MonobankStoreActions['loadSavedToken'] to a value typed () => Promise<string | null>",
      "when": "npx tsc --noEmit runs over the project",
      "then": "the type-check process exit code equals 0",
      "expect": 0,
      "from": "signature in `src/features/monobank/types.ts` is updated to match." },

    { "id": "AC-020",
      "surface": "src/features/monobank/types.ts",
      "given": "a type-level fixture assigning MonobankStoreActions['disconnect'] to a value typed () => Promise<void>",
      "when": "npx tsc --noEmit runs over the project",
      "then": "the type-check process exit code equals 0",
      "expect": 0,
      "from": "`src/features/monobank/types.ts` and its call site in `ConnectMonobankScreen.tsx` are updated" },

    { "id": "AC-021",
      "surface": "ConnectMonobankScreen.tsx",
      "given": "the store's loadSavedToken returns a promise that resolves saved-token",
      "when": "ConnectMonobankScreen is rendered and its restore effect settles",
      "then": "the token input's `value` prop equals `saved-token`",
      "expect": "`saved-token`",
      "from": "The `ConnectMonobankScreen.tsx` effect awaits it and then `setValue`s the restored token." },

    { "id": "AC-022",
      "surface": "ConnectMonobankScreen.tsx",
      "given": "the store's loadSavedToken returns a promise that resolves null",
      "when": "ConnectMonobankScreen is rendered and its restore effect settles",
      "then": "the length of the token input's `value` prop equals 0",
      "expect": 0,
      "from": "**`loadSavedToken` resolves `null`** — the Connect screen field is left empty, no error shown." },

    { "id": "AC-023",
      "surface": "ConnectMonobankScreen.tsx",
      "given": "the store's loadSavedToken returns a promise that rejects with an Error",
      "when": "ConnectMonobankScreen is rendered and its restore effect settles",
      "then": "the length of the token input's `value` prop equals 0",
      "expect": 0,
      "from": "**`loadSavedToken` rejects** — the field is left empty, no bottom sheet" },

    { "id": "AC-024",
      "surface": "ConnectMonobankScreen.tsx",
      "given": "the store's loadSavedToken returns a promise that rejects with an Error",
      "when": "ConnectMonobankScreen is rendered and its restore effect settles",
      "then": "the `showErrorBottomSheet` call count equals 0",
      "expect": 0,
      "from": "this restoration path is the one place a failure is **not** surfaced to the user." },

    { "id": "AC-025",
      "surface": "ConnectMonobankScreen.tsx",
      "given": "the store's status is connected and the screen is rendered",
      "when": "the Disconnect button's onPress fires once",
      "then": "the store's `disconnect` call count equals 1",
      "expect": 1,
      "from": "AS-002" },

    { "id": "AC-026",
      "surface": "HomeScreen.tsx",
      "given": "the store's loadSavedToken returns a promise that rejects with an Error and a global rejection listener is recording",
      "when": "HomeScreen is rendered and the microtask queue is flushed",
      "then": "the count of rejection events recorded by the global listener equals 0",
      "expect": 0,
      "from": "The `HomeScreen.tsx` startup effect calls it fire-and-forget with a `.catch`" },

    { "id": "AC-027",
      "surface": "useTransactionsStore.syncFromMonobank",
      "given": "monobankTokenService.get returns a promise that resolves a record whose token field holds saved-token",
      "when": "syncFromMonobank(userId) is awaited to completion",
      "then": "the first argument of the `getMonobankService` call equals `saved-token`",
      "expect": "`saved-token`",
      "from": "`monobankTokenService.get()` call and passes the resolved token onward." },

    { "id": "AC-028",
      "surface": "useTransactionsStore.syncFromMonobank",
      "given": "monobankTokenService.get returns a promise that resolves null",
      "when": "syncFromMonobank(userId) is awaited to completion",
      "then": "the `getMonobankService` call count equals 0",
      "expect": 0,
      "from": "AS-007" }
  ],
  "assumptions": [
    { "id": "AS-001",
      "text": "connect absorbs a rejecting save: its own promise resolves, and the failure is presented only through store state and the bottom sheet, never by rejecting to the caller.",
      "because": "the ticket says the failure is surfaced as a connection failure rather than an unhandled promise rejection, but does not say whether connect's own promise settles as resolved or as rejected-and-handled by each caller.",
      "instead_of": "letting connect re-throw after setting the status, which would oblige every call site — the screen's handleSubmit callback included — to attach its own handler.",
      "affects": ["AC-004"] },

    { "id": "AS-002",
      "text": "disconnect likewise absorbs a rejecting clear and its own promise resolves, so ConnectMonobankScreen keeps handing the action straight to onPress with no wrapper.",
      "because": "the ticket requires the disconnect call site in ConnectMonobankScreen to be updated accordingly without saying whether that update is an await-with-catch wrapper or an unchanged pass-through.",
      "instead_of": "having disconnect reject and wrapping the Disconnect button's onPress in a screen-level try/catch that would own the error presentation.",
      "affects": ["AC-013", "AC-025"] },

    { "id": "AS-003",
      "text": "A rejecting save travels through connect's existing catch branch, so a failed write raises the same Connection Failed bottom sheet a network failure already raises.",
      "because": "the ticket mandates the bottom sheet for the disconnect failure and is silent on whether a failed save reaches one at all.",
      "instead_of": "giving the save branch its own catch and its own presentation, distinct from the failure path a bad token already takes.",
      "affects": ["AC-005"] },

    { "id": "AS-004",
      "text": "\"with a message\" means errorMessage holds a string on both failure branches; the criteria pin its type, not its text.",
      "because": "the ticket deliberately leaves the exact wording of the error messages open while still requiring each failure branch to set a message.",
      "instead_of": "fixing an exact message string in the criteria, which would freeze copy the ticket explicitly refused to decide.",
      "affects": ["AC-003", "AC-008"] },

    { "id": "AS-005",
      "text": "On a rejecting clear the store keeps clientName, accounts and selectedAccountIds as they were — only status and errorMessage move — so the screen still shows the user as linked to that client.",
      "because": "the ticket says the tear-down side effects are skipped and the user is not presented as disconnected, but does not say what happens to the store's own connected-identity fields.",
      "instead_of": "clearing clientName and accounts while leaving status at error, which would present the user as half-disconnected while the token is still on disk.",
      "affects": ["AC-014"] },

    { "id": "AS-006",
      "text": "A rejecting loadSavedToken on ConnectMonobankScreen also sets no field-level validation error and does not move the store's status.",
      "because": "the ticket says the rejection is caught and the field left empty rather than blocking the form with an error, without naming which of the screen's other error channels must stay silent.",
      "instead_of": "marking the token field invalid or dropping the store to idle, either of which would make a transient read failure look like user input trouble.",
      "affects": [] },

    { "id": "AS-007",
      "text": "syncFromMonobank with no saved token returns without moving syncStatus and without constructing a Monobank service.",
      "because": "the ticket only says the get() call is awaited and the resolved token passed onward; it does not restate what the null branch does now that the read is asynchronous.",
      "instead_of": "treating a missing token as a sync failure that sets syncStatus to error and raises a sheet on every cold start before a connection exists.",
      "affects": ["AC-028"] },

    { "id": "AS-008",
      "text": "loadSavedToken resolving null leaves the store's status untouched rather than forcing it to idle.",
      "because": "the ticket pins what the Connect screen does on null (field left empty) but says nothing about whether the store should react to the absence of a saved token.",
      "instead_of": "resetting status to idle on a null result, which would race a connect already in flight and could erase a connecting state.",
      "affects": [] },

    { "id": "AS-009",
      "text": "No new MonobankConnectionStatus member is introduced: idle, connecting, connected and error carry every state named here, including the window in which a clear is pending.",
      "because": "the ticket requires an existing MonobankConnectionStatus value for the failure and names connected for the pending-clear window, but a disconnect that can now fail is the obvious place someone would add a disconnecting state.",
      "instead_of": "adding a disconnecting member, which would change every status comparison in ConnectMonobankScreen and HomeScreen.",
      "affects": ["AC-006", "AC-007"] },

    { "id": "AS-010",
      "text": "A connect whose save resolves but whose subsequent card upsert rejects stays a connection failure with status error, exactly as today; only the save branch is being pinned.",
      "because": "the ticket pins the save branch of connect and does not say whether the rest of the try block keeps its current failure behaviour once the save branch is given explicit semantics.",
      "instead_of": "treating a persisted token as a successful connection and letting a later upsert failure leave the store at connected with a partial card set.",
      "affects": [] }
  ],
  "verification_gaps": [
    { "id": "VG-001",
      "text": "Every criterion runs against a doubled token service; nothing in this cycle exercises the real Keychain-backed SecretStore, so a green suite would not establish that a save reached the device or that a clear removed anything from it.",
      "leaves": ["AC-001", "AC-006", "AC-015", "AC-016"] },

    { "id": "VG-002",
      "text": "A resolved clear is observed as a call that resolved, not as an absence of bytes on disk; the suite would not detect a residue of the kind OPES-63 found in the plaintext MMKV file.",
      "leaves": ["AC-015", "AC-016"] },

    { "id": "VG-003",
      "text": "The pending-window observations are made with manually settled promises under Jest; real device latency, and what the Connect screen renders to the user during that window, are not exercised.",
      "leaves": ["AC-001", "AC-006"] },

    { "id": "VG-004",
      "text": "Concurrency between these actions is not exercised: overlapping connect and disconnect calls, a second connect issued during a pending save, or a disconnect issued while a sync is in flight.",
      "leaves": [] },

    { "id": "VG-005",
      "text": "The text the user actually reads on either failure is not established — only that a string is present and that the bottom sheet was invoked.",
      "leaves": ["AC-003", "AC-005", "AC-008", "AC-012"] },

    { "id": "VG-006",
      "text": "What ConnectMonobankScreen renders once the status is error after a failed disconnect is not exercised, so nothing here establishes that the user can retry the disconnect or leave that state.",
      "leaves": ["AC-007"] },

    { "id": "VG-007",
      "text": "No criterion observes the token service from the outside during the pending window, so the suite establishes the order in which the store announces its status but not that the underlying write or delete had genuinely not yet happened.",
      "leaves": ["AC-001", "AC-006"] }
  ],
  "non_goals": [
    "Changing MonobankTokenService, its storage keys, or the OPES-63 plaintext migration",
    "Retrying a failed save or a failed clear",
    "Deciding the wording of any error message",
    "Adding a disconnecting status or any other new MonobankConnectionStatus value",
    "Changing loadAccounts, toggleAccount, or account-selection semantics",
    "Establishing encryption or on-disk residue of the stored secret"
  ] }
-->

# OPES-64 — Pin the async Monobank connect/disconnect semantics

OPES-58 made the token service promise-returning and mechanically awaited it everywhere, but left
open what the Monobank store does when a write or delete of the secret fails, and in what order the
store's status may move relative to that write. This spec pins both: the status observed *while* the
token-service promise is still unsettled is the load-bearing assertion, because a criterion about the
final state alone would pass whatever the ordering, and a failed `clear` must leave the user
presented as connected, with the tear-down side effects unexecuted and the failure raised through the
error bottom sheet.

The one path where a failure is deliberately invisible is saved-token restoration: a rejecting
`loadSavedToken` leaves the Connect screen's field empty and says nothing, and the Home startup
effect swallows it without a rejection escaping. Message wording is out of scope by the ticket's own
decision, so every message criterion asserts presence and type rather than text — and because the
whole suite runs against a doubled token service, none of it establishes that the secret itself
moved on the device, which is what VG-001 and VG-002 leave for manual verification.
