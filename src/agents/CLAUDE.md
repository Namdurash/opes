# Agents

LLM agents that analyse the user's finances. Today this is a single agent —
**Subscription Detective** ([subscriptionDetective/](subscriptionDetective/)) —
which inspects transactions and reports recurring subscriptions.

This layer is currently a **standalone, dev-only harness**: it is exercised
through the `agent:dev` script, not from any screen or store. It runs on Node
(via `tsx`), not in the React Native bundle. Wiring it into the app as a real,
in-app feature is a separate, deferred task.

## Running it

```sh
npm run agent:dev   # tsx scripts/runAgentDev.ts
```

Requires `CLAUDE_API_KEY` in the environment (loaded from `.env` via
`dotenv/config` in the script).

## Folder shape

```
src/agents/subscriptionDetective/
  agent.ts              # runAgent(query, today) — the tool-use loop
  prompt.ts             # exported system prompt for the task
  tools.ts              # get_transactions tool definition + executeTool dispatcher
  transactionSource.ts  # fetchInRange — the data source
  types.ts              # RawTransaction / NormalizedTransaction
  __mocks__/            # mock dataset + ground-truth eval fixture
  index.ts              # barrel — public API of the agent
```

## Rules

- **Transport:** the agent calls Claude through the official `@anthropic-ai/sdk`
  (`client.messages.create`) in a manual tool-use loop. Keep this call shape;
  don't hand-roll HTTP here.
- **Data source is the MOCK dataset.** [transactionSource.ts](subscriptionDetective/transactionSource.ts)
  reads `__mocks__/mock_transactions.json`. Do **not** import the app's
  WatermelonDB repositories or Monobank service from this layer — it must stay
  runnable on plain Node with no native modules. Connecting real data is a
  deferred task.
- **No `any`.** Tool inputs arrive as `unknown`; narrow them before use (see
  `isGetTransactionsInput` in [tools.ts](subscriptionDetective/tools.ts)).
- **Comments and logs in English.** The mock data and eval fixtures keep their
  original (Ukrainian) merchant strings — those are data, not prose.
- **Arrow functions only**, matching the rest of the codebase.
