import { supabase } from './supabase';

export interface DatabaseProfile {
  id: string;
  full_name: string;
  age: number;
  gender: 'male' | 'female';
  budget_level: 'low' | 'medium' | 'high';
  activities: string[];
  place_types: string[];
  food_preferences: string[];
  food_restrictions: string[];
  personality_traits: string[];
  trip_style: 'planned' | 'mixed' | 'spontaneous';
  updated_at?: string;
}

export async function saveNewProfile(profileData: Omit<DatabaseProfile, 'id' | 'updated_at'>): Promise<void> {
  console.log('🚀 NEW PROFILE SAVE - Starting save operation');
  console.log('📋 Profile data to save:', JSON.stringify(profileData, null, 2));
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('❌ Authentication error:', authError);
    throw new Error('User not authenticated');
  }

  console.log('✅ User authenticated:', user.id);

  // Check what existing profiles look like for reference
  console.log('🔍 Checking existing profiles for structure reference...');
  const { data: existingProfiles, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .limit(3);

  if (fetchError) {
    console.log('ℹ️ Could not fetch existing profiles:', fetchError.message);
  } else {
    console.log('📋 Existing profiles structure:', JSON.stringify(existingProfiles, null, 2));
  }

  // Simple validation - only male/female allowed
  console.log(`👤 Selected gender: "${profileData.gender}"`);
  if (!['male', 'female'].includes(profileData.gender)) {
    throw new Error(`Invalid gender: ${profileData.gender}. Only 'male' or 'female' are allowed.`);
  }

  // Use the selected gender directly
  const profileToSave = {
    id: user.id,
    full_name: profileData.full_name,
    age: profileData.age,
    gender: profileData.gender, // Only male/female allowed now
    budget_level: profileData.budget_level,
    activities: profileData.activities,
    place_types: profileData.place_types,
    food_preferences: profileData.food_preferences,
    food_restrictions: profileData.food_restrictions,
    personality_traits: profileData.personality_traits,
    trip_style: profileData.trip_style
  };

  console.log('📤 Profile to save:', JSON.stringify(profileToSave, null, 2));

  try {
    // Use UPSERT (insert or update) instead of delete + insert
    console.log('� Upserting profile (insert or update)...');
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileToSave, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('❌ Insert failed:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
      throw new Error(`Profile save failed: ${error.message} (Code: ${error.code})`);
    }

    console.log('✅ Profile saved successfully!');
    console.log('📋 Saved data:', JSON.stringify(data, null, 2));

    // Verify the save worked
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ VERIFICATION SUCCESS - Profile in database:');
      console.log('📋 Verified profile:', JSON.stringify(verifyData, null, 2));
      
      // Check each field
      console.log('🔍 FIELD VERIFICATION:');
      console.log('  full_name:', verifyData?.full_name);
      console.log('  age:', verifyData?.age);
      console.log('  gender:', verifyData?.gender);
      console.log('  budget_level:', verifyData?.budget_level);
      console.log('  activities:', verifyData?.activities);
      console.log('  place_types:', verifyData?.place_types);
      console.log('  food_preferences:', verifyData?.food_preferences);
      console.log('  food_restrictions:', verifyData?.food_restrictions);
      console.log('  personality_traits:', verifyData?.personality_traits);
      console.log('  trip_style:', verifyData?.trip_style);
    }

  } catch (error) {
    console.error('❌ Save operation failed:', error);
    throw error;
  }
}

export async function loadExistingProfile(): Promise<DatabaseProfile | null> {
  console.log('📖 Loading existing profile...');
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.log('❌ No authenticated user');
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('ℹ️ No existing profile found');
      return null;
    }
    console.error('❌ Error loading profile:', error);
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  console.log('✅ Profile loaded successfully');
  return profile;
}
