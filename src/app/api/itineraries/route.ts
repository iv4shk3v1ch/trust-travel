/**
 * Itineraries API
 * Handles CRUD operations for user itineraries
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/core/database/supabase';
import { supabaseAdmin } from '@/core/database/supabase';

// GET - Fetch user's itineraries or a specific itinerary by ID
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

    const url = new URL(request.url);
    const itineraryId = url.searchParams.get('id');

    if (itineraryId) {
      // Fetch specific itinerary
      const { data: itinerary, error } = await supabaseAdmin
        .from('itineraries')
        .select('*')
        .eq('id', itineraryId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching itinerary:', error);
        return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, itinerary });
    } else {
      // Fetch all user's itineraries
      const { data: itineraries, error } = await supabaseAdmin
        .from('itineraries')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching itineraries:', error);
        return NextResponse.json({ error: 'Failed to fetch itineraries' }, { status: 500 });
      }

      return NextResponse.json({ success: true, itineraries: itineraries || [] });
    }
  } catch (error) {
    console.error('Itineraries API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new itinerary
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
    const { name, start_date, num_days, days } = body;

    if (!name || !start_date || !num_days || !days) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, start_date, num_days, days' 
      }, { status: 400 });
    }

    // Create new itinerary
    const { data: itinerary, error } = await supabaseAdmin
      .from('itineraries')
      .insert({
        user_id: user.id,
        name,
        start_date,
        num_days,
        days
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating itinerary:', error);
      return NextResponse.json({ 
        error: 'Failed to create itinerary',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Itinerary created:', itinerary.id);
    return NextResponse.json({ 
      success: true, 
      itinerary,
      message: 'Itinerary saved successfully' 
    });

  } catch (error) {
    console.error('Itineraries API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update existing itinerary
export async function PUT(request: NextRequest) {
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
    const { id, name, start_date, num_days, days } = body;

    if (!id) {
      return NextResponse.json({ error: 'Itinerary ID is required' }, { status: 400 });
    }

    // Update itinerary
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (num_days !== undefined) updateData.num_days = num_days;
    if (days !== undefined) updateData.days = days;

    const { data: itinerary, error } = await supabaseAdmin
      .from('itineraries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating itinerary:', error);
      return NextResponse.json({ 
        error: 'Failed to update itinerary',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Itinerary updated:', itinerary.id);
    return NextResponse.json({ 
      success: true, 
      itinerary,
      message: 'Itinerary updated successfully' 
    });

  } catch (error) {
    console.error('Itineraries API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete itinerary
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
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Itinerary ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('itineraries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting itinerary:', error);
      return NextResponse.json({ error: 'Failed to delete itinerary' }, { status: 500 });
    }

    console.log('✅ Itinerary deleted:', id);
    return NextResponse.json({ 
      success: true,
      message: 'Itinerary deleted successfully' 
    });

  } catch (error) {
    console.error('Itineraries API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
