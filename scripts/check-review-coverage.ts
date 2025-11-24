/**
 * Check Review Coverage Script
 * 
 * Shows how many reviews each place has
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkReviewCoverage() {
  console.log('📊 Checking Review Coverage\n');
  console.log('='.repeat(70));

  // Get all places with review counts
  const { data: places, error } = await supabase
    .from('places')
    .select('id, name, city')
    .order('name');

  if (error) {
    console.error('❌ Error fetching places:', error);
    return;
  }

  if (!places || places.length === 0) {
    console.log('⚠️  No places found');
    return;
  }

  const stats = {
    total: places.length,
    with0: 0,
    with1: 0,
    with2: 0,
    with3to4: 0,
    with5plus: 0,
  };

  const placesByReviewCount: Record<number, typeof places> = {};

  for (const place of places) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('place_id', place.id);

    const reviewCount = reviews?.length || 0;

    if (!placesByReviewCount[reviewCount]) {
      placesByReviewCount[reviewCount] = [];
    }
    placesByReviewCount[reviewCount].push(place);

    if (reviewCount === 0) stats.with0++;
    else if (reviewCount === 1) stats.with1++;
    else if (reviewCount === 2) stats.with2++;
    else if (reviewCount >= 3 && reviewCount <= 4) stats.with3to4++;
    else stats.with5plus++;
  }

  // Display statistics
  console.log('\n📈 Statistics:');
  console.log(`   Total Places: ${stats.total}`);
  console.log(`   ❌ 0 reviews: ${stats.with0} places (${((stats.with0 / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   ⚠️  1 review: ${stats.with1} places (${((stats.with1 / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   ⚠️  2 reviews: ${stats.with2} places (${((stats.with2 / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   ✅ 3-4 reviews: ${stats.with3to4} places (${((stats.with3to4 / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   ✅ 5+ reviews: ${stats.with5plus} places (${((stats.with5plus / stats.total) * 100).toFixed(1)}%)`);

  const needsMoreReviews = stats.with0 + stats.with1 + stats.with2;
  const wellCovered = stats.with3to4 + stats.with5plus;
  console.log(`\n   🎯 Well covered (3+ reviews): ${wellCovered}/${stats.total} (${((wellCovered / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   ⚠️  Needs more reviews (<3): ${needsMoreReviews}/${stats.total} (${((needsMoreReviews / stats.total) * 100).toFixed(1)}%)`);

  // Show places with 0-2 reviews
  console.log('\n' + '='.repeat(70));
  console.log('📋 Places needing more reviews (<3):');
  console.log('='.repeat(70));

  for (let i = 0; i <= 2; i++) {
    const placesWithCount = placesByReviewCount[i] || [];
    if (placesWithCount.length > 0) {
      console.log(`\n${i} review(s) - ${placesWithCount.length} places:`);
      placesWithCount.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.name} (${p.city})`);
      });
    }
  }

  console.log('\n' + '='.repeat(70));
}

checkReviewCoverage().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
