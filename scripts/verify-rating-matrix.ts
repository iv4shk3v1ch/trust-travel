/**
 * Verify Rating Matrix Quality
 * 
 * This script checks if imported data is sufficient for collaborative filtering:
 * - User count (>40)
 * - Cross-city user count (>30)
 * - Reviews per user (avg >10)
 * - City coverage (all cities represented)
 * - Rating distribution (not all 5 stars)
 * - Category diversity
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TARGET_CITIES = ['Milan', 'Rome', 'Florence', 'Trento'];

async function verifyDataQuality() {
  console.log('\n📊 RATING MATRIX VERIFICATION\n');
  console.log('='.repeat(60));
  
  const results = {
    pass: true,
    checks: [] as any[]
  };
  
  // Check 1: Total users
  console.log('\n1️⃣  Checking user count...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, is_synthetic')
    .eq('is_synthetic', true);
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }
  
  const userCount = users?.length || 0;
  const passUserCount = userCount >= 40;
  
  console.log(`   ${passUserCount ? '✅' : '❌'} Users: ${userCount}/40 (target: ≥40)`);
  results.checks.push({ name: 'User Count', value: userCount, target: '≥40', pass: passUserCount });
  if (!passUserCount) results.pass = false;
  
  // Check 2: Reviews per user
  console.log('\n2️⃣  Checking reviews per user...');
  const { data: reviewCounts } = await supabase
    .from('reviews')
    .select('user_id')
    .in('user_id', users?.map(u => u.id) || []);
  
  const reviewsPerUser: Record<string, number> = {};
  reviewCounts?.forEach(r => {
    reviewsPerUser[r.user_id] = (reviewsPerUser[r.user_id] || 0) + 1;
  });
  
  const avgReviewsPerUser = Object.values(reviewsPerUser).reduce((a, b) => a + b, 0) / Object.keys(reviewsPerUser).length;
  const passAvgReviews = avgReviewsPerUser >= 10;
  
  console.log(`   ${passAvgReviews ? '✅' : '❌'} Avg reviews/user: ${avgReviewsPerUser.toFixed(1)}/10 (target: ≥10)`);
  console.log(`   📊 Distribution:`);
  
  const distribution = Object.values(reviewsPerUser).reduce((acc, count) => {
    if (count < 5) acc['<5']++;
    else if (count < 10) acc['5-9']++;
    else if (count < 20) acc['10-19']++;
    else acc['20+']++;
    return acc;
  }, { '<5': 0, '5-9': 0, '10-19': 0, '20+': 0 } as Record<string, number>);
  
  console.log(`      <5 reviews: ${distribution['<5']} users`);
  console.log(`      5-9 reviews: ${distribution['5-9']} users`);
  console.log(`      10-19 reviews: ${distribution['10-19']} users`);
  console.log(`      20+ reviews: ${distribution['20+']} users`);
  
  results.checks.push({ 
    name: 'Avg Reviews/User', 
    value: avgReviewsPerUser.toFixed(1), 
    target: '≥10', 
    pass: passAvgReviews,
    distribution
  });
  if (!passAvgReviews) results.pass = false;
  
  // Check 3: Cross-city users
  console.log('\n3️⃣  Checking cross-city coverage...');
  const { data: crossCityData } = await supabase.rpc('get_cross_city_users', {
    target_cities: TARGET_CITIES
  }).catch(async () => {
    // Fallback if RPC doesn't exist
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('user_id, place_id, places!inner(city)')
      .in('places.city', TARGET_CITIES);
    
    const userCities: Record<string, Set<string>> = {};
    allReviews?.forEach((r: any) => {
      if (!userCities[r.user_id]) userCities[r.user_id] = new Set();
      userCities[r.user_id].add(r.places.city);
    });
    
    return {
      data: Object.entries(userCities)
        .filter(([_, cities]) => cities.size >= 2)
        .map(([userId, cities]) => ({
          user_id: userId,
          cities_count: cities.size,
          cities_list: Array.from(cities)
        }))
    };
  });
  
  const crossCityUserCount = crossCityData?.length || 0;
  const passCrossCityCount = crossCityUserCount >= 30;
  
  console.log(`   ${passCrossCityCount ? '✅' : '❌'} Cross-city users: ${crossCityUserCount}/30 (target: ≥30)`);
  
  if (crossCityData && crossCityData.length > 0) {
    const cityDistribution = crossCityData.reduce((acc, user: any) => {
      const count = user.cities_count;
      acc[count] = (acc[count] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    console.log(`   📊 Distribution:`);
    console.log(`      2 cities: ${cityDistribution[2] || 0} users`);
    console.log(`      3 cities: ${cityDistribution[3] || 0} users`);
    console.log(`      4 cities: ${cityDistribution[4] || 0} users`);
  }
  
  results.checks.push({ 
    name: 'Cross-City Users', 
    value: crossCityUserCount, 
    target: '≥30', 
    pass: passCrossCityCount 
  });
  if (!passCrossCityCount) results.pass = false;
  
  // Check 4: City coverage
  console.log('\n4️⃣  Checking city coverage...');
  const { data: cityStats } = await supabase
    .from('reviews')
    .select('place_id, places!inner(city)')
    .in('places.city', TARGET_CITIES);
  
  const reviewsPerCity: Record<string, number> = {};
  cityStats?.forEach((r: any) => {
    const city = r.places.city;
    reviewsPerCity[city] = (reviewsPerCity[city] || 0) + 1;
  });
  
  console.log(`   📍 Reviews by city:`);
  let passCityCoverage = true;
  
  TARGET_CITIES.forEach(city => {
    const count = reviewsPerCity[city] || 0;
    const pass = count >= 150;
    console.log(`      ${pass ? '✅' : '⚠️ '} ${city}: ${count}/150 reviews`);
    if (!pass) passCityCoverage = false;
  });
  
  results.checks.push({ 
    name: 'City Coverage', 
    value: reviewsPerCity, 
    target: '≥150 per city', 
    pass: passCityCoverage 
  });
  if (!passCityCoverage) results.pass = false;
  
  // Check 5: Rating distribution
  console.log('\n5️⃣  Checking rating distribution...');
  const { data: ratings } = await supabase
    .from('reviews')
    .select('overall_rating');
  
  const ratingDist: Record<number, number> = {};
  ratings?.forEach(r => {
    const rating = Math.floor(r.overall_rating || 0);
    ratingDist[rating] = (ratingDist[rating] || 0) + 1;
  });
  
  const totalRatings = Object.values(ratingDist).reduce((a, b) => a + b, 0);
  const avgRating = ratings?.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / (ratings?.length || 1);
  
  console.log(`   ⭐ Average rating: ${avgRating.toFixed(2)}/5.0`);
  console.log(`   📊 Distribution:`);
  for (let i = 5; i >= 1; i--) {
    const count = ratingDist[i] || 0;
    const percent = ((count / totalRatings) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(count / totalRatings * 30));
    console.log(`      ${i}★: ${bar} ${percent}% (${count})`);
  }
  
  // Good distribution: not >70% 5-star
  const fiveStarPercent = ((ratingDist[5] || 0) / totalRatings) * 100;
  const passRatingDist = fiveStarPercent < 70;
  
  console.log(`   ${passRatingDist ? '✅' : '⚠️ '} 5-star reviews: ${fiveStarPercent.toFixed(1)}% (healthy: <70%)`);
  
  results.checks.push({ 
    name: 'Rating Distribution', 
    value: avgRating.toFixed(2), 
    distribution: ratingDist,
    fiveStarPercent: fiveStarPercent.toFixed(1),
    pass: passRatingDist 
  });
  
  // Check 6: Category diversity
  console.log('\n6️⃣  Checking category diversity...');
  const { data: placeTypes } = await supabase
    .from('places')
    .select('place_type_id, place_types!inner(name, slug)')
    .in('city', TARGET_CITIES);
  
  const categoryDist: Record<string, number> = {};
  placeTypes?.forEach((p: any) => {
    const category = p.place_types.name;
    categoryDist[category] = (categoryDist[category] || 0) + 1;
  });
  
  const totalPlaces = Object.values(categoryDist).reduce((a, b) => a + b, 0);
  const sortedCategories = Object.entries(categoryDist)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  console.log(`   📊 Top 10 categories (${totalPlaces} places total):`);
  sortedCategories.forEach(([cat, count], idx) => {
    const percent = ((count / totalPlaces) * 100).toFixed(1);
    console.log(`      ${idx + 1}. ${cat}: ${count} (${percent}%)`);
  });
  
  // Good diversity: top category is <50% of total
  const topCategoryPercent = (sortedCategories[0][1] / totalPlaces) * 100;
  const passDiversity = topCategoryPercent < 50;
  
  console.log(`   ${passDiversity ? '✅' : '⚠️ '} Category diversity: Top category is ${topCategoryPercent.toFixed(1)}% (healthy: <50%)`);
  
  results.checks.push({ 
    name: 'Category Diversity', 
    value: sortedCategories,
    topCategoryPercent: topCategoryPercent.toFixed(1),
    pass: passDiversity 
  });
  
  // Final verdict
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL VERDICT');
  console.log('='.repeat(60) + '\n');
  
  if (results.pass) {
    console.log('✅ ✅ ✅  DATA QUALITY: EXCELLENT  ✅ ✅ ✅\n');
    console.log('🚀 You are ready to proceed with:');
    console.log('   - User similarity calculation');
    console.log('   - Collaborative filtering implementation');
    console.log('   - Cross-city recommendations\n');
    console.log('📖 Next step: See REVISED_IMPLEMENTATION_PLAN.md → PHASE 1\n');
  } else {
    console.log('⚠️  ⚠️  ⚠️   DATA QUALITY: NEEDS IMPROVEMENT   ⚠️  ⚠️  ⚠️ \n');
    console.log('📝 Recommendations:');
    
    const failedChecks = results.checks.filter(c => !c.pass);
    failedChecks.forEach(check => {
      console.log(`   ❌ ${check.name}: ${check.value} (target: ${check.target})`);
    });
    
    console.log('\n💡 Actions:');
    if (!results.checks[0].pass) {
      console.log('   - Collect more user IDs (add to milan-users.txt)');
    }
    if (!results.checks[1].pass) {
      console.log('   - Focus on users with more reviews (check review count before adding)');
    }
    if (!results.checks[2].pass) {
      console.log('   - Find users who traveled to multiple cities');
      console.log('   - Look for reviews on tourist hotspots (Colosseum, Duomo, etc.)');
    }
    if (!results.checks[3].pass) {
      const missingCities = TARGET_CITIES.filter(city => (reviewsPerCity[city] || 0) < 150);
      console.log(`   - Collect more users from: ${missingCities.join(', ')}`);
    }
    
    console.log('\n📖 See: scripts/README_TRIPADVISOR_IMPORT.md for tips\n');
  }
  
  // Summary table
  console.log('📊 Summary Table:\n');
  console.log('┌─────────────────────────┬─────────────┬─────────────┬────────┐');
  console.log('│ Check                   │ Current     │ Target      │ Status │');
  console.log('├─────────────────────────┼─────────────┼─────────────┼────────┤');
  
  results.checks.forEach(check => {
    const name = check.name.padEnd(23);
    const value = String(check.value).padEnd(11);
    const target = String(check.target).padEnd(11);
    const status = check.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`│ ${name} │ ${value} │ ${target} │ ${status} │`);
  });
  
  console.log('└─────────────────────────┴─────────────┴─────────────┴────────┘\n');
}

// Run verification
verifyDataQuality().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
