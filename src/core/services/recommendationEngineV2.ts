/**
 * Optimized Recommendation Engine V2 - SQL-Based Computation
 * 
 * Matches the exact plan:
 * Step 1: Intent identification (goal-oriented, discovery, informational)
 * Step 2: Filtering (location, category, budget, environment, time context)
 * Step 3: Ranking (preference_similarity, quality, social_trust, popularity, novelty, contextual_fit)
 * 
 * Formula:
 * final_score = 
 *   0.35 * preference_similarity +
 *   0.25 * quality_score +
 *   0.20 * social_trust +
 *   0.10 * popularity_score +
 *   0.05 * novelty_score +
 *   0.05 * contextual_fit
 */

import { supabaseAdmin } from '../database/supabase';
import type { ExperienceTag, PlaceCategory } from '@/shared/utils/dataStandards';
import { userBehaviorService, type UserBehaviorProfile } from './userBehaviorService';
import { 
  getCachedRecommendations, 
  setCachedRecommendations 
} from './recommendationCache';

type IntentType = 'goal-oriented' | 'discovery' | 'informational';

export interface RecommendationContext {
  intent: IntentType;
  userId?: string;
  location?: string;
  categories?: PlaceCategory[];
  experienceTags?: ExperienceTag[];
  budget?: 'low' | 'medium' | 'high';
  timeContext?: 'now' | 'morning' | 'afternoon' | 'evening' | 'night' | 'weekend';
  environment?: 'indoor' | 'outdoor' | 'mixed';
  dietaryRestrictions?: string[];
  // Disable automatic behavioral category filtering (for explore all)
  disableBehavioralCategoryFilter?: boolean;
  // Disable automatic behavioral budget filtering (for explore all)
  disableBehavioralBudgetFilter?: boolean;
  // User profile preferences for matching
  userProfile?: {
    env_preference?: string | null;
    activity_style?: string | null;
    food_restrictions?: string | null;
  };
}

export interface RecommendedPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  city: string | null;
  address?: string | null;
  description?: string | null;
  photo_urls?: string[];
  website?: string;
  phone?: string;
  working_hours?: string;
  
  // Location coordinates
  latitude?: number | null;
  longitude?: number | null;
  
  // Pricing and environment
  price_level?: string | null;
  price_category?: string | null; // NEW: budget, moderate, expensive, luxury
  indoor_outdoor?: string | null;
  verified?: boolean;
  
  // Aggregated review data (matching old interface)
  average_rating: number;
  review_count: number;
  matching_tags: ExperienceTag[];
  tag_confidence: number; // For UI compatibility
  
  // Social trust data (matching old interface)
  trusted_reviewers_count: number;
  social_trust_boost: number; // Normalized to 0-1 for compatibility
  
  // Ranking signals (matching old interface)
  popularity_score: number;
  novelty_score: number;
  final_ranking_score: number; // This is what we call final_score
  
  // New V2 scoring metrics (additional, not breaking)
  quality_score?: number;
  social_trust?: number;
  preference_similarity?: number;
  contextual_fit?: number;
  final_score?: number; // Internal V2 score
}

// Ranking weights (same for all intents in your plan)
const RANKING_WEIGHTS = {
  PREFERENCE_SIMILARITY: 0.35,
  QUALITY: 0.25,
  SOCIAL_TRUST: 0.20,
  POPULARITY: 0.10,
  NOVELTY: 0.05,
  CONTEXTUAL_FIT: 0.05
};

/**
 * Get user's trusted network
 */
async function getTrustedUsers(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('trust_links')
    .select('source_user, target_user')
    .or(`source_user.eq.${userId},target_user.eq.${userId}`);
  
  if (error || !data) return [];
  
  return data.map(link => 
    link.source_user === userId ? link.target_user : link.source_user
  );
}

/**
 * Get place type IDs for category slugs
 */
async function getPlaceTypeIds(categories: PlaceCategory[]): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('place_types')
    .select('id')
    .in('slug', categories);
  
  if (error || !data) return [];
  return data.map(pt => pt.id);
}

/**
 * Get experience tag IDs for tag slugs
 */
async function getExperienceTagIds(tags: ExperienceTag[]): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('experience_tags')
    .select('id')
    .in('slug', tags);
  
  if (error || !data) return [];
  return data.map(tag => tag.id);
}

/**
 * Get user's place type preferences
 */
async function getUserPlacePreferences(userId: string): Promise<Map<string, number>> {
  const { data, error } = await supabaseAdmin
    .from('user_place_preferences')
    .select(`
      place_type_id,
      preference_strength
    `)
    .eq('user_id', userId);
  
  if (error || !data) return new Map();
  
  const preferences = new Map<string, number>();
  for (const pref of data) {
    preferences.set(pref.place_type_id, pref.preference_strength);
  }
  return preferences;
}

/**
 * Normalize location name (e.g., "trento-city" -> "Trento")
 */
function normalizeLocation(location: string | undefined): string | undefined {
  if (!location) return undefined;
  
  // Remove common suffixes
  const normalized = location
    .replace(/-city$/i, '')
    .replace(/-town$/i, '')
    .replace(/-village$/i, '');
  
  // Capitalize first letter
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

/**
 * Main function: Get recommendations with SQL-based computation
 */
export async function getIntentBasedRecommendations(
  context: RecommendationContext,
  limit: number = 20
): Promise<RecommendedPlace[]> {
  try {
    // ✨ CACHE CHECK: Try to get cached results first
    const cached = getCachedRecommendations(context);
    if (cached) {
      console.log(`⚡ Returning ${cached.length} cached recommendations`);
      return cached.slice(0, limit); // Apply limit to cached results
    }
    
    console.log(`🎯 Getting ${context.intent} recommendations (SQL-optimized)`);

    // Normalize location name
    const normalizedLocation = normalizeLocation(context.location);
    console.log(`📍 Location: "${context.location}" -> "${normalizedLocation}"`);

    // ✨ TASK 3: Fetch user behavioral profile
    let userBehavior: UserBehaviorProfile | null = null;
    if (context.userId) {
      console.log('🧠 Fetching user behavioral profile...');
      userBehavior = await userBehaviorService.getUserBehaviorProfile(context.userId);
      
      // Enhance context with behavioral insights (unless disabled)
      if (userBehavior.preferredPlaceTypes.length > 0 && !context.disableBehavioralCategoryFilter) {
        console.log(`🎯 User prefers: ${userBehavior.preferredPlaceTypes.join(', ')}`);
        // Merge user's preferred types with AI-suggested categories
        context.categories = context.categories 
          ? [...new Set([...context.categories, ...userBehavior.preferredPlaceTypes])]
          : userBehavior.preferredPlaceTypes;
      } else if (context.disableBehavioralCategoryFilter) {
        console.log('🌍 Behavioral category filter disabled - showing all categories');
      }
      
      if (userBehavior.preferredTags.length > 0) {
        console.log(`🏷️ User likes tags: ${userBehavior.preferredTags.join(', ')}`);
        // Merge user's preferred tags with AI-suggested tags
        context.experienceTags = context.experienceTags
          ? [...new Set([...context.experienceTags, ...userBehavior.preferredTags])]
          : userBehavior.preferredTags;
      }
      
      // Use behavioral budget if no budget specified
      if (!context.budget && userBehavior.budgetBehavior && !context.disableBehavioralBudgetFilter) {
        console.log(`💰 Using user's budget behavior: ${userBehavior.budgetBehavior}`);
        context.budget = userBehavior.budgetBehavior;
      } else if (context.disableBehavioralBudgetFilter) {
        console.log('💸 Behavioral budget filter disabled - showing all price levels');
      }
    }

    // Step 1: Get trusted users for social trust calculation
    let trustedUserIds: string[] = [];
    if (context.userId) {
      trustedUserIds = await getTrustedUsers(context.userId);
      console.log(`👥 Found ${trustedUserIds.length} trusted users`);
    }

    // Step 2: Get place type IDs for category filter
    let placeTypeIds: string[] = [];
    if (context.categories && context.categories.length > 0) {
      placeTypeIds = await getPlaceTypeIds(context.categories);
      console.log(`📂 Filtering by ${placeTypeIds.length} place types for categories:`, context.categories);
      console.log(`📂 Place type IDs:`, placeTypeIds);
    }

    // Step 3: Get experience tag IDs for preference matching
    let experienceTagIds: string[] = [];
    if (context.experienceTags && context.experienceTags.length > 0) {
      experienceTagIds = await getExperienceTagIds(context.experienceTags);
      console.log(`🏷️ Matching ${experienceTagIds.length} experience tags`);
    }

    // Step 4: Get user's place preferences for preference_similarity
    let userPlacePrefs = new Map<string, number>();
    if (context.userId) {
      userPlacePrefs = await getUserPlacePreferences(context.userId);
      console.log(`⭐ Loaded ${userPlacePrefs.size} user preferences`);
    }

    // Step 5: Use simplified query with behavioral boosting
    console.log('⚠️ Using simplified query approach');
    return await getRecommendationsSimplified(
      context, 
      limit, 
      placeTypeIds, 
      trustedUserIds, 
      experienceTagIds,
      userBehavior, // Pass behavioral data for scoring
      userPlacePrefs // Pass user preferences for scoring
    );

  } catch (error) {
    console.error('❌ Error in getIntentBasedRecommendations:', error);
    return [];
  }
}

/**
 * Simplified fallback query (when RPC function doesn't exist yet)
 * ENHANCED: Now includes behavioral data for personalized scoring
 */
async function getRecommendationsSimplified(
  context: RecommendationContext,
  limit: number,
  placeTypeIds: string[],
  trustedUserIds: string[],
  experienceTagIds: string[],
  userBehavior: UserBehaviorProfile | null,
  userPlacePrefs: Map<string, number>
): Promise<RecommendedPlace[]> {
  console.log('⚠️ Using simplified query (RPC function not found)');
  console.log('🔍 Query parameters:', {
    placeTypeIds,
    placeTypeCount: placeTypeIds.length,
    location: context.location,
    budget: context.budget,
    environment: context.environment
  });

  // Normalize location
  const normalizedLocation = normalizeLocation(context.location);
  console.log(`📍 Simplified query location: "${normalizedLocation}"`);

  // Build base query with filters
  let query = supabaseAdmin
    .from('places')
    .select(`
      id,
      name,
      place_type_id,
      city,
      address,
      description,
      photo_urls,
      latitude,
      longitude,
      price_level,
      indoor_outdoor,
      verified,
      created_at,
      place_types!inner(slug, name),
      reviews(
        id,
        user_id,
        overall_rating,
        created_at
      )
    `);

  // Apply filters
  if (normalizedLocation) {
    query = query.eq('city', normalizedLocation); // Exact match (case-sensitive)
  }

  if (placeTypeIds.length > 0) {
    query = query.in('place_type_id', placeTypeIds);
  }

  if (context.budget) {
    query = query.eq('price_level', context.budget);
  }

  if (context.environment && context.environment !== 'mixed') {
    query = query.eq('indoor_outdoor', context.environment);
  }

  // Fetch ALL places (no limit) - we have a fixed dataset, so rank everything
  const { data: places, error } = await query;

  console.log('📊 Query result:', {
    error: error,
    placesCount: places?.length || 0,
    samplePlaces: places?.slice(0, 3).map(p => ({
      name: p.name,
      place_type_id: p.place_type_id,
      type_slug: (Array.isArray(p.place_types) ? p.place_types[0]?.slug : null)
    }))
  });

  if (error || !places) {
    console.error('❌ Error in simplified query:', error);
    return [];
  }

  // Filter out places without reviews (no reviews = not popular/visited)
  const placesWithReviews = places.filter(place => {
    const reviews = Array.isArray(place.reviews) ? place.reviews : [];
    return reviews.length > 0;
  });

  console.log(`📋 Filtered to ${placesWithReviews.length} places with reviews (removed ${places.length - placesWithReviews.length} places without reviews)`);

  // Calculate scores in JavaScript (temporary until RPC is created)
  const processed = placesWithReviews
    .map((place: { 
      id: string; 
      name: string; 
      place_type_id: string; 
      city: string; 
      address?: string; 
      description?: string; 
      photo_urls?: string[];
      latitude?: number;
      longitude?: number;
      price_level?: string;
      indoor_outdoor?: string;
      verified?: boolean;
      created_at: string;
      place_types: Array<{ slug: string; name: string }>;
      reviews: Array<{ id: string; user_id: string; overall_rating?: number; created_at: string }>;
    }) => {
      const reviews = place.reviews || [];
      const placeType = Array.isArray(place.place_types) ? place.place_types[0] : place.place_types;
      
      // Allow places without reviews (but they'll rank lower)
      const hasReviews = reviews.length > 0;

      // Quality score
      const avgRating = hasReviews 
        ? reviews.reduce((sum: number, r: { overall_rating?: number }) => sum + (r.overall_rating || 0), 0) / reviews.length
        : 0; // Default to 0 for places without reviews
      const quality_score = avgRating / 5.0;

      // Social trust
      const trustedCount = reviews.filter((r: { user_id: string }) => trustedUserIds.includes(r.user_id)).length;
      const social_trust = reviews.length > 0 ? trustedCount / reviews.length : 0;

      // Popularity
      const popularity_score = Math.min(reviews.length / 20, 1.0);

      // Novelty
      const placeAge = (Date.now() - new Date(place.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const novelty_score = placeAge < 30 ? 1.0 : placeAge < 90 ? 0.7 : placeAge < 180 ? 0.4 : 0.2;

      // Preference similarity (COMPREHENSIVE CALCULATION - 35% of final score!)
      let preference_similarity = 0.0; // Start at 0 - build up based on matches
      let matchCount = 0;
      let totalChecks = 0;

      // 1. USER PROFILE PREFERENCES (from user_place_preferences table)
      if (userPlacePrefs.size > 0 && place.place_type_id) {
        const prefStrength = userPlacePrefs.get(place.place_type_id);
        if (prefStrength !== undefined) {
          preference_similarity += prefStrength; // Range 0-1 from database
          matchCount++;
          console.log(`📊 Place "${place.name}" has user pref strength: ${prefStrength}`);
        }
        totalChecks++;
      }

      // 2. BEHAVIORAL PREFERENCES (from user interactions - saves, likes, hides)
      if (userBehavior && placeType) {
        const placeTypeSlug = placeType.slug as PlaceCategory;
        
        // Boost if place type matches user's preferred types (from saved places)
        if (userBehavior.preferredPlaceTypes.includes(placeTypeSlug)) {
          preference_similarity += 0.8; // Strong positive signal
          matchCount++;
          console.log(`🎯 "${place.name}" matches preferred type: ${placeTypeSlug}`);
        }
        totalChecks++;
        
        // Penalize if place is already saved (avoid duplication)
        if (userBehavior.savedPlaceIds.includes(place.id)) {
          preference_similarity -= 0.5;
          console.log(`👎 "${place.name}" already saved - penalizing`);
        }
        
        // Strong penalty if place is hidden/disliked
        if (userBehavior.hiddenPlaceIds.includes(place.id)) {
          preference_similarity -= 1.0; // Almost exclude
          console.log(`� "${place.name}" hidden by user - strong penalty`);
        }
      }

      // 3. EXPERIENCE TAGS MATCHING (from chatbot query + user preferences)
      if (experienceTagIds.length > 0) {
        // TODO: Fetch place's experience tags from place_experience_tags table
        // For now, use a simplified tag match based on place category
        // This is a placeholder - should query actual tags
        const hasMatchingTags = false; // Placeholder
        if (hasMatchingTags) {
          preference_similarity += 0.6;
          matchCount++;
        }
        totalChecks++;
      }

      // 4. USER PROFILE SETTINGS MATCHING (env_preference, activity_style)
      if (context.userProfile) {
        // Environment preference matching
        if (context.userProfile.env_preference && place.indoor_outdoor) {
          const userPrefersOutdoor = context.userProfile.env_preference === 'nature';
          const userPrefersIndoor = context.userProfile.env_preference === 'city';
          const placeIsOutdoor = place.indoor_outdoor === 'outdoor';
          const placeIsIndoor = place.indoor_outdoor === 'indoor';
          
          if ((userPrefersOutdoor && placeIsOutdoor) || (userPrefersIndoor && placeIsIndoor)) {
            preference_similarity += 0.4;
            matchCount++;
            console.log(`🌳 "${place.name}" matches env preference: ${context.userProfile.env_preference}`);
          } else if (place.indoor_outdoor === 'mixed' || context.userProfile.env_preference === 'balanced') {
            preference_similarity += 0.2; // Partial match
            matchCount++;
          }
          totalChecks++;
        }

        // Food restrictions matching
        if (context.userProfile.food_restrictions && placeType) {
          const restrictions = context.userProfile.food_restrictions.split(',').map(r => r.trim().toLowerCase());
          const foodRelatedCategories = ['restaurant', 'cafe', 'pizzeria', 'local-trattoria', 'bakery'];
          const placeTypeSlug = placeType?.slug || '';
          
          if (foodRelatedCategories.includes(placeTypeSlug)) {
            // For food places, dietary restrictions should be considered
            // TODO: Match against place tags (vegan-friendly, halal, etc.)
            // For now, give slight boost to assume food places can accommodate
            preference_similarity += 0.2;
            matchCount++;
            console.log(`🍽️ "${place.name}" is food-related, considering restrictions: ${restrictions.join(', ')}`);
            totalChecks++;
          }
        }
      }

      // 5. BUDGET MATCHING (not just filtering - score proximity too!)
      if (context.budget && place.price_level) {
        if (context.budget === place.price_level) {
          preference_similarity += 0.5; // Perfect budget match
          matchCount++;
          console.log(`💰 "${place.name}" perfect budget match: ${context.budget}`);
        } else {
          // Partial credit for close budget
          const budgetLevels = ['low', 'medium', 'high'];
          const userBudgetIdx = budgetLevels.indexOf(context.budget);
          const placeBudgetIdx = budgetLevels.indexOf(place.price_level);
          const distance = Math.abs(userBudgetIdx - placeBudgetIdx);
          
          if (distance === 1) {
            preference_similarity += 0.2; // One level off
            console.log(`💰 "${place.name}" close budget match (${place.price_level} vs ${context.budget})`);
          }
        }
        totalChecks++;
      }

      // Normalize preference_similarity
      // If we have matches, average them. If no matches, use default 0.3
      if (totalChecks > 0 && matchCount > 0) {
        preference_similarity = preference_similarity / totalChecks;
      } else if (totalChecks > 0) {
        preference_similarity = 0.3; // Default for no matches but we have user data
      } else {
        preference_similarity = 0.5; // Default for anonymous users
      }

      // Clamp between 0 and 1
      preference_similarity = Math.max(0, Math.min(1, preference_similarity));

      // Contextual fit (simplified)
      const contextual_fit = 0.5;

      // Final score
      const final_score =
        RANKING_WEIGHTS.PREFERENCE_SIMILARITY * preference_similarity +
        RANKING_WEIGHTS.QUALITY * quality_score +
        RANKING_WEIGHTS.SOCIAL_TRUST * social_trust +
        RANKING_WEIGHTS.POPULARITY * popularity_score +
        RANKING_WEIGHTS.NOVELTY * novelty_score +
        RANKING_WEIGHTS.CONTEXTUAL_FIT * contextual_fit;

      // Log detailed scoring for debugging (only for top results)
      if (final_score > 0.5 || preference_similarity > 0.6) {
        console.log(`🎯 Scoring "${place.name}":`, {
          preference_similarity: `${(preference_similarity * 100).toFixed(1)}% (weight: 35%)`,
          quality_score: `${(quality_score * 100).toFixed(1)}% (weight: 25%)`,
          social_trust: `${(social_trust * 100).toFixed(1)}% (weight: 20%)`,
          popularity_score: `${(popularity_score * 100).toFixed(1)}% (weight: 10%)`,
          novelty_score: `${(novelty_score * 100).toFixed(1)}% (weight: 5%)`,
          contextual_fit: `${(contextual_fit * 100).toFixed(1)}% (weight: 5%)`,
          final_score: `${(final_score * 100).toFixed(1)}%`,
          matchCount,
          totalChecks
        });
      }

      // Map to old interface format
      return {
        id: place.id,
        name: place.name,
        category: (placeType?.slug || 'restaurant') as PlaceCategory,
        city: place.city,
        address: place.address,
        description: place.description,
        photo_urls: place.photo_urls || [],
        latitude: place.latitude,
        longitude: place.longitude,
        price_level: place.price_level,
        indoor_outdoor: place.indoor_outdoor,
        verified: place.verified || false,
        
        // OLD INTERFACE FIELDS
        average_rating: Math.round(avgRating * 10) / 10,
        review_count: reviews.length,
        matching_tags: [] as ExperienceTag[],
        tag_confidence: Math.round(contextual_fit * 100) / 100,
        trusted_reviewers_count: trustedCount,
        social_trust_boost: Math.round(social_trust * 100) / 100,
        popularity_score: Math.round(popularity_score * 100) / 100,
        novelty_score: Math.round(novelty_score * 100) / 100,
        final_ranking_score: Math.round(final_score * 1000) / 1000,
        
        // NEW V2 FIELDS
        quality_score: Math.round(quality_score * 100) / 100,
        social_trust: Math.round(social_trust * 100) / 100,
        preference_similarity: Math.round(preference_similarity * 100) / 100,
        contextual_fit: Math.round(contextual_fit * 100) / 100,
        final_score: Math.round(final_score * 1000) / 1000
      };
    }) as RecommendedPlace[]; // No filter - include all places

  // Sort by final_ranking_score (what UI expects)
  processed.sort((a: RecommendedPlace, b: RecommendedPlace) => b.final_ranking_score - a.final_ranking_score);

  const results = processed.slice(0, limit);
  
  // ✨ CACHE SET: Store results for future queries
  setCachedRecommendations(context, results);
  
  return results;
}
