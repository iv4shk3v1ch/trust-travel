/**
 * Share Itinerary API
 * Generate and manage shareable links for itineraries
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/core/database/supabase';
import { supabaseAdmin } from '@/core/database/supabase';

// POST - Generate share link for itinerary
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { itinerary_id } = body;

    if (!itinerary_id) {
      return NextResponse.json({ error: 'Itinerary ID is required' }, { status: 400 });
    }

    // Generate share token using the database function
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .rpc('generate_share_token');

    if (tokenError) {
      console.error('Error generating share token:', tokenError);
      return NextResponse.json({ error: 'Failed to generate share token' }, { status: 500 });
    }

    const shareToken = tokenData;

    // Update itinerary with share token and make it public
    const { error: updateError } = await supabaseAdmin
      .from('itineraries')
      .update({
        share_token: shareToken,
        is_public: true
      })
      .eq('id', itinerary_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating itinerary:', updateError);
      return NextResponse.json({ error: 'Failed to share itinerary' }, { status: 500 });
    }

    const shareUrl = `${request.nextUrl.origin}/shared/${shareToken}`;

    console.log('✅ Share link generated:', shareUrl);
    return NextResponse.json({ 
      success: true,
      share_url: shareUrl,
      share_token: shareToken,
      message: 'Share link generated successfully' 
    });

  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Revoke share link
export async function DELETE(request: NextRequest) {
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

    const url = new URL(request.url);
    const itinerary_id = url.searchParams.get('id');

    if (!itinerary_id) {
      return NextResponse.json({ error: 'Itinerary ID is required' }, { status: 400 });
    }

    // Remove share token and make private
    const { error } = await supabaseAdmin
      .from('itineraries')
      .update({
        share_token: null,
        is_public: false
      })
      .eq('id', itinerary_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error revoking share link:', error);
      return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 });
    }

    console.log('✅ Share link revoked for itinerary:', itinerary_id);
    return NextResponse.json({ 
      success: true,
      message: 'Share link revoked successfully' 
    });

  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get public itinerary by share token
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const share_token = url.searchParams.get('token');

    if (!share_token) {
      return NextResponse.json({ error: 'Share token is required' }, { status: 400 });
    }

    // Fetch public itinerary by share token
    const { data: itinerary, error } = await supabaseAdmin
      .from('itineraries')
      .select('*')
      .eq('share_token', share_token)
      .eq('is_public', true)
      .single();

    if (error || !itinerary) {
      console.error('Error fetching shared itinerary:', error);
      return NextResponse.json({ error: 'Itinerary not found or not public' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      itinerary 
    });

  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
