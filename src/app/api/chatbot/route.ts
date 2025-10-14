import { NextRequest, NextResponse } from "next/server";
import { chatbotService } from "@/core/services/chatbot";
import { ChatMessage } from "@/shared/types/chatbot";

export async function POST(request: NextRequest) {
  try {
    console.log(" Chatbot API endpoint called");
    
    const body = await request.json();
    const { message, conversationHistory } = body;

    console.log(" Received message:", message);
    console.log(" Conversation history length:", conversationHistory?.length || 0);

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    const history: ChatMessage[] = conversationHistory || [];

    console.log(" Calling chatbot service...");
    const result = await chatbotService.processUserMessage(message, history);
    
    console.log(" Chatbot response generated successfully");
    console.log(" Is complete:", result.isComplete);

    let places: unknown[] = [];
    
    // Always try to get recommendations if preferences are provided OR for common queries
    const shouldGetRecommendations = result.preferences || 
      message.toLowerCase().includes('trento') || 
      message.toLowerCase().includes('must-see') || 
      message.toLowerCase().includes('top places') || 
      message.toLowerCase().includes('restaurant') || 
      message.toLowerCase().includes('attractions') ||
      message.toLowerCase().includes('things to do') ||
      message.toLowerCase().includes('visit') ||
      message.toLowerCase().includes('places') ||
      message.toLowerCase().includes('dinner') ||
      message.toLowerCase().includes('lunch') ||
      message.toLowerCase().includes('food') ||
      message.toLowerCase().includes('eat');
    
    if (shouldGetRecommendations) {
      try {
        console.log(" Getting recommendations from preferences...");
        let preferences = result.preferences;
        
        // If no preferences but it's a common query, create basic preferences
        if (!preferences) {
          const msg = message.toLowerCase();
          if (msg.includes('must-see') || msg.includes('top places') || msg.includes('attractions')) {
            preferences = {
              categories: ['museum', 'historical-site', 'viewpoint', 'attraction', 'restaurant'],
              experienceTags: ['highly-rated', 'popular', 'must-visit'],
              destination: 'trento-city',
              budget: 'medium',
              summary: 'Must-see attractions in Trento'
            };
          } else if (msg.includes('restaurant') || msg.includes('food') || msg.includes('dinner') || 
                     msg.includes('lunch') || msg.includes('eat') || msg.includes('dining') || 
                     msg.includes('meal') || msg.includes('breakfast') || msg.includes('brunch')) {
            preferences = {
              categories: ['restaurant'],
              experienceTags: ['highly-rated', 'authentic-local'],
              destination: 'trento-city',
              budget: 'medium',
              summary: 'Top restaurants in Trento'
            };
          } else {
            // Default for general queries
            preferences = {
              categories: ['restaurant', 'museum', 'historical-site', 'park', 'viewpoint'],
              experienceTags: ['popular', 'highly-rated'],
              destination: 'trento-city',
              budget: 'medium',
              summary: 'Popular places in Trento'
            };
          }
          console.log("🎯 Created basic preferences for query:", preferences);
        }
        // Override wrong preferences for restaurant queries
        else if (result.preferences && (message.toLowerCase().includes('restaurant') || 
                 message.toLowerCase().includes('food') || message.toLowerCase().includes('dinner') || 
                 message.toLowerCase().includes('lunch') || message.toLowerCase().includes('eat') || 
                 message.toLowerCase().includes('dining') || message.toLowerCase().includes('meal'))) {
          // Check if the preferences include non-restaurant categories
          if (result.preferences.categories.some(cat => !['restaurant', 'bar', 'coffee-shop', 'fast-food'].includes(cat))) {
            console.log("🔧 Fixing restaurant query - overriding broad categories");
            preferences = {
              categories: ['restaurant'],
              experienceTags: ['highly-rated', 'authentic-local'],
              destination: 'trento-city',
              budget: 'medium',
              summary: 'Top restaurants in Trento'
            };
          }
        }
        
        const recommendations = await chatbotService.getRecommendationsFromPreferences(
          preferences
        );
        console.log("🎯 Final preferences being sent to recommender:", {
          categories: preferences.categories,
          experienceTags: preferences.experienceTags
        });
        places = recommendations || [];
        console.log(" Places found:", places.length);
      } catch (error) {
        console.error("Error getting recommendations:", error);
      }
    }

    return NextResponse.json({
      success: true,
      response: result.response,
      isComplete: result.isComplete || places.length > 0, // Mark complete if we have places
      preferences: result.preferences,
      places: places
    });

  } catch (error) {
    console.error(" Error in chatbot API:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process message",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
