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

  const selectedAge = ageGroupToAge[formData.basicInfo.ageGroup] || 25;

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

  // Convert gender to database format
  const genderMap = {
    'Male': 'M',
    'Female': 'F',
    'Non-binary': 'O',
    'Prefer not to say': 'O'
  };
  
  const dbGender = genderMap[formData.basicInfo.gender as keyof typeof genderMap] || 'O';
  
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const profileData = transformFormDataToProfile(formData, user.id);
  
  const { error } = await supabase
    .from('profiles')
    .upsert(profileData);
  
  if (error) {
    console.error('Error saving profile:', error);
    throw new Error(`Failed to save profile: ${error.message}`);
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
