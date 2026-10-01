---
name: sdlc-commit
description: Commit the current step of work to the ticket's branch following the project commit convention. Use after /aif-po writes a request, after /aif-ba writes or reworks a ticket, after a hand-made fix on a ticket branch, or whenever the user asks to commit work in this repo. Resolves the OPES ticket from the branch name or the tasks/<ID>/ path, checks/cuts the ticket branch, runs the Definition of Done, and writes a Conventional-Commits message with a Co-Authored-By trailer. Never writes the foundry's own commits — aif work and aif land do that themselves.
license: MIT
compatibility: Requires git. The aif CLI is only used to confirm a ticket exists on the board.
metadata:
  author: opes
  version: "2.0"
---

Commit the current work following this repo's AI SDLC commit convention. **Ticket work lives on a per-ticket branch — never commit it to `main`.** Requests, tickets and trivial escape-hatch edits commit on `main`. Never `git push`, never merge, never open a PR unless the user explicitly asks.

The foundry commits for itself. `aif work <ID>` writes one commit per station on `aif/<ID>` — `aif: intake OPES-XX`, `aif: plan OPES-XX (attempt N)`, `aif: tests …`, `aif: implement …`, `aif: report OPES-XX (built)` — and `aif land <ID>` writes the merge into `main`. This skill never writes those, never commits inside `.aif/worktrees/`, and never hand-commits the worker's files under `tasks/<ID>/` (`plan.md`, `report.md`, `run.json`, `stations/`, `tests.lock.json`).

## Branch convention (canonical)

```
<domain>/opes-<ticket-number>-<short-name>
```

- **domain**: `feat` (features) · `fix` (bugs) · `chore` (technical work that isn't a feature) · `docs` (documentation).
- **ticket-number**: the OPES ticket, lowercase — `opes-49`.
- **short-name**: kebab-case, a few words naming the work.

Example: `feat/opes-49-monthly-budgets`. Commit types `refactor`/`test`/`perf`/`style`/`build`/`ci` all belong on a `chore/` branch. The foundry names its own branch `aif/OPES-NN`; a hand fix on one of those keeps the ticket's scope.

## Commit format (canonical)

```
<type>(OPES-XX): <subject>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

- **type**: `feat` `fix` `chore` `docs` `refactor` `test` `perf` `style` `build` `ci`
- **scope**: the `OPES-XX` ticket (from the branch name or the `tasks/OPES-XX/` path). Omit for a request — no ticket exists yet — and for trivial escape-hatch commits.
- **subject**: imperative, lowercase start, no trailing period, ≤ ~72 chars.
- Always append the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer (use a second `git commit -m`).

## Steps

0. **Check the branch — before anything else**
   ```bash
   git branch --show-current
   ```
   - Already on a `<domain>/opes-<n>-<short-name>` branch for this ticket → proceed.
   - On `aif/OPES-NN` — the foundry's branch — and the change is a hand fix for that ticket → proceed with that ticket's scope.
   - On `main` and this is **ticket work** (source code for a ticket) → cut the branch now, before committing:
     ```bash
     git switch -c <domain>/opes-<n>-<short-name>
     ```
     Resolve the ticket first (step 2) so the number is real; derive `<domain>` from the work (feature → `feat`, bug → `fix`, docs → `docs`, anything else technical → `chore`) and `<short-name>` from the ticket's title.
   - On `main` and this is a **request**, a **ticket**, or a **trivial escape-hatch edit** → stay on `main`, no branch.
   - On a branch belonging to a *different* ticket → STOP and ask. Do not stack tickets on one branch.

1. **See what changed**
   ```bash
   git status --porcelain
   ```
   Use the changed paths to detect the step:
   - Only `requests/<slug>.md` → **Request** → `docs: <subject>` (no scope — no ticket exists yet)
   - `tasks/<ID>/ticket.md` and `ledger.json` (± the `## Status` of the request it was cut from) → **Ticket** → `docs(OPES-XX): write the ticket for <need>` (`rework the ticket for <need>` when it came back from review)
   - Source code (± tests) → **Ticket work** → `feat|fix|refactor(OPES-XX): <subject>`
   - Nothing ticket-related, and the edit is trivial (typo, formatting, version bump) → **Escape hatch** → `chore:`/`docs:` with no scope.
   - The worker's files under `tasks/<ID>/` (`plan.md`, `report.md`, `run.json`, `stations/`, `tests.lock.json`) → not yours. Leave them to `aif work`.

   If the working tree mixes unrelated steps/tickets, stage and commit them **separately** — one logical commit each. Do not lump unrelated work together.

2. **Resolve the ticket** — in this order, first hit wins:
   - the argument passed to `/sdlc:commit` (`OPES-33`);
   - the branch name — `aif/OPES-33` or `<domain>/opes-33-<short-name>`;
   - the `tasks/OPES-33/` folder among the changed paths.

   Confirm it exists: `tasks/OPES-33/ticket.md` on disk, or `aif board show OPES-33`. A request carries no ticket — no scope. If **ticket work** resolves to no ticket, **ask the user for the OPES ticket number** (use AskUserQuestion). Never derive a number from `git log` — the board runs ahead of it (see the `trello-card` skill) — and never invent one.

3. **Run the Definition of Done** (do this before every code commit)
   ```bash
   npx tsc --noEmit
   npm run lint
   npm test
   ```
   - If any check **fails**, STOP. Report the failure and do not commit. Fix or hand back to the user.
   - Request and Ticket commits touch no TS — `tsc`/`lint` should pass trivially; you may skip `npm test` when no code changed.

4. **Stage the right files**
   - Request: `git add requests/<slug>.md`
   - Ticket: `git add tasks/<ID>/ticket.md tasks/<ID>/ledger.json`, plus the request file whose `## Status` changed.
   - Ticket work: `git add` the touched source files **and** their tests.
   Prefer explicit paths over `git add -A` so unrelated working-tree changes don't sneak in. Confirm with `git status` before committing.

5. **Write the subject**
   - Ticket work: a concise imperative summary of the behavior shipped.
   - Request: what happened to it — `write the <outcome> request`, `narrow the <slug> request to <…>`.
   - Ticket: `write the ticket for <need>` / `rework the ticket for <need>`.

6. **Commit to the ticket's branch**
   ```bash
   git commit -m "<type>(OPES-XX): <subject>" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
   ```

7. **Confirm**
   ```bash
   git log --oneline -1
   ```
   Show the resulting commit line and the step it covered.

## Guardrails
- Ticket work commits on its own branch, never on `main`; never merge, never push unless asked.
- One logical commit per step; never mix unrelated changes.
- Never commit when the Definition of Done fails for code changes.
- Never fabricate an OPES ticket number — ask if it's missing, and never take it from `git log`.
- Never write the foundry's commits by hand, never commit inside `.aif/worktrees/`, never hand-commit the worker's files under `tasks/<ID>/`.
- Keep the `Co-Authored-By` trailer on every Claude-authored commit.
