import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/core/database/supabase';

type ConnectionRow = {
  id: string;
  source_user: string;
  target_user: string;
  trust_level: number;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  age: number | null;
  gender: string | null;
  budget: string | null;
  activities?: string[] | null;
  personality_traits?: string[] | null;
  trip_style?: string | null;
  env_preference?: string | null;
  activity_style?: string | null;
  food_restrictions?: string | null;
};

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function getProfilesByIds(userIds: string[]) {
  if (!userIds.length) return [];

  const candidateSelects = [
    'id, full_name, age, gender, budget, activities, personality_traits, trip_style, env_preference, activity_style, food_restrictions',
    'id, full_name, age, gender, budget, env_preference, activity_style, food_restrictions',
    'id, full_name, age, gender, budget',
    'id, full_name'
  ];

  for (const select of candidateSelects) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(select)
      .in('id', userIds);

    if (!error && data) {
      return data as ProfileRow[];
    }
  }

  return [];
}

function buildProfileFallback(id: string): ProfileRow {
  return {
    id,
    full_name: 'Traveler',
    age: null,
    gender: null,
    budget: null,
    activities: [],
    personality_traits: [],
    trip_style: null,
    env_preference: null,
    activity_style: null,
    food_restrictions: null
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'my';

    if (mode === 'status') {
      const targetUserId = url.searchParams.get('targetUserId');
      if (!targetUserId) {
        return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
      }

      const { data: outgoing } = await supabaseAdmin
        .from('trust_links')
        .select('id')
        .eq('source_user', user.id)
        .eq('target_user', targetUserId)
        .maybeSingle();

      const { data: incoming } = await supabaseAdmin
        .from('trust_links')
        .select('id')
        .eq('source_user', targetUserId)
        .eq('target_user', user.id)
        .maybeSingle();

      const iConnectedToThem = Boolean(outgoing);
      const theyConnectedToMe = Boolean(incoming);

      return NextResponse.json({
        iConnectedToThem,
        theyConnectedToMe,
        isMutual: iConnectedToThem && theyConnectedToMe
      });
    }

    if (mode === 'trusted_by') {
      const { data: links, error } = await supabaseAdmin
        .from('trust_links')
        .select('id, source_user, trust_level, created_at')
        .eq('target_user', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const sourceUserIds = (links || []).map((link) => link.source_user);
      const profiles = await getProfilesByIds(sourceUserIds);
      const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

      const rows = (links || []).map((link) => ({
        ...link,
        profiles: profileById.get(link.source_user) || buildProfileFallback(link.source_user)
      }));

      return NextResponse.json({ rows });
    }

    // default: "my"
    const { data: links, error } = await supabaseAdmin
      .from('trust_links')
      .select('id, target_user, trust_level, created_at')
      .eq('source_user', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const targetUserIds = (links || []).map((link) => link.target_user);
    const profiles = await getProfilesByIds(targetUserIds);
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

    const rows = (links || []).map((link) => ({
      ...link,
      profiles: profileById.get(link.target_user) || buildProfileFallback(link.target_user)
    }));

    return NextResponse.json({ rows });
  } catch (error) {
    console.error('GET /api/connections failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const targetUserId = (body?.targetUserId || '').trim();

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }
    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'Cannot connect to yourself' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('trust_links')
      .select('id')
      .eq('source_user', user.id)
      .eq('target_user', targetUserId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, alreadyConnected: true });
    }

    const { error } = await supabaseAdmin
      .from('trust_links')
      .insert({
        source_user: user.id,
        target_user: targetUserId,
        trust_level: 1
      } satisfies Omit<ConnectionRow, 'id' | 'created_at'>);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/connections failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const targetUserId = (body?.targetUserId || '').trim();

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('trust_links')
      .delete()
      .eq('source_user', user.id)
      .eq('target_user', targetUserId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/connections failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
