Ticket: OPES-41

## Why

The app stores the Monobank **personal token** — which grants read access to the user's entire transaction history and account balances — in **plaintext MMKV** (`MonobankTokenService`). Anyone with filesystem access (rooted/jailbroken device, an unencrypted device backup, forensic extraction) can read it. For a finance app this is a real at-rest exposure.

Separately, the **Claude API key** is inlined into the app binary at build time (`react-native-config`). The Subscription Detective agent is dev-only today, so the key is not yet used at runtime — but the moment that agent is wired in-app, the key becomes trivially extractable from the IPA/APK and open to Anthropic-quota abuse. The problem is latent now and must be solved *before* the agent ships in-app.

## What Changes

- Introduce an **encrypted secret store**: a dedicated MMKV instance created with an `encryptionKey`, where the key itself is generated once and held in the device **Keychain/Keystore** (new `react-native-keychain` dependency, used only to hold the 32-byte MMKV key).
- Rewire `MonobankTokenService` to read/write through the encrypted store. Add a **one-time migration** that moves any existing plaintext token into the encrypted store and deletes the plaintext copy.
- `MonobankTokenService.get()` and `useMonobankStore.loadSavedToken()` become **async** (Keychain access is async). Update the 3 affected call sites.
- Keep the existing **Jest-vs-device split** — in-memory store + a mocked Keychain under Jest.
- **Specify** (not implement here) how the Claude API key is provisioned to the in-app agent without shipping it in the binary: a lightweight **proxy backend** (e.g. a Firebase Cloud Function) holds the key server-side; the app calls the proxy. This deliberately relaxes the project's *local-only, no-backend* constraint for this one path. A **BYO-key** alternative (user supplies their own Anthropic key, stored via the same secret store) is captured in `design.md`. Implementation of the chosen path is sequenced as a follow-up change.

## Capabilities

### New Capabilities

- `secret-storage`: encrypted at-rest storage for runtime secrets — an MMKV instance encrypted with a Keychain-held key, one-time migration from plaintext, and a Jest fallback. The Monobank token is its first consumer.
- `claude-api-key-provisioning`: the Claude API key SHALL NOT be shipped inside the app binary; defines how the in-app agent obtains it (proxy backend as primary, BYO-key as alternative).

### Modified Capabilities

- _None — the existing dev-only `subscription-detective` harness is unchanged, and the Monobank token currently has no spec of its own._

## Impact

- **services/**: rewrite `MonobankTokenService` to use the encrypted store; new secret-store module (e.g. `src/services/secret-storage/`) wrapping MMKV + Keychain. `serviceInstance.ts` / rate limiter unaffected.
- **features/**: `useMonobankStore.loadSavedToken` → `async`; effects at [HomeScreen.tsx:53](src/features/home/HomeScreen.tsx) and [ConnectMonobankScreen.tsx:50](src/features/monobank/ConnectMonobankScreen.tsx) updated to await/`.then`; `useTransactionsStore.syncFromMonobank` already async (no signature change).
- **Dependencies**: **+ `react-native-keychain`** (native — requires `pod install` + native rebuild). The Claude-key path introduces a backend service (e.g. Firebase) that lives outside this RN repo and is sequenced separately.
- **Data / migration**: no WatermelonDB schema-version bump. A one-time **data** migration moves the persisted token from plaintext MMKV → encrypted MMKV (not a DB migration).
- **Native build**: iOS Keychain access / Android Keystore — a native rebuild is required; env values are still build-time only.
- **Layer docs**: update [src/services/monobank/CLAUDE.md](src/services/monobank/CLAUDE.md) (token storage is now encrypted) and add a `CLAUDE.md` for the new secret-storage module.

## Non-goals

- Encrypting non-secret MMKV data — theme preference ([themeStorage.ts](src/shared/theme/themeStorage.ts)) and Monobank account-selection ([MonobankAccountSelectionService.ts](src/services/monobank/MonobankAccountSelectionService.ts)) stay plaintext.
- Implementing the Claude proxy backend itself — it is specified here and built as a sequenced follow-up change.
- Wiring the Subscription Detective agent into the app — still deferred; this change only guarantees the key-provisioning path is defined before that happens.
- Adding auth or user accounts, and encrypting the WatermelonDB database / full-disk encryption.
