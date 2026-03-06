/**
 * API Route: GET /api/explore
 * Returns Explore recommendations using the thesis recommender modes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/core/database/supabase';
import recommenderApi, { type RecommendationMode } from '@/core/services/recommender';
import type { TravelPlan } from '@/shared/types/travel-plan';

const SUPPORTED_CITIES = ['Trento', 'Milan', 'Rome', 'Florence'] as const;
const DEFAULT_CITY = 'Trento';
const DEFAULT_MODE: RecommendationMode = 'cf_only';

function normalizeCity(input: string | null): string {
  if (!input) return DEFAULT_CITY;
  const normalized = input.trim().toLowerCase();
  const match = SUPPORTED_CITIES.find(city => city.toLowerCase() === normalized);
  return match || DEFAULT_CITY;
}

function normalizeMode(input: string | null): RecommendationMode {
  if (input === 'popular' || input === 'hybrid' || input === 'cf_only') {
    return input;
  }
  return DEFAULT_MODE;
}

export async function GET(request: NextRequest) {
  try {
    // Get current user from Supabase auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const city = normalizeCity(searchParams.get('city'));
    const mode = normalizeMode(searchParams.get('mode'));
    const section = searchParams.get('section') || 'for-you';

    const travelPlan: TravelPlan = {
      destination: {
        area: city,
        region: city
      },
      dates: {
        type: 'custom',
        isFlexible: false
      },
      travelType: 'solo',
      experienceTags: [],
      specialNeeds: [],
      completedSteps: [],
      isComplete: true,
      categories: []
    };

    console.log(`📍 Fetching explore recommendations for user ${user.id} in ${city} with mode ${mode}`);

    let places = mode === 'popular'
      ? await recommenderApi.recommendPopular(travelPlan, user.id)
      : mode === 'hybrid'
        ? await recommenderApi.recommendHybrid(travelPlan, user.id)
        : await recommenderApi.recommendCFOnly(travelPlan, user.id);

    console.log(`✅ Returning ${places.length} places for ${city}/${mode}`);
    
    return NextResponse.json({
      section,
      city,
      mode,
      diagnostics: {
        collaborativeCoverage: mode === 'cf_only' ? (places.length > 0 ? 'available' : 'missing') : undefined
      },
      places,
      count: places.length
    });

  } catch (error) {
    console.error('❌ Error in explore API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
