import Anthropic from '@anthropic-ai/sdk';
import { fetchInRange } from './transactionSource';

export const getTransactionsTool: Anthropic.Tool = {
  name: 'get_transactions',
  description:
    "Fetches the user's transactions for a given date range. Returns transactions with merchant name, amount in UAH, MCC code, and date.",
  input_schema: {
    type: 'object',
    properties: {
      from_date: {
        type: 'string',
        description: 'Start date in ISO format (yyyy-mm-dd)',
      },
      to_date: {
        type: 'string',
        description: 'End date in ISO format (yyyy-mm-dd)',
      },
    },
    required: ['from_date', 'to_date'],
  },
};

export async function executeTool(name: string, input: any): Promise<string> {
  if (name === 'get_transactions') {
    const txs = await fetchInRange(input.from_date, input.to_date);
    // console.log('INTERNAL RESULT:', txs);
    return JSON.stringify(txs);
  }
  throw new Error(`Unknown tool: ${name}`);
}
