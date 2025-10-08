import { NextRequest, NextResponse } from 'next/server';
import { chatbotService } from '@/core/services/chatbot';
import { ChatMessage } from '@/shared/types/chatbot';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory }: { 
      message: string; 
      conversationHistory?: ChatMessage[] 
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Process the user message with chatbot
    const result = await chatbotService.processUserMessage(
      message,
      conversationHistory || []
    );

    // If chatbot is ready to provide recommendations, get them
    let recommendations = null;
    if (result.isComplete && result.preferences) {
      try {
        recommendations = await chatbotService.getRecommendationsFromPreferences(
          result.preferences
        );
      } catch (error) {
        console.error('Error getting recommendations:', error);
        // Don't fail the request, just return without recommendations
      }
    }

    return NextResponse.json({
      success: true,
      response: result.response,
      isComplete: result.isComplete,
      preferences: result.preferences,
      recommendations: recommendations
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chatbot request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Chatbot API endpoint. Use POST to send messages.',
    usage: {
      method: 'POST',
      body: {
        message: 'string - Your message to the chatbot',
        conversationHistory: 'ChatMessage[] - Optional conversation history'
      }
    }
  });
}