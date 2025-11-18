/**
 * Embedding Service - Generate vector embeddings for places, reviews, and profiles
 * Uses OpenAI API for embedding generation (Groq doesn't have embeddings yet)
 */

import { supabase } from '../database/supabase';

// Groq doesn't have native embeddings API yet, so we'll use OpenAI's
// But keeping the structure ready for when Groq adds embeddings
// For now, using a workaround with text-embedding via external service

// NOTE: Since Groq doesn't have embeddings API, we'll use OpenAI's embedding API
// with a fallback to a simple bag-of-words approach if OpenAI is not available
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding vector from text using OpenAI
 * Falls back to simple vector if OpenAI is not available
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Clean and prepare text
    const cleanText = text.trim().replace(/\s+/g, ' ').substring(0, 8000); // Max 8k chars
    
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY not set - using fallback embedding');
      return generateFallbackEmbedding(cleanText);
    }

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: cleanText,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Fallback to simple embedding
    return generateFallbackEmbedding(text);
  }
}

/**
 * Fallback: Generate simple bag-of-words embedding when OpenAI is unavailable
 * This is a simplified approach for development/testing
 */
function generateFallbackEmbedding(text: string): number[] {
  // Create a deterministic embedding based on text content
  const words = text.toLowerCase().split(/\s+/);
  const vector = new Array(EMBEDDING_DIMENSIONS).fill(0);
  
  // Simple hash-based embedding
  words.forEach((word, idx) => {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const position = (charCode * (idx + 1) * (i + 1)) % EMBEDDING_DIMENSIONS;
      vector[position] += 1 / (words.length + 1);
    }
  });
  
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => magnitude > 0 ? val / magnitude : 0);
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
