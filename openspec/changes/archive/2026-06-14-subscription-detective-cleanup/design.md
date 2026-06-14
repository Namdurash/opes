## Context

`src/agents` holds a dev-only Subscription Detective harness run via `tsx scripts/runAgentDev.ts` (the `agent:dev` script). It is intentionally isolated from the app — it reads a mock transaction dataset, never the WatermelonDB/Monobank data — and exists to iterate on the agent loop and prompt. The prototype shipped breaking the repo's code-style rules and with no layer doc.

## Goals / Non-Goals

**Goals:** bring the harness up to the project's TypeScript/style conventions; give it a real, externalized system prompt; make `runAgent` reusable (query/date params); document the layer.

**Non-Goals:** real-data wiring, transport swap, detection-algorithm changes.

## Decisions

- **Keep the MOCK dataset and the `@anthropic-ai/sdk` transport unchanged.** This is a cleanup; data-wiring and the `fetch` transport are tracked as a separate (BYOK) change. Minimizing surface keeps the two changes independent and reviewable.
- **Externalize the system prompt** to `prompt.ts` as a named export and pass it via `system`, so prompt iteration is a one-file edit and the agent's intended behavior is documented in one place.
- **Parameterize `runAgent(query, today)`** — the date the agent treats as "now" and the request are inputs, not hardcoded literals; required by the dev script and any future caller.
- **Replace `any` tool I/O with real types** and convert `function` declarations to arrows per the repo style; remove the dead `config.ts` flag and populate the barrel.
- **Document the layer** in `src/agents/CLAUDE.md` and link it from the root table so the dev-only, mock-data, do-not-wire-real-data rules are discoverable.

## Risks / Trade-offs

- [Prompt quality is subjective] → grounded against the harness's `ground_truth.json` expectations (filter income, exclude discretionary spend, charity-is-not-a-subscription, low-confidence grey zones), but not asserted by an automated test (that needs a live API key).
- [Keeping the SDK transport] → the deferred BYOK change must still swap to `fetch`; accepted to keep this change scoped.
