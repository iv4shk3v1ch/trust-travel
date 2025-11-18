/**
 * Test TripAdvisor API Connection
 * 
 * Quick test to verify your TripAdvisor API key works
 * 
 * Usage: npx tsx scripts/test-tripadvisor-api.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY || '';
const TRIPADVISOR_BASE_URL = 'https://api.content.tripadvisor.com/api/v1';

// Trento coordinates
const TRENTO_LAT = 46.0664;
const TRENTO_LNG = 11.1211;

async function testAPI() {
  console.log('🧪 Testing TripAdvisor API Connection\n');
  
  if (!TRIPADVISOR_API_KEY) {
    console.error('❌ TRIPADVISOR_API_KEY not found in environment variables');
    console.log('💡 Add it to your .env.local file:\n');
    console.log('   TRIPADVISOR_API_KEY=your_key_here\n');
    process.exit(1);
  }
  
  console.log('✅ API key found:', TRIPADVISOR_API_KEY.substring(0, 8) + '...\n');
  
  // Test 1: Nearby search
  console.log('📍 Test 1: Searching for places near Trento...');
  
  const url = new URL(`${TRIPADVISOR_BASE_URL}/location/nearby_search`);
  url.searchParams.set('latLong', `${TRENTO_LAT},${TRENTO_LNG}`);
  url.searchParams.set('radius', '5');
  url.searchParams.set('radiusUnit', 'km');
  url.searchParams.set('language', 'en');
  url.searchParams.set('category', 'restaurants');
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'key': TRIPADVISOR_API_KEY
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      
      if (response.status === 401) {
        console.log('\n💡 Your API key might be invalid or expired');
        console.log('   Check: https://www.tripadvisor.com/developers');
      }
      
      if (response.status === 403) {
        console.log('\n💡 Access forbidden - check your API key permissions');
      }
      
      if (response.status === 429) {
        console.log('\n💡 Rate limit exceeded - wait a bit and try again');
      }
      
      process.exit(1);
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.log('⚠️  No results found (this might be normal for small radius)');
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      console.log(`✅ Found ${data.data.length} restaurants near Trento!\n`);
      
      // Show first 3 results
      console.log('📋 Sample results:\n');
      data.data.slice(0, 3).forEach((place: any, i: number) => {
        console.log(`${i + 1}. ${place.name}`);
        console.log(`   Address: ${place.address_obj?.address_string || 'N/A'}`);
        console.log(`   Category: ${place.category?.name || 'N/A'}`);
        if (place.rating) console.log(`   Rating: ${place.rating} (${place.num_reviews} reviews)`);
        console.log('');
      });
    }
    
    // Test 2: Get location details
    if (data.data && data.data.length > 0) {
      const firstLocation = data.data[0];
      console.log(`📄 Test 2: Fetching details for "${firstLocation.name}"...\n`);
      
      const detailsUrl = `${TRIPADVISOR_BASE_URL}/location/${firstLocation.location_id}/details`;
      
      const detailsResponse = await fetch(detailsUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'key': TRIPADVISOR_API_KEY
        }
      });
      
      if (!detailsResponse.ok) {
        console.log(`⚠️  Could not fetch details (${detailsResponse.status})`);
      } else {
        const details = await detailsResponse.json();
        console.log('✅ Details retrieved successfully!\n');
        console.log('📋 Location details:');
        console.log(`   Name: ${details.name}`);
        console.log(`   Description: ${details.description?.substring(0, 100)}...`);
        console.log(`   Phone: ${details.phone || 'N/A'}`);
        console.log(`   Website: ${details.website || 'N/A'}`);
        console.log(`   Price Level: ${details.price_level || 'N/A'}`);
        console.log(`   Coordinates: ${details.latitude}, ${details.longitude}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ TripAdvisor API is working correctly!');
    console.log('='.repeat(50));
    console.log('\n💡 You can now run the full import:');
    console.log('   npm run import:tripadvisor\n');
    
  } catch (error) {
    console.error('❌ Connection error:', error);
    console.log('\n💡 Possible issues:');
    console.log('   - Check your internet connection');
    console.log('   - Verify the API endpoint URL');
    console.log('   - Make sure your API key is correct\n');
    process.exit(1);
  }
}

testAPI();
