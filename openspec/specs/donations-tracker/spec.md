# donations-tracker Specification

## Purpose
Define a read-only Donations view that lets a user see their giving at a glance — total donated, count, and average — plus a list of donation transactions and a donation-jar visual. It is derived entirely from existing transactions and the existing `donations` category (no new data model), and is reachable from Home.

## Requirements
### Requirement: Donations summary
The app SHALL provide a read-only Donations screen that summarizes the user's donation-category transactions: total donated, donation count, and average donation.

#### Scenario: Summary computed from donation transactions
- **WHEN** the user opens the Donations screen
- **THEN** all transactions are categorized and those in the `donations` category are summarized as total (sum of amounts), count, and average

#### Scenario: No donations yet
- **WHEN** the user has no donation-category transactions
- **THEN** the screen shows an empty state and the computed total, count, and average are zero

### Requirement: Donation transaction list
The Donations screen SHALL list the donation-category transactions with amounts formatted by the shared money formatter.

#### Scenario: Donations listed
- **WHEN** the user has donation-category transactions
- **THEN** they are listed with their title, date, and formatted amount

### Requirement: Donation jar visual
The Donations screen SHALL display a donation-jar visual rendered with the existing `react-native-svg`.

#### Scenario: Jar shown
- **WHEN** the Donations screen renders
- **THEN** a donation-jar SVG is displayed alongside the summary

### Requirement: Read-only and reachable from Home
The Donations screen SHALL be reachable from Home and SHALL NOT introduce a new data model.

#### Scenario: Navigate from Home
- **WHEN** the user selects the Donations entry on Home
- **THEN** the Donations screen opens, deriving its data from existing transactions and categories (no new table or schema change)

