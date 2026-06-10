---
name: sdlc-commit
description: Commit the current OpenSpec phase to main following the project commit convention. Use after a propose, apply, or archive phase completes, or whenever the user asks to commit work in this repo. Resolves the OPES ticket, runs the Definition of Done, and writes a Conventional-Commits message with a Co-Authored-By trailer.
license: MIT
compatibility: Requires git and the openspec CLI.
metadata:
  author: opes
  version: "1.0"
---

Commit the current work to `main` following this repo's AI SDLC commit convention. The repo is **trunk-based: commit directly to `main`, never create a branch.** Never `git push` unless the user explicitly asks.

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

6. **Commit to `main`**
   ```bash
   git commit -m "<type>(OPES-XX): <subject>" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
   ```

7. **Confirm**
   ```bash
   git log --oneline -1
   ```
   Show the resulting commit line and the phase it covered.

## Guardrails
- Trunk-based: commit on `main`, never branch, never push unless asked.
- One logical commit per phase; never mix unrelated changes.
- Never commit when the Definition of Done fails for code changes.
- Never fabricate an OPES ticket number — ask if it's missing.
- Keep the `Co-Authored-By` trailer on every Claude-authored commit.
