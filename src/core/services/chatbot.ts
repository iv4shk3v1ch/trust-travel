import { createGroqChatCompletion, TRAVEL_CHATBOT_SYSTEM_PROMPT } from './groq';
import { ChatMessage, ChatbotPreferences } from '@/shared/types/chatbot';
import { getRecommendations } from './recommender';
import { type ExperienceTag } from '@/shared/utils/dataStandards';

export class ChatbotService {
  private systemMessage = {
    role: 'system' as const,
    content: TRAVEL_CHATBOT_SYSTEM_PROMPT
  };

  async processUserMessage(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<{
    response: string;
    isComplete: boolean;
    preferences?: ChatbotPreferences;
  }> {
    try {
      // Force recommendations after 2 exchanges to prevent endless conversations
      const userMessageCount = conversationHistory.filter(msg => msg.role === 'user').length;
      const shouldForceRecommendations = userMessageCount >= 1; // Force after first user message
      
      if (shouldForceRecommendations) {
        console.log('🔄 Forcing recommendations after conversation exchange');
        const fallbackPrefs = this.createFallbackPreferences(userMessage);
        console.log('🎯 Forced preferences:', fallbackPrefs);
        return {
          response: "Got it! Let me find the perfect places for you...",
          isComplete: true,
          preferences: fallbackPrefs
        };
      }

      // Prepare conversation for Groq
      const messages = [
        this.systemMessage,
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: userMessage
        }
      ];

      // Get response from Groq
      const result = await createGroqChatCompletion(messages, {
        temperature: 0.7,
        maxTokens: 300 // Reduced to encourage shorter responses
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to get chatbot response');
      }

      const response = result.content.trim();

      // Check if chatbot is ready to provide recommendations
      if (response.includes('READY_FOR_RECOMMENDATIONS')) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const preferences = JSON.parse(jsonMatch[0]) as ChatbotPreferences;
            console.log('✅ Successfully parsed preferences:', preferences);
            return {
              response: "Perfect! I understand what you're looking for. Let me find the best places for you...",
              isComplete: true,
              preferences
            };
          } catch (parseError) {
            console.error('Failed to parse preferences JSON:', parseError);
            console.error('Raw JSON string:', jsonMatch[0]);
            const fallbackPrefs = this.createFallbackPreferences(userMessage);
            console.log('🔄 Using fallback preferences:', fallbackPrefs);
            return {
              response: "I think I understand what you're looking for. Let me find some great places for you!",
              isComplete: true,
              preferences: fallbackPrefs
            };
          }
        }
      }

      return {
        response,
        isComplete: false
      };

    } catch (error) {
      console.error('Chatbot service error:', error);
      return {
        response: "I'm sorry, I'm having trouble right now. Could you try asking again?",
        isComplete: false
      };
    }
  }

  async getRecommendationsFromPreferences(
    preferences: ChatbotPreferences,
    userId?: string
  ) {
    try {
      // Convert chatbot preferences to travel plan format for recommender
      const travelPlan = {
        destination: {
          area: preferences.destination,
          region: 'trento'
        },
        dates: {
          type: 'now' as const,
          isFlexible: true
        },
        travelType: 'solo' as const, // Default, could be enhanced later
        experienceTags: preferences.experienceTags as ExperienceTag[],
        specialNeeds: [],
        completedSteps: [1, 2, 3, 4, 5, 6],
        isComplete: true
      };

      // Get recommendations using existing recommender system
      const recommendations = await getRecommendations(travelPlan, userId);

      // Filter by categories if specified
      if (preferences.categories.length > 0) {
        return recommendations.filter(place => 
          preferences.categories.includes(place.category)
        );
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations from preferences:', error);
      throw error;
    }
  }

  private createFallbackPreferences(userMessage: string): ChatbotPreferences {
    // Enhanced fallback logic based on keywords in user message
    const message = userMessage.toLowerCase();
    const categories: string[] = [];
    const experienceTags: string[] = [];
    
    // Enhanced keyword matching for categories
    if (message.includes('hike') || message.includes('hiking') || message.includes('trail') || 
        message.includes('mountain') || message.includes('trek')) {
      categories.push('hiking-trail', 'park', 'viewpoint');
      experienceTags.push('scenic-beauty', 'peaceful');
    }
    else if (message.includes('nature') || message.includes('outdoor') || message.includes('forest') || 
             message.includes('scenery') || message.includes('view')) {
      categories.push('park', 'viewpoint', 'hiking-trail');
      experienceTags.push('scenic-beauty', 'peaceful');
    }
    else if (message.includes('restaurant') || message.includes('food') || message.includes('eat') || 
             message.includes('dining') || message.includes('meal')) {
      categories.push('restaurant');
    }
    else if (message.includes('bar') || message.includes('drink') || message.includes('cocktail') || 
             message.includes('beer') || message.includes('pub') || message.includes('wine')) {
      categories.push('bar');
      if (message.includes('friend') || message.includes('hangout') || message.includes('social')) {
        experienceTags.push('friends-group');
      }
    }
    else if (message.includes('coffee') || message.includes('cafe')) {
      categories.push('coffee-shop');
    }
    else if (message.includes('museum') || message.includes('art') || message.includes('culture') || 
             message.includes('history') || message.includes('exhibition')) {
      categories.push('museum', 'historical-site');
      experienceTags.push('cultural');
    }
    else if (message.includes('adventure') || message.includes('sport') || message.includes('activity')) {
      categories.push('adventure-activity', 'sports-facility');
      experienceTags.push('energetic');
    }
    else if (message.includes('beach') || message.includes('water') || message.includes('swim')) {
      categories.push('beach', 'water-activity');
    }
    else if (message.includes('shop') || message.includes('shopping') || message.includes('buy')) {
      categories.push('shopping');
    }

    // Enhanced keyword matching for experience tags
    if (message.includes('romantic') || message.includes('date') || message.includes('couple')) {
      experienceTags.push('romantic');
    }
    if (message.includes('family') || message.includes('kids') || message.includes('children')) {
      experienceTags.push('family-friendly');
    }
    if (message.includes('friend') || message.includes('group') || message.includes('hangout') || 
        message.includes('social') || message.includes('together')) {
      experienceTags.push('friends-group');
    }
    if (message.includes('alone') || message.includes('solo') || message.includes('myself')) {
      experienceTags.push('solo-friendly');
    }
    if (message.includes('quiet') || message.includes('peaceful') || message.includes('relax') || 
        message.includes('calm') || message.includes('tranquil')) {
      experienceTags.push('peaceful');
    }
    if (message.includes('budget') || message.includes('cheap') || message.includes('affordable') || 
        message.includes('inexpensive')) {
      experienceTags.push('budget-friendly');
    }
    if (message.includes('luxury') || message.includes('fancy') || message.includes('upscale') || 
        message.includes('expensive')) {
      experienceTags.push('luxury');
    }
    if (message.includes('local') || message.includes('authentic') || message.includes('traditional')) {
      experienceTags.push('authentic-local');
    }

    return {
      categories: categories.length > 0 ? categories : ['restaurant'], // Default to restaurant only if nothing matches
      experienceTags: experienceTags.length > 0 ? experienceTags : ['authentic-local'],
      destination: 'trento-city',
      budget: 'medium',
      summary: `Based on your request: ${userMessage.substring(0, 80)}...`
    };
  }
}

export const chatbotService = new ChatbotService();