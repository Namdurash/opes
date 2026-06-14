Ticket: OPES-37

> Backfilled retrospectively: this change documents work already implemented and
> committed as `feat(OPES-37)`. Tasks are checked because the code already landed.

## Why

The Subscription Detective agent (a dev-only harness under `src/agents`) shipped as a rough prototype: an empty `prompt.ts` and `index.ts`, `any`-typed tool I/O, `function` declarations, an unused `config.ts` flag, a hardcoded query/date, and non-English inline comments. It violated the project's code-style rules and had no documented layer conventions. This is a code-quality cleanup only — it does NOT wire the agent to real app data (that is a deferred BYOK feature) and keeps the existing `@anthropic-ai/sdk` transport.

## What Changes

- Write a real system prompt in `prompt.ts` (`SUBSCRIPTION_DETECTIVE_SYSTEM_PROMPT`), export it, and pass it as `system` in `runAgent`.
- Parameterize `runAgent(query, today)` — the request and reference date are arguments instead of hardcoded literals; the MOCK dataset is unchanged.
- Replace all `any` with real types; convert `function` declarations to arrow consts; remove the unused `config.ts` flag; populate the empty `index.ts` barrel.
- Keep the transport as-is (the `@anthropic-ai/sdk` `messages.create` loop) — swapping to `fetch` is a later change.
- Add the `package.json` script `agent:dev`: `tsx scripts/runAgentDev.ts`.
- Add `src/agents/CLAUDE.md` documenting the layer and link it from the root `CLAUDE.md` layer table. Comments/logs in English.

## Capabilities

### New Capabilities
- `subscription-detective`: a developer SHALL be able to run a self-contained, mock-data subscription-detection agent harness that conforms to the project's code-style and layer conventions.

### Modified Capabilities
- _None — no end-user app behavior changes (the harness is dev-only)._

## Impact

- `src/agents/subscriptionDetective` (`prompt`, `agent`, `tools`, `transactionSource`, `types`, `index`; `config.ts` removed), `scripts/runAgentDev.ts` (dev script), `package.json` (`agent:dev` script), new `src/agents/CLAUDE.md` + root `CLAUDE.md` layer table.
- No `domain`/`models`/`services` change, no schema, no new dependency (`tsx` is already a devDependency). The agent still uses the MOCK dataset and is not reachable from the app.

## Non-goals

- Wiring the agent to real DB/Monobank data or surfacing it in the app (deferred BYOK feature).
- Changing the network transport (kept on `@anthropic-ai/sdk`; a later change swaps to `fetch`).
- Improving the detection algorithm or model choice itself.
