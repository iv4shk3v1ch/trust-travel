/**
 * Favorites API
 * Handles saving/unsaving places to user's favorites
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/core/database/supabase';
import { supabaseAdmin } from '@/core/database/supabase';

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
      const { data: placesData, error: placesError } = await supabaseAdmin
        .from('places')
        .select(`
          id,
          name,
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
        `)
        .in('id', placeIds);

      if (placesError) {
        console.error('❌ Error fetching places:', placesError);
        return NextResponse.json({ 
          error: 'Failed to fetch place details',
          details: placesError.message
        }, { status: 500 });
      }

      console.log('📦 Fetched', placesData?.length, 'place records');

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
          
          return {
            id: place.id,
            name: place.name,
            category: placeType?.slug || 'unknown',
            city: null,
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
            average_rating: place.avg_rating || 0,
            review_count: place.review_count || 0,
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
