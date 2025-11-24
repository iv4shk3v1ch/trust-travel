/**
 * User Behavioral Data Service
 * 
 * Fetches and analyzes user's behavioral data to personalize recommendations:
 * - Saved places (user explicitly liked)
 * - Hidden places (user explicitly dislikes)
 * - Visited places (from interaction history)
 * - Preferred place types and tags (extracted from behavior)
 */

import { supabaseAdmin } from '../database/supabase';
import { PlaceCategory, ExperienceTag } from '@/shared/utils/dataStandards';

export interface UserBehaviorProfile {
  // Direct user actions
  savedPlaceIds: string[];           // Places user saved/liked
  hiddenPlaceIds: string[];          // Places user hid/disliked
  visitedPlaceIds: string[];         // Places user viewed/visited
  
  // Extracted preferences
  preferredPlaceTypes: PlaceCategory[];  // Most common place types user likes
  preferredTags: ExperienceTag[];        // Most common tags from saved places
  avoidedPlaceTypes: PlaceCategory[];    // Place types user hides
  
  // Behavioral insights
  activityLevel: 'low' | 'medium' | 'high';  // Based on active vs chill places
  socialPreference: 'solo' | 'friends' | 'family' | 'mixed';  // Social context
  budgetBehavior: 'low' | 'medium' | 'high'; // Actual spending based on saves
}

class UserBehaviorService {
  
  /**
   * Get comprehensive behavioral profile for a user
   */
  async getUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
    console.log(`🔍 Fetching behavioral profile for user: ${userId}`);

    try {
      // Fetch user interactions (saves, hides, views)
      const interactions = await this.getUserInteractions(userId);
      
      // Fetch saved places with their details
      const savedPlaces = await this.getSavedPlacesDetails(interactions.savedPlaceIds);
      
      // Extract behavioral patterns
      const preferredPlaceTypes = this.extractPreferredPlaceTypes(savedPlaces);
      const preferredTags = await this.extractPreferredTags(savedPlaces);
      const activityLevel = this.determineActivityLevel(savedPlaces);
      const socialPreference = this.determineSocialPreference();
      const budgetBehavior = this.determineBudgetBehavior(savedPlaces);
      
      const profile: UserBehaviorProfile = {
        savedPlaceIds: interactions.savedPlaceIds,
        hiddenPlaceIds: interactions.hiddenPlaceIds,
        visitedPlaceIds: interactions.visitedPlaceIds,
        preferredPlaceTypes,
        preferredTags,
        avoidedPlaceTypes: [], // TODO: Extract from hidden places
        activityLevel,
        socialPreference,
        budgetBehavior
      };

      console.log(`✅ Behavioral profile created:`, {
        saved: profile.savedPlaceIds.length,
        hidden: profile.hiddenPlaceIds.length,
        visited: profile.visitedPlaceIds.length,
        preferredTypes: profile.preferredPlaceTypes.length,
        preferredTags: profile.preferredTags.length,
        activityLevel: profile.activityLevel,
        socialPreference: profile.socialPreference,
        budgetBehavior: profile.budgetBehavior
      });

      return profile;

    } catch (error) {
      console.error('❌ Error fetching user behavior profile:', error);
      // Return empty profile on error
      return {
        savedPlaceIds: [],
        hiddenPlaceIds: [],
        visitedPlaceIds: [],
        preferredPlaceTypes: [],
        preferredTags: [],
        avoidedPlaceTypes: [],
        activityLevel: 'medium',
        socialPreference: 'mixed',
        budgetBehavior: 'medium'
      };
    }
  }

  /**
   * Fetch user's interaction history (saves, hides, views)
   */
  private async getUserInteractions(userId: string): Promise<{
    savedPlaceIds: string[];
    hiddenPlaceIds: string[];
    visitedPlaceIds: string[];
  }> {
    const { data: interactions, error } = await supabaseAdmin
      .from('user_interactions')
      .select('place_id, action_type')
      .eq('user_id', userId)
      .in('action_type', ['save', 'like', 'hide', 'dislike', 'view'])
      .not('place_id', 'is', null);

    if (error) {
      console.error('Error fetching interactions:', error);
      return { savedPlaceIds: [], hiddenPlaceIds: [], visitedPlaceIds: [] };
    }

    const savedPlaceIds = [...new Set(
      interactions
        ?.filter(i => i.action_type === 'save' || i.action_type === 'like')
        .map(i => i.place_id)
        .filter(Boolean) || []
    )];

    const hiddenPlaceIds = [...new Set(
      interactions
        ?.filter(i => i.action_type === 'hide' || i.action_type === 'dislike')
        .map(i => i.place_id)
        .filter(Boolean) || []
    )];

    const visitedPlaceIds = [...new Set(
      interactions
        ?.filter(i => i.action_type === 'view')
        .map(i => i.place_id)
        .filter(Boolean) || []
    )];

    return { savedPlaceIds, hiddenPlaceIds, visitedPlaceIds };
  }

  /**
   * Fetch details of saved places (to extract patterns)
   */
  private async getSavedPlacesDetails(placeIds: string[]) {
    if (placeIds.length === 0) return [];

    const { data: places, error } = await supabaseAdmin
      .from('places')
      .select(`
        id,
        place_type_id,
        price_level,
        indoor_outdoor,
        place_types(slug, name)
      `)
      .in('id', placeIds);

    if (error) {
      console.error('Error fetching saved places:', error);
      return [];
    }

    // Transform the result to have a single place_types object instead of array
    return (places || []).map(place => ({
      ...place,
      place_types: Array.isArray(place.place_types) ? place.place_types[0] : place.place_types
    }));
  }

  /**
   * Extract preferred place types from saved places
   */
  private extractPreferredPlaceTypes(places: Array<{ place_types?: { slug?: string } }>): PlaceCategory[] {
    if (places.length === 0) return [];

    // Count occurrences of each place type
    const typeCounts = new Map<string, number>();
    
    places.forEach(place => {
      const slug = place.place_types?.slug;
      if (slug) {
        typeCounts.set(slug, (typeCounts.get(slug) || 0) + 1);
      }
    });

    // Sort by count and return top types (at least 2 occurrences or top 3)
    const sortedTypes = Array.from(typeCounts.entries())
      .filter(([, count]) => count >= 2 || typeCounts.size <= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([slug]) => slug as PlaceCategory);

    return sortedTypes.slice(0, 5); // Top 5 preferred types
  }

  /**
   * Extract preferred experience tags from saved places
   */
  private async extractPreferredTags(places: Array<{ id: string }>): Promise<ExperienceTag[]> {
    if (places.length === 0) return [];

    const placeIds = places.map(p => p.id);

    // First get review IDs for these places
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .in('place_id', placeIds);

    if (reviewsError || !reviews) {
      console.error('Error fetching reviews:', reviewsError);
      return [];
    }

    const reviewIds = reviews.map(r => r.id);
    if (reviewIds.length === 0) return [];

    // Fetch review tags
    const { data: reviewTags, error } = await supabaseAdmin
      .from('review_experience_tags')
      .select(`
        experience_tag_id,
        experience_tags!inner(slug)
      `)
      .in('review_id', reviewIds);

    if (error) {
      console.error('Error fetching review tags:', error);
      return [];
    }

    // Count tag occurrences
    const tagCounts = new Map<string, number>();
    
    reviewTags?.forEach(rt => {
      const slug = (rt.experience_tags as { slug?: string })?.slug;
      if (slug) {
        tagCounts.set(slug, (tagCounts.get(slug) || 0) + 1);
      }
    });

    // Return top tags (at least 3 occurrences or top 5)
    const sortedTags = Array.from(tagCounts.entries())
      .filter(([, count]) => count >= 3 || tagCounts.size <= 5)
      .sort((a, b) => b[1] - a[1])
      .map(([slug]) => slug as ExperienceTag);

    return sortedTags.slice(0, 8); // Top 8 preferred tags
  }

  /**
   * Determine user's activity level based on place types
   */
  private determineActivityLevel(places: Array<{ place_types?: { slug?: string } }>): 'low' | 'medium' | 'high' {
    if (places.length === 0) return 'medium';

    const activePlaceTypes = ['mountain-peak', 'hiking-trail', 'adventure-park', 'sports-facility'];
    const chillPlaceTypes = ['cafe', 'spa-wellness', 'park', 'garden', 'museum'];

    let activeCount = 0;
    let chillCount = 0;

    places.forEach(place => {
      const slug = place.place_types?.slug;
      if (slug && activePlaceTypes.includes(slug)) activeCount++;
      if (slug && chillPlaceTypes.includes(slug)) chillCount++;
    });

    if (activeCount > chillCount * 1.5) return 'high';
    if (chillCount > activeCount * 1.5) return 'low';
    return 'medium';
  }

  /**
   * Determine user's social preference
   */
  private determineSocialPreference(): 'solo' | 'friends' | 'family' | 'mixed' {
    // This would require analyzing review tags, for now return mixed
    // TODO: Analyze tags like 'solo-friendly', 'great-for-friends', 'family-friendly'
    return 'mixed';
  }

  /**
   * Determine user's budget behavior from saved places
   */
  private determineBudgetBehavior(places: Array<{ price_level?: string }>): 'low' | 'medium' | 'high' {
    if (places.length === 0) return 'medium';

    const budgetCounts = {
      low: 0,
      medium: 0,
      high: 0
    };

    places.forEach(place => {
      const priceLevel = place.price_level;
      if (priceLevel && priceLevel in budgetCounts) {
        budgetCounts[priceLevel as keyof typeof budgetCounts]++;
      }
    });

    // Return the most common budget level
    const sorted = Object.entries(budgetCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0][0] as 'low' | 'medium' | 'high';
  }
}

export const userBehaviorService = new UserBehaviorService();

