import { NextRequest, NextResponse } from "next/server";
import { chatbotService } from "@/core/services/chatbot";
import { ChatMessage } from "@/shared/types/chatbot";
// REMOVED: intentClassifier - now handled in single Groq call via chatbot prompt
// import { classifyIntent, getResponseStrategy } from "@/core/services/intentClassifier";
import { getIntentBasedRecommendations, type RecommendationContext } from "@/core/services/recommendationEngineV2";
import { interactionTracker } from "@/core/services/interactionTracker";
import { supabase } from "@/core/database/supabase";

export async function POST(request: NextRequest) {
  try {
    console.log("💬 Chatbot API endpoint called");
    
    const body = await request.json();
    const { message, conversationHistory } = body;

    console.log("📨 Received message:", message);
    console.log("📚 Conversation history length:", conversationHistory?.length || 0);

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    const history: ChatMessage[] = conversationHistory || [];

    // Get current user for personalization
    const { data: { user } } = await supabase.auth.getUser();

    // Step 1: Process message with chatbot service (includes intent classification in single API call)
    console.log("🤖 Calling chatbot service...");
    const result = await chatbotService.processUserMessage(message, history);
    
    console.log("✅ Chatbot response generated successfully");
    console.log("📊 Is complete:", result.isComplete);

    // Step 2: Extract intent from chatbot preferences (parsed from Groq JSON response)
    const userIntent = result.preferences?.intent || 'informational'; // Default to informational
    const intentConfidence = result.preferences ? 0.9 : 0.5; // High confidence if preferences present
    
    console.log("🎯 Intent from chatbot response:", {
      intent: userIntent,
      hasPreferences: !!result.preferences,
      confidence: intentConfidence
    });

    // Step 3: Track chatbot interaction with intent
    if (user) {
      await interactionTracker.trackChatbotQuery(
        message,
        userIntent,
        {
          page: 'chatbot',
          confidence: intentConfidence,
          has_preferences: !!result.preferences
        }
      );
    }

    let places: unknown[] = [];
    
    // Step 4: Get intent-based recommendations (only for goal-oriented and discovery intents)
    const needsRecommendations = (userIntent === 'goal-oriented' || userIntent === 'discovery') 
      && result.isComplete;
    
    if (needsRecommendations && result.preferences) {
      try {
        console.log("🗺️ Intent requires recommendations - using recommendation engine...");
        
        // Build recommendation context from chatbot preferences
        const context: RecommendationContext = {
          intent: userIntent,
          userId: user?.id,
          location: result.preferences.destination || 'Trento',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          categories: result.preferences.categories as any, // Type assertion - categories from chatbot are valid
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          experienceTags: result.preferences.experienceTags as any, // Type assertion - tags from chatbot are valid
          budget: result.preferences.budget,
        };

        // Add time context for "now" queries
        if (message.toLowerCase().includes('now') || message.toLowerCase().includes('tonight')) {
          context.timeContext = 'now';
        }

        console.log("🎯 Recommendation context:", {
          intent: context.intent,
          categories: context.categories,
          experienceTags: context.experienceTags,
          userId: context.userId ? 'provided' : 'anonymous'
        });
        
        // Call new recommendation engine
        const recommendations = await getIntentBasedRecommendations(context, 20);
        places = recommendations || [];
        console.log("✅ Places found with intent-based ranking:", places.length);
      } catch (error) {
        console.error("❌ Error getting intent-based recommendations:", error);
      }
    } else if (userIntent === 'informational') {
      console.log("ℹ️ Intent is informational - skipping recommendations");
    } else {
      console.log("💬 Intent needs more conversation - skipping recommendations");
    }

    return NextResponse.json({
      success: true,
      response: result.response,
      isComplete: result.isComplete || places.length > 0,
      preferences: result.preferences,
      places: places,
      // Include intent info for debugging/analytics
      intent: {
        type: userIntent,
        confidence: intentConfidence,
        fromPreferences: !!result.preferences
      }
    });

  } catch (error) {
    console.error("❌ Error in chatbot API:", error);
    
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
