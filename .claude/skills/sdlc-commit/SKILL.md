---
name: sdlc-commit
description: Commit the current OpenSpec phase to the ticket's branch following the project commit convention. Use after a propose, apply, or archive phase completes, or whenever the user asks to commit work in this repo. Resolves the OPES ticket, checks/cuts the ticket branch, runs the Definition of Done, and writes a Conventional-Commits message with a Co-Authored-By trailer.
license: MIT
compatibility: Requires git and the openspec CLI.
metadata:
  author: opes
  version: "1.0"
---

Commit the current work following this repo's AI SDLC commit convention. **Ticket work lives on a per-ticket branch — never commit it to `main`.** Only trivial escape-hatch edits commit on `main`. Never `git push`, never merge, never open a PR unless the user explicitly asks.

## Branch convention (canonical)

```
<domain>/opes-<ticket-number>-<short-name>
```

- **domain**: `feat` (features) · `fix` (bugs) · `chore` (technical work that isn't a feature) · `docs` (documentation).
- **ticket-number**: the OPES ticket, lowercase — `opes-49`.
- **short-name**: kebab-case, a few words naming the work.

Example: `feat/opes-49-monthly-budgets`. Commit types `refactor`/`test`/`perf`/`style`/`build`/`ci` all belong on a `chore/` branch.

## Commit format (canonical)

```
<type>(OPES-XX): <subject>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

- **type**: `feat` `fix` `chore` `docs` `refactor` `test` `perf` `style` `build` `ci`
- **scope**: the `OPES-XX` ticket (from the change's `proposal.md`). Omit only for trivial escape-hatch commits.
- **subject**: imperative, lowercase start, no trailing period, ≤ ~72 chars.
- Always append the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer (use a second `git commit -m`).

## Steps

0. **Check the branch — before anything else**
   ```bash
   git branch --show-current
   ```
   - Already on a `<domain>/opes-<n>-<short-name>` branch for this ticket → proceed.
   - On `main` and this is **ticket work** → cut the branch now, before committing:
     ```bash
     git switch -c <domain>/opes-<n>-<short-name>
     ```
     Resolve the ticket first (step 2) so the number is real; derive `<domain>` from the work (feature → `feat`, bug → `fix`, docs → `docs`, anything else technical → `chore`) and `<short-name>` from the change name.
   - On `main` and this is a **trivial escape-hatch edit** → stay on `main`, no branch.
   - On a branch belonging to a *different* ticket → STOP and ask. Do not stack tickets on one branch.

1. **See what changed**
   ```bash
   git status --porcelain
   ```
   Use the changed paths to detect the phase:
   - Only `openspec/changes/<name>/**` → **Propose** → `docs(OPES-XX): propose <name>`
   - Source code (± `openspec/changes/<name>/tasks.md` checkbox ticks) → **Implement** → `feat|fix|refactor(OPES-XX): <subject>`
   - `openspec/specs/**` and/or a move into `openspec/changes/archive/` → **Archive** → `chore(OPES-XX): archive <name>`
   - Nothing OpenSpec-related, and the edit is trivial (typo, formatting, version bump) → **Escape hatch** → `chore:`/`docs:` with no scope.

   If the working tree mixes unrelated phases/changes, stage and commit them **separately** — one logical commit each. Do not lump unrelated work together.

2. **Resolve the change and ticket**
   ```bash
   openspec list --json
   ```
   Identify the active change for this work. Read its `proposal.md` and extract the `Ticket: OPES-XX` line — that is the commit scope.
   - If the ticket is `OPES-TBD` or missing, **ask the user for the OPES ticket number** before committing (use AskUserQuestion). Do not invent one.
   - For a trivial escape-hatch commit with no change, no ticket/scope is needed.

3. **Run the Definition of Done** (do this before every code commit)
   ```bash
   npx tsc --noEmit
   npm run lint
   npm test
   ```
   - If any check **fails**, STOP. Report the failure and do not commit. Fix or hand back to the user.
   - Docs/spec-only commits (Propose, Archive) won't touch TS — `tsc`/`lint` should pass trivially; you may skip `npm test` when no code changed.

4. **Stage the right files**
   - Propose: `git add openspec/changes/<name>`
   - Implement: `git add` the touched source files **and** the change's `tasks.md`.
   - Archive: `git add openspec/specs openspec/changes` (captures synced specs + the archive move).
   Prefer explicit paths over `git add -A` so unrelated working-tree changes don't sneak in. Confirm with `git status` before committing.

5. **Write the subject**
   - Implement phase: a concise imperative summary of the behavior shipped (derive from the change title / proposal `## What Changes`).
   - Propose/Archive: `propose <name>` / `archive <name>`.

6. **Commit to the ticket's branch**
   ```bash
   git commit -m "<type>(OPES-XX): <subject>" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
   ```

7. **Confirm**
   ```bash
   git log --oneline -1
   ```
   Show the resulting commit line and the phase it covered.

## Guardrails
- Ticket work commits on its own branch, never on `main`; never merge, never push unless asked.
- One logical commit per phase; never mix unrelated changes.
- Never commit when the Definition of Done fails for code changes.
- Never fabricate an OPES ticket number — ask if it's missing.
- Keep the `Co-Authored-By` trailer on every Claude-authored commit.
