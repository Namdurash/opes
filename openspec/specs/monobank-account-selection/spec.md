# monobank-account-selection Specification

## Purpose
Define how a user controls which linked Monobank accounts are synced. By default every linked account syncs; the user can enable/disable individual accounts on the Connect Monobank screen, the choice is persisted locally (MMKV), and transaction sync fetches statements only for the enabled accounts. Disconnecting clears the selection.

## Requirements
### Requirement: Choose which accounts sync
A user SHALL be able to enable or disable each linked Monobank account for syncing from the Connect Monobank screen.

#### Scenario: Toggle an account off
- **WHEN** the user turns off a linked account in "Accounts to sync"
- **THEN** that account is removed from the enabled allow-list

#### Scenario: Default is all accounts
- **WHEN** the user has never changed the selection
- **THEN** every linked account is treated as enabled

### Requirement: Selection persists
The selection SHALL be persisted locally (MMKV) and survive app restarts.

#### Scenario: Selection restored on relaunch
- **WHEN** the Connect Monobank screen reloads after a selection was made
- **THEN** the previously enabled/disabled state of each account is restored

### Requirement: Sync honors the selection
Transaction sync SHALL only fetch statements for the enabled accounts; when no selection has been made it SHALL sync all accounts.

#### Scenario: Only enabled accounts sync
- **WHEN** a sync runs with a non-empty selection
- **THEN** only the enabled accounts' statements are fetched and saved

#### Scenario: No selection syncs everything
- **WHEN** a sync runs and no selection has ever been made
- **THEN** all linked accounts are synced

### Requirement: Disconnect clears the selection
Disconnecting Monobank SHALL clear the persisted account selection.

#### Scenario: Selection cleared on disconnect
- **WHEN** the user disconnects Monobank
- **THEN** the persisted selection is removed and a future reconnect defaults to syncing all accounts

