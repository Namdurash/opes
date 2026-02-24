# AI Contribution Guide

This file defines how AI agents should contribute to this repository.

## Project Context

- Platform: React Native CLI (TypeScript)
- Product: Offline-first personal finance manager (MVP)
- Current scope: Local-only app, no backend, no auth

## Engineering Principles

- Keep changes small, explicit, and scoped to the requested task.
- Prefer simple implementations over abstractions unless the abstraction has immediate value.
- Avoid introducing new libraries unless explicitly requested.
- Use clear names, short functions, and predictable file organization.
- Do not rewrite large existing files unless explicitly requested.
- Apply minimal, scoped changes (prefer additive edits over refactors).
- If a structural refactor is necessary, propose it before implementing.
- Never introduce a new dependency without first explaining why it is needed and what problem it solves.
- Prefer built-in React Native APIs and existing project patterns.

## Code Structure (Source of Truth)

- Main app code lives in `src/`.
- Feature code is grouped by feature under `src/features`.
- Shared UI and cross-feature utilities live under `src/shared`.
- Domain models/types live under `src/domain`.
- State and app-level orchestration live under `src/state` and `src/app`.
- Storage access is abstracted behind interfaces in `src/services/storage`.

## Design System (Source of Truth)

All UI must use design tokens and shared UI primitives. Do not hardcode colors, font sizes, spacing, or radii in feature screens.

### Tokens

- Tokens live in `src/shared/theme/`.
- Use `theme.colors.*`, `theme.typography.*`, `theme.spacing.*`, `theme.radii.*`, `theme.shadows.*`.

### Rules

- No raw hex colors in feature code.
- No numeric font sizes in feature code.
- Prefer `shared/ui` primitives: `Screen`, `Text`, `Button`, `Card`, `Spacer`.
- Styles must be created via a helper that accepts theme (e.g. `makeStyles(theme)`), or by using `useTheme()`.

### Styling

- All styles inside `src/features/**` must be placed in separate modules.
- The styles file name must be the full related module name with `.styles.ts` postfix.
  - Example: `TransactionsScreen.tsx` -> `TransactionsScreen.styles.ts`
  - Example: `TransactionListPlaceholder.tsx` -> `TransactionListPlaceholder.styles.ts`
- Feature components must not contain `StyleSheet.create(...)` inline in the component module.
- `shared/ui` primitives may contain their own styles in the same file (allowed), but feature-level UI must follow the separation rule.

### Extensibility

- Theme must be switchable (e.g. light/dark) without rewriting feature code.
- Adding a new color or text style must happen only in the tokens file and be used everywhere consistently.

## Conventions

- TypeScript strictness should be preserved.
- Prefer named exports for internal modules and barrel files (`index.ts`) per folder.
- Keep screen components presentational when possible; isolate business logic in hooks/services.
- Keep placeholders explicit but functional.
- Repository methods must be async (return Promise), even for in-memory implementations.
- Domain types must not depend on React, React Native, or storage implementations.

## How To Add A Feature

1. Define/extend domain types in `src/domain` if needed.
2. Add feature folder in `src/features/<feature-name>`.
3. Create screen/component files inside that feature.
4. Add or extend state logic in `src/state` only if required by the feature.
5. Integrate with storage via `src/services/storage` interfaces (not direct storage calls from UI).
6. Wire into app navigation in `src/app`.
7. Add/update tests for logic and critical rendering paths.
8. Update docs when structure or behavior changes.

## Definition of Done (DoD)

- Code compiles and TypeScript checks pass.
- Lint and test suite pass (or any deviations are clearly documented).
- No unused imports/exports added.
- New files follow the repository folder conventions.
- User-visible behavior for the requested task is complete (no unfinished core flow).
- Documentation updated when architecture/structure changes.
