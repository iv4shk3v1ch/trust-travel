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
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

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

function normalizePositiveInt(
  input: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  if (!input) return fallback;
  const parsed = Number.parseInt(input, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const city = normalizeCity(searchParams.get('city'));
    const mode = normalizeMode(searchParams.get('mode'));
    const section = searchParams.get('section') || 'for-you';
    const page = normalizePositiveInt(searchParams.get('page'), DEFAULT_PAGE, 1, 500);
    const pageSize = normalizePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);

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

    const requestedLimit = (page * pageSize) + 1;
    const recommendations = mode === 'popular'
      ? await recommenderApi.recommendPopular(travelPlan, user.id, requestedLimit)
      : mode === 'hybrid'
        ? await recommenderApi.recommendHybrid(travelPlan, user.id, requestedLimit)
        : await recommenderApi.recommendCFOnly(travelPlan, user.id, requestedLimit);

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const places = recommendations.slice(startIndex, endIndex);
    const hasMore = recommendations.length > endIndex;

    return NextResponse.json({
      section,
      city,
      mode,
      page,
      pageSize,
      hasMore,
      diagnostics: {
        collaborativeCoverage: mode === 'cf_only' ? (places.length > 0 ? 'available' : 'missing') : undefined
      },
      places,
      count: places.length
    });
  } catch (error) {
    console.error('Error in explore API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
