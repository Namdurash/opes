---
name: trello-card
description: Label a card on the OPES board and link it to the cards it depends on — the board-level metadata that the ticket format does not carry. Use right after `aif board create` puts a card up, when a card's labels are wrong or missing, when a dependency between cards changes, or when a ticket number needs allocating. Not for writing the ticket or the card's description — that is /aif-ba.
license: MIT
compatibility: Requires the Trello MCP connector for removing labels; everything else goes through `aif board`.
metadata:
  author: opes
  version: "2.0"
---

The card's **description is the ticket** — `aif board create` writes `tasks/<ID>/ticket.md` into it
verbatim, `aif:meta` block and all, and `aif work` reads it back at intake. So this skill never
touches the description, the name, or the column: those belong to aif, and anything written over
them is overwritten on the next push.

What aif does **not** do is everything else on the card. That is this skill.

## Run it after the card exists, not before

`aif board create` sets four things: list, name, description, position. It never sets labels.

- On an **existing** card it issues a `PUT`, so the card keeps whatever labels it already had.
- On a **new** card it issues a `POST`, and the card comes out bare.

That asymmetry is why reformulated cards look fine and freshly created ones look empty. So the
order is: `aif board create` first, this skill second. A card created and left unlabelled is a card
nobody can triage without opening it.

## Allocate the number from the board, never from git log

**The board is the source of truth for ticket numbers.** It runs ahead of the commit history,
because cards exist long before any of their code is committed — at the time of writing the board
reached OPES-60 while `git log` only knew OPES-48.

Read every list, take the highest `OPES-NN` across **all** of them, add one:

```bash
aif board status --json | jq -r '[.[].ticket | ltrimstr("OPES-") | tonumber] | max'
```

Deriving the next number from `git log` collides with a card that already owns it.

## Labels — four axes

```bash
aif board label <ID> "<label>"     # adds; creates the label on the board if new
```

Apply one from each axis that applies. Area and size are effectively always known; priority is a
judgement call; the domain axis is optional.

| Axis | Labels | Pick by |
|---|---|---|
| Area | `🧩 features` · `⚙️ services` · `🔧 shared` · `🗄 models` · `📐 domain` | Which `src/` layer the work lands in. More than one is fine and common. Tooling and config work outside `src/` is `🔧 shared`. |
| Size | `🟢 XS` · `🔵 S` · `🟡 M` · `🟣 L` | Effort, not risk. Native config on both platforms is L; a contained service change is M. |
| Priority | `🔴 Critical` · `🟠 High` · `🟡 Medium` · `⚪ Low` | Urgency against other work. **Not the same as the ticket's `risk`** — a high-risk internal tool can be Medium priority, and an XS ticket that unblocks three others can be High. |
| Domain | `👤 User` · `💰 Money` · `💳 Card` · `🤖 AI` | Only when the card delivers user-facing value in that domain. Omit for tooling. |

**Never invent a label.** If none fits, say so rather than creating one — `aif board label` will
happily create a typo as a new board label.

**Priority is the one you must surface.** Area and size are readable off the ticket; priority is a
claim about what matters next, and it is yours, not the ticket's. Say which priority you assigned
and why, in the conversation — not only on the card.

## Dependencies between cards

```bash
aif board label <ID> "depends-on-OPES-NN"
```

Label only the **open** blockers. A card whose two blockers are one done and one outstanding gets
one label, for the outstanding one — otherwise the board shows a dependency that no longer exists.

**`aif board label` can only add.** There is no unlabel command, so a dependency that has been
resolved must be removed through the Trello MCP: read the card's current labels, then set them
again without the stale one (`update_card_details` with the remaining label ids). Check for stale
`depends-on-` labels whenever a card moves to Done.

Distinguish the two cases before labelling:

- **Blocked** — cannot be built until the other card lands. Belongs in the Blocked column.
- **Ordered** — builds fine, but cannot be *verified* until the other lands. Stays in Ready; say so
  in the ticket's `verification_gaps`, not with a `depends-on` label that overstates it.

## What this skill does not do

- **Checklists.** The `plan` station produces the authoritative work breakdown in
  `tasks/<ID>/plan.md`, with the file manifest the scope gate enforces. A checklist on the card is
  read by nothing, duplicates the acceptance criteria, and is stale minutes after `aif work` starts.
  Older cards still carry them; leave them as history.
- **The description, the name, or the column.** All three are aif's, and all three are overwritten
  on the next `aif board create`.
- **Deciding anything the ticket left open.** If a card would need it, the ticket is not ready —
  send it to `/aif-ba`, which is where open questions get answered.

Cards from before aif (OPES-41 through OPES-56) use an OpenSpec-era shape: `**bold**` headings,
`What Changes` / `Capabilities` / `Impact`, and a `---` footer with `Source:` / `OpenSpec:` /
`Commit scope:`. They are history. Do not retrofit them — reformulating one means running it
through `/aif-ba`, which replaces the description wholesale.

## Before finishing

- Every new card carries area, size and priority. A card with no labels is invisible to triage.
- Priority calls were said out loud to the user, with the reason.
- No `depends-on-` label points at a card that is already Done.
- The number came from the board, not from `git log`.
