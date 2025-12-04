import { GoogleGenerativeAI } from '@google/generative-ai';

// Validate Gemini API key
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Missing GOOGLE_GEMINI_API_KEY - Gemini features will be disabled');
}

// Create Gemini client instance
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Helper function for text generation with Google Gemini
 * FREE tier: 1,500 requests/day
 * Model: gemini-2.0-flash-exp (best free model as of Nov 2024)
 */
export async function createGeminiCompletion(
  prompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
) {
  if (!genAI) {
    return {
      success: false,
      content: '',
      error: 'Gemini API key not configured',
    };
  }

  const {
    temperature = 0.7,
    maxTokens = 1000,
  } = options;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp', // Latest free model
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      content: text,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Helper function for chat-style completions
 */
export async function createGeminiChatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
) {
  if (!genAI) {
    return {
      success: false,
      content: '',
      error: 'Gemini API key not configured',
    };
  }

  const {
    temperature = 0.7,
    maxTokens = 1000,
  } = options;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    // Convert messages to Gemini format
    // System message becomes part of first user message
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const chatHistory = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    // Start chat with history
    const chat = model.startChat({
      history: chatHistory.slice(0, -1), // All but last message
    });

    // Send last message (with system prompt if first message)
    const lastMessage = chatHistory[chatHistory.length - 1];
    const finalPrompt = systemMessage && chatHistory.length === 1
      ? `${systemMessage}\n\n${lastMessage.parts[0].text}`
      : lastMessage.parts[0].text;

    const result = await chat.sendMessage(finalPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      content: text,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
