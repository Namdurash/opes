## 1. Prompt

- [x] 1.1 Write and export `SUBSCRIPTION_DETECTIVE_SYSTEM_PROMPT` in `prompt.ts`
- [x] 1.2 Pass it as the `system` parameter in `runAgent`

## 2. Agent harness

- [x] 2.1 Parameterize `runAgent(query, today)`; remove the hardcoded query/date
- [x] 2.2 Replace `any` with real types; convert `function` declarations to arrow consts
- [x] 2.3 Remove the unused `config.ts` flag; populate the `index.ts` barrel
- [x] 2.4 Keep the `@anthropic-ai/sdk` transport unchanged

## 3. Tooling & docs

- [x] 3.1 Add the `package.json` `agent:dev` script (`tsx scripts/runAgentDev.ts`) and update `runAgentDev.ts` to pass query/date
- [x] 3.2 Add `src/agents/CLAUDE.md` and link it from the root `CLAUDE.md` layer table

## 4. Definition of Done

- [x] 4.1 `npx tsc --noEmit`, `npm run lint`, and `npm test` all pass; no `any`/`function`, comments in English
