import OpenAI from 'openai';

// Validate OpenAI API key
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing env.OPENAI_API_KEY');
}

// Create OpenAI client instance
export const openai = new OpenAI({
  apiKey: apiKey,
});

// Helper function for chat completions
export async function createChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
) {
  const {
    model = 'gpt-3.5-turbo',
    temperature = 0.7,
    maxTokens = 1000,
  } = options;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI response');
  }
}

// Helper function for embeddings
export async function createEmbedding(text: string, model = 'text-embedding-ada-002') {
  try {
    const response = await openai.embeddings.create({
      model,
      input: text,
    });

    return response.data[0]?.embedding || [];
  } catch (error) {
    console.error('OpenAI embedding error:', error);
    throw new Error('Failed to create embedding');
  }
}
