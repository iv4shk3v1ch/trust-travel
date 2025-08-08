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
    '18-25': 22,
    '26-35': 30,
    '36-45': 40,
    '46-55': 50,
    '56-65': 60,
    '65+': 70
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
    trip_style: planningToTrip[formData.personalityAndStyle.planningStyle as keyof typeof planningToTrip] || 'mixed',
    travel_with: formData.budget.travelWith
  };
}

// Transform database profile back to form data
export function transformProfileToFormData(profile: ProfileData): UserPreferences {
  // Convert age to age group
  const ageToAgeGroup = (age: number): string => {
    if (age <= 25) return '18-25';
    if (age <= 35) return '26-35';
    if (age <= 45) return '36-45';
    if (age <= 55) return '46-55';
    if (age <= 65) return '56-65';
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const profileData = transformFormDataToProfile(formData, user.id);
  
  const { error } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' });

  if (error) {
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
