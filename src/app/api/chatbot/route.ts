import { NextRequest, NextResponse } from "next/server";
import { chatbotService } from "@/core/services/chatbot";
import { ChatMessage } from "@/shared/types/chatbot";
// REMOVED: intentClassifier - now handled in single Groq call via chatbot prompt
// import { classifyIntent, getResponseStrategy } from "@/core/services/intentClassifier";
import { getIntentBasedRecommendations, type RecommendationContext } from "@/core/services/recommendationEngineV2";
import { interactionTracker } from "@/core/services/interactionTracker";
import { supabase } from "@/core/database/supabase";
import { loadExistingProfile } from "@/core/database/newDatabase";

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
    
    // Load user profile to get budget and other preferences
    let userProfile = null;
    if (user) {
      try {
        userProfile = await loadExistingProfile();
        console.log("👤 User profile loaded:", {
          budget: userProfile?.budget,
          food_restrictions: userProfile?.food_restrictions,
          env_preference: userProfile?.env_preference
        });
      } catch (error) {
        console.warn("⚠️ Could not load user profile:", error);
      }
    }

    // Step 1: Process message with chatbot service (includes intent classification in single API call)
    console.log("🤖 Calling chatbot service...");
    const result = await chatbotService.processUserMessage(
      message, 
      history, 
      user?.id,
      userProfile ? {
        budget: userProfile.budget,
        env_preference: userProfile.env_preference,
        food_restrictions: userProfile.food_restrictions
      } : null
    );
    
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
        
        // Use user's profile budget if available, otherwise use chatbot-detected budget
        const userBudget = userProfile?.budget as 'low' | 'medium' | 'high' | undefined;
        const finalBudget = userBudget || result.preferences.budget;
        
        if (userBudget && userBudget !== result.preferences.budget) {
          console.log(`💰 Overriding chatbot budget (${result.preferences.budget}) with user profile budget (${userBudget})`);
        }
        
        // Build recommendation context from chatbot preferences
        const context: RecommendationContext = {
          intent: userIntent,
          userId: user?.id,
          location: result.preferences.destination || 'Trento',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          categories: result.preferences.categories as any, // Type assertion - categories from chatbot are valid
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          experienceTags: result.preferences.experienceTags as any, // Type assertion - tags from chatbot are valid
          budget: finalBudget, // Use user's profile budget if available
          // Pass user profile for preference matching
          userProfile: userProfile ? {
            env_preference: userProfile.env_preference,
            activity_style: userProfile.activity_style,
            food_restrictions: userProfile.food_restrictions
          } : undefined
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

    // Override preferences budget with user profile budget for display
    const finalPreferences = result.preferences && userProfile?.budget 
      ? { ...result.preferences, budget: userProfile.budget as 'low' | 'medium' | 'high' }
      : result.preferences;

    const response = NextResponse.json({
      success: true,
      response: result.response,
      isComplete: result.isComplete || places.length > 0,
      preferences: finalPreferences,
      places: places,
      // Include intent info for debugging/analytics
      intent: {
        type: userIntent,
        confidence: intentConfidence,
        fromPreferences: !!result.preferences
      }
    });

    // No caching - conversational data must always be fresh
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;

  } catch (error) {
    console.error("❌ Error in chatbot API:", error);
    
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: "Failed to process message",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
    
    // Don't cache errors
    errorResponse.headers.set('Cache-Control', 'no-store');
    
    return errorResponse;
  }
}
