# CLAUDE.md

Guidance for Claude Code when working in this repository. Rules scoped to a specific layer live in a `CLAUDE.md` inside that layer's folder — Claude Code loads them automatically when reading files there. This root file holds project-wide rules: commands, code style, layer contracts, Definition of Done.

## Project context

- Platform: React Native CLI (TypeScript)
- Product: Offline-first personal finance manager (MVP)
- Scope: Offline-first — the on-device database is the source of truth and every core flow works without network or auth. Monobank is an optional sync source, not a dependency of core flows.
- Backend: Opes has a backend (decided 2026-10-01; no backend code exists yet). It exists only for what a closed app cannot do — calling Monobank while the app is not running, notifications, and similar tasks. **It stores no user data.** Nothing of the user's lives anywhere but the device, so the backend is never a sync target, a backup or a source of truth.

## AI SDLC — every change goes through the foundry

This repo runs an AI SDLC on [AI Foundry](https://github.com/Namdurash/ai-foundry) (`aif`): a need becomes a request, a request is cut into tickets with GIVEN/WHEN/THEN criteria, and the foundry builds each ticket headless on its own branch while the maintainer reviews the result. The board is the coupling between the roles — see **Trello board**. Tooling is the `aif` CLI plus the vendored set it installs: [.aif/foundry.md](.aif/foundry.md) (imported at the bottom of this file), the gates under `.aif/gates/`, the hooks under `.aif/hooks/`, and the `aif-*` skills, agents and commands under `.claude/`. **Do not edit those vendored files** — they are listed in [.aif/manifest.json](.aif/manifest.json) and overwritten by the next `aif init`; a defect in them is reported upstream, never patched here. Project settings the gates read — the suite command, `checks`, limits, risk rules, the board — live in [.aif/project.json](.aif/project.json); project conventions live in this file.

**The loop — one request per outcome, one ticket per slice, one card per ticket:**

1. `/aif-po` _(human time)_ — think the need through; write `requests/<slug>.md`. No criteria, no code. → commit.
2. `/aif-ba` _(human time)_ — cut the request by its slices into `tasks/<ID>/ticket.md` (scaffolded by `aif _ticket-init <ID>`, never by hand); write the GIVEN/WHEN/THEN criteria with the maintainer; pass `aif _ready <ID>` — the Definition of Ready, the same script the worker runs at intake; put the card up with `aif board create tasks/<ID>/ticket.md --column ready`, then label it (`trello-card` skill) and mark the request's `## Status`. → commit.
3. `aif work <ID>` _(machine time)_ — the maintainer runs it in their own terminal. It builds the ticket in `.aif/worktrees/<ID>` on the branch `aif/<ID>`: intake → plan → tests → implement → report, one commit per station, with the gates `ready` → `plan` → `verify-red` → `scope` → `green` between them. It never asks anything: the card moves to In Progress when the run starts, and to Review with the report — or to Blocked (aif's `needs_human`) with the gate's reasons — when it ends. `--loop` drains Ready.
4. `/aif-review` _(human time)_ — prepare the three-minute review of the card. The verdict is the maintainer's: `aif land <ID>` merges `aif/<ID>` into `main`, runs the suite on the result, moves the card to Done, removes the worktree and releases the slices that waited on it; `wrong` is a rework comment on the card that `/aif-pjm` routes to Backlog for `/aif-ba <ID>` to rework the criteria.

`/aif-pjm` keeps the board honest and never starts a build; `/aif-setup` says which roles can run on this machine. The commits of steps 1 and 2, and any fix made by hand on a ticket branch, go through `/sdlc:commit`, which runs the Definition of Done first — see **Commit convention**.

**One branch per ticket.** The foundry cuts `aif/<ID>` itself; work done by hand on a ticket cuts its branch off `main` first — see **Branching**. A request or a ticket is a document, not ticket work: it is committed on `main`, and the branch is cut when the build starts. Only those and trivial escape-hatch edits are committed on `main` directly.

**Escape hatch (pragmatic).** Truly trivial edits — typos, formatting, comment fixes, version bumps — may be committed directly without a ticket, as `chore:`/`docs:`. Everything else (new behavior, structural refactors, logic bug fixes) needs a ticket on the board.

**Autonomous operation (full hands-off).** The machine half is hands-off by construction: `aif work` never asks, and the gates — not a human — admit or refuse each station. The human half is a conversation by design: `/aif-po`, `/aif-ba` and `/aif-review` ask the maintainer, because that is the one place a product decision belongs. For everything Claude does by hand in this repo — a request, a ticket, an escape-hatch edit, a fix on a ticket branch — the maintainer has durably authorized Claude to commit via `/sdlc:commit` the moment the step is done, without per-commit approval. They review after the fact through `git log` and the board — do **not** wait for approval to follow the process.

- **Ticket numbers come from the board, never from `git log`** — see **Trello board**. Never write `OPES-TBD`, never stop to ask for the number.
- **The Definition of Done is the gate — not a human.** `/sdlc:commit` runs `tsc`/`lint`/`test` first and refuses to commit on a red build; the foundry's `green` gate runs the same suite and `checks` from `.aif/project.json`. If the DoD fails, STOP, surface the failure, do not commit.
- **Still stop for genuine judgment calls** — a product decision the request or ticket leaves open (an `open` question is the maintainer's to answer; a default is recorded in `decided`, never applied silently), a destructive/irreversible action, or ambiguity where guessing would waste work. Autonomy means "don't ask permission to follow the process," not "never ask anything."
- **Never `git push`**, never open a PR, and never merge into `main` unless explicitly asked — work stays committed locally. `aif work` and `aif land` are the maintainer's commands, run in their own terminal, never from a Claude session.

## Branching

**One branch per ticket, cut from `main`.** The branch is created when work on the ticket *starts* — for the foundry that is `aif work <ID>`, which cuts `aif/<ID>` in its own worktree before the first station commits; for work done by hand, before the first commit, named as below. Every commit for that ticket (all stations / all hand-made commits) lands on that branch.

```
<domain>/opes-<ticket-number>-<short-name>
```

- **domain** — one of four:

  | domain | use for |
  |---|---|
  | `feat` | new features |
  | `fix` | bugs |
  | `chore` | technical work that isn't a feature (refactors, deps, tooling, tests, build/CI, perf) |
  | `docs` | documentation work |

- **ticket-number** — the OPES ticket, lowercase: `opes-49`.
- **short-name** — kebab-case, a few words naming the work.

Examples: `feat/opes-49-monthly-budgets` · `fix/opes-50-duplicate-sync-rows` · `chore/opes-51-bump-watermelondb` · `docs/opes-52-layer-contracts`

Commit types are finer-grained than branch domains — `refactor`, `test`, `perf`, `style`, `build` and `ci` commits all live on a `chore/` branch.

Rules:

- **Never commit ticket work to `main` directly.** Check the current branch before a ticket's first commit; if it is `main`, cut the branch first (`git switch -c <name>`).
- **Do not merge, do not push, do not open a PR.** When the cycle finishes, stop on the branch and tell the maintainer it is ready — landing it on `main` is their call.
- **One branch per ticket.** Never reuse a branch for a second ticket and never stack tickets on one branch.
- **Escape-hatch edits** (typos, formatting, version bumps) still commit directly to `main` — no ticket, no branch.

## Commit convention

Every commit — Claude or human — follows Conventional Commits with the OPES ticket as scope:

```
<type>(OPES-XX): <subject>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

- **type:** `feat` · `fix` · `chore` · `docs` · `refactor` · `test` · `perf` · `style` · `build` · `ci`.
- **scope:** the `OPES-XX` ticket — from the branch name (`aif/OPES-XX` or `<domain>/opes-xx-…`) or the `tasks/OPES-XX/` folder the commit touches. Required for non-trivial work; a request (no ticket exists yet) and trivial escape-hatch commits omit the scope (`docs: …`, `chore: …`).
- **subject:** imperative mood, lowercase start, no trailing period, ≤ ~72 chars.
- **trailer:** every Claude-authored commit ends with the `Co-Authored-By: Claude` line above.

**Commit rhythm** (default: one commit per step of the loop):

| Step | After | Commits | Message |
|---|---|---|---|
| Request | `/aif-po` | `requests/<slug>.md`, on `main` | `docs: <subject>` — no ticket yet, so no scope |
| Ticket | `/aif-ba` | `tasks/<ID>/ticket.md` + `ledger.json`, the request's `## Status`, on `main` | `docs(OPES-XX): write the ticket for <need>` |
| Build | `aif work <ID>` | one commit per station on `aif/<ID>` — `tasks/<ID>/**`, tests, source | `aif: <station> OPES-XX (attempt N)` — the worker's own format, never written by hand |
| Land | `aif land <ID>` | the merge of `aif/<ID>` into `main` | `Merge branch 'aif/OPES-XX'` — written by `aif land` |
| By hand | a fix on a ticket branch | source + tests on `<domain>/opes-<n>-<short-name>` (or `aif/<ID>`) | `feat(OPES-XX): <subject>` (or `fix`/`refactor`/…) |

Run `/sdlc:commit` to commit the current step — it resolves the ticket from the branch name or the `tasks/<ID>/` path (or the argument you pass), runs the Definition of Done, stages the right files, and writes the message. The Build and Land rows are the foundry's own commits; `/sdlc:commit` never writes those.

## Trello board

Work is tracked on the [Opes board](https://trello.com/b/OpgSv5wd/opes). Two rules bind here; the rest lives in the `trello-card` skill, which loads when you actually need it.

- **A card's text belongs to aif; its labels do not.** `aif board create` writes the ticket into the description and sets the name, column and position — never edit those by hand, they are overwritten on the next push. It sets **no labels at all** on a new card, so every card needs area / size / priority applied afterwards. Invoke the `trello-card` skill right after `aif board create`; do not improvise.
- **Ticket numbers come from the board, never from `git log`.** The board runs ahead of the commit history because cards exist long before code does. Take the highest `OPES-NN` across *all* lists and add one — deriving it from `git log` collides with a card that already owns that number.

Lists are workflow phase. The board's own names map onto aif's columns, and the two differ:
**Todo** (`backlog`) → **Ready** (`ready`) → **In Progress** (`in_progress`) → **Review** (`review`) → **Done** (`done`),
plus **Blocked**, which aif calls `needs_human` — one list under two names.

## Commands

```sh
npm start            # Metro dev server
npm run ios          # build + run iOS (first run: bundle install && bundle exec pod install)
npm run android      # build + run Android
npm run lint         # eslint .
npm test             # jest (all)
npm test -- useCardsStore           # single test file by name pattern
npm test -- -t "rate limit"         # single test by name
npx tsc --noEmit     # strict type-check (no dedicated npm script)
```

## Engineering principles

- Keep changes small, explicit, and scoped to the requested task. Prefer additive edits over refactors.
- Prefer simple implementations over abstractions unless the abstraction has immediate value.
- Do not rewrite large existing files unless explicitly requested. If a structural refactor is necessary, propose it before implementing.
- Never introduce a new dependency without first explaining why it is needed and what problem it solves. Prefer built-in React Native APIs and existing project patterns.

## Layer architecture (enforced, not aspirational)

The app is offline-first: the local WatermelonDB database is the source of truth for domain data. Data flows in one direction:

```
UI (features/) → Zustand store actions → repositories (models/) → WatermelonDB
                              ↘ services/ (sync, categorization, monobank) ↗
```

Cross-cutting rules — each layer's own `CLAUDE.md` expands on these:

- **Components never touch repositories, services, or the DB directly.** They call store actions only.
- **Repositories (`src/models/<entity>/`) are the only code allowed to read/write the DB.** They return `domain/` types, never WatermelonDB models. All methods are async.
- **`domain/` is pure TypeScript types** — no React, RN, or storage imports. WatermelonDB `*Model` classes live separately in `src/services/database/models/`.
- **Stores instantiate repositories/services at module scope** and wire them inside actions. Canonical example: [src/features/transactions/state/useTransactionsStore.ts](src/features/transactions/state/useTransactionsStore.ts).
- **Every folder exposes a barrel `index.ts`.** Import features/layers through their barrel. Never import another feature's `utils.ts` — promote shared helpers to `src/shared/utils/`.

## Language & code style

These rules apply across every `.ts` / `.tsx` file in the project.

### JavaScript / ES6+

- **Arrow functions everywhere.** Never use the `function` keyword — not for components, helpers, store factories, or callbacks. Every callable is a `const` arrow.
- **`const` and `let` only.** Never `var` — now enforced by `no-var`, not just
  documented. One exception, scoped in [.eslintrc.js](.eslintrc.js): test files,
  `test/` and `jest.config.js`, where a hoisted `jest.mock` factory may only close
  over a `var` (`let`/`const` are still in their temporal dead zone at that point).
- **`async`/`await` over `.then()` chains.** `.catch()` is allowed only as a terminal error sink on fire-and-forget calls.
- **Destructuring by default** for function parameters and local variables.
- **Template literals over string concatenation.**
- **Spread syntax** for objects and arrays — not `Object.assign` or `Array.concat`.
- **Optional chaining and nullish coalescing.** Use `?.` and `??` — never `&&`/`||` chains as null guards. Use `??` (not `||`) when the fallback must only trigger on `null`/`undefined`, not on `0` or `""`.
- **No `void` operator.** Don't write `onPress={() => void connect()}` — use a statement-body arrow instead.
- **`as const` for fixed literal maps and tuples.**

### TypeScript

- **Strict mode is on.** All code must pass `tsc --noEmit` with `strict: true`. Never suppress with `@ts-ignore` / `@ts-expect-error` without an explanatory comment.
- **No `any`.** Use `unknown` for genuinely dynamic data and narrow it before use.
- **`interface` for object shapes; `type` for unions and aliases.**
- **Explicit return types on exported functions and public class methods.** Infer for internal helpers where the type is obvious.
- **`import type` for type-only imports.**
- **Generics for reusable utilities** — bounded, not loose.
- **`Pick`, `Partial`, `Readonly`, etc.** over duplicating shapes.
- **Discriminated unions over boolean flags** when state has mutually exclusive modes.

## Testing

Where a test lives and what it is called is **checked by the build**, not agreed by
convention. What follows describes what the machine already enforces; it does not
replace it.

- **A test is a sibling of its source and carries its name.** `CreateCardScreen.tsx`
  is tested by `CreateCardScreen.test.tsx` in the same folder — the same pairing
  [src/features/CLAUDE.md](src/features/CLAUDE.md) already requires for
  `*.styles.ts`.
- **One allowed form: `.test.ts` / `.test.tsx`.** Not `.tests.`, not `.spec.`, not
  `.test.js`. Enforced by `testMatch` in [jest.config.js](jest.config.js) — anything
  else is not collected at all.
- **Three allowed places:** anywhere under `src/`, anywhere under `scripts/`, and the
  repository root itself (where `App.test.tsx` sits beside `App.tsx`).
- **No underscored jest directories.** No `__tests__/`, no `__mocks__/`. Fixture data
  that ordinary code imports lives in a plainly named folder next to its consumer.
- **Shared harness lives in [test/](test/CLAUDE.md)** — factories, repository doubles,
  the test-database helper, jest setup. It contains no tests. Product code importing
  from it is a lint error.
- **Repository tests run against a real database**, one throwaway instance per test
  case, built from the product schema. Everything above the repository layer takes
  injected doubles instead.

Because a misnamed file is silently *not collected* rather than red, `npm run lint`
also runs a guard that fails on a test outside the allowed form or place, and fails
if it finds no tests at all.

Repo-wide commands are not tests. `npx tsc --noEmit` and `npm run lint` run as
`checks` in [.aif/project.json](.aif/project.json), which the foundry's green gate
runs after every implementation — never from inside jest. The tests a ticket writes
first import modules that do not exist yet, so a jest test that type-checks the tree
goes red on every ticket, and `verify-red` stops the run as "the pre-existing suite
is not green".

## Definition of Done

- `npx tsc --noEmit` passes (strict).
- `npm run lint` passes.
- `npm test` passes (or any deviation is documented).
- No unused imports/exports added.
- New files follow the folder conventions in this repo (see layer `CLAUDE.md` files).
- User-visible behavior for the requested task is complete (no unfinished core flow).
- Layer-specific `CLAUDE.md` was updated when the structure or rule it documents changed.
- For non-trivial work: a ticket on the board drove it — `tasks/<ID>/ticket.md` passed `aif _ready`, the work sits on the ticket's branch, and the card is in Review (with the worker's report when `aif work` built it) for the maintainer to land.
- Committed to the ticket's branch per the **Branching** and **Commit convention** rules (never straight to `main`, never merged or pushed).

## Where to find layer-specific rules

| Layer | File | What it covers |
|---|---|---|
| App shell + navigation | [src/app/CLAUDE.md](src/app/CLAUDE.md) | Root navigator, typed routes, header convention |
| Agents (LLM) | [src/agents/CLAUDE.md](src/agents/CLAUDE.md) | Dev-only Subscription Detective harness, mock data, `agent:dev` |
| Domain types | [src/domain/CLAUDE.md](src/domain/CLAUDE.md) | Purity rules — no React/RN/storage |
| Feature screens | [src/features/CLAUDE.md](src/features/CLAUDE.md) | Feature folder shape, styles, forms, store usage |
| Repositories | [src/models/CLAUDE.md](src/models/CLAUDE.md) | Contract + class + `toDomain` mapper pattern |
| WatermelonDB | [src/services/database/CLAUDE.md](src/services/database/CLAUDE.md) | Schema versioning, migrations, adapter swap |
| Monobank | [src/services/monobank/CLAUDE.md](src/services/monobank/CLAUDE.md) | Service singleton, rate limiter, token storage |
| Sync | [src/services/sync/CLAUDE.md](src/services/sync/CLAUDE.md) | TransactionSyncService behavior |
| Categorization | [src/services/categorization/CLAUDE.md](src/services/categorization/CLAUDE.md) | Resolution precedence, batch API |
| Design system | [src/shared/ui/CLAUDE.md](src/shared/ui/CLAUDE.md) | Screen, Header, Icon, UI state patterns |
| Test harness | [test/CLAUDE.md](test/CLAUDE.md) | Shared factories, doubles, test database, jest setup |
| Theme tokens | [src/shared/theme/CLAUDE.md](src/shared/theme/CLAUDE.md) | Token usage rules |
| Validation | [src/shared/validation/CLAUDE.md](src/shared/validation/CLAUDE.md) | Yup schema location |
| Global stores | [src/stores/CLAUDE.md](src/stores/CLAUDE.md) | Cross-feature Zustand stores |
| AI SDLC / foundry | [.aif/foundry.md](.aif/foundry.md) · [.aif/project.json](.aif/project.json) · [.claude/skills/sdlc-commit/SKILL.md](.claude/skills/sdlc-commit/SKILL.md) | The aif loop and its roles (the `aif-*` skills hold each procedure), the suite / checks / limits the gates enforce, the commit step |
| Trello board | [.claude/skills/trello-card/SKILL.md](.claude/skills/trello-card/SKILL.md) | Labels on four axes, cross-card dependencies, ticket numbering |

<!-- aif:begin — managed by ai-foundry; edits inside are overwritten -->
@.aif/foundry.md
<!-- aif:end -->
