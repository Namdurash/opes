import Anthropic from '@anthropic-ai/sdk';
import { executeTool, getTransactionsTool } from './tools';

export async function runAgent(): Promise<string> {
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
      content:
        'Today is 2026-05-07. Find recurring subscriptions in my transactions from the last 90 days.',
    },
  ];

  for (let i = 0; i < 8; i++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      tools: [getTransactionsTool],
      messages,
    });

    // Додаємо assistant message в історію
    messages.push({ role: 'assistant', content: response.content });

    // console.log(`[INTERNAL ${i}] assistant response:`, response);

    // Якщо модель закінчила — повертаємо текст
    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text');
      return textBlock && textBlock.type === 'text' ? textBlock.text : '';
    }

    // Виконуємо всі tool_use блоки і збираємо результати в один user message
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        console.log(`[loop iter ${i}] tool call: ${block.name}`, block.input);
        const result = await executeTool(block.name, block.input);
        console.log(`RESULT:`, result);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    // ВСІ tool_result-и за одну ітерацію йдуть в одному user message
    messages.push({ role: 'user', content: toolResults });
  }

  throw new Error('Agent exceeded max iterations');
}
