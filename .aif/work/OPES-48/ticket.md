<!-- aif:meta
{ "schema": 1, "ticket": "OPES-48", "lang": "en", "risk": "low" }
-->

# OPES-48 — Transactions category & month filter

## Why

`TransactionsScreen` today renders one flat `SectionList` with no way to narrow
it. The MVP plan's analytics drill-down (§6.3) is meant to open "the existing
transactions screen with a filter" — but that filtered destination does not
exist yet, so the drill-down has nowhere to land. The filter is also valuable on
its own: a user looking at a long history should be able to see just one
category, or just one month, without scrolling past everything else.

After this change the transactions screen can be opened pre-filtered, the active
filter is always visible and clearable, and the user is never confused about why
the list looks short.

## Who and when

The screen is opened in a filtered state by **navigation** — another screen (in
future, the analytics drill-down of OPES-49) navigates to the `Transactions`
route carrying a filter payload. This ticket delivers the destination and the
on-screen filter affordances; it does **not** build the analytics-side tap
handler that navigates here (that is OPES-49).

## What becomes observable

**Route param.** The `Transactions` route gains an optional filter payload. It
may carry a **category** (a single, concrete, existing category id), a **month**
(a specific calendar month), or **both together**. All three combinations are
valid ways to arrive filtered: category-only, month-only, or category-and-month.
The param is optional — with no payload the screen behaves exactly as it does
today (the full list, unfiltered). `app/navigation/types.ts` currently types
this param as `undefined` and must be widened to describe the payload.

**Filtering.** When a filter is active, the list shows only the transactions
that match every active dimension — a category filter narrows to that category,
a month filter narrows to that month, and both together narrow to the
intersection. Filtering happens **in the view-model** (`useTransactionsViewModel`)
over the already-resolved category map that the screen loads today. It adds **no
new repository query and no new database read** — it is a selection over data
already in memory. Date grouping of the list is otherwise unchanged; the filter
only narrows which transactions feed into it.

A transaction's **month** for matching is the `YYYY-MM` prefix of its stored
`occurredAtIso` timestamp — the same date the list already uses to group
transactions into date sections (`utils.ts` derives the section key from the
`YYYY-MM-DD` prefix of that same string, with no timezone conversion). Month
matching is a string-prefix comparison over data already in memory; it introduces
no date-picker UI and no new date/timezone logic.

**Filter chips.** When a filter is active, the screen shows a visible,
dismissible **chip per active dimension** — one chip for the category (showing
the category's name), one chip for the month (showing the month, e.g. a form
like "Aug 2026"). When both are present they appear **category chip first, then
month chip, in a single horizontal row**. The chips are **independently
clearable**: dismissing the category chip removes only the category constraint
and keeps the month filter applied; dismissing the month chip keeps the category
filter applied. When the last active chip is dismissed the screen returns to the
full, unfiltered list.

**The filter is ephemeral — every arrival without a payload shows the full
list.** The Transactions screen is long-lived (it stays mounted), but the filter
does not persist across arrivals. Whenever the screen is *navigated to* carrying
a filter payload, that payload takes effect and **replaces** whatever filter was
applied. Whenever the screen is *returned to without* a fresh filter payload —
an explicit payload-less navigation, or simply switching away to another tab and
re-focusing this one — the filter is **cleared** and the full, unfiltered list is
shown. Within the screen the user cannot add a filter by hand — they can only
*clear* active chips (there is no in-screen control to add a filter — see
_Deliberately left open_).

A navigation that carries a payload (e.g. a future analytics drill-down) applies
its filter. Whether an incoming payload that is *identical* to a filter the user
just cleared by hand must still be re-applied — a known edge on a long-lived
screen where the navigator may not re-render on an unchanged param — is left to
the spec/design; the intent is that a drill-down applies its filter.

**Empty state.** When an active filter matches no transactions — including when
the screen is opened with a category or month that simply has nothing in it —
the screen shows an empty state with the message **"No transactions match this
filter."** (the same message for the category-only, month-only, and combined
cases), and the filter **chips remain visible** so the user can clear the filter
and get back to the full list from there.

## Surfaces

- `features/transactions` — `TransactionsScreen`: reads the route param and
  renders the chips + empty state.
- `features/transactions` — `useTransactionsViewModel`: holds the active filter
  state and exposes the filtered selection.
- `features/transactions` — a small filter-chip component.
- `app/navigation/types.ts` — the `Transactions` entry in the route param list,
  widened from `undefined` to the optional filter payload.

## Non-goals

- Free-text search, date-range pickers, and multi-category selection.
- Sorting options.
- Filtering to the "uncategorized" bucket — the category dimension always targets
  a concrete existing category id.
- Handling a category id that resolves to no known category (deleted / not in the
  loaded map). That error-message behaviour is a **separate follow-up ticket**,
  not part of OPES-48.
- The analytics-side tap handler that navigates here — that is **OPES-49**.
- Any new repository method, DB query, or schema/data-model change.
- Any new dependency.

## Deliberately left open

- **How a user activates a filter from within the screen.** This ticket covers
  *arriving* filtered (via the navigation param) and *clearing* filters (via the
  chips). Whether the transactions screen itself offers an in-screen control to
  pick or add a category/month filter — rather than only receiving one through
  navigation — is not decided here; the spec author may treat it as out of scope
  for OPES-48.
- **The exact shape of the widened `Transactions` route param** — the field
  name(s) and encoding for both the category dimension and the month dimension
  (the month need only identify a single calendar month whose matching follows
  the `YYYY-MM` prefix rule above) — is left to the spec/design. This shape is
  the contract OPES-49's navigator must produce, so the spec fixes it once and
  both tickets consume it. The precise chip label text is likewise left to design.
- **Whether clearing a chip also rewrites the navigation param.** The observable
  requirement is that the cleared dimension stops filtering the list; whether the
  route param is also mutated is an implementation detail left to the spec.
