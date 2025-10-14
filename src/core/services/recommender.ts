import { supabase } from '../database/supabase';
import { TravelPlan } from '@/shared/types/travel-plan';
import { type ExperienceTag, type PlaceCategory } from '@/shared/utils/dataStandards';

// Enhanced place interface with aggregated review data
export interface RecommendedPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  city: string;
  address?: string;
  description?: string;
  photo_urls?: string[];
  website?: string;
  phone?: string;
  working_hours?: string;
  
  // Location coordinates (optional for map display)
  latitude?: number | null;
  longitude?: number | null;
  
  // Aggregated review data
  average_rating: number;
  review_count: number;
  matching_tags: ExperienceTag[]; // Tags that match user's preferences
  tag_confidence: number; // How well this place matches user preferences (0-1)
  
  // Additional metadata
  verified?: boolean;
  indoor_outdoor?: 'indoor' | 'outdoor' | 'both';
  created_at?: string;
  
  // Social trust data
  trusted_reviewers_count: number; // Number of trusted users who reviewed this place
  social_trust_boost: number; // Boost factor based on trusted reviewers (0-1)
  
  // Ranking signals
  popularity_score: number; // Based on review count and engagement (0-1)
  novelty_score: number; // How new/fresh this place is (0-1)
  final_ranking_score: number; // Combined weighted score for sorting
}

// Category mappings based on destination area preferences
const DESTINATION_CATEGORY_MAPPING = {
  'trento-city': [
    'restaurant', 'bar', 'coffee-shop', 'fast-food',
    'museum', 'theater', 'music-venue', 'historical-site',
    'shopping', 'hotel', 'park', 'hiking-trail', 'viewpoint',
    'adventure-activity', 'sports-facility', 'spa-wellness'
  ] as PlaceCategory[],
  
  'historic-villages': [
    'historical-site', 'religious-site', 'museum',
    'restaurant', 'coffee-shop', 'hotel', 'attraction'
  ] as PlaceCategory[],
  
  'nature-easy': [
    'park', 'viewpoint', 'beach', 'hiking-trail',
    'cafe', 'restaurant'
  ] as PlaceCategory[],
  
  'nature-hike': [
    'hiking-trail', 'viewpoint', 'adventure-activity',
    'park', 'attraction'
  ] as PlaceCategory[]
};

// Travel type to experience tag mappings (additional context)
const TRAVEL_TYPE_CONTEXT = {
  'solo': ['solo-friendly', 'authentic-local', 'cultural-immersion'],
  'date': ['romantic', 'intimate', 'scenic-beauty'],
  'family': ['family-friendly', 'crowd-level-low', 'budget-friendly'],
  'friends': ['friends-group', 'energetic', 'crowd-level-high'],
  'business': ['luxury', 'quick-visit', 'central-location']
};

// Ranking weights configuration
const RANKING_WEIGHTS = {
  VIBE_MATCH: 0.35,        // How well experience tags match (35%)
  SOCIAL_TRUST: 0.25,      // Boost from trusted reviewers (25%)
  POPULARITY: 0.20,        // Based on review count and rating (20%)
  QUALITY: 0.15,           // Average rating quality (15%)
  NOVELTY: 0.05           // How new/fresh the place is (5%)
} as const;

// Popularity calculation constants
const POPULARITY_CONSTANTS = {
  MIN_REVIEWS_FOR_POPULARITY: 2,    // Minimum reviews to be considered popular
  MAX_REVIEWS_FOR_FULL_SCORE: 20,   // Review count that gives maximum popularity score
  RATING_THRESHOLD: 3.5             // Minimum rating to get popularity boost
} as const;

/**
 * Calculate popularity score based on review count and rating
 */
function calculatePopularityScore(reviewCount: number, averageRating: number): number {
  // No reviews = no popularity
  if (reviewCount < POPULARITY_CONSTANTS.MIN_REVIEWS_FOR_POPULARITY) {
    return 0;
  }
  
  // Low rating = reduced popularity regardless of review count
  if (averageRating < POPULARITY_CONSTANTS.RATING_THRESHOLD) {
    return 0.1; // Minimal popularity for low-rated places
  }
  
  // Scale review count to 0-1, capped at MAX_REVIEWS_FOR_FULL_SCORE
  const reviewScore = Math.min(reviewCount / POPULARITY_CONSTANTS.MAX_REVIEWS_FOR_FULL_SCORE, 1);
  
  // Boost high-rated places: rating above 4.0 gets extra popularity
  const ratingBoost = averageRating >= 4.0 ? 0.2 : 0;
  
  return Math.min(reviewScore + ratingBoost, 1);
}

/**
 * Calculate novelty score based on how recently the place was added
 */
function calculateNoveltyScore(createdAt?: string): number {
  if (!createdAt) return 0.5; // Neutral score for places without creation date
  
  const placeDate = new Date(createdAt);
  const now = new Date();
  const daysSinceCreated = (now.getTime() - placeDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // New places (< 30 days) get full novelty score
  if (daysSinceCreated <= 30) return 1.0;
  
  // Places 30-90 days old get decreasing novelty score
  if (daysSinceCreated <= 90) {
    return Math.max(0.3, 1.0 - ((daysSinceCreated - 30) / 60) * 0.7);
  }
  
  // Places > 90 days old get minimal novelty score
  return 0.1;
}

/**
 * Calculate final weighted ranking score
 */
function calculateFinalRankingScore(
  vibeMatchScore: number,
  socialTrustScore: number, 
  popularityScore: number,
  qualityScore: number,
  noveltyScore: number
): number {
  return (
    vibeMatchScore * RANKING_WEIGHTS.VIBE_MATCH +
    socialTrustScore * RANKING_WEIGHTS.SOCIAL_TRUST +
    popularityScore * RANKING_WEIGHTS.POPULARITY +
    qualityScore * RANKING_WEIGHTS.QUALITY +
    noveltyScore * RANKING_WEIGHTS.NOVELTY
  );
}

/**
 * Get list of user IDs that the current user trusts (both directions)
 */
async function getTrustedUsers(currentUserId: string): Promise<string[]> {
  try {
    console.log('Getting trusted users for:', currentUserId);
    
    // Get users that current user trusts (source_user = current)
    const { data: outgoingConnections, error: outgoingError } = await supabase
      .from('trust_links')
      .select('target_user')
      .eq('source_user', currentUserId);
    
    if (outgoingError) {
      console.error('Error fetching outgoing connections:', outgoingError);
    }
    
    // Get users that trust current user (target_user = current)
    const { data: incomingConnections, error: incomingError } = await supabase
      .from('trust_links')
      .select('source_user')
      .eq('target_user', currentUserId);
    
    if (incomingError) {
      console.error('Error fetching incoming connections:', incomingError);
    }
    
    // Combine both directions to get all trusted users
    const trustedUsers = new Set<string>();
    
    if (outgoingConnections) {
      outgoingConnections.forEach(conn => trustedUsers.add(conn.target_user));
    }
    
    if (incomingConnections) {
      incomingConnections.forEach(conn => trustedUsers.add(conn.source_user));
    }
    
    const trustedUsersList = Array.from(trustedUsers);
    console.log(`Found ${trustedUsersList.length} trusted users`);
    
    return trustedUsersList;
    
  } catch (error) {
    console.error('Error getting trusted users:', error);
    return [];
  }
}

/**
 * Main recommender function that finds places matching a travel plan
 */
export async function getRecommendations(travelPlan: TravelPlan, currentUserId?: string): Promise<RecommendedPlace[]> {
  try {
    console.log('Getting recommendations for travel plan:', travelPlan);
    
    // Step 1: Get trusted users for social bias (if user provided)
    let trustedUsers: string[] = [];
    if (currentUserId) {
      trustedUsers = await getTrustedUsers(currentUserId);
      console.log(`Social bias enabled: ${trustedUsers.length} trusted users`);
    }
    
    // Step 2: Get relevant place categories - use specific categories if provided, otherwise use destination mapping
    const relevantCategories = travelPlan.categories || DESTINATION_CATEGORY_MAPPING[travelPlan.destination.area as keyof typeof DESTINATION_CATEGORY_MAPPING] || [
      // Default fallback categories if area not found
      'restaurant', 'bar', 'coffee-shop', 'museum', 'park', 'attraction'
    ];
    
    // Log which category source we're using
    if (travelPlan.categories) {
      console.log('🎯 Using specific categories from preferences:', relevantCategories);
    } else {
      console.log('📍 Using destination-based categories:', relevantCategories);
    }
    
    // Step 3: Combine user's experience tags with travel type context
    const allPreferredTags = [
      ...travelPlan.experienceTags,
      ...(TRAVEL_TYPE_CONTEXT[travelPlan.travelType as keyof typeof TRAVEL_TYPE_CONTEXT] || [])
    ];
    
    console.log('Relevant categories:', relevantCategories);
    console.log('Preferred tags:', allPreferredTags);
    
    // Step 4: Query places with aggregated review data (including user_id for trust analysis)
    const { data: places, error } = await supabase
      .from('places')
      .select(`
        *,
        reviews!inner(
          user_id,
          ratings,
          experience_tags,
          comment
        )
      `)
      .eq('city', 'Trento') // Focus on Trento
      .in('category', relevantCategories)
      .limit(50); // Get more than we need for filtering
    
    if (error) {
      console.error('Error fetching places:', error);
      return [];
    }
    
    if (!places || places.length === 0) {
      console.log('No places found matching criteria');
      return [];
    }
    
    console.log(`Found ${places.length} places to analyze`);
    
    // Step 5: Process and score each place (including social bias)
    const recommendations: RecommendedPlace[] = [];
    
    // Check if this is a general query vs specific query
    const isSpecificCategoryQuery = travelPlan.categories && travelPlan.categories.length <= 3;
    const isGeneralQuery = !isSpecificCategoryQuery && (
      relevantCategories.length >= 5 || 
      allPreferredTags.some(tag => ['popular', 'highly-rated', 'authentic-local'].includes(tag)) ||
      allPreferredTags.length <= 2
    );
    
    console.log(`🎯 Query analysis: isGeneral=${isGeneralQuery}, isSpecific=${isSpecificCategoryQuery}, categories=${relevantCategories.length}, tags=${allPreferredTags.length}`);
    
    for (const place of places) {
      const processedPlace = processPlaceForRecommendation(place, allPreferredTags, trustedUsers);
      if (processedPlace) {
        if (isSpecificCategoryQuery) {
          // For specific category queries (like "restaurants"), include all matches from those categories
          recommendations.push(processedPlace);
          console.log(`🍽️ Specific category query: included ${processedPlace.name} (${processedPlace.category}, rating: ${processedPlace.average_rating})`);
        } else if (isGeneralQuery) {
          // For general queries, be much more inclusive - prioritize high-quality places
          if (processedPlace.average_rating >= 3.5 || processedPlace.tag_confidence > 0) {
            recommendations.push(processedPlace);
            console.log(`✅ General query: included ${processedPlace.name} (rating: ${processedPlace.average_rating}, tags: ${processedPlace.tag_confidence})`);
          }
        } else {
          // For specific queries with mixed categories, require some tag confidence or high rating
          if (processedPlace.tag_confidence > 0 || processedPlace.average_rating >= 4.5) {
            recommendations.push(processedPlace);
            console.log(`✅ Specific query: included ${processedPlace.name} (rating: ${processedPlace.average_rating}, tags: ${processedPlace.tag_confidence})`);
          }
        }
      }
    }
    
    // If we still have no recommendations, include all highly rated places
    if (recommendations.length === 0 && places.length > 0) {
      console.log('No matches found, falling back to all highly rated places');
      for (const place of places) {
        const processedPlace = processPlaceForRecommendation(place, [], trustedUsers);
        if (processedPlace && processedPlace.average_rating >= 4.0) {
          recommendations.push(processedPlace);
        }
      }
    }
    
    // For general queries, ensure diversity across categories
    if (isGeneralQuery && recommendations.length > 5) {
      console.log('🎯 General query detected - ensuring category diversity');
      const diverseRecommendations = [];
      const categoriesUsed = new Set<string>();
      
      // Sort by rating first to get best quality
      const sortedByRating = [...recommendations].sort((a, b) => 
        (b.average_rating + b.social_trust_boost) - (a.average_rating + a.social_trust_boost)
      );
      
      // Add top place from each category first
      for (const place of sortedByRating) {
        if (!categoriesUsed.has(place.category) && diverseRecommendations.length < 10) {
          diverseRecommendations.push(place);
          categoriesUsed.add(place.category);
        }
      }
      
      // Fill remaining slots with highest rated regardless of category
      for (const place of sortedByRating) {
        if (diverseRecommendations.length >= 15) break;
        if (!diverseRecommendations.some(p => p.id === place.id)) {
          diverseRecommendations.push(place);
        }
      }
      
      // Use diverse recommendations for general queries
      recommendations.length = 0;
      recommendations.push(...diverseRecommendations);
    }
    
    // Step 6: Sort by comprehensive ranking score
    recommendations.sort((a, b) => {
      return b.final_ranking_score - a.final_ranking_score;
    });
    
    console.log(`Returning ${recommendations.length} recommendations`);
    return recommendations.slice(0, 20); // Return top 20
    
  } catch (error) {
    console.error('Error in getRecommendations:', error);
    return [];
  }
}

/**
 * Process a place with its reviews to calculate matching score including social bias
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processPlaceForRecommendation(placeData: any, preferredTags: string[], trustedUsers: string[] = []): RecommendedPlace | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const place = placeData as any;
    const reviews = place.reviews || [];
    
    if (reviews.length === 0) {
      return null; // Skip places without reviews for now
    }
    
    // Calculate average rating and social trust metrics
    let totalRating = 0;
    let ratingCount = 0;
    let trustedReviewersCount = 0;
    
    const allPlaceTags = new Set<string>();
    const reviewerIds = new Set<string>();
    
    for (const review of reviews) {
      // Track reviewer for trust analysis
      if (review.user_id) {
        reviewerIds.add(review.user_id);
        // Check if this reviewer is trusted
        if (trustedUsers.includes(review.user_id)) {
          trustedReviewersCount++;
        }
      }
      
      // Extract ratings
      if (review.ratings && typeof review.ratings === 'object') {
        const ratings = Object.values(review.ratings) as number[];
        const avgReviewRating = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
        totalRating += avgReviewRating;
        ratingCount++;
      }
      
      // Collect all experience tags mentioned in reviews
      if (review.experience_tags && Array.isArray(review.experience_tags)) {
        review.experience_tags.forEach((tag: string) => allPlaceTags.add(tag));
      }
    }
    
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
    
    // Calculate tag matching confidence
    const matchingTags = Array.from(allPlaceTags).filter(tag => 
      preferredTags.includes(tag)
    );
    
    const tagConfidence = matchingTags.length > 0 
      ? matchingTags.length / Math.max(preferredTags.length, allPlaceTags.size) 
      : 0;
    
    // Calculate social trust boost
    // Formula: (trusted_reviewers / total_unique_reviewers) * trust_weight
    const socialTrustBoost = reviewerIds.size > 0 
      ? (trustedReviewersCount / reviewerIds.size) * 0.5 // Max 50% boost
      : 0;
    
    // Calculate additional ranking signals
    const popularityScore = calculatePopularityScore(reviews.length, averageRating);
    const noveltyScore = calculateNoveltyScore(place.created_at);
    const qualityScore = averageRating / 5; // Normalize rating to 0-1
    
    // Calculate final weighted ranking score
    const finalRankingScore = calculateFinalRankingScore(
      tagConfidence, // vibe match score
      socialTrustBoost / 0.5, // normalize social trust to 0-1 
      popularityScore,
      qualityScore,
      noveltyScore
    );
    
    // Debug logging for coordinates
    if (place.name === 'Pizzeria Korallo') {
      console.log(`🍕 Debug: ${place.name} coordinates from DB:`, {
        latitude: place.latitude,
        longitude: place.longitude,
        latType: typeof place.latitude,
        lngType: typeof place.longitude
      });
    }
    
    return {
      id: place.id,
      name: place.name,
      category: place.category,
      city: place.city,
      address: place.address,
      description: place.description,
      photo_urls: place.photo_urls || [],
      website: place.website,
      phone: place.phone,
      working_hours: place.working_hours,
      
      // Include coordinates from database (they come as strings and need to be converted)
      latitude: place.latitude || null,
      longitude: place.longitude || null,
      
      average_rating: Math.round(averageRating * 10) / 10,
      review_count: reviews.length,
      matching_tags: matchingTags as ExperienceTag[],
      tag_confidence: Math.round(tagConfidence * 100) / 100,
      verified: place.verified,
      indoor_outdoor: place.indoor_outdoor,
      trusted_reviewers_count: trustedReviewersCount,
      social_trust_boost: Math.round(socialTrustBoost * 100) / 100,
      popularity_score: Math.round(popularityScore * 100) / 100,
      novelty_score: Math.round(noveltyScore * 100) / 100,
      final_ranking_score: Math.round(finalRankingScore * 100) / 100
    };
    
  } catch (error) {
    console.error('Error processing place:', error);
    return null;
  }
}

/**
 * Get recommendations for immediate use (when travel plan type is 'now')
 */
export async function getImmediateRecommendations(travelPlan: TravelPlan, currentUserId?: string): Promise<RecommendedPlace[]> {
  const recommendations = await getRecommendations(travelPlan, currentUserId);
  
  // Filter for places that are likely open now
  const currentHour = new Date().getHours();
  
  return recommendations.filter(place => {
    // Simple heuristic for likely open places
    if (place.category === 'park' || place.category === 'viewpoint' || place.category === 'hiking-trail') {
      return true; // Outdoor places usually accessible
    }
    
    if (place.category === 'coffee-shop' && currentHour >= 7 && currentHour <= 20) {
      return true;
    }
    
    if (place.category === 'restaurant' && (
      (currentHour >= 12 && currentHour <= 15) || (currentHour >= 19 && currentHour <= 23)
    )) {
      return true;
    }
    
    if (place.category === 'bar' && currentHour >= 18) {
      return true;
    }
    
    if (['museum', 'theater', 'shopping'].includes(place.category) && 
        currentHour >= 9 && currentHour <= 18) {
      return true;
    }
    
    return false;
  });
}
