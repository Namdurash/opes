<!-- aif:meta
{ "schema": 1, "ticket": "OPES-58", "lang": "en", "risk": "high" }
-->

# OPES-58 — Move the Monobank token onto the encrypted secret store

## Why

This is the consumer half of OPES-42. OPES-42 built the encrypted `secret-storage` module
(an encrypted MMKV instance keyed from the device Keychain, with an async `get`/`set`/`delete`
error contract and a fail-closed key bootstrap). On its own that module holds nothing — the
Monobank **personal token** is still written to **plaintext MMKV** via `MonobankTokenService`.

This ticket rewires `MonobankTokenService` to persist through `SecretStore`, which is the point
at which new writes stop landing in plaintext.

It depends on OPES-42: the `SecretStore` API it consumes (async `get`/`set`/`delete`, `null`
only for a genuinely-absent storage key, rejects on transient/write failure) is defined and
delivered there.

## Scope note — this ticket was split

The original OPES-58 covered the rewire, the one-time plaintext migration, and the async
propagation semantics in one change. That is three units of work, so it was split:

- **OPES-58 (this ticket)** — rewire `MonobankTokenService` onto the secret store; make its
  three methods async; update every call site so the project type-checks and its existing
  behaviour is preserved.
- **OPES-63** — the one-time migration that moves any existing plaintext copy across and
  deletes the original.
- **OPES-64** — the security-visible async semantics at the call sites: connect/disconnect
  ordering, failure presentation, `loadSavedToken` on the two screens and in sync.

Do not implement OPES-63's migration or OPES-64's ordering guarantees here.

## What should be true after

**The Monobank token rides on the secret store.** `MonobankTokenService` persists through
`SecretStore` instead of the default plaintext MMKV instance. Its `get` / `save` / `clear`
become async:

- `save(token, clientName)` writes both the token and the client name into the encrypted store,
  under the storage keys `monobank_personal_token` and `monobank_client_name`.
- `get()` resolves both values; it resolves `null` when no token is stored.
- `clear()` removes both.
- When the underlying `SecretStore` rejects, the service does not swallow it — the rejection
  reaches the caller.

**Every call site compiles and keeps behaving as it does today.** Because the three methods are
now async, `useMonobankStore.loadSavedToken` / `connect` / `disconnect`,
`useTransactionsStore.syncFromMonobank`, `HomeScreen.tsx` and `ConnectMonobankScreen.tsx` are
updated to await them, and the `loadSavedToken` / `disconnect` signatures in
`src/features/monobank/types.ts` are updated to their promise-returning forms. `npx tsc --noEmit`
passes and the existing suite stays green.

This ticket asks for the mechanical propagation only. **What the store should do when a save or
a clear fails, and in what order the status may change, is OPES-64's subject** — nothing here
should be read as deciding it.

**The docs say where the token now lives.** `src/services/monobank/CLAUDE.md` is updated to state
that the token is stored encrypted via `secret-storage`.

**The Jest-vs-device split is preserved.** Under Jest the secret store is in-memory and
`react-native-keychain` is mocked (as delivered by OPES-42); these criteria are exercised through
that Jest backing.

## Surfaces the change is seen through

- `MonobankTokenService` — `get` / `save` / `clear`, now async and backed by `SecretStore`.
- `src/features/monobank/types.ts` — `loadSavedToken` and `disconnect` signatures.
- Call sites updated for the await only: `useMonobankStore.loadSavedToken` / `connect` /
  `disconnect`, `useTransactionsStore.syncFromMonobank`, `HomeScreen.tsx`,
  `ConnectMonobankScreen.tsx`.
- Docs: `src/services/monobank/CLAUDE.md`.

## Edge cases that matter

- **No token stored** — `get()` resolves `null` rather than an object with empty fields.
- **The secret store rejects on write** — `save()` rejects; the rejection is not swallowed by the
  service.
- **Existing plaintext token on disk** — out of scope here. Until OPES-63 lands, a user who
  already connected will read `null` from the encrypted store and appear disconnected, with the
  plaintext copy still on disk. That is expected between these two tickets and must not be
  papered over with a plaintext fallback read.

## Risk

High. It changes where a secret is written, and it makes a security-visible connect/disconnect
flow async without yet pinning the ordering (that is OPES-64). A green suite after this ticket
does not establish that the flow is safe under failure — only that it type-checks and that the
service reads and writes through the encrypted store.

## Deliberately left open

- Whether `MonobankTokenService` stays a class, a singleton, or becomes a factory — provided the
  observable `get` / `save` / `clear` contract above holds.

## Rework requested at approve

- Ручна перевірка на iOS-симуляторі показала, що після цього тікету Monobank не підключається взагалі — тобто OPES-58 у поточному вигляді перетворює робочу функцію на зламану.

ДОКАЗИ. У системному лозі рівно один SecItemCopyMatching_ios (читання Keychain) і нуль SecItemAdd (запису ключа не було). За весь сеанс створено лише 'Creating MMKV instance "mmkv.default" ... Encrypted: false' — шифрований інстанс opes.secret-storage не відкривався жодного разу. У UI показано загальний fallback 'Failed to connect. Please check your token and try again.', а не MonobankError 'Invalid or missing Monobank token.' — отже getClientInfo() відпрацював, а виняток кинув наступний рядок, monobankTokenService.save().

ПРИЧИНА. src/services/secret-storage/cryptoKey.ts бере випадкові байти з globalThis.crypto.getRandomValues і кидає 'No cryptographically secure random source is available.', якщо джерела немає. У React Native 0.84 / Hermes такого глобала не існує (жодної згадки getRandomValues у node_modules/react-native), а поліфілу в проєкті немає — ні в package.json, ні в index.js. Тобто bootstrap ключа fail-closed падає на будь-якому пристрої при першій спробі зберегти секрет. Дефект належить модулю OPES-42, але саме OPES-58 виводить його на критичний шлях: до цього тікету токен ішов у plaintext MMKV і працював.

ЩО МАЄ ЗМІНИТИСЯ В ЦЬОМУ ТІКЕТІ.

1. Non-goal 'Changing the SecretStore module itself, its key bootstrap, or key rotation' ЧАСТКОВО ЗНІМАЄТЬСЯ: key bootstrap тепер у скоупі. Key rotation і решта модуля лишаються поза скоупом.

2. Додати залежність react-native-get-random-values (узгоджено з мейнтейнером; під капотом SecRandomCopyBytes на iOS і SecureRandom на Android) та імпортувати її ПЕРШИМ рядком index.js, до імпорту App.

3. У cryptoKey.ts читати джерело випадковості ЛІНИВО, у момент виклику, а не захоплювати globalThis.crypto на завантаженні модуля (зараз рядок 45). Поточне захоплення робить коректність залежною від порядку імпортів, що є крихким навіть із поліфілом.

4. Оновити src/services/secret-storage/CLAUDE.md — записати, звідки береться ключ і чому імпорт поліфілу мусить бути першим.

5. Після цього тікету підключення Monobank має реально працювати на симуляторі: save() доходить до SecItemAdd і створює шифрований інстанс opes.secret-storage.

ПОПЕРЕДЖЕННЯ ДЛЯ СТАНЦІЇ SPEC. Під Jest Node сам надає globalThis.crypto, тому тест, який просто викликає generateKey() і бачить успіх, пройде ВАКУУМНО і не доведе нічого про пристрій. Не писати такий критерій як доказ виправлення. Чесні варіанти: пінити відсутність захоплення на module load (лінивий lookup), пінити наявність і позицію імпорту поліфілу в index.js, пінити поведінку при відсутньому джерелі через інʼєкцію. А те, що зелений сьют не доводить роботу на реальному пристрої, записати окремим verification gap.
