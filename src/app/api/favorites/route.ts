/**
 * Favorites API
 * Handles saving/unsaving places to user's favorites
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/core/database/supabase';
import { supabaseAdmin } from '@/core/database/supabase';

type PlaceRow = {
  id: string;
  name: string;
  city: string | null;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  price_level: string | number | null;
  verified: boolean | null;
  indoor_outdoor: string | null;
  working_hours: string | null;
  phone: string | null;
  website: string | null;
  photo_urls: string[] | null;
  avg_rating?: number | null;
  review_count?: number | null;
  place_types?: { slug?: string | null } | Array<{ slug?: string | null }> | null;
};

async function fetchPlacesDetails(placeIds: string[]) {
  const selectCandidates = [
    `
      id,
      name,
      city,
      description,
      address,
      latitude,
      longitude,
      avg_rating,
      review_count,
      price_level,
      verified,
      indoor_outdoor,
      working_hours,
      phone,
      website,
      photo_urls,
      place_types!inner (
        slug
      )
    `,
    `
      id,
      name,
      city,
      description,
      address,
      latitude,
      longitude,
      price_level,
      verified,
      indoor_outdoor,
      working_hours,
      phone,
      website,
      photo_urls,
      place_types!inner (
        slug
      )
    `
  ];

  for (const select of selectCandidates) {
    const { data, error } = await supabaseAdmin
      .from('places')
      .select(select)
      .in('id', placeIds);

    if (!error && data) {
      return data as PlaceRow[];
    }
  }

  return null;
}

async function getReviewStats(placeIds: string[]) {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('place_id, overall_rating')
    .in('place_id', placeIds)
    .not('overall_rating', 'is', null);

  if (error || !data) return new Map<string, { average: number; count: number }>();

  const accum = new Map<string, { total: number; count: number }>();
  for (const row of data) {
    const placeId = row.place_id as string;
    const rating = Number(row.overall_rating);
    if (!Number.isFinite(rating)) continue;

    const current = accum.get(placeId) || { total: 0, count: 0 };
    current.total += rating;
    current.count += 1;
    accum.set(placeId, current);
  }

  const stats = new Map<string, { average: number; count: number }>();
  for (const [placeId, { total, count }] of accum.entries()) {
    stats.set(placeId, { average: count > 0 ? total / count : 0, count });
  }
  return stats;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { place_id, action } = body;

    console.log('📝 Favorites request:', { userId: user.id, place_id, action });

    if (!place_id || !action) {
      console.error('❌ Missing place_id or action');
      return NextResponse.json({ error: 'Missing place_id or action' }, { status: 400 });
    }

    if (action === 'save') {
      // Save place to favorites
      const { data, error: insertError } = await supabaseAdmin
        .from('user_interactions')
        .insert({
          user_id: user.id,
          place_id: place_id,
          action_type: 'save'
        })
        .select();

      if (insertError) {
        console.error('❌ Error saving place:', insertError);
        return NextResponse.json({ 
          error: 'Failed to save place', 
          details: insertError.message 
        }, { status: 500 });
      }

      console.log('✅ Place saved:', data);
      return NextResponse.json({ 
        success: true, 
        message: 'Place saved to favorites',
        action: 'saved'
      });

    } else if (action === 'unsave') {
      // Remove place from favorites
      const { error: deleteError } = await supabaseAdmin
        .from('user_interactions')
        .delete()
        .eq('user_id', user.id)
        .eq('place_id', place_id)
        .eq('action_type', 'save');

      if (deleteError) {
        console.error('Error unsaving place:', deleteError);
        return NextResponse.json({ error: 'Failed to unsave place' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Place removed from favorites',
        action: 'unsaved'
      });

    } else if (action === 'hide') {
      // Hide place from recommendations
      const { error: insertError } = await supabaseAdmin
        .from('user_interactions')
        .insert({
          user_id: user.id,
          place_id: place_id,
          action_type: 'hide'
        });

      if (insertError) {
        console.error('Error hiding place:', insertError);
        return NextResponse.json({ error: 'Failed to hide place' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Place hidden from recommendations',
        action: 'hidden'
      });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to fetch user's saved places
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if full details are requested
    const url = new URL(request.url);
    const includeDetails = url.searchParams.get('include_details') === 'true';

    if (includeDetails) {
      // First, fetch saved place IDs
      const { data: interactions, error: interactionsError } = await supabaseAdmin
        .from('user_interactions')
        .select('place_id, created_at')
        .eq('user_id', user.id)
        .eq('action_type', 'save')
        .order('created_at', { ascending: false });

      if (interactionsError) {
        console.error('❌ Error fetching interactions:', interactionsError);
        return NextResponse.json({ 
          error: 'Failed to fetch favorites',
          details: interactionsError.message
        }, { status: 500 });
      }

      if (!interactions || interactions.length === 0) {
        console.log('✅ No favorites found');
        return NextResponse.json({ 
          success: true,
          places: []
        });
      }

      console.log('📦 Found', interactions.length, 'saved places');

      // Then fetch place details with place_type
      const placeIds = interactions.map(i => i.place_id);
      const placesData = await fetchPlacesDetails(placeIds);
      if (!placesData) {
        console.error('❌ Error fetching places details');
        return NextResponse.json({ 
          error: 'Failed to fetch place details',
          details: 'Could not fetch place details from places table'
        }, { status: 500 });
      }

      console.log('📦 Fetched', placesData?.length, 'place records');
      const reviewStats = await getReviewStats(placeIds);

      // Transform to match RecommendedPlace interface and maintain order
      const placeMap = new Map(placesData?.map(p => [p.id, p]) || []);
      const places = interactions
        .map(interaction => {
          const place = placeMap.get(interaction.place_id);
          if (!place) return null;
          
          // Extract place_type slug (Supabase returns it as an object or array)
          const placeType = Array.isArray(place.place_types) 
            ? place.place_types[0] 
            : place.place_types;
          const stats = reviewStats.get(place.id);
          const averageRating = Number(place.avg_rating ?? stats?.average ?? 0);
          const reviewCount = Number(place.review_count ?? stats?.count ?? 0);
          
          return {
            id: place.id,
            name: place.name,
            category: placeType?.slug || 'unknown',
            city: place.city || null,
            address: place.address,
            description: place.description,
            photo_urls: place.photo_urls || [],
            website: place.website,
            phone: place.phone,
            working_hours: place.working_hours,
            latitude: place.latitude,
            longitude: place.longitude,
            price_level: place.price_level?.toString() || null,
            indoor_outdoor: place.indoor_outdoor,
            verified: place.verified,
            average_rating: Number.isFinite(averageRating) ? averageRating : 0,
            review_count: Number.isFinite(reviewCount) ? reviewCount : 0,
            matching_tags: [],
            tag_confidence: 0,
            trusted_reviewers_count: 0,
            social_trust_boost: 0,
            popularity_score: 0,
            novelty_score: 0,
            final_ranking_score: 0,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null); // Filter out any null entries

      console.log('✅ Returning', places.length, 'places');

      return NextResponse.json({ 
        success: true,
        places
      });
    } else {
      // Just fetch place IDs (for lightweight checks)
      const { data: interactions, error } = await supabaseAdmin
        .from('user_interactions')
        .select('place_id')
        .eq('user_id', user.id)
        .eq('action_type', 'save');

      if (error) {
        console.error('Error fetching favorites:', error);
        return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
      }

      const savedPlaceIds = interactions?.map(i => i.place_id) || [];

      return NextResponse.json({ 
        success: true,
        savedPlaceIds
      });
    }

  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
