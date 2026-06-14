## ADDED Requirements

### Requirement: Export transactions
A user SHALL be able to export all transactions as JSON or CSV via the system share sheet, with no file-system dependency.

#### Scenario: Export as JSON
- **WHEN** the user chooses Export as JSON in Settings
- **THEN** all transactions are serialized to pretty-printed JSON and offered via the system share sheet

#### Scenario: Export as CSV
- **WHEN** the user chooses Export as CSV in Settings
- **THEN** all transactions are serialized to CSV with a fixed column order and quoted/escaped fields, and offered via the system share sheet

#### Scenario: Nothing to export
- **WHEN** the user triggers an export with no transactions
- **THEN** an informational message is shown and nothing is shared
