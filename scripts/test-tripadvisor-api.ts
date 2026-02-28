/**
 * TripAdvisor API Test Script
 * 
 * This script tests your TripAdvisor API connection and shows you
 * how to manually fetch data for a single place.
 * 
 * Use this to understand the API structure before running the full import.
 * 
 * Usage: npx tsx scripts/test-tripadvisor-api.ts
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY!;
const TRIPADVISOR_API_BASE = 'https://api.content.tripadvisor.com/api/v1';

async function makeApiRequest(endpoint: string) {
  const url = `${TRIPADVISOR_API_BASE}${endpoint}`;
  console.log(`\n📡 Making request to: ${url}\n`);
  
  const response = await fetch(url, {
    headers: {
      'accept': 'application/json',
      'Referer': 'http://localhost:3000'
    }
  });
  
  if (!response.ok) {
    console.error(`❌ Request failed: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.error('Response:', text);
    return null;
  }
  
  return response.json();
}

async function testApi() {
  console.log('\n🔬 TripAdvisor API Test\n');
  console.log('='.repeat(60));
  
  // Test 1: Search for Milan
  console.log('\n1️⃣  Testing location search (Milan)...\n');
  
  const searchData = await makeApiRequest(
    `/location/search?searchQuery=${encodeURIComponent('Milan Italy')}&language=en&key=${TRIPADVISOR_API_KEY}`
  );
  
  if (searchData && searchData.data && searchData.data.length > 0) {
    console.log('✅ Location search successful!\n');
    console.log(`Found ${searchData.data.length} results:`);
    searchData.data.slice(0, 3).forEach((loc: any, idx: number) => {
      console.log(`   ${idx + 1}. ${loc.name} (ID: ${loc.location_id})`);
      console.log(`      Address: ${loc.address_obj?.address_string || 'N/A'}`);
    });
    
    const milanId = searchData.data[0].location_id;
    
    // Test 2: Get place details
    console.log(`\n2️⃣  Testing location details (ID: ${milanId})...\n`);
    
    const detailsData = await makeApiRequest(
      `/location/${milanId}/details?language=en&currency=EUR&key=${TRIPADVISOR_API_KEY}`
    );
    
    if (detailsData) {
      console.log('✅ Location details successful!\n');
      console.log(`📍 Name: ${detailsData.name}`);
      console.log(`📝 Description: ${detailsData.description?.substring(0, 100)}...`);
      console.log(`⭐ Rating: ${detailsData.rating || 'N/A'}`);
      console.log(`💬 Reviews: ${detailsData.num_reviews || 'N/A'}`);
      console.log(`📍 Coordinates: ${detailsData.latitude}, ${detailsData.longitude}`);
      console.log(`🏷️  Category: ${detailsData.category?.name || 'N/A'}`);
      console.log(`💰 Price Level: ${detailsData.price_level || 'N/A'}`);
    }
    
    // Test 3: Get reviews
    console.log(`\n3️⃣  Testing reviews (ID: ${milanId})...\n`);
    
    const reviewsData = await makeApiRequest(
      `/location/${milanId}/reviews?language=en&key=${TRIPADVISOR_API_KEY}`
    );
    
    if (reviewsData && reviewsData.data) {
      console.log(`✅ Reviews fetch successful! Found ${reviewsData.data.length} reviews\n`);
      
      if (reviewsData.data.length > 0) {
        const review = reviewsData.data[0];
        console.log('Sample review:');
        console.log(`   👤 User: ${review.user?.username || 'Anonymous'}`);
        console.log(`   ⭐ Rating: ${review.rating || 'N/A'}`);
        console.log(`   📅 Date: ${review.published_date || 'N/A'}`);
        console.log(`   💬 Text: ${review.text?.substring(0, 150)}...`);
        console.log(`   🔗 User ID: ${review.user?.user_id || 'N/A'}`);
      }
    }
    
  } else {
    console.log('❌ Location search failed - check API key and rate limits\n');
  }
  
  // Test 4: Search for Duomo di Milano (famous place)
  console.log(`\n4️⃣  Testing specific place search (Duomo di Milano)...\n`);
  
  const duomoSearch = await makeApiRequest(
    `/location/search?searchQuery=${encodeURIComponent('Duomo di Milano')}&language=en&key=${TRIPADVISOR_API_KEY}`
  );
  
  if (duomoSearch && duomoSearch.data && duomoSearch.data.length > 0) {
    console.log('✅ Found Duomo!\n');
    const duomo = duomoSearch.data[0];
    console.log(`   📍 Name: ${duomo.name}`);
    console.log(`   🆔 Location ID: ${duomo.location_id}`);
    console.log(`   📍 Address: ${duomo.address_obj?.address_string || 'N/A'}`);
    
    // This location_id can be used to fetch its reviews
    console.log(`\n💡 To get reviews for this place, use:`);
    console.log(`   Location ID: ${duomo.location_id}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ API test complete!\n');
  console.log('📖 Next steps:');
  console.log('   1. Collect user IDs/usernames in milan-users.txt');
  console.log('   2. Run: npx tsx scripts/import-tripadvisor-by-users.ts');
  console.log('   3. Check progress in console output');
  console.log('   4. Verify with: npx tsx scripts/verify-rating-matrix.ts\n');
}

testApi().catch(error => {
  console.error('\n❌ Test failed:', error);
  console.log('\n⚠️  Common issues:');
  console.log('   - Invalid API key (check .env.local)');
  console.log('   - Rate limit exceeded (wait 24 hours)');
  console.log('   - Network connection issue');
  console.log('   - TripAdvisor API endpoint changed\n');
  process.exit(1);
});
