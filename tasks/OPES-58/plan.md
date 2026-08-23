<!-- aif:meta
{ "schema": 1,
  "ticket": "OPES-58",
  "spec_sha256": "ac4f9383c4f362d996e6e02f3d87d39262a8bce47451ea019715a3200b65ef97",
  "risk": "high",
  "files": {
    "create": [],
    "change": [
      "src/services/monobank/MonobankTokenService.ts",
      "src/features/monobank/types.ts",
      "src/features/monobank/state/useMonobankStore.ts",
      "src/features/transactions/state/useTransactionsStore.ts",
      "src/services/sandbox/resetSandboxEnvironment.ts",
      "src/features/monobank/ConnectMonobankScreen.tsx",
      "src/features/home/HomeScreen.tsx",
      "src/features/settings/state/useSettingsStore.ts",
      "src/services/monobank/CLAUDE.md",
      "src/services/database/CLAUDE.md"
    ],
    "tests": [
      "src/services/monobank/MonobankTokenService.test.ts",
      "src/services/sandbox/resetSandboxEnvironment.test.ts",
      "src/features/monobank/state/useMonobankStore.test.ts",
      "src/features/transactions/state/useTransactionsStore.test.ts"
    ] },
  "decisions": [
    { "id": "D-001",
      "statement": "Declare `export interface SecretStorePort` in MonobankTokenService.ts: get(key): Promise<string | null>, set(key, value): Promise<void>, delete(key): Promise<void>.",
      "because": "that is SecretStore's public API structurally, so the real store assigns to the seam without a cast" },

    { "id": "D-002",
      "statement": "Delete KeyValueStorage, InMemoryKeyValueStorage and the whole createDefaultStorage MMKV branch from MonobankTokenService.ts; leave no reference to react-native-mmkv in the file.",
      "because": "AS-005 — there must be no code path left that could read the plaintext copy" },

    { "id": "D-003",
      "statement": "Reach the secret-storage barrel only through a lazy require inside the non-Jest branch of createDefaultSecretStore, never a top-level import.",
      "because": "src/services/secret-storage/index.ts evaluates `new SecretStore()` at module load and that constructor throws under Jest ('react-native-keychain is unavailable under Jest'), which would break every suite that imports monobankTokenService",
      "rejected": "Do not make the barrel's singleton lazy — the secret-storage module is a declared non-goal." },

    { "id": "D-004",
      "statement": "Write createDefaultSecretStore as: `if (typeof jest !== 'undefined') return new InMemorySecretStore();` then the lazy require of the device singleton.",
      "because": "the existing suites drive monobankTokenService with no injected double and must keep working" },

    { "id": "D-005",
      "statement": "Type the device branch as `const { secretStore } = require('../secret-storage') as { secretStore: SecretStore };` with `import type { SecretStore } from '../secret-storage';`.",
      "because": "import type is erased, so nothing is evaluated under Jest while tsc still reconciles SecretStore against SecretStorePort",
      "rejected": "Do not construct a second `new SecretStore()` — the barrel singleton is the app-wide instance." },

    { "id": "D-006",
      "statement": "Add a module-private `class InMemorySecretStore implements SecretStorePort` backed by a Map: get resolves `this.data.get(key) ?? null`, set and delete resolve void.",
      "because": "it replaces today's InMemoryKeyValueStorage one-for-one, only async" },

    { "id": "D-007",
      "statement": "Keep the constructor seam `private readonly storage: SecretStorePort = createDefaultSecretStore()` and the `monobankTokenService` singleton export at its current path.",
      "because": "AS-001 and AS-008 — the seam and the singleton name are what every call site and test double depend on" },

    { "id": "D-008",
      "statement": "Make save async: `await this.storage.set(TOKEN_KEY, token);` then `await this.storage.set(CLIENT_NAME_KEY, clientName);`, in that order.",
      "rejected": "Do not Promise.all them and do not roll back a partial write — AS-007 leaves that unspecified." },

    { "id": "D-009",
      "statement": "Make get async: read TOKEN_KEY first and `return null` when it is null or empty, without reading CLIENT_NAME_KEY at all.",
      "because": "AS-003 — presence is decided by the token key alone" },

    { "id": "D-010",
      "statement": "When the token is present resolve `{ token, clientName: (await this.storage.get(CLIENT_NAME_KEY)) ?? '' }`.",
      "because": "AS-004 — an absent client name stays the empty string, as today" },

    { "id": "D-011",
      "statement": "Make clear async: `await this.storage.delete(TOKEN_KEY);` then `await this.storage.delete(CLIENT_NAME_KEY);`." },

    { "id": "D-012",
      "statement": "Give the three methods explicit return types Promise<void>, Promise<MonobankCredentials | null>, Promise<void>, and keep the TOKEN_KEY / CLIENT_NAME_KEY literals byte for byte.",
      "because": "AS-002 — the two key strings are the storage contract" },

    { "id": "D-013",
      "statement": "Put no try/catch anywhere in MonobankTokenService, so a SecretStore rejection reaches the caller as the same value.",
      "because": "AS-006, pinned by AC-010 and AC-011" },

    { "id": "D-014",
      "statement": "In src/features/monobank/types.ts change disconnect to `disconnect(): Promise<void>`." },

    { "id": "D-015",
      "statement": "In src/features/monobank/types.ts change loadSavedToken to `loadSavedToken(): Promise<string | null>`." },

    { "id": "D-016",
      "statement": "Leave the connect, loadAccounts and toggleAccount signatures in that interface untouched.",
      "because": "none of the three reaches monobankTokenService, so widening them would be scope the spec did not ask for" },

    { "id": "D-017",
      "statement": "In useMonobankStore make disconnect and loadSavedToken `async` and await monobankTokenService.clear() / .get(), keeping every other statement in its current order.",
      "rejected": "Do not move the set() calls, clearMonobankService() or reset() — connect/disconnect ordering is OPES-64." },

    { "id": "D-018",
      "statement": "In useMonobankStore.connect insert `await` before monobankTokenService.save(trimmed, clientInfo.name) at its current line inside the try.",
      "rejected": "Do not touch the fire-and-forget `syncFromMonobank(userId).catch(() => {})` line below it." },

    { "id": "D-019",
      "statement": "In useTransactionsStore.syncFromMonobank change the credentials read to `const saved = await monobankTokenService.get();` and change nothing else in that action." },

    { "id": "D-020",
      "statement": "In resetSandboxEnvironment await monobankTokenService.clear() in place, keeping the wipeAllData -> token -> account-selection order." },

    { "id": "D-021",
      "statement": "In HomeScreen's loadSavedToken effect call `loadSavedToken().catch(() => {});` and keep the dependency array as it is.",
      "because": "it is a fire-and-forget effect, and that .catch shape is already this file's idiom two effects below",
      "rejected": "Do not use the void operator — CLAUDE.md bans it." },

    { "id": "D-022",
      "statement": "In ConnectMonobankScreen's first useEffect await loadSavedToken() inside a local async arrow and invoke it as `restore().catch(() => {});`; keep the dependency array as it is.",
      "because": "the effect needs the resolved token to call setValue, so a bare fire-and-forget will not do" },

    { "id": "D-023",
      "statement": "Leave `onPress={disconnect}` in ConnectMonobankScreen exactly as it is.",
      "because": "Button's prop is `onPress: () => void` and TypeScript accepts a `() => Promise<void>` there",
      "rejected": "Do not wrap it in an arrow or add a handler." },

    { "id": "D-024",
      "statement": "In useSettingsStore.resetSandbox await useMonobankStore.getState().disconnect() inside the existing try block.",
      "because": "a throw from the synchronous disconnect already surfaced as the Reset Failed sheet, and awaiting is what preserves that" },

    { "id": "D-025",
      "statement": "Rewrite the Token storage section of src/services/monobank/CLAUDE.md around secret-storage: the three methods are async, with an in-memory port under Jest.",
      "because": "AC-015 reads that section for the literal text secret-storage" },

    { "id": "D-026",
      "statement": "Repoint the Jest-vs-device exemplar in src/services/database/CLAUDE.md from MonobankTokenService.ts to MonobankAccountSelectionService.ts.",
      "because": "the token service no longer carries an MMKV branch for anyone to copy" },

    { "id": "D-027",
      "statement": "Do not edit src/services/monobank/index.ts.",
      "because": "MonobankTokenService, monobankTokenService and MonobankCredentials keep their names and their module path" },

    { "id": "D-028",
      "statement": "Update the three existing suites that drive monobankTokenService to await clear/save/get, making their currently synchronous beforeEach hooks async.",
      "because": "resetSandboxEnvironment.test.ts asserts `expect(monobankTokenService.get()).toBeNull()`, which a Promise fails" } ],
  "ac_coverage": {
    "AC-001": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-002": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-003": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-004": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-005": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-006": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-007": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-008": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-009": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-010": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-011": ["src/services/monobank/MonobankTokenService.ts"],
    "AC-012": ["src/features/monobank/types.ts", "src/features/monobank/state/useMonobankStore.ts"],
    "AC-013": ["src/features/monobank/types.ts", "src/features/monobank/state/useMonobankStore.ts"],
    "AC-014": ["src/services/monobank/MonobankTokenService.ts", "src/features/monobank/types.ts", "src/features/monobank/state/useMonobankStore.ts", "src/features/transactions/state/useTransactionsStore.ts", "src/services/sandbox/resetSandboxEnvironment.ts", "src/features/monobank/ConnectMonobankScreen.tsx", "src/features/home/HomeScreen.tsx", "src/features/settings/state/useSettingsStore.ts"],
    "AC-015": ["src/services/monobank/CLAUDE.md", "src/services/database/CLAUDE.md"] },
  "uncovered": [],
  "surface_map": {
    "MonobankTokenService.save": ["src/services/monobank/MonobankTokenService.ts"],
    "MonobankTokenService.get": ["src/services/monobank/MonobankTokenService.ts"],
    "MonobankTokenService.clear": ["src/services/monobank/MonobankTokenService.ts"],
    "src/features/monobank/types.ts": ["src/features/monobank/types.ts", "src/features/monobank/state/useMonobankStore.ts"],
    "src/services/monobank/CLAUDE.md": ["src/services/monobank/CLAUDE.md", "src/services/database/CLAUDE.md"],
    "npx tsc --noEmit": ["src/services/monobank/MonobankTokenService.ts", "src/features/monobank/types.ts", "src/features/monobank/state/useMonobankStore.ts", "src/features/transactions/state/useTransactionsStore.ts", "src/services/sandbox/resetSandboxEnvironment.ts", "src/features/monobank/ConnectMonobankScreen.tsx", "src/features/home/HomeScreen.tsx", "src/features/settings/state/useSettingsStore.ts"] },
  "external": [
    { "name": "react-native-keychain — getGenericPassword/setGenericPassword, reached on device only through secret-storage's lazy require; the Jest branch throws by design and is never taken" },
    { "name": "react-native-mmkv — createMMKV/deleteMMKV; MonobankTokenService stops touching it entirely and reaches it on device only through secret-storage's encrypted backend",
      "ac": "AC-007" },
    { "name": "zustand — create() and getState() on useMonobankStore, useTransactionsStore and useSettingsStore, whose action signatures change shape",
      "ac": "AC-014" },
    { "name": "react — React.useEffect in HomeScreen and ConnectMonobankScreen, now calling promise-returning store actions",
      "ac": "AC-014" },
    { "name": "react-hook-form — setValue in ConnectMonobankScreen's restore effect, now called after an await",
      "ac": "AC-014" },
    { "name": "jest — the `typeof jest !== 'undefined'` runtime guard in createDefaultSecretStore that selects the in-memory port" } ] }
-->

# OPES-58 — plan

`MonobankTokenService` keeps its class, its singleton, its module path and its two key
strings, and swaps its storage seam. The synchronous `KeyValueStorage` interface and the
`react-native-mmkv` branch are deleted; in their place a `SecretStorePort` — `get`,
`set`, `delete`, all promise-returning — is the constructor dependency, and the three
public methods become `async`. Everything else in this ticket is the `await` that
follows.

**The one non-obvious constraint: never import the secret-storage barrel at the top of
the file.** `src/services/secret-storage/index.ts` runs `export const secretStore = new
SecretStore();` at module load, and under Jest that construction throws out of
`createDefaultKeychainKeyStore()` on purpose. `MonobankTokenService` is imported by both
Monobank stores, by `resetSandboxEnvironment` and by the monobank barrel, so a top-level
import would take a large part of the suite down at import time. The device singleton is
therefore reached by a lazy `require` inside the non-Jest branch, with `import type` for
the compile-time check — the same shape `keychainKeyStore.ts` already uses for the native
module. Under Jest the default is a private in-memory port, exactly as today.

**No error handling is added.** There is no `try`/`catch` anywhere in the service, so a
rejection from the store arrives at the caller unchanged. `save` does its two `set`s in
sequence and `clear` its two `delete`s in sequence; neither is partial-write safe and
neither pretends to be. `get` reads the token key first and resolves `null` before it
touches the client-name key, so an orphaned client name is invisible and the plaintext
copy is unreachable by construction — there is no fallback branch left to take.

**The call-site edits are mechanical and must stay that way.** `connect` gains an `await`
in front of `save` at its current line; `disconnect` and `loadSavedToken` become `async`
with their statements in exactly the present order; `syncFromMonobank` awaits `get`;
`resetSandboxEnvironment` awaits `clear`. Whether the connected status flips before or
after the store write, and how a rejected save or clear is presented, is OPES-64's
subject and is not decided here. The plaintext token already on disk is left where it is
— that is OPES-63 — so between the two tickets a previously connected user reads `null`.

Two components consume the now-async `loadSavedToken`: `HomeScreen` discards the result
(`.catch(() => {})`, the idiom already in that file), `ConnectMonobankScreen` needs the
value and so awaits inside a local async arrow within its effect. `Button`'s
`onPress: () => void` accepts the async `disconnect` unchanged. `useSettingsStore`
awaits `disconnect` inside its existing `try`, which keeps a failure landing on the same
Reset Failed sheet it does today.

**Documentation.** `src/services/monobank/CLAUDE.md`'s *Token storage* section is
rewritten around `secret-storage`; `src/services/database/CLAUDE.md` currently points at
`MonobankTokenService.ts` as the MMKV-vs-Jest exemplar and is repointed at
`MonobankAccountSelectionService.ts`, which still is one.

**What the suite cannot establish.** Nothing here runs on a device: the encrypted store
is an in-memory `Map` under Jest and the Keychain is never reached, so a green run says
nothing about encryption at rest (VG-001). `clear`'s rejection path is unexercised
(VG-004), and AC-014 proves only that the awaited call sites compile — the runtime
behaviour of the two screens and of `syncFromMonobank` rests on whatever the existing
suites already assert (VG-005).
