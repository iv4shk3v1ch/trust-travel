import { createGroqChatCompletion, TRAVEL_CHATBOT_SYSTEM_PROMPT } from './groq';
import { ChatMessage, ChatbotPreferences } from '@/shared/types/chatbot';
// REMOVED: import { getRecommendations } from './recommender'; - was only used in dead getRecommendationsFromPreferences method
import { type ExperienceTag } from '@/shared/utils/dataStandards';

// Define the profile structure based on the database
interface DatabaseProfile {
  id: string;
  full_name?: string;
  age?: number;
  gender?: string;
  activities?: string[];
  personality_traits?: string[];
  trip_style?: string;
  budget_level?: string;
  food_restrictions?: string[];
  spending_style?: string;
  created_at?: string;
  updated_at?: string;
}

export class ChatbotService {
  private systemMessage = {
    role: 'system' as const,
    content: TRAVEL_CHATBOT_SYSTEM_PROMPT
  };

  /**
   * Enhance chatbot preferences with user profile data
   */
  private enhancePreferencesWithProfile(
    chatPreferences: ChatbotPreferences, 
    userProfile: DatabaseProfile | null
  ): ChatbotPreferences {
    if (!userProfile) {
      return chatPreferences;
    }

    const enhanced = { ...chatPreferences };

    // Add user's dietary restrictions and food preferences
    if (userProfile.food_restrictions?.length) {
      console.log('🍽️ Adding dietary restrictions:', userProfile.food_restrictions);
      // Add food-related tags based on restrictions
      const foodTags = userProfile.food_restrictions
        .map((restriction: string) => restriction.toLowerCase().replace(' ', '-')) as ExperienceTag[];
      enhanced.experienceTags = [...new Set([...enhanced.experienceTags, ...foodTags])];
    }

    // Add personality-based preferences
    if (userProfile.personality_traits?.length) {
      console.log('🎭 Adding personality traits:', userProfile.personality_traits);
      const personalityTags = userProfile.personality_traits
        .map((trait: string) => trait.toLowerCase().replace(' ', '-')) as ExperienceTag[];
      enhanced.experienceTags = [...new Set([...enhanced.experienceTags, ...personalityTags])];
    }

    // Add budget preferences (could influence place selection)
    if (userProfile.budget_level) {
      console.log('💰 Adding budget preference:', userProfile.budget_level);
      const budgetTag = userProfile.budget_level.toLowerCase().replace(' ', '-') as ExperienceTag;
      enhanced.experienceTags = [...new Set([...enhanced.experienceTags, budgetTag])];
    }

    // Add spending style preferences
    if (userProfile.spending_style) {
      console.log('💸 Adding spending style:', userProfile.spending_style);
      const spendingTag = userProfile.spending_style.toLowerCase().replace(' ', '-') as ExperienceTag;
      enhanced.experienceTags = [...new Set([...enhanced.experienceTags, spendingTag])];
    }

    // Add activity preferences
    if (userProfile.activities?.length) {
      console.log('🎯 Adding activity preferences:', userProfile.activities);
      const activityTags = userProfile.activities
        .map((activity: string) => activity.toLowerCase().replace(' ', '-')) as ExperienceTag[];
      enhanced.experienceTags = [...new Set([...enhanced.experienceTags, ...activityTags])];
    }

    // Add trip style preferences
    if (userProfile.trip_style) {
      console.log('🗺️ Adding trip style:', userProfile.trip_style);
      const tripStyleTag = userProfile.trip_style.toLowerCase().replace(' ', '-') as ExperienceTag;
      enhanced.experienceTags = [...new Set([...enhanced.experienceTags, tripStyleTag])];
    }

    console.log('✨ Enhanced preferences with profile data:', {
      original: chatPreferences.experienceTags.length,
      enhanced: enhanced.experienceTags.length,
      newTags: enhanced.experienceTags
    });

    return enhanced;
  }

  async processUserMessage(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    userId?: string
  ): Promise<{
    response: string;
    isComplete: boolean;
    preferences?: ChatbotPreferences;
  }> {
    try {
      // No more forced recommendations - let the conversation flow naturally
      console.log('�️ Processing user message naturally');
      console.log('👤 User ID for personalization:', userId || 'anonymous');

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
            
            // Extract the natural response part (everything before READY_FOR_RECOMMENDATIONS)
            const naturalResponse = response.split('READY_FOR_RECOMMENDATIONS')[0].trim();
            const finalResponse = naturalResponse || "Perfect! I understand what you're looking for. Let me find the best places for you...";
            
            return {
              response: finalResponse,
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
      
      // Try to provide fallback recommendations if the message seems like a request
      const message = userMessage.toLowerCase();
      const isPlaceRequest = message.includes('find') || message.includes('show') || 
                            message.includes('recommend') || message.includes('looking for') ||
                            message.includes('want') || message.includes('need') ||
                            message.includes('restaurant') || message.includes('bar') || 
                            message.includes('cafe') || message.includes('museum') ||
                            message.includes('hike') || message.includes('place');
      
      if (isPlaceRequest) {
        const fallbackPrefs = this.createFallbackPreferences(userMessage);
        console.log('🔄 Using fallback preferences due to Groq error:', fallbackPrefs);
        return {
          response: "I'm having trouble connecting to my AI service, but I'll try to help you anyway! Let me find some places based on what you asked...",
          isComplete: true,
          preferences: fallbackPrefs
        };
      }
      
      return {
        response: "I'm sorry, I'm having trouble right now. Could you try asking again?",
        isComplete: false
      };
    }
  }

  // DELETED: getRecommendationsFromPreferences() method - DEAD CODE (85 lines)
  // This method was never called after we moved recommendation logic to chatbot/route.ts
  // It was using the old recommender.ts instead of the new recommendationEngine.ts
  // If needed in future, use getIntentBasedRecommendations from recommendationEngine.ts instead

  private createFallbackPreferences(userMessage: string): ChatbotPreferences {
    // Enhanced fallback logic based on keywords in user message
    const message = userMessage.toLowerCase();
    const categories: string[] = [];
    const experienceTags: string[] = [];
    
    // Check for specific category queries first (highest priority)
    const isRestaurantQuery = message.includes('restaurant') || message.includes('food') || message.includes('eat') || 
                             message.includes('dining') || message.includes('meal') || message.includes('dinner') || 
                             message.includes('lunch') || message.includes('breakfast') || message.includes('brunch');
    
    const isHikingQuery = message.includes('hike') || message.includes('hiking') || message.includes('trail') || 
                         message.includes('mountain') || message.includes('trek');
    
    const isNatureQuery = message.includes('nature') || message.includes('outdoor') || message.includes('forest') || 
                         message.includes('scenery') || message.includes('view');
    
    const isBarQuery = message.includes('bar') || message.includes('drink') || message.includes('cocktail') || 
                      message.includes('beer') || message.includes('pub') || message.includes('wine');
    
    const isCoffeeQuery = message.includes('coffee') || message.includes('cafe');
    
    const isMuseumQuery = message.includes('museum') || message.includes('art') || message.includes('culture') || 
                         message.includes('history') || message.includes('exhibition');
    
    // Check for general/broad queries only if no specific category detected
    const isGeneralQuery = !isRestaurantQuery && !isHikingQuery && !isNatureQuery && !isBarQuery && 
                          !isCoffeeQuery && !isMuseumQuery && (
                          message.includes('top places') || 
                          message.includes('best places') || 
                          message.includes('what to visit') || 
                          message.includes('places to visit') || 
                          message.includes('things to do') || 
                          message.includes('recommendations') ||
                          message.includes('show me places') ||
                          message.includes('popular places') ||
                          message.includes('must visit') ||
                          message.includes('tourist attractions') ||
                          message.includes('top things') ||
                          message.includes('best things') ||
                          message.includes('what to do') ||
                          message.includes('attractions') ||
                          (message.includes('trento') && (message.includes('visit') || message.includes('see') || message.includes('explore'))));
    
    if (isRestaurantQuery) {
      categories.push('restaurant');
      experienceTags.push('great-food', 'authentic-local');
      console.log('🍽️ Detected restaurant query - using restaurant category only');
    } else if (isGeneralQuery) {
      // For general queries, include diverse categories to show variety
      categories.push(
        'restaurant', 'museum', 'historical-landmark', 'park', 'viewpoint', 
        'cafe', 'aperetivo-bar'
      );
      experienceTags.push('local-favorite', 'authentic-local');
      console.log('🎯 Detected general query - using diverse categories');
    } else {
      // Enhanced keyword matching for specific categories
      if (isHikingQuery) {
        categories.push('hiking-trail', 'park', 'viewpoint');
        experienceTags.push('scenic-view', 'peaceful');
      }
      else if (isNatureQuery) {
        categories.push('park', 'viewpoint', 'hiking-trail');
        experienceTags.push('scenic-view', 'peaceful');
      }
      else if (isBarQuery) {
        categories.push('aperetivo-bar', 'craft-beer-pub');
        if (message.includes('friend') || message.includes('hangout') || message.includes('social')) {
          experienceTags.push('great-for-friends', 'lively');
        }
      }
      else if (isCoffeeQuery) {
        categories.push('cafe', 'specialty-coffee');
        experienceTags.push('cozy');
      }
      else if (isMuseumQuery) {
        categories.push('museum', 'historical-landmark', 'art-gallery');
        experienceTags.push('artsy', 'peaceful');
      }
      else if (message.includes('adventure') || message.includes('sport') || message.includes('activity')) {
        categories.push('adventure-park', 'hiking-trail');
      }
      else if (message.includes('beach') || message.includes('water') || message.includes('swim')) {
        categories.push('beach', 'lake');
      }
      else if (message.includes('shop') || message.includes('shopping') || message.includes('buy')) {
        categories.push('shopping-centre', 'local-market', 'artisanal-shop');
      }
      else {
        // Default for unclear specific queries - still show some variety
        categories.push('restaurant', 'museum', 'park');
        experienceTags.push('authentic-local');
      }
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

    console.log(`🎯 Fallback preferences created:`, {
      isGeneral: isGeneralQuery,
      categories: categories.length,
      tags: experienceTags.length,
      message: userMessage.substring(0, 50)
    });

    return {
      intent: 'goal-oriented', // Fallback always assumes user wants recommendations
      categories: categories,
      experienceTags: experienceTags,
      destination: 'trento-city',
      budget: 'medium',
      summary: `Based on your request: ${userMessage.substring(0, 80)}...`
    };
  }

  // DELETED: createMustSeePreferences() method - DEAD CODE (13 lines)
  // This method was never called anywhere in the codebase
  // If needed in future, the logic is simple enough to recreate
}

export const chatbotService = new ChatbotService();