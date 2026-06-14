## Context

The app holds two secrets, both currently exposed:

1. **Monobank personal token** — persisted by `MonobankTokenService` in a **plaintext MMKV** instance (`createMMKV()` with no `encryptionKey`). The token grants read access to the user's full transaction history and balances. At-rest exposure on rooted/jailbroken devices, unencrypted backups, or forensic extraction.
2. **Claude API key** — inlined into the binary at build time via `react-native-config`. Only the dev-only `agent:dev` harness uses it today, so it is not yet a runtime risk — but it will be the moment the Subscription Detective agent is wired in-app.

There is no OS-secure storage (Keychain/Keystore) in the project. Three services share the **same default MMKV instance** via `createMMKV()` with no id: `themeStorage`, `MonobankAccountSelectionService`, and `MonobankTokenService`. Only the last stores a secret.

```
Default MMKV instance (plaintext, shared, no id)
├── theme preference            ← not a secret, stays
├── monobank account selection  ← not a secret, stays
└── monobank_personal_token     ← SECRET, must move out
    monobank_client_name
```

## Goals / Non-Goals

**Goals:**

- Encrypt the Monobank token at rest using an MMKV `encryptionKey` whose key material lives in the OS Keychain/Keystore.
- Migrate existing users off plaintext with no data loss and no lingering plaintext copy.
- Preserve the Jest-vs-device storage split so suites keep running without native modules.
- Define (not build) a provisioning path so the Claude API key is never shipped in the binary.

**Non-Goals:**

- Encrypting non-secret MMKV data (theme, account selection).
- Encrypting the WatermelonDB database or full-disk encryption.
- Building the Claude proxy backend in this change (sequenced follow-up).
- Wiring the agent into the app.

## Decisions

### Decision 1 — Encrypted MMKV instance, key held in Keychain

Store secrets in a **dedicated MMKV instance** (id: `secrets`) created with `createMMKV({ id: 'secrets', encryptionKey })`. The `encryptionKey` is a random 32-byte value generated once and persisted in the OS Keychain/Keystore.

```
                       ┌──────────────────────────┐
  app startup ───▶ read│ Keychain / Keystore       │  (hardware-backed)
                       │  └ "opes.mmkv.secretsKey" │
                       └────────────┬─────────────┘
                                    │ encryptionKey (32 bytes)
                                    ▼
                   createMMKV({ id: 'secrets', encryptionKey })
                                    │
                                    ▼
                   ┌──────────────────────────────┐
                   │ secrets.mmkv  (encrypted file)│  monobank token lives here
                   └──────────────────────────────┘
```

**Why this over the alternatives:**

| Option | At-rest security | New dep | Notes |
|---|---|---|---|
| **Encrypted MMKV + key in Keychain** (chosen) | High — file encrypted, key hardware-backed | `react-native-keychain` (small) | Reuses MMKV we already ship; key never in bundle |
| Keychain stores the token directly | Highest | `react-native-keychain` | Per-secret async reads; abandons MMKV for secrets; more API churn |
| MMKV `encryptionKey` only, no Keychain | Low — "encryption theater" | none | Key must be hardcoded/derived → extractable from binary; defeats the purpose |
| `react-native-encrypted-storage` | High | new dep | Wraps Keychain anyway; less maintained than `react-native-keychain` |

The "MMKV key only, no Keychain" option was explicitly rejected: a key baked into the JS bundle is extractable, so the data is effectively still plaintext to an attacker. Hardware-backed key storage is the whole point.

### Decision 2 — New dependency: `react-native-keychain`

Per project rule (no new dep without justification): there is **no built-in RN API** for the iOS Keychain / Android Keystore. `react-native-keychain` is the de-facto standard, is actively maintained, and is used here for a single narrow purpose — storing/retrieving the 32-byte MMKV encryption key. We do **not** use it to store the token itself, keeping its surface area minimal. Requires `pod install` + a native rebuild.

### Decision 3 — Async key load, sync access after ready (memoized init)

Keychain reads are asynchronous, so the encrypted MMKV instance cannot be created synchronously at module scope. The secret store exposes **async accessors** backed by a **memoized `ready()`** that loads the key and creates the instance once:

```
get()/save()/clear()  ──await──▶ ready()  ──(first call)──▶ Keychain read → createMMKV
                                    │                         (cached thereafter)
                                    └──(subsequent)──▶ resolved instance (sync MMKV ops)
```

This makes `MonobankTokenService` async. The ripple is small and contained:

| Call site | Now | After |
|---|---|---|
| `MonobankTokenService.get()` | `MonobankCredentials \| null` | `Promise<…>` |
| `MonobankTokenService.save()/clear()` | `void` | `Promise<void>` |
| `useMonobankStore.loadSavedToken()` | sync `string \| null` | `async`, returns `Promise<string \| null>` |
| `HomeScreen.tsx:53` effect | calls `loadSavedToken()` | call inside effect, ignore/`.catch` (return value already unused) |
| `ConnectMonobankScreen.tsx:50` effect | `const t = loadSavedToken(); setValue(t)` | `loadSavedToken().then(t => t && setValue(...))` |
| `useTransactionsStore.syncFromMonobank` | `await`s already; `get()` inside | add `await` to the `get()` call — already async context |

**Alternative considered — explicit `await secretStore.init()` at app bootstrap, then keep sync accessors.** Smaller signature churn, but introduces a startup ordering gate and an access-before-init foot-gun. Rejected in favor of self-contained memoized accessors given how few call sites exist.

### Decision 4 — Migration: copy token keys to `secrets`, delete from default instance

The encrypted instance MUST use a **different id** (`secrets`) — you cannot reopen the same MMKV file once without and once with a key. Migration, run inside `ready()` on first launch, is key-scoped (not a wipe), so theme/account-selection in the default instance are untouched:

```
default MMKV (plaintext)                 secrets MMKV (encrypted)
  monobank_personal_token  ──copy──▶       monobank_personal_token
  monobank_client_name     ──copy──▶       monobank_client_name
  monobank_personal_token  ──delete
  monobank_client_name     ──delete
  theme / account-selection  (left as-is)
```

Idempotent: if `secrets` already has the token, or the default instance has none, migration is a no-op.

### Decision 5 — Module placement

New module `src/services/secret-storage/` with its own barrel and `CLAUDE.md`, exposing a small `SecretStore` (encrypted KV) plus the Keychain key bootstrap. `MonobankTokenService` consumes it. This generalizes the existing per-service MMKV pattern into one secret-aware place that the Claude BYO-key path can also reuse. Update `src/services/monobank/CLAUDE.md` (token storage is now encrypted).

### Decision 6 — Claude API key provisioning: proxy (target) vs BYO-key (interim)

This is a **key-distribution** problem, not at-rest storage — encrypting on-device does not help, because a build-time key is extractable from the binary regardless. Two viable channels:

**(A) Server-side proxy — recommended productization target**

```
App ──(agent request, NO key)──▶ Proxy (e.g. Firebase Cloud Function) ──(+ Claude key)──▶ Anthropic
            ▲ App Check / anon-auth + per-device quota
```

- **Pros:** key lives server-side only, never on device; rotate without an app release; central abuse controls, rate limits, model routing.
- **Cons / required work:** introduces a backend — **relaxes the project's "local-only, no backend" constraint for this one path**; hosting + cost; **must** be authenticated (Firebase App Check / anonymous auth + per-device quotas), otherwise an open proxy just relocates the quota-abuse target; adds a network dependency to the agent feature.

**(B) BYO-key — no-backend interim**

```
User pastes their own Anthropic key ──▶ secret-storage (encrypted) ──▶ app calls Anthropic directly
```

- **Pros:** zero backend, stays local-only, **reuses this change's `secret-storage` verbatim**; the user spends their own Anthropic quota, so there is no shared key to abuse.
- **Cons:** high friction (most users have no Anthropic key) — not consumer-grade; the key sits on the user's device (now encrypted, and it is their own key → small blast radius).

**Recommendation:** ship **BYO-key** as the MVP-pragmatic interim (it falls out of `secret-storage` for free and keeps the no-backend posture), and adopt the **Firebase proxy + App Check** when the agent is productized for non-technical users. Either way, the build-time `CLAUDE_API_KEY` inlining is **not** used by the shipped in-app agent; the `agent:dev` harness keeps using the env key. The actual implementation is a **sequenced follow-up change**, not part of OPES-41.

## Risks / Trade-offs

- **Keychain unavailable / read fails (e.g. corrupted entry, restored backup without Keychain item)** → secret store cannot derive the key and the encrypted data is unreadable. → Mitigation: treat as "no saved token" (fail closed): regenerate a key, start clean, prompt the user to reconnect Monobank. Never crash startup.
- **Migration interrupted mid-flight** (copy done, delete not) → token exists in both stores briefly. → Mitigation: idempotent, copy-before-delete ordering; a leftover plaintext copy is cleaned on the next launch.
- **Async ripple touches startup-time effects** → a regression could leave the Home/Connect screens not restoring connection. → Mitigation: covered by `secret-storage` scenarios (restore after restart) and store unit tests.
- **New native dependency** → `pod install` + rebuild required; CI/dev onboarding must rebuild. → Mitigation: documented in the monobank + secret-storage `CLAUDE.md`.
- **Proxy without auth** (if path A is chosen later) → anyone can drain the Anthropic quota. → Mitigation: App Check / anonymous-auth + per-device quotas are mandatory, not optional — captured as a follow-up requirement.

## Migration Plan

1. Ship the encrypted `secret-storage` module + `react-native-keychain`; native rebuild.
2. On first launch, `ready()` performs the one-time plaintext → encrypted migration (Decision 4). No WatermelonDB schema bump.
3. **Rollback:** since the plaintext copy is deleted after migration, a downgrade to a pre-encryption build would not see the token (user re-enters it). Acceptable for an MVP; note in release notes. No DB-level rollback concern (no schema change).

## Open Questions

- **Claude path A vs B for first in-app release** — proxy (needs infra + App Check) or BYO-key (ships now)? Resolve when the agent is scheduled for in-app wiring; both satisfy the `claude-api-key-provisioning` spec.
- **Keychain accessibility level** — `AFTER_FIRST_UNLOCK` (allows background sync to read the token after the first unlock post-boot) vs `WHEN_UNLOCKED` (stricter). Lean `AFTER_FIRST_UNLOCK` so background Monobank sync keeps working; confirm against any background-sync plans.
- **Android Keystore key wrapping** specifics (StrongBox availability varies by device) — verify `react-native-keychain` fallbacks on the min-SDK target.
