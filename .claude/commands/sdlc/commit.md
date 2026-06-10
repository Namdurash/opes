---
name: "SDLC: Commit"
description: Commit the current OpenSpec phase to main following the project commit convention
category: Workflow
tags: [workflow, git, commit]
---

Commit the current phase of work to `main`, following this repo's AI SDLC commit convention.

**Input** (all optional, after `/sdlc:commit`):
- An OPES ticket — e.g. `/sdlc:commit OPES-33` — to use/override the commit scope.
- A type and/or subject override — e.g. `/sdlc:commit feat: add monthly budgets` — when you don't want it auto-derived.

**What to do**

Invoke the **`sdlc-commit`** skill (via the Skill tool) and follow it end to end. In short, the skill:

1. Inspects `git status --porcelain` to detect the phase (Propose / Implement / Archive / trivial escape-hatch).
2. Resolves the active OpenSpec change and its `Ticket: OPES-XX` from `proposal.md` (asks you if the ticket is `OPES-TBD` or missing). A ticket passed as an argument overrides this.
3. Runs the Definition of Done (`npx tsc --noEmit`, `npm run lint`, `npm test`) and STOPS if anything fails for a code change.
4. Stages only the files for this phase, then commits to `main` as:

   ```
   <type>(OPES-XX): <subject>

   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```

5. Shows the resulting `git log --oneline -1`.

**Guardrails**
- Trunk-based — commit on `main`, never branch, never push unless explicitly asked.
- One logical commit per phase; never mix unrelated changes.
- Never fabricate an OPES ticket — ask if it's missing.
