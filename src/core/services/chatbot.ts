import { createGroqChatCompletion, TRAVEL_CHATBOT_SYSTEM_PROMPT } from './groq';
import { ChatMessage, ChatbotPreferences } from '@/shared/types/chatbot';
import { getRecommendations } from './recommender';
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
      // Force recommendations after 2 exchanges to prevent endless conversations
      const userMessageCount = conversationHistory.filter(msg => msg.role === 'user').length;
      const shouldForceRecommendations = userMessageCount >= 1; // Force after first user message
      
      if (shouldForceRecommendations) {
        console.log('🔄 Forcing recommendations after conversation exchange');
        console.log('👤 User ID for personalization:', userId || 'anonymous');
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
      return {
        response: "I'm sorry, I'm having trouble right now. Could you try asking again?",
        isComplete: false
      };
    }
  }

  async getRecommendationsFromPreferences(
    preferences: ChatbotPreferences,
    userId?: string,
    userProfile?: DatabaseProfile | null
  ) {
    try {
      console.log('🎯 Getting recommendations with user personalization...');
      
      // Enhance preferences with user profile data if available
      let enhancedPreferences = preferences;
      if (userProfile) {
        console.log('✅ User profile provided, enhancing preferences');
        enhancedPreferences = this.enhancePreferencesWithProfile(preferences, userProfile);
      } else if (userId) {
        console.log('⚠️ User ID provided but no profile data, using chat preferences only');
      } else {
        console.log('🔒 No user context provided, using chat preferences only');
      }

      // Convert chatbot preferences to travel plan format for recommender
      const travelPlan = {
        destination: {
          area: enhancedPreferences.destination,
          region: 'trento'
        },
        dates: {
          type: 'now' as const,
          isFlexible: true
        },
        travelType: 'solo' as const, // Default, could be enhanced later
        experienceTags: enhancedPreferences.experienceTags as ExperienceTag[],
        specialNeeds: [],
        completedSteps: [1, 2, 3, 4, 5, 6],
        isComplete: true
      };

      console.log('🚀 Calling recommender with enhanced travel plan:', {
        experienceTags: travelPlan.experienceTags,
        destination: travelPlan.destination,
        userId: userId
      });

      // Get recommendations using existing recommender system with user context
      const recommendations = await getRecommendations(travelPlan, userId);

      // Only filter by categories for specific queries, not general ones
      const isGeneralQuery = enhancedPreferences.categories.length >= 5 ||
                            enhancedPreferences.experienceTags.some(tag => 
                              ['popular', 'highly-rated', 'authentic-local'].includes(tag)
                            );
      
      if (!isGeneralQuery && enhancedPreferences.categories.length > 0 && enhancedPreferences.categories.length <= 3) {
        // Only filter for specific queries with few categories
        const filtered = recommendations.filter(place => 
          enhancedPreferences.categories.includes(place.category)
        );
        console.log(`🎯 Specific query - filtered recommendations: ${filtered.length}/${recommendations.length} places`);
        return filtered;
      }

      console.log(`✨ General query - returning all ${recommendations.length} diverse recommendations`);
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
    
    // Check for general/broad queries first
    const isGeneralQuery = message.includes('top places') || 
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
                          (message.includes('trento') && (message.includes('visit') || message.includes('see') || message.includes('explore')));
    
    if (isGeneralQuery) {
      // For general queries, include diverse categories to show variety
      categories.push(
        'restaurant', 'museum', 'historical-site', 'park', 'viewpoint', 
        'coffee-shop', 'bar', 'attraction', 'adventure-activity'
      );
      experienceTags.push('popular', 'highly-rated', 'authentic-local');
      console.log('🎯 Detected general query - using diverse categories');
    } else {
      // Enhanced keyword matching for specific categories
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
      categories: categories,
      experienceTags: experienceTags,
      destination: 'trento-city',
      budget: 'medium',
      summary: `Based on your request: ${userMessage.substring(0, 80)}...`
    };
  }
}

export const chatbotService = new ChatbotService();