## ADDED Requirements

### Requirement: Analytics screen and entry point

The system SHALL provide an Analytics screen, registered under an `ANALYTICS` route, reachable from the Home screen's Quick Actions.

#### Scenario: Open analytics from Home

- **WHEN** the user taps the "Analytics" action in Home → Quick Actions
- **THEN** the app navigates to the Analytics screen with a back affordance to Home

### Requirement: Monthly period selection

The Analytics screen SHALL default to the current calendar month and SHALL let the user move to the previous or next month. Every widget on the screen MUST recompute for the selected month. The screen MUST NOT allow navigating to a month later than the current month.

#### Scenario: Defaults to current month

- **WHEN** the Analytics screen opens
- **THEN** the month switcher shows the current month and year and all widgets reflect that month

#### Scenario: Navigate to previous month

- **WHEN** the user taps the previous-month control
- **THEN** the switcher shows the prior month and every widget recomputes for that month

#### Scenario: Forward navigation capped at current month

- **WHEN** the selected month is the current month
- **THEN** the next-month control is disabled so the user cannot select a future month

### Requirement: Primary-currency scoping

Analytics SHALL aggregate only transactions whose `currencyCode` equals the primary currency — defined as the `currencyCode` held by the most transactions across the user's data (ties broken by the most recent transaction's currency). Transactions in other currencies MUST be excluded from every total, chart, and ranking, and the screen MUST surface how many transactions were hidden. No currency conversion is performed.

#### Scenario: Only primary-currency transactions are counted

- **WHEN** the selected month contains transactions in the primary currency and in other currencies
- **THEN** all totals, the donut, and the ranking include only the primary-currency transactions

#### Scenario: Hidden-transaction count is surfaced

- **WHEN** the selected month contains one or more transactions outside the primary currency
- **THEN** the screen shows a note stating how many transactions were excluded

#### Scenario: No note when all transactions share the primary currency

- **WHEN** every transaction in the selected month is in the primary currency
- **THEN** no hidden-transaction note is shown

### Requirement: Spending-by-category donut

The screen SHALL render a donut chart of the selected month's expense transactions grouped by their resolved category. Each slice MUST be colored with that category's palette color, the donut center MUST show the total expenses for the month, and a legend MUST list each category with its amount and its share of total monthly expenses. Income transactions MUST be excluded from the donut.

#### Scenario: One slice per category with expenses

- **WHEN** the selected month has expenses in several categories
- **THEN** the donut renders one slice per category, each colored by the category's color, sized proportionally to that category's expense total

#### Scenario: Center shows total expenses

- **WHEN** the donut is rendered for the selected month
- **THEN** the center label shows the sum of all primary-currency expense transactions for that month

#### Scenario: Legend shows amount and share

- **WHEN** the legend is rendered
- **THEN** each entry shows the category label, its expense amount, and its percentage share of total monthly expenses

### Requirement: Income vs expenses summary

The screen SHALL show, for the selected month, the total income, the total expenses, and the net result (income minus expenses) in the primary currency.

#### Scenario: Totals computed for the month

- **WHEN** the selected month has both income and expense transactions
- **THEN** the summary shows total income, total expenses, and their net difference

#### Scenario: Negative net is represented

- **WHEN** expenses exceed income for the selected month
- **THEN** the net result is shown as a negative value

### Requirement: Top categories ranking

The screen SHALL show up to the top five expense categories for the selected month, ranked by expense total in descending order, each with its amount and its share of total monthly expenses.

#### Scenario: Ranked descending and capped at five

- **WHEN** the selected month has expenses in more than five categories
- **THEN** the list shows only the five largest by amount, ordered from largest to smallest

#### Scenario: Share is computed against total expenses

- **WHEN** a category appears in the ranking
- **THEN** its share equals that category's expense total divided by the month's total expenses

### Requirement: Empty state when no data

WHEN the selected month has no primary-currency transactions, the screen SHALL show an empty state instead of charts and rankings.

#### Scenario: Selected month has no data

- **WHEN** the selected month contains no transactions in the primary currency
- **THEN** the screen shows an empty state inviting the user to pick another month, and renders no donut, summary, or ranking
