import { NextRequest, NextResponse } from 'next/server';
import { saveNewPlace } from '@/core/database/placesDatabase';
import { generatePlaceEmbedding } from '@/core/services/freeEmbeddingService';
import type { PlaceFormData } from '@/shared/types/place';

export async function POST(request: NextRequest) {
  try {
    const formData: PlaceFormData = await request.json();
    
    // Basic validation
    if (!formData.name?.trim()) {
      return NextResponse.json(
        { error: 'Place name is required' },
        { status: 400 }
      );
    }
    
    if (!formData.place_type_id) {
      return NextResponse.json(
        { error: 'Place type is required' },
        { status: 400 }
      );
    }

    // Save the place
    const placeId = await saveNewPlace(formData);
    
    // Generate embedding asynchronously (don't wait for it)
    console.log(`🔧 Generating embedding for new place ${placeId}...`);
    generatePlaceEmbedding(placeId).catch(error => {
      console.error('Failed to generate place embedding:', error);
      // Don't fail the request if embedding generation fails
    });
    
    const response = NextResponse.json(
      { 
        message: 'Place added successfully',
        placeId 
      },
      { status: 201 }
    );
    
    // Don't cache POST requests (write operations)
    response.headers.set('Cache-Control', 'no-store');
    
    return response;
    
  } catch (error) {
    console.error('Error in places API:', error);
    
    const errorResponse = NextResponse.json(
      error instanceof Error ? { error: error.message } : { error: 'Internal server error' },
      { status: 500 }
    );
    
    // Don't cache errors
    errorResponse.headers.set('Cache-Control', 'no-store');
    
    return errorResponse;
  }
}

export async function GET() {
  const response = NextResponse.json(
    { message: 'Places API endpoint - use POST to add places' },
    { status: 200 }
  );
  
  // Cache static endpoint info for 1 hour
  response.headers.set('Cache-Control', 'public, max-age=3600, immutable');
  
  return response;
}
