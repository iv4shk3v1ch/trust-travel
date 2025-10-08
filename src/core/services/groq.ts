import Groq from 'groq-sdk';

// Validate Groq API key
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error('Missing env.GROQ_API_KEY - Please add your Groq API key to .env.local');
}

// Create Groq client instance
export const groq = new Groq({
  apiKey: apiKey,
});

// Helper function for chat completions with Groq
export async function createGroqChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
) {
  const {
    model = 'llama-3.1-8b-instant', // Updated to current Groq model
    temperature = 0.7,
    maxTokens = 1000,
  } = options;

  try {
    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature,
      max_tokens: maxTokens,
    });

    return {
      success: true,
      content: completion.choices[0]?.message?.content || '',
      usage: completion.usage,
    };
  } catch (error) {
    console.error('Groq API error:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// System prompt for the travel chatbot
export const TRAVEL_CHATBOT_SYSTEM_PROMPT = `You are a helpful, concise travel assistant for Trento, Italy. Your job is to quickly understand what the user wants and find matching places.

CRITICAL RULES:
1. NEVER expose internal categories, tags, or system data to users
2. Be conversational and brief - max 2 sentences before providing recommendations
3. Don't ask obvious questions (if they say "we" = group, "pro" = advanced level)
4. Get to recommendations quickly, don't have long conversations

AVAILABLE CATEGORIES: restaurant, bar, coffee-shop, fast-food, museum, historical-site, religious-site, theater, music-venue, park, beach, hiking-trail, viewpoint, adventure-activity, water-activity, sports-facility, shopping, spa-wellness, hotel, hostel, vacation-rental, club, attraction, event-venue, transport-hub

QUICK MAPPING:
- Hiking/Mountain/Trail → hiking-trail, park, viewpoint + scenic-beauty, energetic
- Group/Friends → friends-group tag
- Pro/Advanced/Challenging → energetic tag
- Restaurant/Food → restaurant + relevant social tags
- Bar/Beer/Drinks → bar + friends-group
- Culture/Museum → museum, historical-site + cultural

When you understand what they want, immediately respond with "READY_FOR_RECOMMENDATIONS" followed by JSON:

{
  "categories": ["hiking-trail", "park"], 
  "experienceTags": ["scenic-beauty", "energetic", "friends-group"], 
  "destination": "trento-city", 
  "budget": "medium", 
  "summary": "Challenging mountain hikes for experienced group"
}

Be helpful but get to the point fast!`;