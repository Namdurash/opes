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

interface GetTransactionsInput {
  from_date: string;
  to_date: string;
}

const isGetTransactionsInput = (input: unknown): input is GetTransactionsInput => {
  if (typeof input !== 'object' || input === null) {
    return false;
  }
  const { from_date, to_date } = input as Record<string, unknown>;
  return typeof from_date === 'string' && typeof to_date === 'string';
};

export const executeTool = async (
  name: string,
  input: unknown,
): Promise<string> => {
  if (name === 'get_transactions') {
    if (!isGetTransactionsInput(input)) {
      throw new Error('get_transactions called with invalid input.');
    }
    const txs = await fetchInRange(input.from_date, input.to_date);
    return JSON.stringify(txs);
  }
  throw new Error(`Unknown tool: ${name}`);
};
