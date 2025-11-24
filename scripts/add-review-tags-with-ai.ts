/**
 * Add Experience Tags to Reviews using Groq AI
 * 
 * This script analyzes existing reviews without tags and uses Groq AI
 * to automatically assign appropriate experience tags based on the review content.
 * 
 * Usage: npm run add:tags
 */

import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const groqApiKey = process.env.GROQ_API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const groq = new Groq({ apiKey: groqApiKey });

// All available experience tags with their categories
const EXPERIENCE_TAGS = {
  budget: ['luxury', 'budget-friendly'],
  'food/drink': ['halal', 'vegeterian', 'gluten-free', 'great-drinks', 'great-food', 'vegan'],
  occasion: ['date-spot', 'great-for-daytime', 'best-at-night', 'rainy-day-spot'],
  service: ['quick-service', 'friendly-staff'],
  'social context': [
    'local-favorite',
    'dj',
    'family-friendly',
    'pet-friendly',
    'touristy',
    'solo-friendly',
    'perfect-for-couples',
    'student-crowd',
    'great-for-friends',
  ],
  vibe: [
    'cozy',
    'elegant',
    'simple',
    'romantic',
    'live-music',
    'scenic-view',
    'trendy',
    'authentic-local',
    'peaceful',
    'lively',
    'hidden-gem',
    'artsy',
  ],
};

const ALL_TAG_SLUGS = Object.values(EXPERIENCE_TAGS).flat();

interface Review {
  id: string;
  place_id: string;
  comment: string;
  overall_rating: number;
  place?: {
    name: string;
    place_type?: {
      name: string;
    };
  };
}

/**
 * Generate system prompt for tag analysis
 */
function createTagAnalysisPrompt(): string {
  return `You are an expert at analyzing travel reviews and identifying experience tags.

AVAILABLE EXPERIENCE TAGS (by category):

Budget:
- luxury: High-end, expensive, premium
- budget-friendly: Affordable, good value, cheap

Food/Drink:
- halal: Halal food available
- vegeterian: Vegetarian options
- gluten-free: Gluten-free options
- great-drinks: Excellent beverages, cocktails, wine
- great-food: Delicious food, tasty dishes
- vegan: Vegan options

Occasion:
- date-spot: Romantic, perfect for dates
- great-for-daytime: Best during the day
- best-at-night: Better at night, nightlife
- rainy-day-spot: Indoor, good for bad weather

Service:
- quick-service: Fast, efficient service
- friendly-staff: Helpful, kind, welcoming staff

Social Context:
- local-favorite: Popular with locals, not touristy
- dj: Has DJ, music entertainment
- family-friendly: Good for families with children
- pet-friendly: Allows pets
- touristy: Popular tourist destination
- solo-friendly: Good for solo travelers
- perfect-for-couples: Ideal for couples
- student-crowd: Popular with students, young crowd
- great-for-friends: Good for groups of friends

Vibe:
- cozy: Warm, intimate atmosphere
- elegant: Sophisticated, classy, upscale
- simple: Basic, minimalist, no-frills
- romantic: Romantic atmosphere, intimate
- live-music: Has live music performances
- scenic-view: Beautiful views, nice scenery
- trendy: Modern, fashionable, hip
- authentic-local: Traditional, genuine local experience
- peaceful: Quiet, calm, relaxing
- lively: Energetic, vibrant, busy
- hidden-gem: Not well-known, off the beaten path
- artsy: Artistic, creative atmosphere

YOUR TASK:
Analyze the review text and select 3-7 relevant experience tags that best describe what the reviewer experienced.

RULES:
1. Select ONLY tags that are clearly supported by the review text
2. Choose 3-7 tags (not more, not less if possible)
3. Prioritize tags that capture the main themes of the review
4. Return ONLY valid tag slugs (e.g., "budget-friendly", "great-food")
5. Return tags as a JSON array of strings

Example review: "Amazing pizza! The staff was so friendly and welcoming. Perfect spot for a romantic dinner. A bit pricey but worth it."
Response: ["great-food", "friendly-staff", "romantic", "date-spot", "luxury"]

Example review: "Terrible service, food was cold. Would not recommend."
Response: ["great-food"]  // Note: Even negative reviews mention topics

IMPORTANT: Return ONLY a JSON array of tag slugs, nothing else.`;
}

/**
 * Use Groq AI to analyze review and suggest tags
 */
async function analyzeReviewWithAI(review: Review): Promise<string[]> {
  const placeName = review.place?.name || 'Unknown place';
  const placeType = review.place?.place_type?.name || 'place';
  const rating = review.overall_rating;
  
  const userPrompt = `Review for "${placeName}" (a ${placeType}):
Rating: ${rating}/5 stars

Review text:
"${review.comment}"

Based on this review, suggest 3-7 relevant experience tags as a JSON array.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: createTagAnalysisPrompt() },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile', // Updated to Llama 3.3 (3.1 was deprecated Jan 2025)
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    
    // Parse JSON response
    const tags = JSON.parse(content.trim());
    
    // Validate tags
    const validTags = tags.filter((tag: string) => ALL_TAG_SLUGS.includes(tag));
    
    return validTags.slice(0, 7); // Limit to 7 tags max
  } catch (error) {
    console.error(`   ❌ Error analyzing review ${review.id}:`, error);
    return [];
  }
}

/**
 * Get tag IDs from slugs
 */
async function getTagIds(tagSlugs: string[]): Promise<string[]> {
  if (tagSlugs.length === 0) return [];
  
  const { data, error } = await supabase
    .from('experience_tags')
    .select('id, slug')
    .in('slug', tagSlugs);

  if (error) {
    console.error('Error fetching tag IDs:', error);
    return [];
  }

  return data?.map(tag => tag.id) || [];
}

/**
 * Add tags to a review
 */
async function addTagsToReview(reviewId: string, tagIds: string[]): Promise<boolean> {
  if (tagIds.length === 0) return false;

  // Check which tags already exist for this review
  const { data: existingTags } = await supabase
    .from('review_experience_tags')
    .select('experience_tag_id')
    .eq('review_id', reviewId);

  const existingTagIds = new Set(existingTags?.map(t => t.experience_tag_id) || []);
  
  // Filter out tags that already exist
  const newTagIds = tagIds.filter(tagId => !existingTagIds.has(tagId));
  
  if (newTagIds.length === 0) {
    console.log(`   ℹ️  All tags already exist for this review`);
    return true; // Not an error, just already tagged
  }

  // Create tag associations for new tags only
  const tagAssociations = newTagIds.map(tagId => ({
    review_id: reviewId,
    experience_tag_id: tagId,
  }));

  const { error } = await supabase
    .from('review_experience_tags')
    .insert(tagAssociations);

  if (error) {
    console.error(`   ❌ Error inserting tags:`, error.message);
    return false;
  }

  return true;
}

/**
 * Main function
 */
async function addTagsToReviews() {
  console.log('🤖 AI-Powered Review Tag Analysis\n');
  console.log('='.repeat(70));

  // Validate API keys
  if (!groqApiKey) {
    console.error('❌ GROQ_API_KEY not found in environment variables');
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials not found');
    process.exit(1);
  }

  console.log('✅ API keys validated');

  // Fetch reviews without tags
  console.log('\n📋 Fetching reviews without experience tags...');
  
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      id,
      place_id,
      comment,
      overall_rating,
      place:places (
        name,
        place_type:place_types (
          name
        )
      )
    `)
    .order('created_at', { ascending: true });

  if (reviewsError) {
    console.error('❌ Error fetching reviews:', reviewsError);
    process.exit(1);
  }

  if (!reviews || reviews.length === 0) {
    console.log('⚠️  No reviews found');
    process.exit(0);
  }

  // Filter reviews that don't have tags yet
  const reviewsWithoutTags: Review[] = [];
  
  for (const review of reviews as unknown as Review[]) {
    const { data: existingTags } = await supabase
      .from('review_experience_tags')
      .select('id')
      .eq('review_id', review.id)
      .limit(1);

    if (!existingTags || existingTags.length === 0) {
      reviewsWithoutTags.push(review);
    }
  }

  console.log(`✅ Found ${reviews.length} total reviews`);
  console.log(`   📝 ${reviewsWithoutTags.length} reviews need tags\n`);
  console.log('='.repeat(70));

  if (reviewsWithoutTags.length === 0) {
    console.log('\n🎉 All reviews already have tags!');
    return;
  }

  // Process reviews
  let processed = 0;
  let successful = 0;
  let failed = 0;

  for (const review of reviewsWithoutTags) {
    processed++;
    const placeName = review.place?.name || 'Unknown';
    
    console.log(`\n[${processed}/${reviewsWithoutTags.length}] ${placeName}`);
    console.log(`   Review: "${review.comment.substring(0, 80)}..."`);
    console.log(`   Rating: ${review.overall_rating}/5 ⭐`);

    // Analyze with AI
    console.log(`   🤖 Analyzing with Groq AI...`);
    const suggestedTags = await analyzeReviewWithAI(review);

    if (suggestedTags.length === 0) {
      console.log(`   ⚠️  No tags suggested`);
      failed++;
      continue;
    }

    console.log(`   ✅ Suggested tags: ${suggestedTags.join(', ')}`);

    // Get tag IDs
    const tagIds = await getTagIds(suggestedTags);

    if (tagIds.length === 0) {
      console.log(`   ❌ Could not find tag IDs`);
      failed++;
      continue;
    }

    // Add tags to review
    const success = await addTagsToReview(review.id, tagIds);

    if (success) {
      console.log(`   ✅ Added ${tagIds.length} tags to review`);
      successful++;
    } else {
      console.log(`   ❌ Failed to add tags`);
      failed++;
    }

    // Rate limiting - small delay to avoid overwhelming API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Summary:');
  console.log(`   Total processed: ${processed}`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success rate: ${((successful / processed) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));
  console.log('\n✨ Tag analysis completed!\n');
}

// Run the script
addTagsToReviews().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
