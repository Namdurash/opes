import Anthropic from '@anthropic-ai/sdk';
import { SUBSCRIPTION_DETECTIVE_SYSTEM_PROMPT } from './prompt';
import { executeTool, getTransactionsTool } from './tools';

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 2048;
const MAX_ITERATIONS = 8;

/**
 * Runs the Subscription Detective agent loop against the mock transaction
 * dataset and returns the agent's final natural-language report.
 *
 * @param query The user's request, e.g. "Find recurring subscriptions...".
 * @param today The reference date (yyyy-mm-dd) the agent should treat as "now".
 */
export const runAgent = async (query: string, today: string): Promise<string> => {
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  if (!claudeApiKey) {
    console.error(
      'Error: CLAUDE_API_KEY is not set in the environment variables.',
    );
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: claudeApiKey });

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Today is ${today}. ${query}`,
    },
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SUBSCRIPTION_DETECTIVE_SYSTEM_PROMPT,
      tools: [getTransactionsTool],
      messages,
    });

    // Keep the assistant turn in the running history.
    messages.push({ role: 'assistant', content: response.content });

    // Model finished — return its text answer.
    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text');
      return textBlock && textBlock.type === 'text' ? textBlock.text : '';
    }

    // Execute every tool_use block and collect the results.
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        console.log(`[loop iter ${i}] tool call: ${block.name}`, block.input);
        const result = await executeTool(block.name, block.input);
        console.log('RESULT:', result);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    // All tool results for this iteration go back in a single user message.
    messages.push({ role: 'user', content: toolResults });
  }

  throw new Error('Agent exceeded max iterations');
};
