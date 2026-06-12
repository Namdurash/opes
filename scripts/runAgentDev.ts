import 'dotenv/config';
import { runAgent } from '../src/agents/subscriptionDetective';

const TODAY = '2026-05-07';
const QUERY = 'Find recurring subscriptions in my transactions from the last 90 days.';

const main = async (): Promise<void> => {
  const result = await runAgent(QUERY, TODAY);
  console.log('--- RESULT ---');
  console.log(result);
};

main().catch(console.error);
