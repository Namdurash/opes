import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { fetchInRange } from '../src/agents/subscriptionDetective/transactionSource';
import { getTransactionsTool } from '../src/agents/subscriptionDetective/tools';
import { runAgent } from '../src/agents/subscriptionDetective/agent';

async function main() {
  const result = await runAgent();
  console.log('--- РЕЗУЛЬТАТ ---');
  console.log(result);
}

main().catch(console.error);
