import { NextRequest, NextResponse } from 'next/server';
import recommenderApi, { type RecommendationMode } from '@/core/services/recommender';
import { TravelPlan } from '@/shared/types/travel-plan';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      travelPlan,
      userId,
      mode = 'cf_only'
    }: { travelPlan: TravelPlan; userId?: string; mode?: RecommendationMode } = body;
    
    console.log('API: Getting recommendations for travel plan:', travelPlan);
    if (userId) {
      console.log('API: Social bias enabled for user:', userId);
    }
    console.log('API: Recommendation mode:', mode);
    
    // Validate travel plan
    if (!travelPlan.destination?.area || !travelPlan.travelType || !travelPlan.dates?.type) {
      return NextResponse.json(
        { error: 'Invalid travel plan data' },
        { status: 400 }
      );
    }

    if (!['popular', 'cf_only', 'hybrid'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid recommendation mode' },
        { status: 400 }
      );
    }
    
    const getByMode = async () => {
      if (mode === 'popular') return recommenderApi.recommendPopular(travelPlan, userId);
      if (mode === 'hybrid') return recommenderApi.recommendHybrid(travelPlan, userId);
      return recommenderApi.recommendCFOnly(travelPlan, userId);
    };

    const recommendations = travelPlan.dates.type === 'now' 
      ? await recommenderApi.getImmediateRecommendations(travelPlan, userId, mode)
      : await getByMode();
    
    console.log(`API: Found ${recommendations.length} recommendations`);
    
    const response = NextResponse.json({
      success: true,
      recommendations,
      count: recommendations.length,
      socialBiasEnabled: !!userId,
      mode
    });
    
    // Cache for 5 minutes - user-specific but stable for short periods
    // Private cache (only client can cache, not CDN)
    response.headers.set(
      'Cache-Control', 
      'private, max-age=300, stale-while-revalidate=60'
    );
    
    return response;
    
  } catch (error) {
    console.error('Error in recommendations API:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
    
    // Don't cache errors
    errorResponse.headers.set('Cache-Control', 'no-store');
    
    return errorResponse;
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
      specialNeeds: ['optional', 'array'],
      mode: 'popular | cf_only | hybrid'
    }
  });
}
