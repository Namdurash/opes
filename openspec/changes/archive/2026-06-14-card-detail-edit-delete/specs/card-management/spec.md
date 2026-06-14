## ADDED Requirements

### Requirement: View card details
A user SHALL be able to open any card from Home to view its details.

#### Scenario: Open a card from Home
- **WHEN** the user taps a card in the card stack on Home
- **THEN** a card detail screen opens showing the card's title, balance, type, and creation date

#### Scenario: Synced card shows account metadata
- **WHEN** the opened card is a Monobank-synced card
- **THEN** the detail screen additionally shows the masked card number, IBAN, and credit limit when present

### Requirement: Edit a manual card
A user SHALL be able to edit a manually-created card (one with no Monobank account id). The system MUST reuse the card creation form in an edit mode rather than a separate screen.

#### Scenario: Edit and save
- **WHEN** the user opens a manual card's detail and chooses Edit
- **THEN** the create-card form opens prefilled with the card's title, amount, type, and image
- **AND WHEN** the user saves
- **THEN** the card is updated optimistically and the screen returns to the previous view

#### Scenario: Update failure rolls back
- **WHEN** saving an edited card fails at the repository
- **THEN** the card's previous values are restored and an error bottom sheet is shown

### Requirement: Delete a manual card
A user SHALL be able to delete a manually-created card after confirming. Deletion MUST permanently remove the card from the local database.

#### Scenario: Confirmed delete
- **WHEN** the user chooses Delete on a manual card and confirms in the dialog
- **THEN** the card is removed optimistically from the list and permanently deleted from the database

#### Scenario: Delete failure rolls back
- **WHEN** the repository delete fails
- **THEN** the removed card is restored to the list and an error bottom sheet is shown

### Requirement: Monobank cards are read-only
Monobank-synced cards (those with a Monobank account id) SHALL NOT be editable or deletable in-app.

#### Scenario: No edit or delete for synced cards
- **WHEN** the user opens the detail of a Monobank-synced card
- **THEN** no Edit or Delete action is offered and a read-only note is shown instead

### Requirement: Tap coexists with drag-to-reorder
Tapping a card SHALL open its detail without breaking the existing long-press drag-to-reorder gesture.

#### Scenario: Short tap opens detail
- **WHEN** the user briefly taps a card
- **THEN** its detail screen opens

#### Scenario: Long-press still reorders
- **WHEN** the user long-presses and drags a card within the stack
- **THEN** the card reorders as before and the new order is persisted
