import 'dotenv/config';
import { runAgent } from '../src/agents/subscriptionDetective/agent';

async function main() {
  const result = await runAgent();
  console.log('--- РЕЗУЛЬТАТ ---');
  console.log(result);
}

main().catch(console.error);
