/**
 * Profile Completeness Scoring Service
 * 
 * Computes a profile completeness score from 0-100 based on filled fields
 * with configurable weights for different sections and field types.
 */

import type { UserPreferences } from '@/types/preferences';

export interface ProfileScoreConfig {
  weights: {
    basicInfo: {
      total: number;
      firstName: number;
      lastName: number;
      gender: number;
      ageGroup: number;
    };
    preferences: {
      total: number;
      activities: number;
      placeTypes: number;
    };
    foodAndRestrictions: {
      total: number;
      foodExcitement: number;
      restrictions: number;
      placesToAvoid: number;
    };
    personalityAndStyle: {
      total: number;
      travelPersonality: number;
      planningStyle: number;
    };
    budget: {
      total: number;
      spendingStyle: number;
      travelWith: number;
    };
  };
  arrayMinimumForCredit: {
    activities: number;
    placeTypes: number;
    foodExcitement: number;
    restrictions: number;
    placesToAvoid: number;
    travelPersonality: number;
  };
}

/**
 * Default scoring configuration
 * Total weights sum to 100 for easy percentage calculation
 */
export const DEFAULT_PROFILE_SCORE_CONFIG: ProfileScoreConfig = {
  weights: {
    // Basic Info: 30% (most important for personalization)
    basicInfo: {
      total: 30,
      firstName: 8,
      lastName: 8,
      gender: 7,
      ageGroup: 7,
    },
    // Preferences: 25% (core for recommendations)
    preferences: {
      total: 25,
      activities: 13,
      placeTypes: 12,
    },
    // Food & Restrictions: 20% (important for practical recommendations)
    foodAndRestrictions: {
      total: 20,
      foodExcitement: 8,
      restrictions: 6,
      placesToAvoid: 6,
    },
    // Personality & Style: 15% (helps with matching style)
    personalityAndStyle: {
      total: 15,
      travelPersonality: 8,
      planningStyle: 7,
    },
    // Budget: 10% (useful but less critical)
    budget: {
      total: 10,
      spendingStyle: 5,
      travelWith: 5,
    },
  },
  // Minimum array lengths to get credit for array fields
  arrayMinimumForCredit: {
    activities: 2,
    placeTypes: 2,
    foodExcitement: 1,
    restrictions: 0, // Can be empty (no restrictions)
    placesToAvoid: 0, // Can be empty (no places to avoid)
    travelPersonality: 1,
  },
};

/**
 * Field priority for suggestions (higher number = higher priority)
 */
export const FIELD_SUGGESTION_PRIORITY = {
  // Core identity fields (highest priority)
  firstName: 100,
  lastName: 95,
  ageGroup: 90,
  
  // Travel preferences (high priority for recommendations)
  activities: 85,
  placeTypes: 80,
  planningStyle: 75,
  
  // Personality and style (medium-high priority)
  travelPersonality: 70,
  gender: 65,
  spendingStyle: 60,
  
  // Food and lifestyle (medium priority)
  foodExcitement: 55,
  travelWith: 50,
  
  // Optional restrictions (lower priority)
  restrictions: 30,
  placesToAvoid: 25,
} as const;

export type SuggestedField = keyof typeof FIELD_SUGGESTION_PRIORITY;

export interface ProfileScoreResult {
  totalScore: number;
  sectionScores: {
    basicInfo: number;
    preferences: number;
    foodAndRestrictions: number;
    personalityAndStyle: number;
    budget: number;
  };
  completedFields: string[];
  missingFields: string[];
  completionPercentage: number;
}

export interface NextSuggestedFieldResult {
  field: SuggestedField;
  section: string;
  priority: number;
  weight: number;
  reason: string;
}

/**
 * Check if a string field has meaningful content
 */
function isStringFieldComplete(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if an array field meets minimum requirements
 */
function isArrayFieldComplete(value: unknown, minLength: number): boolean {
  return Array.isArray(value) && value.length >= minLength;
}

/**
 * Calculate score for basic info section
 */
function calculateBasicInfoScore(
  basicInfo: UserPreferences['basicInfo'],
  config: ProfileScoreConfig
): { score: number; completed: string[]; missing: string[] } {
  const weights = config.weights.basicInfo;
  const completed: string[] = [];
  const missing: string[] = [];
  let score = 0;

  // Check each field
  if (isStringFieldComplete(basicInfo?.firstName)) {
    completed.push('firstName');
    score += weights.firstName;
  } else {
    missing.push('firstName');
  }

  if (isStringFieldComplete(basicInfo?.lastName)) {
    completed.push('lastName');
    score += weights.lastName;
  } else {
    missing.push('lastName');
  }

  if (isStringFieldComplete(basicInfo?.gender)) {
    completed.push('gender');
    score += weights.gender;
  } else {
    missing.push('gender');
  }

  if (isStringFieldComplete(basicInfo?.ageGroup)) {
    completed.push('ageGroup');
    score += weights.ageGroup;
  } else {
    missing.push('ageGroup');
  }

  return { score, completed, missing };
}

/**
 * Calculate score for preferences section
 */
function calculatePreferencesScore(
  preferences: UserPreferences['preferences'],
  config: ProfileScoreConfig
): { score: number; completed: string[]; missing: string[] } {
  const weights = config.weights.preferences;
  const arrayMins = config.arrayMinimumForCredit;
  const completed: string[] = [];
  const missing: string[] = [];
  let score = 0;

  // Check activities
  if (isArrayFieldComplete(preferences?.activities, arrayMins.activities)) {
    completed.push('activities');
    score += weights.activities;
  } else {
    missing.push('activities');
  }

  // Check place types
  if (isArrayFieldComplete(preferences?.placeTypes, arrayMins.placeTypes)) {
    completed.push('placeTypes');
    score += weights.placeTypes;
  } else {
    missing.push('placeTypes');
  }

  return { score, completed, missing };
}

/**
 * Calculate score for food and restrictions section
 */
function calculateFoodAndRestrictionsScore(
  foodAndRestrictions: UserPreferences['foodAndRestrictions'],
  config: ProfileScoreConfig
): { score: number; completed: string[]; missing: string[] } {
  const weights = config.weights.foodAndRestrictions;
  const arrayMins = config.arrayMinimumForCredit;
  const completed: string[] = [];
  const missing: string[] = [];
  let score = 0;

  // Check food excitement
  if (isArrayFieldComplete(foodAndRestrictions?.foodExcitement, arrayMins.foodExcitement)) {
    completed.push('foodExcitement');
    score += weights.foodExcitement;
  } else {
    missing.push('foodExcitement');
  }

  // Check restrictions (can be empty)
  if (isArrayFieldComplete(foodAndRestrictions?.restrictions, arrayMins.restrictions)) {
    completed.push('restrictions');
    score += weights.restrictions;
  } else {
    missing.push('restrictions');
  }

  // Check places to avoid (can be empty)
  if (isArrayFieldComplete(foodAndRestrictions?.placesToAvoid, arrayMins.placesToAvoid)) {
    completed.push('placesToAvoid');
    score += weights.placesToAvoid;
  } else {
    missing.push('placesToAvoid');
  }

  return { score, completed, missing };
}

/**
 * Calculate score for personality and style section
 */
function calculatePersonalityAndStyleScore(
  personalityAndStyle: UserPreferences['personalityAndStyle'],
  config: ProfileScoreConfig
): { score: number; completed: string[]; missing: string[] } {
  const weights = config.weights.personalityAndStyle;
  const arrayMins = config.arrayMinimumForCredit;
  const completed: string[] = [];
  const missing: string[] = [];
  let score = 0;

  // Check travel personality
  if (isArrayFieldComplete(personalityAndStyle?.travelPersonality, arrayMins.travelPersonality)) {
    completed.push('travelPersonality');
    score += weights.travelPersonality;
  } else {
    missing.push('travelPersonality');
  }

  // Check planning style
  if (isStringFieldComplete(personalityAndStyle?.planningStyle)) {
    completed.push('planningStyle');
    score += weights.planningStyle;
  } else {
    missing.push('planningStyle');
  }

  return { score, completed, missing };
}

/**
 * Calculate score for budget section
 */
function calculateBudgetScore(
  budget: UserPreferences['budget'],
  config: ProfileScoreConfig
): { score: number; completed: string[]; missing: string[] } {
  const weights = config.weights.budget;
  const completed: string[] = [];
  const missing: string[] = [];
  let score = 0;

  // Check spending style
  if (isStringFieldComplete(budget?.spendingStyle)) {
    completed.push('spendingStyle');
    score += weights.spendingStyle;
  } else {
    missing.push('spendingStyle');
  }

  // Check travel with
  if (isStringFieldComplete(budget?.travelWith)) {
    completed.push('travelWith');
    score += weights.travelWith;
  } else {
    missing.push('travelWith');
  }

  return { score, completed, missing };
}

/**
 * Calculate comprehensive profile completeness score
 */
export function getProfileScore(
  profile: UserPreferences | null | undefined,
  config: ProfileScoreConfig = DEFAULT_PROFILE_SCORE_CONFIG
): ProfileScoreResult {
  // Handle null/undefined profile
  if (!profile) {
    return {
      totalScore: 0,
      sectionScores: {
        basicInfo: 0,
        preferences: 0,
        foodAndRestrictions: 0,
        personalityAndStyle: 0,
        budget: 0,
      },
      completedFields: [],
      missingFields: Object.keys(FIELD_SUGGESTION_PRIORITY),
      completionPercentage: 0,
    };
  }

  // Calculate scores for each section
  const basicInfoResult = calculateBasicInfoScore(profile.basicInfo, config);
  const preferencesResult = calculatePreferencesScore(profile.preferences, config);
  const foodResult = calculateFoodAndRestrictionsScore(profile.foodAndRestrictions, config);
  const personalityResult = calculatePersonalityAndStyleScore(profile.personalityAndStyle, config);
  const budgetResult = calculateBudgetScore(profile.budget, config);

  // Aggregate results
  const totalScore = Math.round(
    basicInfoResult.score +
    preferencesResult.score +
    foodResult.score +
    personalityResult.score +
    budgetResult.score
  );

  const completedFields = [
    ...basicInfoResult.completed,
    ...preferencesResult.completed,
    ...foodResult.completed,
    ...personalityResult.completed,
    ...budgetResult.completed,
  ];

  const missingFields = [
    ...basicInfoResult.missing,
    ...preferencesResult.missing,
    ...foodResult.missing,
    ...personalityResult.missing,
    ...budgetResult.missing,
  ];

  return {
    totalScore,
    sectionScores: {
      basicInfo: Math.round(basicInfoResult.score),
      preferences: Math.round(preferencesResult.score),
      foodAndRestrictions: Math.round(foodResult.score),
      personalityAndStyle: Math.round(personalityResult.score),
      budget: Math.round(budgetResult.score),
    },
    completedFields,
    missingFields,
    completionPercentage: totalScore, // Since weights sum to 100
  };
}

/**
 * Get the next most important field to complete
 */
export function getNextSuggestedField(
  profile: UserPreferences | null | undefined,
  config: ProfileScoreConfig = DEFAULT_PROFILE_SCORE_CONFIG
): NextSuggestedFieldResult | null {
  const scoreResult = getProfileScore(profile, config);
  
  // If profile is complete, return null
  if (scoreResult.missingFields.length === 0) {
    return null;
  }

  // Find the missing field with highest priority
  let bestField: SuggestedField | null = null;
  let bestPriority = -1;

  for (const field of scoreResult.missingFields) {
    const priority = FIELD_SUGGESTION_PRIORITY[field as SuggestedField];
    if (priority && priority > bestPriority) {
      bestPriority = priority;
      bestField = field as SuggestedField;
    }
  }

  if (!bestField) {
    return null;
  }

  // Determine section and weight
  let section = '';
  let weight = 0;
  let reason = '';

  // Map field to section and get weight
  const weights = config.weights;
  
  if (['firstName', 'lastName', 'gender', 'ageGroup'].includes(bestField)) {
    section = 'basicInfo';
    weight = weights.basicInfo[bestField as keyof typeof weights.basicInfo];
    reason = 'Essential for personalized recommendations';
  } else if (['activities', 'placeTypes'].includes(bestField)) {
    section = 'preferences';
    weight = weights.preferences[bestField as keyof typeof weights.preferences];
    reason = 'Core preferences for travel recommendations';
  } else if (['foodExcitement', 'restrictions', 'placesToAvoid'].includes(bestField)) {
    section = 'foodAndRestrictions';
    weight = weights.foodAndRestrictions[bestField as keyof typeof weights.foodAndRestrictions];
    reason = 'Important for practical travel planning';
  } else if (['travelPersonality', 'planningStyle'].includes(bestField)) {
    section = 'personalityAndStyle';
    weight = weights.personalityAndStyle[bestField as keyof typeof weights.personalityAndStyle];
    reason = 'Helps match your travel style';
  } else if (['spendingStyle', 'travelWith'].includes(bestField)) {
    section = 'budget';
    weight = weights.budget[bestField as keyof typeof weights.budget];
    reason = 'Useful for budget-appropriate suggestions';
  }

  return {
    field: bestField,
    section,
    priority: bestPriority,
    weight,
    reason,
  };
}
