## ADDED Requirements

### Requirement: Build meets the Definition of Done
The project SHALL maintain a green build on `main`: `npx tsc --noEmit` (strict), `npm run lint`, and `npm test` all pass. Dead code left behind by removed features MUST NOT break the type-check, lint, or test suites.

#### Scenario: Strict type-check passes
- **WHEN** `npx tsc --noEmit` runs against the repository
- **THEN** it completes with zero errors

#### Scenario: Lint passes
- **WHEN** `npm run lint` runs
- **THEN** `eslint` reports zero errors (warnings are permitted)

#### Scenario: Test suites run and pass
- **WHEN** `npm test` runs the jest suites
- **THEN** every suite executes — native modules are mocked rather than crashing — and all tests pass
