---
name: trello-card
description: Create or update a card on the OPES Trello board in the board's own format — name, labels, description sections, checklists, and cross-ticket links. Use whenever a ticket is put on the board, an existing card is brought up to standard, or a ticket number needs allocating. Not for writing the ticket itself — that is aif-ticket.
license: MIT
compatibility: Requires the Trello MCP connector.
metadata:
  author: opes
  version: "1.0"
---

Put a ticket on the OPES board in the board's own shape. A card is the board-facing view of a
ticket that already exists at `tasks/<ID>/ticket.md` — it never invents scope the ticket does not
have, and it never silently decides something the ticket left open.

**Board**: [Opes](https://trello.com/b/OpgSv5wd/opes) · id `6a65fd418956002ae6525c32`

## Allocate the number from the board, never from git log

**The board is the source of truth for ticket numbers.** It runs ahead of the commit history,
because cards are created for work long before any of it is committed — at the time of writing the
board reached OPES-60 while `git log` only knew OPES-48.

So: read every list, take the highest `OPES-NN` across **all** of them, add one. Deriving the next
number from `git log` produces a collision with an unrelated card that already owns that number.

## Name and placement

```
OPES-NN · kebab-slug
```

The slug is the ticket's short name, lowercase, hyphenated — `test-build-isolation`, not a
sentence. Lists are workflow phase, not category: **Todo → In Progress → Blocked → Review / QA →
Done**. New cards go to Todo unless the ticket is blocked by unfinished work, in which case Blocked.

## Labels — four axes

Apply one from each axis that applies. Area and size are effectively always known; priority is a
judgement call; the domain axis is optional and only for user-facing value.

| Axis | Labels | Pick by |
|---|---|---|
| Area | `🧩 features` · `⚙️ services` · `🔧 shared` · `🗄 models` · `📐 domain` | Which `src/` layer the work lands in. More than one is fine and common. |
| Size | `🟢 XS` · `🔵 S` · `🟡 M` · `🟣 L` | Effort, not risk. Native config on both platforms is L; a contained service change is M. |
| Priority | `🔴 Critical` · `🟠 High` · `🟡 Medium` · `⚪ Low` | Urgency against other work. **Not the same as the ticket's `risk`** — a high-risk internal tool can be Medium priority. |
| Domain | `👤 User` · `💰 Money` · `💳 Card` · `🤖 AI` | Only when the card delivers user-facing value in that domain. Omit for tooling. |

Never invent a label. If none fits, say so rather than creating one.

## Description — the standard shape

Cards written for the aif pipeline use `##` headings in this order. Everything is derived from
`tasks/<ID>/ticket.md`; nothing here is new information.

```markdown
<One line: what this card is, and which half of a larger initiative if it is one.>

Source ticket: `tasks/OPES-NN/ticket.md`
Risk: **<low|medium|high>** · **Depends on: OPES-MM · <slug>** — <what must be true first>

## Why
## What should be true after
## Surfaces
## Risk
## Non-goals
## Deliberately left open
```

- **Why** — the problem in the present tense, and what is different afterwards. State the cost of
  the status quo concretely.
- **What should be true after** — observable behaviour, bold lead-in per property. Not tasks.
- **Surfaces** — the actual files and areas touched, as a bullet list. Use real paths, verified to
  exist. Include `CLAUDE.md` files that must be updated.
- **Risk** — restate the ticket's `risk` and say *why a green suite is not sufficient evidence* when
  it is not. This is the part reviewers read.
- **Non-goals** — what a reader would reasonably expect and will not get, each with where it went
  instead if it went somewhere.
- **Deliberately left open** — carried across from the ticket verbatim in substance. Naming
  decisions belong here, not invented in the card.

Older cards (OPES-48, OPES-55) use `**bold**` headings and an OpenSpec-era section set
(`What Changes` / `Capabilities` / `Impact`, plus a `---` footer block with `Source:` /
`OpenSpec:` / `Commit scope:`). Leave them as they are — they are history, not a template.

### Variant: decision card

Some cards carry no implementation at all — their deliverable is a decision recorded in another
ticket's spec. Mark them at the very top so nobody starts a branch:

> 🧭 **Decision card, not implementation work.** Its deliverable is a fixed contract written into
> OPES-MM's `spec.md`. It closes when that spec is approved.

Then: **Why** / **What must be decided** (numbered) / **Constraints already fixed** (do not
re-open) / **Impact** / **Non-goals**, and a footer naming `Source:`, `Resolve in:`, and
`Commit scope: none of its own`.

## Checklists

The card carries the work breakdown; the aif `plan` station later produces the authoritative one.
Keep items at the ticket's altitude — never name a file, flag or label the ticket deliberately left
open.

1. **`Edge cases that matter`** — first, unnumbered. The cases where a plausible implementation
   goes wrong: empty, duplicate, interrupted, boundary, both-builds-installed, already-done. Each
   states the case *and* the expected outcome.
2. **`1. <group>`, `2. <group>`, …** — task groups in dependency order, items prefixed `1.1`, `1.2`.
   One coherent concern per group.
3. **`N. Tests`** — always last, always its own group.

Include a docs item whenever the change alters something a layer `CLAUDE.md` documents.

## Cross-ticket links

State dependencies in both directions and link them:

- On the dependency: `**Blocks: OPES-MM · <slug>**`
- On the dependent: `**Depends on: OPES-NN · <slug>**` plus the card URL, and a note on what must
  be true before starting.

When a ticket is split, each resulting card says which half it is and what the other half covers.

## Before finishing

- Every path named in **Surfaces** actually exists — check, do not recall.
- Priority and size are stated, and any judgement call you made is surfaced to the user rather than
  buried in the card.
- Nothing in the card decides something the ticket lists under *Deliberately left open*.
- The card was not created by guessing the number from `git log`.
