import { NextRequest, NextResponse } from 'next/server';
import { saveNewPlace, type AddPlaceFormData } from '@/core/database/placesDatabase';

export async function POST(request: NextRequest) {
  try {
    const formData: AddPlaceFormData = await request.json();
    
    // Basic validation
    if (!formData.name?.trim()) {
      return NextResponse.json(
        { error: 'Place name is required' },
        { status: 400 }
      );
    }
    
    if (!formData.city?.trim()) {
      return NextResponse.json(
        { error: 'City is required' },
        { status: 400 }
      );
    }
    
    if (!formData.category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Save the place
    const placeId = await saveNewPlace(formData);
    
    return NextResponse.json(
      { 
        message: 'Place added successfully',
        placeId 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error in places API:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Places API endpoint - use POST to add places' },
    { status: 200 }
  );
}
