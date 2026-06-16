## ADDED Requirements

### Requirement: Insights strip on the Analytics screen

The system SHALL render a ranked strip of plain-language insight cards at the top of the Analytics screen, above the charts. The strip MUST reflect the screen's currently selected month and MUST recompute whenever the selected month changes.

#### Scenario: Insights appear above the charts

- **WHEN** the Analytics screen is shown for a month that produces at least one insight
- **THEN** an insights strip is rendered above the spending donut, income-vs-expenses summary, and top-categories list

#### Scenario: Insights follow the selected month

- **WHEN** the user changes the selected month using the analytics month switcher
- **THEN** the insights strip recomputes and shows the insights for the newly selected month

### Requirement: Deterministic, offline insight computation

Insights SHALL be computed entirely on-device by a fixed set of deterministic rules over local transaction data. The computation MUST NOT use an LLM, a network call, or any external service, and MUST NOT read or write persisted state. Given the same transactions and the same selected month, the engine MUST always produce the same insights in the same order.

#### Scenario: No network or LLM is involved

- **WHEN** insights are computed for any month
- **THEN** the result is derived only from already-loaded local transactions, with no network request and no language-model call

#### Scenario: Computation is reproducible

- **WHEN** the engine runs twice over identical transactions for the same selected month
- **THEN** it returns identical insights in identical order

### Requirement: Insights inherit analytics month and primary-currency scoping

Insights SHALL be scoped to the same primary currency that analytics selects (the most frequent `currencyCode`, ties broken by the most recent transaction's currency) and MUST exclude transactions in other currencies from every total, comparison, and ranking. Comparison rules SHALL compare the selected month against the immediately preceding calendar month using the same primary currency. No currency conversion is performed.

#### Scenario: Other-currency transactions are excluded

- **WHEN** the selected month contains transactions in the primary currency and in other currencies
- **THEN** every insight is computed from only the primary-currency transactions

#### Scenario: Comparisons use the previous calendar month

- **WHEN** a comparison rule evaluates the selected month
- **THEN** it compares against the immediately preceding month's primary-currency transactions

### Requirement: Net result insight

The system SHALL emit a net-result insight whenever the selected month has at least one primary-currency transaction. The insight MUST convey the month's net (income minus expenses) and MUST be marked positive when the net is greater than or equal to zero and a warning when the net is negative.

#### Scenario: Overspending is flagged

- **WHEN** the selected month's expenses exceed its income
- **THEN** a warning net-result insight conveys the negative net amount

#### Scenario: Surplus is positive

- **WHEN** the selected month's income is greater than or equal to its expenses
- **THEN** a positive net-result insight conveys the non-negative net amount

### Requirement: Spending-trend insight

The system SHALL emit a spending-trend insight comparing the selected month's total expenses against the previous month's, but only when the previous month has expenses greater than zero and the absolute change is at least 15 percent. The insight MUST convey both totals and the percentage change, marked as a warning when spending rose and positive when it fell.

#### Scenario: Spending rose materially

- **WHEN** the previous month had expenses and the selected month's expenses are at least 15 percent higher
- **THEN** a warning spending-trend insight conveys the increase as a percentage

#### Scenario: Change below threshold is suppressed

- **WHEN** the selected month's expenses differ from the previous month's by less than 15 percent
- **THEN** no spending-trend insight is emitted

#### Scenario: No previous-month baseline

- **WHEN** the previous month has no primary-currency expenses
- **THEN** no spending-trend insight is emitted

### Requirement: Top-category dominance insight

The system SHALL emit a top-category insight when the selected month has expenses and the largest expense category accounts for at least 30 percent of the month's total expenses. The insight MUST convey the category, its expense amount, and its share of total expenses.

#### Scenario: A dominant category is highlighted

- **WHEN** the largest expense category is at least 30 percent of the month's expenses
- **THEN** a top-category insight conveys that category, its amount, and its share

#### Scenario: No dominant category

- **WHEN** no single category reaches 30 percent of the month's expenses
- **THEN** no top-category insight is emitted

### Requirement: Category-spike insight

The system SHALL emit a category-spike insight for the single category with the largest qualifying month-over-month increase. A category qualifies only when it had expenses greater than zero in the previous month, its increase is at least 40 percent, and it represents at least 5 percent of the selected month's total expenses. The insight MUST convey the category, both months' amounts, and the percentage increase, marked as a warning.

#### Scenario: A category surged versus last month

- **WHEN** a category was present last month, rose by at least 40 percent, and is at least 5 percent of this month's expenses
- **THEN** a warning category-spike insight conveys that category and its increase

#### Scenario: Small-base increase is suppressed

- **WHEN** a category's percentage increase clears 40 percent but it is below 5 percent of the month's total expenses
- **THEN** no category-spike insight is emitted for that category

#### Scenario: Only the largest qualifying spike is shown

- **WHEN** more than one category qualifies as a spike
- **THEN** only the category with the largest qualifying increase produces an insight

### Requirement: Largest-expense insight

The system SHALL emit a largest-expense insight whenever the selected month has at least one expense. The insight MUST convey the largest single expense transaction's amount, its title, and its resolved category.

#### Scenario: The biggest purchase is surfaced

- **WHEN** the selected month has one or more expense transactions
- **THEN** a largest-expense insight conveys the amount, title, and category of the single biggest expense

### Requirement: Ranking and display cap

The engine SHALL rank emitted insights by severity — warnings first, then positive, then neutral — breaking ties by a fixed rule order, and SHALL cap the number of insights shown at four. The ordering MUST be deterministic.

#### Scenario: Warnings are surfaced first

- **WHEN** the emitted insights include both warning and non-warning insights
- **THEN** warning insights are ordered before positive and neutral insights

#### Scenario: At most four insights are shown

- **WHEN** more than four insights are emitted for a month
- **THEN** only the four highest-ranked insights are displayed, in deterministic order

### Requirement: No insights when data is insufficient

WHEN the selected month has no primary-currency transactions, or no rule clears its threshold, the system SHALL produce no insights and the strip MUST NOT render. The screen MUST NOT show a separate "no insights" message.

#### Scenario: Empty month produces no strip

- **WHEN** the selected month contains no primary-currency transactions
- **THEN** the engine returns no insights and the insights strip is not rendered

#### Scenario: Nothing notable produces no strip

- **WHEN** the selected month has data but no rule clears its threshold
- **THEN** the engine returns no insights and the insights strip is not rendered
