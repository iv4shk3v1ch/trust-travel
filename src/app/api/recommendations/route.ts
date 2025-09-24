import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations, getImmediateRecommendations } from '@/lib/recommender';
import { TravelPlan } from '@/types/travel-plan';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { travelPlan, userId }: { travelPlan: TravelPlan; userId?: string } = body;
    
    console.log('API: Getting recommendations for travel plan:', travelPlan);
    if (userId) {
      console.log('API: Social bias enabled for user:', userId);
    }
    
    // Validate travel plan
    if (!travelPlan.destination?.area || !travelPlan.travelType || !travelPlan.dates?.type) {
      return NextResponse.json(
        { error: 'Invalid travel plan data' },
        { status: 400 }
      );
    }
    
    // Get recommendations based on timing preference (with optional social bias)
    const recommendations = travelPlan.dates.type === 'now' 
      ? await getImmediateRecommendations(travelPlan, userId)
      : await getRecommendations(travelPlan, userId);
    
    console.log(`API: Found ${recommendations.length} recommendations`);
    
    return NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length,
      socialBiasEnabled: !!userId
    });
    
  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Recommendations API endpoint. Use POST with travel plan data.',
    expectedFormat: {
      destination: { area: 'string', region: 'string' },
      dates: { type: 'now | custom', startDate: 'optional', endDate: 'optional' },
      travelType: 'solo | date | family | friends | business',
      experienceTags: ['array', 'of', 'tags'],
      specialNeeds: ['optional', 'array']
    }
  });
}
