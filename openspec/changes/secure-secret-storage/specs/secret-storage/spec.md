## ADDED Requirements

### Requirement: Runtime secrets are encrypted at rest

Runtime secrets SHALL be persisted only in an MMKV instance created with an `encryptionKey`. The encryption key SHALL be a randomly generated value held in the device Keychain/Keystore, and MUST NOT be hardcoded in the JS bundle, derived from a build constant, or written anywhere in plaintext.

#### Scenario: Encryption key generated once and stored in the OS keystore

- **WHEN** the secret store initializes for the first time on a device
- **THEN** a random encryption key is generated and stored in the Keychain/Keystore
- **AND** subsequent launches read that same key from the Keychain/Keystore rather than generating a new one

#### Scenario: Persisted secret is not readable as plaintext

- **WHEN** a secret has been written through the secret store
- **THEN** the value does not appear in cleartext in the on-disk MMKV file

### Requirement: Monobank token persisted through the secret store

`MonobankTokenService` SHALL save, retrieve, and clear the Monobank `{ token, clientName }` pair exclusively through the encrypted secret store. Retrieval SHALL be asynchronous, and callers SHALL handle the asynchronous result.

#### Scenario: Save then retrieve round-trips the credentials

- **WHEN** a token and client name are saved and later retrieved
- **THEN** the retrieved value equals what was saved

#### Scenario: Connection is restored after app restart

- **WHEN** the app restarts with a previously saved token
- **THEN** `loadSavedToken()` asynchronously resolves with the saved token and the Monobank status is restored to connected

#### Scenario: Clearing removes the credentials

- **WHEN** the token is cleared (e.g. on disconnect)
- **THEN** a subsequent retrieval resolves to `null`

### Requirement: One-time migration from plaintext storage

On first run after upgrading to the encrypted store, the system SHALL migrate an existing plaintext Monobank token into the encrypted store and then delete the plaintext copy. Migration MUST be idempotent and MUST NOT fail on a fresh install with no prior token.

#### Scenario: Legacy plaintext token is migrated

- **WHEN** the app starts and a token exists in the old plaintext MMKV store
- **THEN** that token is written to the encrypted store
- **AND** the plaintext copy is deleted so it no longer exists on disk

#### Scenario: Fresh install has nothing to migrate

- **WHEN** the app starts with no previously stored token
- **THEN** migration completes without error and no token is present

### Requirement: Test environment runs without native modules

Under Jest, the secret store SHALL use an in-memory implementation with a mocked Keychain so that test suites run without the native MMKV or Keychain modules.

#### Scenario: Suites run with native modules absent

- **WHEN** the jest suite exercises code that reads or writes secrets
- **THEN** the in-memory store and mocked Keychain are used and the suite runs without crashing on missing native modules
