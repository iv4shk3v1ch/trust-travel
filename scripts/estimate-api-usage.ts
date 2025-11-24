/**
 * Estimate TripAdvisor API Usage
 * 
 * Estimates how many API calls we've made based on our import activities
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function estimateApiUsage() {
  console.log('📊 Estimating TripAdvisor API Usage\n');
  console.log('='.repeat(70));

  // Get total places
  const { data: places } = await supabase
    .from('places')
    .select('id')
    .limit(1000);

  const totalPlaces = places?.length || 0;

  // Estimate API calls made:
  // 1. Places import: ~61 places imported
  //    - 1 location search call per place = ~61 calls
  //    - 1 location details call per place = ~61 calls
  //    Total: ~122 calls

  // 2. Reviews import (3 runs):
  //    - Run 1: 61 places × 2 calls (search + reviews) = ~122 calls
  //    - Run 2: 51 places × 2 calls = ~102 calls  
  //    - Run 3: 32 places × 2 calls = ~64 calls
  //    Total: ~288 calls

  const estimatedPlacesImport = totalPlaces * 2; // search + details
  const estimatedReviewsImport = 288; // Based on our 3 import runs
  const estimatedTotal = estimatedPlacesImport + estimatedReviewsImport;

  console.log('\n📈 Estimated API Calls Made:');
  console.log(`   Places import: ~${estimatedPlacesImport} calls`);
  console.log(`   Reviews imports (3 runs): ~${estimatedReviewsImport} calls`);
  console.log(`   ─────────────────────────────`);
  console.log(`   Total estimated: ~${estimatedTotal} calls`);
  console.log(`   \n   Monthly limit: 5,000 calls`);
  console.log(`   Remaining: ~${5000 - estimatedTotal} calls`);
  console.log(`   Usage: ${((estimatedTotal / 5000) * 100).toFixed(1)}%`);

  // Calculate what we can do with remaining budget
  const remaining = 5000 - estimatedTotal;
  const safetyBuffer = 500; // Keep 500 calls as buffer
  const availableForReviews = remaining - safetyBuffer;

  console.log('\n' + '='.repeat(70));
  console.log('💡 What we can do with remaining budget:');
  console.log('='.repeat(70));
  
  // Get places needing reviews
  const placesWithCounts: Array<{ id: string; reviewCount: number }> = [];
  
  for (const place of places || []) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('place_id', place.id);
    
    placesWithCounts.push({
      id: place.id,
      reviewCount: reviews?.length || 0,
    });
  }

  const placesNeedingReviews = placesWithCounts.filter(p => p.reviewCount < 5).length;
  
  console.log(`\n   Places needing more reviews: ${placesNeedingReviews}`);
  console.log(`   Available API calls: ${availableForReviews} (with safety buffer)`);
  
  // Each place needs: 1 search + multiple review fetches
  // Conservative estimate: 5 calls per place (1 search + 4 review page fetches)
  const placesWeCanProcess = Math.floor(availableForReviews / 5);
  
  console.log(`   \n   ✅ We can safely process: ${placesWeCanProcess} places`);
  console.log(`   (Assuming ~5 API calls per place for thorough review fetching)`);
  
  if (placesWeCanProcess >= placesNeedingReviews) {
    console.log(`\n   🎉 We have enough budget to fetch reviews for ALL remaining places!`);
  } else {
    console.log(`\n   ⚠️  We should prioritize the ${placesWeCanProcess} places with most existing reviews`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('📋 Recommendation:');
  console.log('='.repeat(70));
  console.log(`   
   Strategy: Fetch up to 10-15 reviews per place (not 50+)
   
   This will:
   - Use ~3-5 API calls per place (1 search + 2-4 review pages)
   - Process ${Math.min(placesWeCanProcess, placesNeedingReviews)} places
   - Stay well under 5,000 limit
   - Give each place enough reviews for recommendations
   - Keep buffer for future imports
  `);
  
  console.log('='.repeat(70) + '\n');
}

estimateApiUsage().catch(console.error);
