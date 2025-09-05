import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Fetch users from Supabase
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, profileData } = body;

    console.log('POST /api/users - Received:', { userId, profileData });

    if (!userId || !profileData) {
      console.error('Missing required data:', { userId: !!userId, profileData: !!profileData });
      return NextResponse.json(
        { error: 'Missing userId or profileData' },
        { status: 400 }
      );
    }

    // Get the full_name - try multiple sources
    let fullName = profileData.full_name;
    
    if (!fullName) {
      try {
        // Try to get from current auth session first
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user && session.user.id === userId) {
          fullName = session.user.user_metadata?.full_name || 
                    session.user.email?.split('@')[0] || 
                    'User';
          console.log('Got full name from session:', fullName);
        }
        
        // If still no name, try admin API (might need service role key)
        if (!fullName) {
          const { data: authUser } = await supabase.auth.admin.getUserById(userId);
          if (authUser?.user) {
            fullName = authUser.user.user_metadata?.full_name || 
                      authUser.user.email?.split('@')[0] || 
                      'User';
            console.log('Got full name from admin API:', fullName);
          }
        }
      } catch (error) {
        console.error('Error getting user auth data:', error);
        fullName = 'User'; // Fallback
      }
    }

    if (!fullName) {
      fullName = 'User'; // Final fallback
    }

    console.log('User full name resolved to:', fullName);

    // Prepare the complete profile data
    const completeProfileData = {
      ...profileData,
      full_name: fullName,
      // Ensure all required fields are present
      id: userId
    };

    console.log('Complete profile data to save:', completeProfileData);

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    let result;
    if (existingProfile) {
      console.log('Updating existing profile for user:', userId);
      // Update existing profile - don't try to set created_at or updated_at
      const { data, error } = await supabase
        .from('profiles')
        .update(completeProfileData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
          { error: 'Failed to update profile', details: error.message },
          { status: 500 }
        );
      }
      result = data;
    } else {
      console.log('Creating new profile for user:', userId);
      // Create new profile - don't try to set created_at or updated_at
      const { data, error } = await supabase
        .from('profiles')
        .insert(completeProfileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        console.error('Profile data that failed:', completeProfileData);
        return NextResponse.json(
          { error: 'Failed to create profile', details: error.message, data: completeProfileData },
          { status: 500 }
        );
      }
      result = data;
    }

    console.log('Profile saved successfully:', result);
    return NextResponse.json({ user: result }, { status: 201 });
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save user profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
