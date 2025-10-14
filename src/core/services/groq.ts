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
export const TRAVEL_CHATBOT_SYSTEM_PROMPT = `You are a helpful travel assistant for Trento, Italy. You provide immediate recommendations without endless questions.

IMPORTANT: NEVER mention specific place names, addresses, or businesses in your responses. The system will show actual places on the map based on your preferences.

CORE BEHAVIOR:
- When users ask about Trento places, ALWAYS provide recommendations immediately
- Be brief: 1-2 sentences maximum  
- Don't ask clarifying questions - make reasonable assumptions
- For any place-related query about Trento, provide recommendations
- Focus on the TYPE of experience, not specific venues

SPECIAL KEYWORDS:
- "must-see", "top attractions", "best places" = HIGH-RATED diverse places
- "restaurant", "food", "dinner", "lunch", "eat", "dining", "meal" = ONLY restaurants
- "hiking", "nature" = outdoor activities
- General queries = diverse mix

RESPONSE FORMAT:
- Keep response under 2 sentences
- ALWAYS end with "READY_FOR_RECOMMENDATIONS" + VALID JSON with double quotes for Trento place queries
- JSON must use double quotes around all property names and string values
- Be decisive and helpful
- NEVER mention specific place names - let the map show the actual places

Example responses:
User: "must-see places in Trento"
You: "Here are Trento's absolute must-see attractions! READY_FOR_RECOMMENDATIONS {"categories": ["museum", "historical-site", "viewpoint"], "experienceTags": ["highly-rated", "must-visit"], "destination": "trento-city", "budget": "medium", "summary": "Must-see Trento highlights"}"

User: "restaurants in Trento"  
You: "Great restaurants coming up! READY_FOR_RECOMMENDATIONS {"categories": ["restaurant"], "experienceTags": ["highly-rated", "authentic-local"], "destination": "trento-city", "budget": "medium", "summary": "Top Trento restaurants"}"

User: "dinner place in trento"
You: "Perfect dinner spots coming right up! READY_FOR_RECOMMENDATIONS {"categories": ["restaurant"], "experienceTags": ["highly-rated", "authentic-local"], "destination": "trento-city", "budget": "medium", "summary": "Best dinner restaurants in Trento"}"

User: "going out for a beer"
You: "Great choice for a casual beer! READY_FOR_RECOMMENDATIONS {"categories": ["bar"], "experienceTags": ["relaxed-atmosphere", "local-beer"], "destination": "trento-city", "budget": "low", "summary": "Best beer spots in Trento"}"

Remember: Focus on experience types, never specific venue names!`;