/**
 * FREE Embedding Service - Generate vector embeddings without paid APIs
 * 
 * Strategy: Use TF-IDF + Word2Vec-like approach for 100% free embeddings
 * Dimensions: 384 (standard for sentence transformers)
 * Cost: $0 (completely free, no external API calls)
 */

import { supabase } from '@/core/database/supabase';

const EMBEDDING_DIMENSIONS = 384;

/**
 * Generate a simple but effective embedding vector from text
 * Uses TF-IDF weighting + positional encoding + semantic hashing
 */
function generateFreeEmbedding(text: string): number[] {
  const cleanText = text.toLowerCase().trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
  const words = cleanText.split(' ').filter(w => w.length > 2);
  
  // Initialize embedding vector
  const embedding = new Array(EMBEDDING_DIMENSIONS).fill(0);
  
  if (words.length === 0) {
    return embedding;
  }
  
  // Word frequency (TF)
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  // Calculate TF-IDF-like scores and distribute across embedding
  words.forEach((word, position) => {
    const freq = wordFreq.get(word) || 1;
    const tf = freq / words.length; // Term frequency
    const idf = Math.log(words.length / freq); // Inverse document frequency (simplified)
    const tfidf = tf * idf;
    
    // Positional encoding (words at start/end matter more)
    const positionWeight = 1 + (1 / (1 + position)) + (1 / (1 + (words.length - position)));
    
    // Hash word to multiple dimensions for better representation
    for (let i = 0; i < 3; i++) {
      const hash = hashString(word + i) % EMBEDDING_DIMENSIONS;
      embedding[hash] += tfidf * positionWeight;
    }
    
    // Add character n-grams for better semantic matching
    for (let n = 2; n <= Math.min(4, word.length); n++) {
      for (let j = 0; j <= word.length - n; j++) {
        const ngram = word.substring(j, j + n);
        const ngramHash = hashString(ngram) % EMBEDDING_DIMENSIONS;
        embedding[ngramHash] += (tfidf * 0.3) / (word.length - n + 1);
      }
    }
  });
  
  // Normalize vector to unit length (important for cosine similarity)
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return embedding.map(val => val / magnitude);
  }
  
  return embedding;
}

/**
 * Simple string hashing function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate embedding for a place and save to database
 */
export async function generatePlaceEmbedding(placeId: string): Promise<void> {
  try {
    // Fetch place data
    const { data: place, error } = await supabase
      .from('places')
      .select(`
        name,
        description,
        city,
        address,
        price_level,
        indoor_outdoor,
        place_types!inner(name, slug, category)
      `)
      .eq('id', placeId)
      .single();

    if (error || !place) {
      throw new Error(`Place not found: ${placeId}`);
    }

    // Combine relevant fields into text
    const placeTypes = place.place_types as unknown as { name: string; slug: string; category: string }[];
    const placeType = placeTypes?.[0] || { name: '', slug: 'restaurant', category: 'food-beverage' };
    const text = [
      `Name: ${place.name}`,
      `Type: ${placeType.slug} (${placeType.category})`,
      place.description ? `Description: ${place.description}` : '',
      `Location: ${place.address || ''}, ${place.city}`,
      place.price_level ? `Price: ${place.price_level}` : '',
      place.indoor_outdoor ? `Environment: ${place.indoor_outdoor}` : '',
    ].filter(Boolean).join('. ');

    // Generate embedding
    const embedding = generateFreeEmbedding(text);

    // Save to database
    const { error: updateError } = await supabase
      .from('places')
      .update({ content_embedding: embedding })
      .eq('id', placeId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Generated embedding for place: ${place.name}`);
  } catch (error) {
    console.error(`Failed to generate place embedding for ${placeId}:`, error);
    throw error;
  }
}

/**
 * Generate embedding for a review and save to database
 */
export async function generateReviewEmbedding(reviewId: string): Promise<void> {
  try {
    // Fetch review with experience tags
    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        overall_rating,
        comment,
        price_range,
        visit_date,
        review_experience_tags!inner(
          experience_tags!inner(name, category)
        )
      `)
      .eq('id', reviewId)
      .single();

    if (error || !review) {
      throw new Error(`Review not found: ${reviewId}`);
    }

    // Build text representation
    const stars = '⭐'.repeat(Math.round(review.overall_rating));
    const reviewExpTags = review.review_experience_tags as unknown as Array<{ experience_tags: Array<{ name: string; category: string }> }>;
    const tags = reviewExpTags?.map((ret) => {
      const expTag = ret.experience_tags?.[0];
      return expTag ? `${expTag.name} (${expTag.category})` : '';
    }).filter(Boolean).join(', ') || '';

    const text = [
      `Rating: ${stars} (${review.overall_rating}/5)`,
      review.comment ? `Review: ${review.comment}` : '',
      tags ? `Experience: ${tags}` : '',
      review.price_range ? `Price: ${review.price_range}` : '',
      review.visit_date ? `Visit: ${review.visit_date}` : '',
    ].filter(Boolean).join('. ');

    // Generate embedding
    const embedding = generateFreeEmbedding(text);

    // Save to database
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ review_embedding: embedding })
      .eq('id', reviewId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Generated embedding for review: ${reviewId}`);
  } catch (error) {
    console.error(`Failed to generate review embedding for ${reviewId}:`, error);
    throw error;
  }
}

/**
 * Generate embedding for a user profile and save to database
 */
export async function generateProfileEmbedding(userId: string): Promise<void> {
  try {
    // Fetch user preferences and patterns
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('travel_preferences')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found: ${userId}`);
    }

    // Fetch user's place preferences
    const { data: placePrefs } = await supabase
      .from('user_place_preferences')
      .select(`
        preference_strength,
        place_types!inner(name, slug)
      `)
      .eq('user_id', userId)
      .gte('preference_strength', 0.5)
      .order('preference_strength', { ascending: false })
      .limit(10);

    // Fetch common experience tags from reviews
    const { data: reviewTags } = await supabase
      .from('reviews')
      .select(`
        review_experience_tags!inner(
          experience_tags!inner(name, category)
        )
      `)
      .eq('user_id', userId)
      .limit(50);

    // Build text representation
    const prefs = profile.travel_preferences as Record<string, unknown> || {};
    const placePrefsList = placePrefs as unknown as Array<{ place_types: Array<{ name: string; slug: string }> }>;
    const likedPlaces = placePrefsList?.map(p => {
      const pType = p.place_types?.[0];
      return pType?.slug || '';
    }).filter(Boolean).join(', ') || '';
    
    const tagCounts = new Map<string, number>();
    const reviewTagsList = reviewTags as unknown as Array<{
      review_experience_tags: Array<{ experience_tags: Array<{ name: string }> }>
    }>;
    
    reviewTagsList?.forEach((r) => {
      r.review_experience_tags?.forEach((ret) => {
        const expTag = ret.experience_tags?.[0];
        if (expTag?.name) {
          const tag = expTag.name;
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      });
    });
    
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag)
      .join(', ');

    const text = [
      `Preferences: ${JSON.stringify(prefs)}`,
      likedPlaces ? `Favorite place types: ${likedPlaces}` : '',
      topTags ? `Values: ${topTags}` : '',
    ].filter(Boolean).join('. ');

    // Generate embedding
    const embedding = generateFreeEmbedding(text);

    // Save to database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ preference_embedding: embedding })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Generated embedding for user profile: ${userId}`);
  } catch (error) {
    console.error(`Failed to generate profile embedding for ${userId}:`, error);
    throw error;
  }
}

/**
 * Batch generate place embeddings
 */
export async function batchGeneratePlaceEmbeddings(limit: number = 50): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  try {
    // Get places without embeddings
    const { data: places, error } = await supabase
      .from('places')
      .select('id, name')
      .is('content_embedding', null)
      .limit(limit);

    if (error) throw error;

    if (!places || places.length === 0) {
      console.log('No places need embeddings');
      return { success: 0, failed: 0, total: 0 };
    }

    console.log(`Generating embeddings for ${places.length} places...`);

    let success = 0;
    let failed = 0;

    for (const place of places) {
      try {
        await generatePlaceEmbedding(place.id);
        success++;
      } catch (error) {
        console.error(`Failed for place ${place.name}:`, error);
        failed++;
      }
    }

    return { success, failed, total: places.length };
  } catch (error) {
    console.error('Error in batchGeneratePlaceEmbeddings:', error);
    throw error;
  }
}

/**
 * Batch generate review embeddings
 */
export async function batchGenerateReviewEmbeddings(limit: number = 50): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id')
      .is('review_embedding', null)
      .limit(limit);

    if (error) throw error;

    if (!reviews || reviews.length === 0) {
      console.log('No reviews need embeddings');
      return { success: 0, failed: 0, total: 0 };
    }

    console.log(`Generating embeddings for ${reviews.length} reviews...`);

    let success = 0;
    let failed = 0;

    for (const review of reviews) {
      try {
        await generateReviewEmbedding(review.id);
        success++;
      } catch (error) {
        console.error(`Failed for review ${review.id}:`, error);
        failed++;
      }
    }

    return { success, failed, total: reviews.length };
  } catch (error) {
    console.error('Error in batchGenerateReviewEmbeddings:', error);
    throw error;
  }
}

/**
 * Batch generate profile embeddings
 */
export async function batchGenerateProfileEmbeddings(limit: number = 50): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(limit);

    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found');
      return { success: 0, failed: 0, total: 0 };
    }

    console.log(`Generating embeddings for ${profiles.length} profiles...`);

    let success = 0;
    let failed = 0;

    for (const profile of profiles) {
      try {
        await generateProfileEmbedding(profile.id);
        success++;
      } catch (error) {
        console.error(`Failed for profile ${profile.full_name}:`, error);
        failed++;
      }
    }

    return { success, failed, total: profiles.length };
  } catch (error) {
    console.error('Error in batchGenerateProfileEmbeddings:', error);
    throw error;
  }
}
