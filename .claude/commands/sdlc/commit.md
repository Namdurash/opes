---
name: "SDLC: Commit"
description: Commit the current step of work to the ticket's branch following the project commit convention
category: Workflow
tags: [workflow, git, commit]
---

Commit the current step of work to the ticket's branch, following this repo's AI SDLC commit convention.

**Input** (all optional, after `/sdlc:commit`):
- An OPES ticket — e.g. `/sdlc:commit OPES-33` — to use/override the commit scope.
- A type and/or subject override — e.g. `/sdlc:commit feat: add monthly budgets` — when you don't want it auto-derived.

**What to do**

Invoke the **`sdlc-commit`** skill (via the Skill tool) and follow it end to end. In short, the skill:

0. Checks the current branch and cuts `<domain>/opes-<n>-<short-name>` off `main` if ticket work is still sitting on `main`. Requests, tickets and trivial edits stay on `main`.
1. Inspects `git status --porcelain` to detect the step (Request / Ticket / Ticket work / trivial escape-hatch) and leaves the worker's files under `tasks/<ID>/` to `aif work`.
2. Resolves the `OPES-XX` scope from the argument, else the branch name (`aif/OPES-XX` or `<domain>/opes-xx-…`), else the `tasks/OPES-XX/` path touched — and asks you if ticket work resolves to no ticket. Never from `git log`.
3. Runs the Definition of Done (`npx tsc --noEmit`, `npm run lint`, `npm test`) and STOPS if anything fails for a code change.
4. Stages only the files for this step, then commits to the ticket's branch as:

   ```
   <type>(OPES-XX): <subject>

   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```

5. Shows the resulting `git log --oneline -1`.

**Guardrails**
- One branch per ticket (`<domain>/opes-<n>-<short-name>`, domain = `feat|fix|chore|docs`) — never commit ticket work on `main`, never merge, never push unless explicitly asked.
- One logical commit per step; never mix unrelated changes.
- Never fabricate an OPES ticket — ask if it's missing.
- The foundry's commits (`aif: <station> …`, the `aif land` merge) are aif's own — this command never writes them.
