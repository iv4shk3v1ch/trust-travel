/**
 * Embedding Service
 * Generates 384-dimensional vectors using all-MiniLM-L6-v2 model
 * Uses Xenova Transformers for local embedding generation (no API costs!)
 */

import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';
import { supabase } from '../database/supabase';
import {
  EMBEDDING_DIMENSION,
  EMBEDDING_MODEL,
  type Vector,
} from '../types/vectorTypes';

/**
 * Singleton pipeline instance for the embedding model
 */
let embeddingPipeline: FeatureExtractionPipeline | null = null;

/**
 * Initialize the embedding pipeline
 * This downloads the model on first use (cached afterwards)
 */
async function initializePipeline(): Promise<FeatureExtractionPipeline> {
  if (!embeddingPipeline) {
    console.log('🔄 Initializing embedding model:', EMBEDDING_MODEL);
    try {
      // Create feature-extraction pipeline with all-MiniLM-L6-v2
      const pipe = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      embeddingPipeline = pipe as FeatureExtractionPipeline;
      console.log('✅ Embedding model initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize embedding model:', error);
      throw new Error('Failed to initialize embedding model');
    }
  }
  return embeddingPipeline as FeatureExtractionPipeline;
}

/**
 * Generate embedding vector from text using Xenova transformers
 * No API calls - runs locally!
 */
async function generateEmbedding(text: string): Promise<Vector> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  try {
    const pipeline = await initializePipeline();

    // Clean text (max 512 tokens for all-MiniLM-L6-v2)
    const cleanText = text.trim().replace(/\s+/g, ' ').substring(0, 8000);

    // Generate embedding
    const output = await pipeline(cleanText, {
      pooling: 'mean',
      normalize: true, // Normalize to unit vector
    });

    // Extract embedding array from tensor
    const embedding = Array.from(output.data) as Vector;

    // Verify dimension
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Invalid embedding dimension: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`
      );
    }

    return embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embedding for a place
 * Combines: name, type, description, location, attributes
 */
export async function generatePlaceEmbedding(placeId: string): Promise<boolean> {
  try {
    console.log(`🏢 Generating embedding for place ${placeId}`);

    // Fetch place data with related info
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select(`
        *,
        place_types!inner(name, slug)
      `)
      .eq('id', placeId)
      .single();

    if (placeError || !place) {
      console.error('Error fetching place:', placeError);
      return false;
    }

    // Build content string for embedding
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const placeType = (place as any).place_types?.name || 'Place';
    const content = `
      Name: ${place.name}
      Type: ${placeType}
      Description: ${place.description || 'No description'}
      Location: ${place.city}, ${place.address || ''}
      Price Level: ${place.price_level || 'medium'}
      Environment: ${place.indoor_outdoor || 'mixed'}
    `.trim();

    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Store in database
    const { error: updateError } = await supabase
      .from('places')
      .update({
        content_embedding: embedding,
        embedding_model: EMBEDDING_MODEL,
        embedding_updated_at: new Date().toISOString(),
      })
      .eq('id', placeId);

    if (updateError) {
      console.error('Error updating place embedding:', updateError);
      return false;
    }

    console.log(`✅ Place embedding generated successfully`);
    return true;
  } catch (error) {
    console.error('Error in generatePlaceEmbedding:', error);
    return false;
  }
}

/**
 * Generate embedding for a review
 * Combines: rating, comment, tags, price range
 */
export async function generateReviewEmbedding(reviewId: string): Promise<boolean> {
  try {
    console.log(`📝 Generating embedding for review ${reviewId}`);

    // Fetch review data with experience tags
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        *,
        review_experience_tags!inner(
          experience_tags!inner(name, slug)
        )
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      console.error('Error fetching review:', reviewError);
      return false;
    }

    // Extract experience tags
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tags = (review as any).review_experience_tags
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.map((ret: any) => ret.experience_tags?.name)
      .filter(Boolean)
      .join(', ') || 'No tags';

    // Build content string for embedding
    const content = `
      Rating: ${review.overall_rating}/5
      Comment: ${review.comment || 'No comment'}
      Experience Tags: ${tags}
      Price Range: ${review.price_range || 'Not specified'}
      Visit Date: ${review.visit_date}
    `.trim();

    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Store in database
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        review_embedding: embedding,
        embedding_model: EMBEDDING_MODEL,
        embedding_updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Error updating review embedding:', updateError);
      return false;
    }

    console.log(`✅ Review embedding generated successfully`);
    return true;
  } catch (error) {
    console.error('Error in generateReviewEmbedding:', error);
    return false;
  }
}

/**
 * Generate embedding for a user profile
 * Combines: preferences, liked place types, recent review sentiments
 */
export async function generateProfileEmbedding(userId: string): Promise<boolean> {
  try {
    console.log(`👤 Generating embedding for profile ${userId}`);

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return false;
    }

    // Fetch user's place type preferences
    const { data: placePrefs } = await supabase
      .from('user_place_preferences')
      .select(`
        preference_strength,
        place_types!inner(name)
      `)
      .eq('user_id', userId)
      .order('preference_strength', { ascending: false })
      .limit(10);

    const likedPlaceTypes = placePrefs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.map(p => (p as any).place_types?.name)
      .filter(Boolean)
      .join(', ') || 'No preferences yet';

    // Fetch user's recent reviews to understand their taste
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select(`
        overall_rating,
        comment,
        review_experience_tags!inner(
          experience_tags!inner(name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentTags = recentReviews
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.flatMap(r => (r as any).review_experience_tags
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ?.map((ret: any) => ret.experience_tags?.name)
        .filter(Boolean)
      )
      .slice(0, 15)
      .join(', ') || 'No recent reviews';

    // Build content string for embedding
    const content = `
      Budget Preference: ${profile.budget}
      Environment: ${profile.env_preference}
      Activity Style: ${profile.activity_style}
      Food Restrictions: ${profile.food_restrictions || 'None'}
      Favorite Place Types: ${likedPlaceTypes}
      Recent Experience Preferences: ${recentTags}
      Age: ${profile.age || 'Not specified'}
      Gender: ${profile.gender || 'Not specified'}
    `.trim();

    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Store in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        preference_embedding: embedding,
        embedding_model: EMBEDDING_MODEL,
        embedding_updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile embedding:', updateError);
      return false;
    }

    console.log(`✅ Profile embedding generated successfully`);
    return true;
  } catch (error) {
    console.error('Error in generateProfileEmbedding:', error);
    return false;
  }
}

/**
 * Batch generate embeddings for all places without embeddings
 */
export async function batchGeneratePlaceEmbeddings(limit: number = 50): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  try {
    console.log(`🔄 Batch generating place embeddings (limit: ${limit})`);

    // Find places without embeddings
    const { data: places, error } = await supabase
      .from('places')
      .select('id')
      .is('content_embedding', null)
      .limit(limit);

    if (error || !places) {
      console.error('Error fetching places:', error);
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    let succeeded = 0;
    let failed = 0;

    for (const place of places) {
      const success = await generatePlaceEmbedding(place.id);
      if (success) {
        succeeded++;
      } else {
        failed++;
      }
      
      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Batch complete: ${succeeded} succeeded, ${failed} failed`);
    return { processed: places.length, succeeded, failed };
  } catch (error) {
    console.error('Error in batchGeneratePlaceEmbeddings:', error);
    return { processed: 0, succeeded: 0, failed: 0 };
  }
}

/**
 * Batch generate embeddings for all reviews without embeddings
 */
export async function batchGenerateReviewEmbeddings(limit: number = 50): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  try {
    console.log(`🔄 Batch generating review embeddings (limit: ${limit})`);

    // Find reviews without embeddings
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id')
      .is('review_embedding', null)
      .limit(limit);

    if (error || !reviews) {
      console.error('Error fetching reviews:', error);
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    let succeeded = 0;
    let failed = 0;

    for (const review of reviews) {
      const success = await generateReviewEmbedding(review.id);
      if (success) {
        succeeded++;
      } else {
        failed++;
      }
      
      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Batch complete: ${succeeded} succeeded, ${failed} failed`);
    return { processed: reviews.length, succeeded, failed };
  } catch (error) {
    console.error('Error in batchGenerateReviewEmbeddings:', error);
    return { processed: 0, succeeded: 0, failed: 0 };
  }
}

/**
 * Batch regenerate embeddings for all active user profiles
 */
export async function batchGenerateProfileEmbeddings(limit: number = 50): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  try {
    console.log(`🔄 Batch generating profile embeddings (limit: ${limit})`);

    // Find profiles that need updating (no embedding or old embedding)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id')
      .or(`preference_embedding.is.null,embedding_updated_at.lt.${oneWeekAgo.toISOString()}`)
      .limit(limit);

    if (error || !profiles) {
      console.error('Error fetching profiles:', error);
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    let succeeded = 0;
    let failed = 0;

    for (const profile of profiles) {
      const success = await generateProfileEmbedding(profile.id);
      if (success) {
        succeeded++;
      } else {
        failed++;
      }
      
      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Batch complete: ${succeeded} succeeded, ${failed} failed`);
    return { processed: profiles.length, succeeded, failed };
  } catch (error) {
    console.error('Error in batchGenerateProfileEmbeddings:', error);
    return { processed: 0, succeeded: 0, failed: 0 };
  }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Calculate cosine similarity between two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Similarity score (0 to 1, where 1 is identical)
 */
export function cosineSimilarity(a: Vector, b: Vector): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalize vector to unit length
 * @param vector - Input vector
 * @returns Normalized vector
 */
export function normalizeVector(vector: Vector): Vector {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));

  if (norm === 0) {
    return vector;
  }

  return vector.map((val) => val / norm);
}

/**
 * Weighted average of multiple vectors (for incremental learning)
 * Formula: result = Σ(vector_i * weight_i) / Σ(weight_i)
 * @param vectors - Array of vectors with their weights
 * @returns Averaged vector
 */
export function weightedVectorAverage(
  vectors: Array<{ vector: Vector; weight: number }>
): Vector {
  if (vectors.length === 0) {
    throw new Error('Cannot average empty vector array');
  }

  const dimension = vectors[0].vector.length;
  const result = new Array(dimension).fill(0);
  let totalWeight = 0;

  for (const { vector, weight } of vectors) {
    if (vector.length !== dimension) {
      throw new Error('All vectors must have same dimension');
    }

    totalWeight += weight;
    for (let i = 0; i < dimension; i++) {
      result[i] += vector[i] * weight;
    }
  }

  // Normalize by total weight
  if (totalWeight > 0) {
    for (let i = 0; i < dimension; i++) {
      result[i] /= totalWeight;
    }
  }

  return result;
}

/**
 * Incremental learning update for user preference embedding
 * Formula: new_vector = α * old_vector + (1-α) * interaction_vector
 * @param currentEmbedding - Current user preference vector
 * @param interactionEmbedding - Vector from new interaction (e.g., place saved)
 * @param interactionWeight - Weight for this action (from interaction_weights table)
 * @param alpha - Learning rate (0-1, default 0.9 = keep 90% of old, learn 10% new)
 * @returns Updated embedding
 */
export function updateEmbeddingIncremental(
  currentEmbedding: Vector,
  interactionEmbedding: Vector,
  interactionWeight: number,
  alpha: number = 0.9
): Vector {
  if (currentEmbedding.length !== interactionEmbedding.length) {
    throw new Error('Embeddings must have same dimension');
  }

  // Scale interaction weight (never more than 50% update in one step)
  const scaledWeight = Math.min(interactionWeight, 0.5);
  
  // Calculate: new = α * old + (1-α) * scaled_weight * interaction
  const result = currentEmbedding.map((oldVal, i) => {
    return alpha * oldVal + (1 - alpha) * scaledWeight * interactionEmbedding[i];
  });

  // Normalize to unit vector
  return normalizeVector(result);
}

/**
 * Create a zero vector (for initialization)
 * @returns Zero vector of correct dimension
 */
export function createZeroVector(): Vector {
  return new Array(EMBEDDING_DIMENSION).fill(0);
}

/**
 * Format vector for PostgreSQL
 * Converts array to pgvector format string: '[0.1, 0.2, ...]'
 * @param vector - Input vector
 * @returns Formatted string for SQL
 */
export function formatVectorForDB(vector: Vector): string {
  return `[${vector.join(',')}]`;
}

/**
 * Parse vector from database
 * Converts pgvector string back to array
 * @param dbString - String from database
 * @returns Vector array
 */
export function parseVectorFromDB(dbString: string): Vector {
  // Remove brackets and split by comma
  const cleaned = dbString.replace(/[\[\]]/g, '');
  return cleaned.split(',').map((s) => parseFloat(s.trim()));
}

/**
 * Check if model is initialized
 * @returns True if pipeline is ready
 */
export function isModelInitialized(): boolean {
  return embeddingPipeline !== null;
}

/**
 * Pre-warm the model (download and cache)
 * Call this during app initialization for better UX
 */
export async function prewarmModel(): Promise<void> {
  console.log('🔥 Pre-warming embedding model...');
  await initializePipeline();
  // Generate a dummy embedding to ensure everything works
  await generateEmbedding('test');
  console.log('✅ Model pre-warmed and ready');
}

/**
 * Generate embedding for custom text (direct access)
 * Use this for testing or custom use cases
 * @param text - Text to embed
 * @returns Vector embedding
 */
export async function generateCustomEmbedding(text: string): Promise<Vector> {
  return generateEmbedding(text);
}
