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
    if (result.isComplete && result.preferences) {
      try {
        console.log(" Getting recommendations from preferences...");
        const recommendations = await chatbotService.getRecommendationsFromPreferences(
          result.preferences
        );
        places = recommendations || [];
        console.log(" Places found:", places.length);
      } catch (error) {
        console.error("Error getting recommendations:", error);
      }
    }

    return NextResponse.json({
      success: true,
      response: result.response,
      isComplete: result.isComplete,
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
