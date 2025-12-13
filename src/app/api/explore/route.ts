/**
 * API Route: GET /api/explore
 * Returns personalized recommendations for Explore page sections
 * Uses existing recommendationEngineV2 with different contexts
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/core/database/supabase';
import { getIntentBasedRecommendations, type RecommendationContext } from '@/core/services/recommendationEngineV2';
import type { PlaceCategory } from '@/shared/utils/dataStandards';

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

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('env_preference, activity_style, food_restrictions')
      .eq('id', user.id)
      .single();

    // Get section from query params
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'for-you';

    let context: RecommendationContext;

    // Build context based on section
    switch (section) {
      case 'for-you':
        // General personalized recommendations - show ALL categories and budgets
        context = {
          intent: 'discovery',
          userId: user.id,
          location: 'Trento',
          userProfile: profile || undefined,
          disableBehavioralCategoryFilter: true, // Show all categories
          disableBehavioralBudgetFilter: true, // Show all price levels
        };
        break;

      case 'hidden-gems':
        // Filter for high novelty, low popularity
        context = {
          intent: 'discovery',
          userId: user.id,
          location: 'Trento',
          userProfile: profile || undefined,
          // We'll filter by novelty_score in post-processing
        };
        break;

      case 'nature':
        // Nature & outdoor spots
        context = {
          intent: 'discovery',
          userId: user.id,
          location: 'Trento',
          categories: [
            'park',
            'viewpoint',
            'botanical-garden',
            'hiking-trail'
          ] as PlaceCategory[],
          environment: 'outdoor',
          userProfile: profile || undefined,
        };
        break;

      case 'food':
        // Food & dining
        context = {
          intent: 'goal-oriented',
          userId: user.id,
          location: 'Trento',
          categories: [
            'restaurant',
            'pizzeria',
            'local-trattoria',
            'cafe',
            'bakery',
            'gelato',
            'aperetivo-bar'
          ] as PlaceCategory[],
          userProfile: profile || undefined,
        };
        break;

      case 'culture':
        // Culture & history
        context = {
          intent: 'discovery',
          userId: user.id,
          location: 'Trento',
          categories: [
            'museum',
            'historical-landmark',
            'church',
            'art-gallery',
            'theater'
          ] as PlaceCategory[],
          environment: 'indoor',
          userProfile: profile || undefined,
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    // Get recommendations using existing engine
    // Request 100 places (entire dataset) - the engine will rank all and cache results
    console.log(`📍 Fetching ${section} recommendations for user ${user.id}`);
    let places = await getIntentBasedRecommendations(context, 100);

    // Post-process for specific sections
    if (section === 'hidden-gems') {
      // Filter for hidden gems: high novelty, low-to-medium popularity
      places = places.filter(p => 
        (p.novelty_score || 0) > 0.5 && 
        (p.popularity_score || 0) < 0.5
      );
      console.log(`💎 Filtered to ${places.length} hidden gems`);
    }

    console.log(`✅ Returning ${places.length} places for ${section}`);
    
    return NextResponse.json({
      section,
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
