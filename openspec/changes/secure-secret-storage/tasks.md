## 1. Encrypted secret-store module

- [ ] 1.1 Add `react-native-keychain` to `package.json`; run `pod install` and a native rebuild (iOS + Android)
- [ ] 1.2 Create `src/services/secret-storage/` — Keychain key bootstrap (generate a random 32-byte key once, store it, read it on later launches) behind a memoized `ready()` that creates `createMMKV({ id: 'secrets', encryptionKey })`
- [ ] 1.3 Expose a `SecretStore` API: async `get` / `set` / `delete`; fail closed (regenerate key + start clean, never crash) when the Keychain entry is missing or unreadable
- [ ] 1.4 Jest branch: in-memory `SecretStore` + a mocked `react-native-keychain`, mirroring the existing MMKV-vs-Jest pattern
- [ ] 1.5 Add the module barrel `index.ts` and a `CLAUDE.md` documenting the encrypted-store + Keychain-key rule

## 2. Migrate the Monobank token onto the secret store

- [ ] 2.1 Rewrite `MonobankTokenService` to persist through `SecretStore`; `get` / `save` / `clear` become async
- [ ] 2.2 One-time migration inside `ready()`: copy `monobank_personal_token` / `monobank_client_name` from the default plaintext MMKV instance into `secrets`, then delete them from the default instance — idempotent, leaving theme/account-selection untouched
- [ ] 2.3 Update `src/services/monobank/CLAUDE.md` (token storage is now encrypted via `secret-storage`)

## 3. Propagate async token access

- [ ] 3.1 `useMonobankStore.loadSavedToken` → `async` returning `Promise<string | null>`; update the signature in `src/features/monobank/types.ts`
- [ ] 3.2 Update the `HomeScreen.tsx` startup effect to call the now-async `loadSavedToken` (fire-and-forget with a `.catch`; return value already unused)
- [ ] 3.3 Update the `ConnectMonobankScreen.tsx` effect to `await`/`.then` then `setValue` the restored token
- [ ] 3.4 Add `await` to the `monobankTokenService.get()` call in `useTransactionsStore.syncFromMonobank` (already async context)

## 4. Tests

- [ ] 4.1 `secret-storage` unit tests: key generated-once/read-back, encrypted round-trip, fail-closed when key missing
- [ ] 4.2 Migration tests: legacy plaintext token is migrated and the plaintext copy deleted; fresh install is a no-op; re-running is idempotent
- [ ] 4.3 `MonobankTokenService` async save/get/clear round-trip (in-memory store + mocked Keychain)
- [ ] 4.4 Store test: `loadSavedToken` restores connected status after a simulated restart

## 5. Claude API key — keep it out of the shipped binary

> Implementation of the chosen provisioning channel (Firebase proxy **or** BYO-key UI) is a **sequenced follow-up change**, gated on wiring the agent in-app. This group only ensures the shipped binary carries no usable key today and records the decision.

- [ ] 5.1 Confirm no in-app (non-dev) code path imports `CLAUDE_API_KEY`; the agent stays dev-only/Node (`process.env`). Add a guard/comment so the inlined value cannot be pulled into the RN bundle accidentally
- [ ] 5.2 Ensure release builds do not inline `CLAUDE_API_KEY` (document in `.env.example` / build notes; the dev `agent:dev` env path is unaffected)
- [ ] 5.3 Record the chosen path (BYO-key interim vs Firebase proxy + App Check target) and open a follow-up change for the in-app agent + provisioning implementation

## 6. Definition of Done

- [ ] 6.1 `npx tsc --noEmit` (strict) passes
- [ ] 6.2 `npm run lint` passes
- [ ] 6.3 `npm test` passes
- [ ] 6.4 No unused imports/exports; all touched barrels and layer `CLAUDE.md` files updated
