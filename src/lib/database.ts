import { supabase } from './supabase';
import { UserPreferences } from '@/types/preferences';

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
  avoid_places: string[];
  personality_traits: string[];
  trip_style: 'planned' | 'mixed' | 'spontaneous';
  travel_with?: string; // Optional field for travel companions
}

// Transform form data to database schema
export function transformFormDataToProfile(
  formData: UserPreferences, 
  userId: string
): ProfileData {
  // Convert age group to approximate age number
  const ageGroupToAge: Record<string, number> = {
    // Wizard format (new)
    '18-24': 22,
    '25-34': 30,
    '35-44': 40,
    '45-54': 50,
    '55-64': 60,
    '65+': 70,
    // Old format (legacy)
    '18-25': 22,
    '26-35': 30,
    '36-45': 40,
    '46-55': 50,
    '56-65': 60
  };

  const selectedAge = ageGroupToAge[formData.basicInfo.ageGroup];
  if (!selectedAge) {
    console.log('Age group not found:', formData.basicInfo.ageGroup, 'Available groups:', Object.keys(ageGroupToAge));
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

  // Convert planning style to trip style
  const planningToTrip = {
    'I plan everything': 'planned' as const,
    'Master Planner': 'planned' as const,
    'I like some structure': 'mixed' as const,
    'Balanced Explorer': 'mixed' as const,
    'I go with the flow': 'spontaneous' as const,
    'Free Spirit': 'spontaneous' as const
  };

  return {
    id: userId,
    full_name: `${formData.basicInfo.firstName} ${formData.basicInfo.lastName}`,
    age: selectedAge || 22, // Default to 22 for young adults if age group not found
    gender: formData.basicInfo.gender.toLowerCase(),
    budget_level: spendingToBudget[formData.budget.spendingStyle as keyof typeof spendingToBudget] || 'medium',
    activities: formData.preferences.activities,
    place_types: formData.preferences.placeTypes,
    food_preferences: formData.foodAndRestrictions.foodExcitement,
    food_restrictions: formData.foodAndRestrictions.restrictions,
    avoid_places: formData.foodAndRestrictions.placesToAvoid,
    personality_traits: formData.personalityAndStyle.travelPersonality,
    trip_style: planningToTrip[formData.personalityAndStyle.planningStyle as keyof typeof planningToTrip] || 'mixed'
    // travel_with: formData.budget.travelWith // Temporarily disabled - column may not exist yet
  };
}

// Transform database profile back to form data
export function transformProfileToFormData(profile: ProfileData): UserPreferences {
  // Convert age to age group (using new wizard format)
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

  const [firstName, ...lastNameParts] = profile.full_name.split(' ');
  
  return {
    basicInfo: {
      firstName: firstName || '',
      lastName: lastNameParts.join(' ') || '',
      gender: profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1),
      ageGroup: ageToAgeGroup(profile.age)
    },
    preferences: {
      activities: profile.activities || [],
      placeTypes: profile.place_types || []
    },
    foodAndRestrictions: {
      foodExcitement: profile.food_preferences || [],
      restrictions: profile.food_restrictions || [],
      placesToAvoid: profile.avoid_places || []
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
  console.log('🔧 saveProfile: Starting save process...');
  console.log('🔧 saveProfile: Input data:', formData);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('🔧 saveProfile: No authenticated user found');
    throw new Error('User not authenticated');
  }

  console.log('🔧 saveProfile: User authenticated, ID:', user.id);
  
  try {
    console.log('🔧 saveProfile: Transforming form data to profile...');
    const profileData = transformFormDataToProfile(formData, user.id);
    console.log('🔧 saveProfile: Transformed profile data:', profileData);
    
    console.log('🔧 saveProfile: Attempting database upsert...');
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (error) {
      console.error('🔧 saveProfile: Database save error:', error);
      throw new Error(`Failed to save profile: ${error.message}`);
    }
    
    console.log('🔧 saveProfile: Database save successful!', data);
    console.log('🔧 saveProfile: Save process completed successfully');
  } catch (error) {
    console.error('🔧 saveProfile: Caught error during save:', error);
    throw error;
  }
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
