import { supabase } from './supabase';
import { UserPreferences } from '@/shared/types/preferences';

// Database schema interface matching your Supabase table
export interface ProfileData {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  budget_level: 'low' | 'medium' | 'high';
  activities: string[];
  place_types: string[];
  food_preferences: string[];
  food_restrictions: string[];
  personality_traits: string[];
  trip_style: 'planned' | 'mixed' | 'spontaneous';
  travel_with: string; // Remove optional, make it required
}

// Transform form data to database schema
export function transformFormDataToProfile(
  formData: UserPreferences, 
  userId: string
): ProfileData {
  // Convert age group to approximate age number
  const ageGroupToAge: Record<string, number> = {
    '18-24': 21,
    '25-34': 30,
    '35-44': 40,
    '45-54': 50,
    '55-64': 60,
    '65+': 70
  };

  const selectedAge = ageGroupToAge[formData.basicInfo.ageGroup];
  console.log('🔍 Age conversion - Input age group:', formData.basicInfo.ageGroup, '-> Mapped age:', selectedAge);
  if (!selectedAge) {
    console.error('❌ Age group not found:', formData.basicInfo.ageGroup, 'Available groups:', Object.keys(ageGroupToAge));
  }

  // Convert spending style to budget level
  const spendingToBudget = {
    'Budget-focused': 'low' as const,
    'Budget Explorer': 'low' as const,
    'Value-for-money': 'medium' as const,
    'Smart Spender': 'medium' as const,
    'I don\'t mind splurging': 'high' as const,
    'Comfort Seeker': 'high' as const
  };

  const budgetLevel = spendingToBudget[formData.budget.spendingStyle as keyof typeof spendingToBudget] || 'medium';
  console.log('💰 Budget conversion - Input spending style:', formData.budget.spendingStyle, '-> Mapped budget level:', budgetLevel);
  if (!spendingToBudget[formData.budget.spendingStyle as keyof typeof spendingToBudget]) {
    console.error('❌ Budget style not found:', formData.budget.spendingStyle, 'Available styles:', Object.keys(spendingToBudget));
  }
  if (!spendingToBudget[formData.budget.spendingStyle as keyof typeof spendingToBudget]) {
    console.error('❌ Spending style not found:', formData.budget.spendingStyle, 'Available styles:', Object.keys(spendingToBudget));
  }

  // Convert planning style to trip style
  const planningToTrip = {
    'I plan everything': 'planned' as const,
    'Master Planner': 'planned' as const,
    'I like some structure': 'mixed' as const,
    'Balanced Explorer': 'mixed' as const,
    'I go with the flow': 'spontaneous' as const,
    'Free Spirit': 'spontaneous' as const
  };

  const tripStyle = planningToTrip[formData.personalityAndStyle.planningStyle as keyof typeof planningToTrip] || 'mixed';
  console.log('🎯 Planning style conversion - Input:', formData.personalityAndStyle.planningStyle, '-> Mapped trip style:', tripStyle);
  if (!planningToTrip[formData.personalityAndStyle.planningStyle as keyof typeof planningToTrip]) {
    console.error('❌ Planning style not found:', formData.personalityAndStyle.planningStyle, 'Available styles:', Object.keys(planningToTrip));
  }

  // Convert gender to database format - TEST DIFFERENT VALUES
  let dbGender: string;
  
  switch (formData.basicInfo.gender) {
    case 'Male':
      dbGender = 'M'; // Try single letter
      break;
    case 'Female':
      dbGender = 'F'; // Try single letter
      break;
    case 'Non-binary':
      dbGender = 'O'; // Try 'O' for Other
      break;
    case 'Prefer not to say':
      dbGender = 'O'; // Try 'O' for Other
      break;
    default:
      dbGender = 'O'; // Default to Other
  }
  
  console.log('👤 Gender conversion ATTEMPT - Input:', formData.basicInfo.gender, '-> Database value:', dbGender);
  
  return {
    id: userId,
    full_name: `${formData.basicInfo.firstName} ${formData.basicInfo.lastName}`,
    age: selectedAge || 22, // Default to 22 for young adults if age group not found
    gender: dbGender,
    budget_level: budgetLevel,
    activities: formData.preferences.activities,
    place_types: formData.preferences.placeTypes,
    food_preferences: formData.foodAndRestrictions.foodExcitement,
    food_restrictions: formData.foodAndRestrictions.restrictions,
    personality_traits: formData.personalityAndStyle.travelPersonality,
    trip_style: tripStyle,
    travel_with: formData.budget.travelWith || 'Solo' // Include travel_with field
  };
}

// Transform database profile back to form data
export function transformProfileToFormData(profile: ProfileData): UserPreferences {
  // Convert age to age group - match the form values
  const ageToAgeGroup = (age: number): string => {
    if (age <= 24) return '18-24';
    if (age <= 34) return '25-34';
    if (age <= 44) return '35-44';
    if (age <= 54) return '45-54';
    if (age <= 64) return '55-64';
    return '65+';
  };

  // Convert budget level to spending style
  const budgetToSpending = {
    'low': 'Budget-focused',
    'medium': 'Value-for-money', 
    'high': 'I don\'t mind splurging'
  };

  // Convert trip style to planning style
  const tripToPlanning = {
    'planned': 'I plan everything',
    'mixed': 'I like some structure',
    'spontaneous': 'I go with the flow'
  };

  // Convert database gender back to form format
  const dbGenderToForm: Record<string, string> = {
    'M': 'Male',
    'F': 'Female',
    'O': 'Non-binary' // Default non-binary for 'O' (Other)
  };

  const [firstName, ...lastNameParts] = profile.full_name.split(' ');
  
  return {
    basicInfo: {
      firstName: firstName || '',
      lastName: lastNameParts.join(' ') || '',
      gender: dbGenderToForm[profile.gender] || 'Prefer not to say',
      ageGroup: ageToAgeGroup(profile.age)
    },
    preferences: {
      activities: profile.activities || [],
      placeTypes: profile.place_types || []
    },
    foodAndRestrictions: {
      foodExcitement: profile.food_preferences || [],
      restrictions: profile.food_restrictions || [],
      placesToAvoid: [] // No longer stored in database
    },
    personalityAndStyle: {
      travelPersonality: profile.personality_traits || [],
      planningStyle: tripToPlanning[profile.trip_style] || 'I like some structure'
    },
    budget: {
      spendingStyle: budgetToSpending[profile.budget_level] || 'Value-for-money',
      travelWith: profile.travel_with || 'Solo'
    },
    completedSteps: [1, 2, 3, 4, 5],
    isComplete: true
  };
}

// Save profile to database
export async function saveProfile(formData: UserPreferences): Promise<void> {
  console.log('=== SAVE PROFILE DEBUG START ===');
  console.log('Input formData:', JSON.stringify(formData, null, 2));
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No authenticated user found');
    throw new Error('User not authenticated');
  }

  console.log('Authenticated user ID:', user.id);
  
  // First, let's see what's currently in the database
  const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (!fetchError && currentProfile) {
    console.log('🔍 Current profile in database BEFORE update:', JSON.stringify(currentProfile, null, 2));
  } else {
    console.log('No existing profile found or error fetching:', fetchError?.message);
  }
  
  // GENDER TEST: Try multiple gender values to find what works
  const genderInput = formData.basicInfo.gender;
  console.log('🧪 TESTING GENDER VALUES for input:', genderInput);
  
  const genderTestValues = [
    'male', 'female', 'other',  // lowercase full words
    'Male', 'Female', 'Other',  // capitalized
    'MALE', 'FEMALE', 'OTHER',  // uppercase
    'M', 'F', 'O',              // single letters uppercase
    'm', 'f', 'o',              // single letters lowercase
    'man', 'woman', 'non-binary', // alternative terms
    'prefer-not-to-say', 'unknown', 'unspecified'  // other options
  ];
  
  for (const testGender of genderTestValues) {
    console.log(`🧪 Testing gender value: "${testGender}"`);
    
    const testProfileData = {
      id: user.id,
      full_name: `${formData.basicInfo.firstName} ${formData.basicInfo.lastName}`,
      age: 25, // Simple test age
      gender: testGender,
      budget_level: 'medium',
      activities: ['hiking'],
      place_types: ['nature'],
      food_preferences: ['local'],
      food_restrictions: [],
      personality_traits: ['adventurous'],
      trip_style: 'mixed',
      travel_with: 'Solo'
    };
    
    // Delete existing profile first
    await supabase.from('profiles').delete().eq('id', user.id);
    
    // Try inserting with this gender value
    const { data, error } = await supabase
      .from('profiles')
      .insert(testProfileData)
      .select();
    
    if (!error) {
      console.log(`✅ SUCCESS! Gender value "${testGender}" works!`);
      console.log('✅ Successful insert data:', data);
      
      // Now use this working gender value for the real data
      const workingGender = testGender;
      break;
    } else {
      console.log(`❌ Gender value "${testGender}" failed:`, error.message);
    }
  }
  
  console.log('🧪 Gender testing complete');
  throw new Error('Gender testing mode - check console for results');
}

// Load profile from database
export async function loadProfile(): Promise<UserPreferences | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found
      return null;
    }
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return transformProfileToFormData(profile);
}

// Utility function to completely clear a user's profile (for testing)
export async function clearUserProfile(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('🧹 Clearing all profile data for user:', user.id);
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (error) {
    console.error('❌ Error clearing profile:', error.message);
    throw error;
  } else {
    console.log('✅ Profile cleared successfully');
  }
}
