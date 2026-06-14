## ADDED Requirements

### Requirement: Create a manual card
The system SHALL let a user create a manual card for the current user with a title, money amount, type, optional image, and currency. New cards SHALL be appended to the end of the user's card order.

#### Scenario: Create a card with required fields
- **WHEN** the user submits the create form with a valid title and money amount
- **THEN** a new card is persisted for the current user and appears at the end of the card list

#### Scenario: Sort order is assigned on creation
- **WHEN** a user who already has N cards creates another card
- **THEN** the new card's `sortOrder` is N (placed last)

#### Scenario: Create requires a current user
- **WHEN** there is no current user id
- **THEN** the create action does not persist a card

### Requirement: View cards
The system SHALL display the current user's cards on Home ordered by `sortOrder`, and SHALL show a detail view for a selected card with its balance, type, creation date, and any monobank metadata.

#### Scenario: Cards render in sort order
- **WHEN** Home loads the current user's cards
- **THEN** the cards are shown ordered by `sortOrder` ascending

#### Scenario: Open card detail
- **WHEN** the user taps a card
- **THEN** the detail screen shows that card's balance, type, and creation date

#### Scenario: Detail for a missing card
- **WHEN** the card referenced by the detail screen no longer exists in the working set
- **THEN** the screen shows an "unavailable" empty state instead of crashing

### Requirement: Empty state when no cards exist
When the current user has no cards, Home SHALL show a friendly empty-state message together with the create-card action, rather than only a bare button.

#### Scenario: No cards
- **WHEN** the current user has zero cards
- **THEN** Home shows an empty-state message and a control to create the first card

### Requirement: Edit a manual card
The system SHALL let a user edit a manual card's title, money amount, type, image, and currency. Edits SHALL be applied optimistically and rolled back on failure.

#### Scenario: Edit persists changes
- **WHEN** the user saves changes to a manual card's editable fields
- **THEN** the card is updated in the store immediately and reconciled with the persisted result

#### Scenario: Edit failure rolls back
- **WHEN** persisting an edit fails
- **THEN** the card reverts to its previous values and an error is surfaced

### Requirement: Unsaved-changes guard on edit
When the user attempts to leave the edit screen with unsaved changes, the system SHALL ask for confirmation before discarding them.

#### Scenario: Leaving with pending edits
- **WHEN** the user navigates back from the edit screen while the form has unsaved changes
- **THEN** a confirmation prompt is shown and the screen is only left after the user confirms discarding

#### Scenario: Leaving with no changes
- **WHEN** the user navigates back from the edit screen with no unsaved changes
- **THEN** the screen is left without a prompt

### Requirement: Delete a manual card with undo
The system SHALL let a user delete a manual card after confirmation, applying the removal optimistically, and SHALL offer an undo affordance that prevents permanent deletion if used within the undo window.

#### Scenario: Confirmed delete
- **WHEN** the user confirms deleting a manual card
- **THEN** the card is removed from the list and, if not undone, permanently deleted from storage

#### Scenario: Undo restores the card
- **WHEN** the user activates undo within the undo window after deleting a card
- **THEN** the card is restored to the list and is not deleted from storage

#### Scenario: Delete failure rolls back
- **WHEN** the permanent deletion fails
- **THEN** the card is restored to the list and an error is surfaced

### Requirement: Reorder cards
The system SHALL let a user reorder cards by dragging, persisting the new order, and SHALL roll back to the previous order if persistence fails.

#### Scenario: Reorder persists
- **WHEN** the user drags a card to a new position and releases
- **THEN** the new order is persisted as each card's `sortOrder`

#### Scenario: Reorder failure rolls back
- **WHEN** persisting the new order fails
- **THEN** the card list reverts to the previous order and an error is surfaced

### Requirement: Monobank-synced cards are read-only
The system SHALL treat cards synced from monobank (those with a `monobankAccountId`) as read-only: they MUST NOT be editable or deletable through the manual-card flows.

#### Scenario: Detail of a synced card
- **WHEN** the user opens the detail of a monobank-synced card
- **THEN** edit and delete actions are not offered and a read-only note is shown

### Requirement: Card image persists across restarts
When a user selects an image for a card, the system SHALL copy the image into the application's persistent storage and store the stable local path, so the image remains available after the app restarts or the OS evicts cached/transient URIs.

#### Scenario: Selected image is copied into app storage
- **WHEN** the user selects an image and saves the card
- **THEN** the image is copied into the app's document storage and the card stores the copied file path, not the picker's transient URI

#### Scenario: Image survives restart
- **WHEN** the app is restarted after a card with an image was saved
- **THEN** the card's image still renders from the persisted local path

#### Scenario: Replacing an image cleans up the previous file
- **WHEN** the user replaces an existing card image with a new one
- **THEN** the new image is persisted and the previously persisted file is removed on a best-effort basis

#### Scenario: Content-scheme source copies successfully
- **WHEN** the selected image is provided as a content-scheme URI that cannot be copied directly
- **THEN** the system still persists the image bytes into app storage via a read/write fallback

### Requirement: Manual card currency selection
The system SHALL let a user choose the currency of a manual card at create and edit time, persist it as the card's currency code and symbol, and render the card's money in that currency everywhere money is shown. Existing manual cards without a stored currency SHALL continue to display in the default currency (UAH).

#### Scenario: Create a card in a non-default currency
- **WHEN** the user selects USD as the currency and creates a card
- **THEN** the card persists the USD currency code and symbol and its amount renders with the USD glyph

#### Scenario: Default currency for legacy cards
- **WHEN** a manual card has no stored currency
- **THEN** its amount renders in the default currency (UAH, ₴)

#### Scenario: Currency shown in detail and list
- **WHEN** a card with a chosen currency is shown in the list and the detail screen
- **THEN** both render the amount in the card's currency

### Requirement: Card form validation rules
The system SHALL validate card form input: a title is required and bounded in length, and the money amount is required, must be a finite number within an allowed range, and is normalized to two decimal places before persistence.

#### Scenario: Reject an over-long title
- **WHEN** the user submits a title longer than the allowed maximum
- **THEN** the form is rejected with a validation message and no card is persisted

#### Scenario: Reject a non-numeric amount
- **WHEN** the user submits a money amount that is not a finite number
- **THEN** the form is rejected with a validation message and no card is persisted

#### Scenario: Amount normalized to two decimals
- **WHEN** the user submits a money amount with more than two decimal places
- **THEN** the persisted amount is rounded to two decimal places
