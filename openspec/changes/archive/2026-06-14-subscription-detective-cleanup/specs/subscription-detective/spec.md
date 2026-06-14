## ADDED Requirements

### Requirement: Dev-only mock-data harness
The Subscription Detective agent SHALL run as a developer-only harness against a bundled mock transaction dataset and MUST NOT read the app's real database or Monobank data.

#### Scenario: Run the agent harness
- **WHEN** a developer runs `npm run agent:dev`
- **THEN** the agent loop runs against the bundled mock dataset and prints a natural-language subscription report

#### Scenario: No real-data access
- **WHEN** the harness executes
- **THEN** it sources transactions only from the bundled mock dataset, never from WatermelonDB or the Monobank API

### Requirement: Parameterized agent entry point
`runAgent` SHALL accept the user query and the reference "today" date as parameters rather than hardcoding them.

#### Scenario: Caller supplies query and date
- **WHEN** `runAgent(query, today)` is called
- **THEN** the agent treats `today` as the current date and answers `query`

### Requirement: External system prompt
The agent SHALL be driven by a dedicated, exported system prompt passed as the request `system` parameter.

#### Scenario: System prompt applied
- **WHEN** the agent calls the model
- **THEN** the exported `SUBSCRIPTION_DETECTIVE_SYSTEM_PROMPT` is sent as the system prompt and the `get_transactions` tool is provided

### Requirement: Conforms to project code style
The agent layer SHALL satisfy the project's code-style and layer conventions.

#### Scenario: Style and documentation invariants
- **WHEN** the agent layer is type-checked and linted
- **THEN** there are no `any` types and no `function` declarations, the barrel re-exports the agent modules, and a layer `CLAUDE.md` documents the dev-only / mock-data rules
