import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createChatCompletion } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get AI response using OpenAI
    const aiResponse = await createChatCompletion([
      {
        role: 'system',
        content: 'You are a helpful travel assistant for TrustTravel. Provide helpful, accurate information about travel destinations, safety, and recommendations.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    // Optional: Store the interaction in Supabase
    if (userId) {
      const supabase = createServerClient();
      
      const { error } = await supabase
        .from('ai_interactions')
        .insert([
          {
            user_id: userId,
            prompt: prompt,
            response: aiResponse,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error saving AI interaction:', error);
        // Don't fail the request if saving fails
      }
    }

    return NextResponse.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI endpoint is working',
    endpoints: {
      POST: 'Send a prompt to get AI assistance'
    }
  });
}
