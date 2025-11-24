/**
 * Debug: Check Reviews and Their Experience Tags
 * 
 * Verifies what reviews exist and if they have experience tags
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugReviews() {
  console.log('🔍 Debugging Reviews & Experience Tags\n');
  console.log('='.repeat(60));
  
  // 1. Get all reviews
  console.log('\n📋 Fetching all reviews...\n');
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (reviewsError) {
    console.error('❌ Error fetching reviews:', reviewsError);
    return;
  }
  
  if (!reviews || reviews.length === 0) {
    console.log('⚠️  No reviews found in database');
    return;
  }
  
  console.log(`✅ Found ${reviews.length} review(s)\n`);
  
  // 2. For each review, get its experience tags
  for (const review of reviews) {
    console.log('─'.repeat(60));
    console.log(`Review ID: ${review.id}`);
    console.log(`Place ID: ${review.place_id}`);
    console.log(`Rating: ${review.overall_rating}/5 ⭐`);
    console.log(`Visit Date: ${review.visit_date}`);
    console.log(`Price Range: ${review.price_range || 'Not specified'}`);
    console.log(`Comment: ${review.comment ? review.comment.substring(0, 100) + '...' : 'No comment'}`);
    console.log(`Created: ${new Date(review.created_at).toLocaleString()}`);
    
    // Get experience tags for this review
    const { data: tagLinks, error: tagsError } = await supabase
      .from('review_experience_tags')
      .select(`
        experience_tag_id,
        experience_tags (
          name,
          slug,
          category
        )
      `)
      .eq('review_id', review.id);
    
    if (tagsError) {
      console.log(`❌ Error fetching tags: ${tagsError.message}`);
    } else if (!tagLinks || tagLinks.length === 0) {
      console.log('⚠️  NO EXPERIENCE TAGS attached to this review');
    } else {
      console.log(`\n✅ Experience Tags (${tagLinks.length}):`);
      tagLinks.forEach((link) => {
        const tag = Array.isArray(link.experience_tags) ? link.experience_tags[0] : link.experience_tags;
        if (tag) {
          console.log(`   - ${tag.name} [${tag.category}]`);
        }
      });
    }
    
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`Total Reviews: ${reviews.length}`);
  
  // Count reviews with and without tags
  let withTags = 0;
  let withoutTags = 0;
  
  for (const review of reviews) {
    const { data: tagLinks } = await supabase
      .from('review_experience_tags')
      .select('experience_tag_id')
      .eq('review_id', review.id);
    
    if (tagLinks && tagLinks.length > 0) {
      withTags++;
    } else {
      withoutTags++;
    }
  }
  
  console.log(`Reviews with tags: ${withTags}`);
  console.log(`Reviews without tags: ${withoutTags}`);
  
  if (withoutTags > 0) {
    console.log('\n⚠️  Issue detected: Some reviews don\'t have experience tags!');
    console.log('\nPossible causes:');
    console.log('1. Tags were not selected in the form');
    console.log('2. There was an error saving tags (check browser console logs)');
    console.log('3. The saveReview function had an error but didn\'t throw');
    console.log('\n💡 Check browser console when submitting a review to see detailed logs');
  } else {
    console.log('\n✅ All reviews have experience tags attached!');
  }
}

debugReviews().catch(console.error);
