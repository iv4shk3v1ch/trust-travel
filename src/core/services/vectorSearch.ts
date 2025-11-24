/**
 * Vector Search Service - Semantic similarity search using embeddings
 * Provides cosine similarity calculations and vector-based search
 */

import { supabase } from '../database/supabase';

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same dimensions');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find places similar to a given embedding vector
 * Uses cosine similarity for semantic matching
 */
export async function findSimilarPlaces(
  queryEmbedding: number[],
  options: {
    limit?: number;
    threshold?: number; // Minimum similarity score (0-1)
    excludeIds?: string[]; // Place IDs to exclude
    city?: string;
  } = {}
): Promise<Array<{ id: string; name: string; similarity: number }>> {
  try {
    const {
      limit = 20,
      threshold = 0.5,
      excludeIds = [],
      city
    } = options;

    // Fetch places with embeddings
    let query = supabase
      .from('places')
      .select('id, name, content_embedding, city')
      .not('content_embedding', 'is', null);

    if (city) {
      query = query.eq('city', city);
    }

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: places, error } = await query.limit(200); // Get more for filtering

    if (error || !places) {
      console.error('Error fetching places:', error);
      return [];
    }

    // Calculate similarity for each place
    const results = places
      .map(place => {
        const embedding = place.content_embedding as unknown as number[];
        if (!embedding || embedding.length === 0) return null;

        const similarity = cosineSimilarity(queryEmbedding, embedding);
        
        return {
          id: place.id,
          name: place.name,
          similarity,
        };
      })
      .filter((result): result is NonNullable<typeof result> => 
        result !== null && result.similarity >= threshold
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`✅ Found ${results.length} similar places`);
    return results;
  } catch (error) {
    console.error('Error in findSimilarPlaces:', error);
    return [];
  }
}

/**
 * Find places DISSIMILAR to a given embedding (for discovery/diversity)
 * Returns places with LOW similarity scores
 */
export async function findDissimilarPlaces(
  queryEmbedding: number[],
  options: {
    limit?: number;
    maxSimilarity?: number; // Maximum similarity score (0-1)
    city?: string;
  } = {}
): Promise<Array<{ id: string; name: string; similarity: number }>> {
  try {
    const {
      limit = 20,
      maxSimilarity = 0.5,
      city
    } = options;

    console.log(`🗺️ Searching for dissimilar places (limit: ${limit}, max similarity: ${maxSimilarity})`);

    // Fetch places with embeddings
    let query = supabase
      .from('places')
      .select('id, name, content_embedding, city')
      .not('content_embedding', 'is', null);

    if (city) {
      query = query.eq('city', city);
    }

    const { data: places, error } = await query.limit(200);

    if (error || !places) {
      console.error('Error fetching places:', error);
      return [];
    }

    // Calculate similarity and find LEAST similar
    const results = places
      .map(place => {
        const embedding = place.content_embedding as unknown as number[];
        if (!embedding || embedding.length === 0) return null;

        const similarity = cosineSimilarity(queryEmbedding, embedding);
        
        return {
          id: place.id,
          name: place.name,
          similarity,
        };
      })
      .filter((result): result is NonNullable<typeof result> => 
        result !== null && result.similarity <= maxSimilarity
      )
      .sort((a, b) => a.similarity - b.similarity) // Sort by LOWEST similarity
      .slice(0, limit);

    console.log(`✅ Found ${results.length} dissimilar places`);
    return results;
  } catch (error) {
    console.error('Error in findDissimilarPlaces:', error);
    return [];
  }
}

/**
 * Find reviews similar to a given embedding
 * Useful for finding similar sentiments/experiences
 */
export async function findSimilarReviews(
  queryEmbedding: number[],
  options: {
    limit?: number;
    threshold?: number;
    placeId?: string; // Filter by specific place
  } = {}
): Promise<Array<{ id: string; userId: string; placeId: string; similarity: number }>> {
  try {
    const {
      limit = 20,
      threshold = 0.5,
      placeId
    } = options;

    console.log(`🔍 Searching for similar reviews (limit: ${limit})`);

    // Fetch reviews with embeddings
    let query = supabase
      .from('reviews')
      .select('id, user_id, place_id, review_embedding')
      .not('review_embedding', 'is', null);

    if (placeId) {
      query = query.eq('place_id', placeId);
    }

    const { data: reviews, error } = await query.limit(200);

    if (error || !reviews) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    // Calculate similarity for each review
    const results = reviews
      .map(review => {
        const embedding = review.review_embedding as unknown as number[];
        if (!embedding || embedding.length === 0) return null;

        const similarity = cosineSimilarity(queryEmbedding, embedding);
        
        return {
          id: review.id,
          userId: review.user_id,
          placeId: review.place_id,
          similarity,
        };
      })
      .filter((result): result is NonNullable<typeof result> => 
        result !== null && result.similarity >= threshold
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`✅ Found ${results.length} similar reviews`);
    return results;
  } catch (error) {
    console.error('Error in findSimilarReviews:', error);
    return [];
  }
}

/**
 * Find users with similar preferences based on profile embeddings
 * Useful for collaborative filtering
 */
export async function findSimilarUsers(
  userEmbedding: number[],
  options: {
    limit?: number;
    threshold?: number;
    excludeUserId?: string;
  } = {}
): Promise<Array<{ id: string; similarity: number }>> {
  try {
    const {
      limit = 10,
      threshold = 0.6, // Higher threshold for user similarity
      excludeUserId
    } = options;

    console.log(`👥 Searching for similar users (limit: ${limit})`);

    // Fetch profiles with embeddings
    let query = supabase
      .from('profiles')
      .select('id, preference_embedding')
      .not('preference_embedding', 'is', null);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data: profiles, error } = await query.limit(100);

    if (error || !profiles) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    // Calculate similarity for each profile
    const results = profiles
      .map(profile => {
        const embedding = profile.preference_embedding as unknown as number[];
        if (!embedding || embedding.length === 0) return null;

        const similarity = cosineSimilarity(userEmbedding, embedding);
        
        return {
          id: profile.id,
          similarity,
        };
      })
      .filter((result): result is NonNullable<typeof result> => 
        result !== null && result.similarity >= threshold
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`✅ Found ${results.length} similar users`);
    return results;
  } catch (error) {
    console.error('Error in findSimilarUsers:', error);
    return [];
  }
}

/**
 * Get semantic similarity score between a user and a place
 * Higher score = better match for personalization
 */
export async function getPlaceUserSimilarity(
  placeId: string,
  userId: string
): Promise<number> {
  try {
    // Fetch place embedding
    const { data: place } = await supabase
      .from('places')
      .select('content_embedding')
      .eq('id', placeId)
      .single();

    // Fetch user profile embedding
    const { data: profile } = await supabase
      .from('profiles')
      .select('preference_embedding')
      .eq('id', userId)
      .single();

    if (!place?.content_embedding || !profile?.preference_embedding) {
      return 0;
    }

    const placeEmbedding = place.content_embedding as unknown as number[];
    const userEmbedding = profile.preference_embedding as unknown as number[];

    if (!placeEmbedding || !userEmbedding) {
      return 0;
    }

    return cosineSimilarity(placeEmbedding, userEmbedding);
  } catch (error) {
    console.error('Error calculating place-user similarity:', error);
    return 0;
  }
}

/**
 * Hybrid search: Combine semantic similarity with keyword matching
 * First finds semantically similar places, then filters by keywords
 */
export async function hybridPlaceSearch(
  queryEmbedding: number[],
  keywords: string[],
  options: {
    limit?: number;
    city?: string;
  } = {}
): Promise<Array<{ id: string; name: string; similarity: number }>> {
  try {
    const { limit = 20, city } = options;

    // First get semantically similar places
    const similar = await findSimilarPlaces(queryEmbedding, {
      limit: limit * 3, // Get more candidates
      threshold: 0.3, // Lower threshold
      city
    });

    if (keywords.length === 0) {
      return similar.slice(0, limit);
    }

    // Fetch full place data for keyword filtering
    const placeIds = similar.map(p => p.id);
    const { data: places } = await supabase
      .from('places')
      .select('id, name, description')
      .in('id', placeIds);

    if (!places) {
      return similar.slice(0, limit);
    }

    // Score places by keyword matches
    const scored = similar.map(sim => {
      const place = places.find(p => p.id === sim.id);
      if (!place) return { ...sim, keywordScore: 0, finalScore: sim.similarity };

      const text = `${place.name} ${place.description}`.toLowerCase();
      const matches = keywords.filter(kw => text.includes(kw.toLowerCase())).length;
      const keywordScore = matches / keywords.length;

      return {
        ...sim,
        keywordScore,
        // Combine semantic + keyword scores
        finalScore: sim.similarity * 0.7 + keywordScore * 0.3
      };
    });

    // Sort by combined score
    scored.sort((a, b) => b.finalScore - a.finalScore);

    return scored.slice(0, limit);
  } catch (error) {
    console.error('Error in hybridPlaceSearch:', error);
    return [];
  }
}

