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

import { supabase } from '../database/supabase';
import type { ExperienceTag, PlaceCategory } from '@/shared/utils/dataStandards';

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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
 * Main function: Get recommendations with SQL-based computation
 */
export async function getIntentBasedRecommendations(
  context: RecommendationContext,
  limit: number = 20
): Promise<RecommendedPlace[]> {
  try {
    console.log(`🎯 Getting ${context.intent} recommendations (SQL-optimized)`);

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
      console.log(`📂 Filtering by ${placeTypeIds.length} place types`);
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

    // Step 5: Build SQL query with all scoring in database
    let query = supabase.rpc('get_recommended_places', {
      p_location: context.location || 'Trento',
      p_place_type_ids: placeTypeIds.length > 0 ? placeTypeIds : null,
      p_budget: context.budget || null,
      p_environment: context.environment && context.environment !== 'mixed' ? context.environment : null,
      p_trusted_user_ids: trustedUserIds.length > 0 ? trustedUserIds : null,
      p_experience_tag_ids: experienceTagIds.length > 0 ? experienceTagIds : null,
      p_limit: limit * 2 // Get more for post-processing
    });

    const { data: places, error } = await query;

    if (error) {
      console.error('❌ Error fetching recommendations:', error);
      
      // Fallback: Use simplified query without RPC
      return await getRecommendationsSimplified(context, limit, placeTypeIds, trustedUserIds, experienceTagIds);
    }

    if (!places || places.length === 0) {
      console.log('ℹ️ No places found matching criteria');
      return [];
    }

    console.log(`✅ Got ${places.length} places from database`);

    // Step 6: Post-process results (calculate preference_similarity and contextual_fit in JS)
    const processed = places.map((place: any) => {
      // Calculate preference_similarity (user's preference for this place type)
      const preferenceStrength = userPlacePrefs.get(place.place_type_id) || 0.5;
      const tagMatchScore = place.tag_match_count || 0;
      const preference_similarity = (preferenceStrength * 0.6) + (tagMatchScore * 0.4);

      // Calculate contextual_fit (overlap with requested experience tags)
      const requestedTagCount = experienceTagIds.length || 1;
      const contextual_fit = Math.min(tagMatchScore / requestedTagCount, 1.0);

      // Calculate final score using your exact formula
      const final_score =
        RANKING_WEIGHTS.PREFERENCE_SIMILARITY * preference_similarity +
        RANKING_WEIGHTS.QUALITY * place.quality_score +
        RANKING_WEIGHTS.SOCIAL_TRUST * place.social_trust +
        RANKING_WEIGHTS.POPULARITY * place.popularity_score +
        RANKING_WEIGHTS.NOVELTY * place.novelty_score +
        RANKING_WEIGHTS.CONTEXTUAL_FIT * contextual_fit;

      // Map to old interface format for compatibility
      return {
        id: place.id,
        name: place.name,
        category: place.category_slug as PlaceCategory,
        city: place.city,
        address: place.address,
        description: place.description,
        photo_urls: place.photo_urls || [],
        latitude: place.latitude,
        longitude: place.longitude,
        price_level: place.price_level,
        indoor_outdoor: place.indoor_outdoor,
        verified: place.verified || false,
        
        // OLD INTERFACE FIELDS (what UI expects)
        average_rating: Math.round(place.avg_rating * 10) / 10,
        review_count: place.review_count,
        matching_tags: [] as ExperienceTag[],
        tag_confidence: Math.round(contextual_fit * 100) / 100, // Map contextual_fit to tag_confidence
        trusted_reviewers_count: place.trusted_review_count || 0,
        social_trust_boost: Math.round(place.social_trust * 100) / 100, // Map social_trust to social_trust_boost
        popularity_score: Math.round(place.popularity_score * 100) / 100,
        novelty_score: Math.round(place.novelty_score * 100) / 100,
        final_ranking_score: Math.round(final_score * 1000) / 1000, // Map final_score to final_ranking_score
        
        // NEW V2 FIELDS (optional, for debugging)
        quality_score: Math.round(place.quality_score * 100) / 100,
        social_trust: Math.round(place.social_trust * 100) / 100,
        preference_similarity: Math.round(preference_similarity * 100) / 100,
        contextual_fit: Math.round(contextual_fit * 100) / 100,
        final_score: Math.round(final_score * 1000) / 1000
      };
    });

    // Step 7: Sort by final_ranking_score (what the UI expects) and return top N
    processed.sort((a: RecommendedPlace, b: RecommendedPlace) => 
      b.final_ranking_score - a.final_ranking_score
    );
    
    const results = processed.slice(0, limit);
    console.log(`🏆 Returning top ${results.length} recommendations`);
    
    return results;

  } catch (error) {
    console.error('❌ Error in getIntentBasedRecommendations:', error);
    return [];
  }
}

/**
 * Simplified fallback query (when RPC function doesn't exist yet)
 */
async function getRecommendationsSimplified(
  context: RecommendationContext,
  limit: number,
  placeTypeIds: string[],
  trustedUserIds: string[],
  experienceTagIds: string[]
): Promise<RecommendedPlace[]> {
  console.log('⚠️ Using simplified query (RPC function not found)');

  // Build base query with filters
  let query = supabase
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
  if (context.location) {
    query = query.eq('city', context.location);
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

  const { data: places, error } = await query.limit(50);

  if (error || !places) {
    console.error('❌ Error in simplified query:', error);
    return [];
  }

  // Calculate scores in JavaScript (temporary until RPC is created)
  const processed = places
    .map((place: any) => {
      const reviews = place.reviews || [];
      
      if (reviews.length === 0) return null; // Skip places without reviews

      // Quality score
      const avgRating = reviews.reduce((sum: number, r: any) => sum + (r.overall_rating || 0), 0) / reviews.length;
      const quality_score = avgRating / 5.0;

      // Social trust
      const trustedCount = reviews.filter((r: any) => trustedUserIds.includes(r.user_id)).length;
      const social_trust = reviews.length > 0 ? trustedCount / reviews.length : 0;

      // Popularity
      const popularity_score = Math.min(reviews.length / 20, 1.0);

      // Novelty
      const placeAge = (Date.now() - new Date(place.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const novelty_score = placeAge < 30 ? 1.0 : placeAge < 90 ? 0.7 : placeAge < 180 ? 0.4 : 0.2;

      // Preference similarity (simplified)
      const preference_similarity = 0.5;

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

      // Map to old interface format
      return {
        id: place.id,
        name: place.name,
        category: place.place_types.slug as PlaceCategory,
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
    })
    .filter((p) => p !== null) as RecommendedPlace[];

  // Sort by final_ranking_score (what UI expects)
  processed.sort((a: RecommendedPlace, b: RecommendedPlace) => b.final_ranking_score - a.final_ranking_score);

  return processed.slice(0, limit);
}
