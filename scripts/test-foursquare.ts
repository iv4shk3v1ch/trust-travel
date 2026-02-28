import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

if (!FOURSQUARE_API_KEY) {
  console.error('❌ Missing FOURSQUARE_API_KEY in .env.local');
  console.error('');
  console.error('Add this to your .env.local file:');
  console.error('FOURSQUARE_API_KEY=your_api_key_here');
  console.error('');
  console.error('Get your API key from: https://foursquare.com/developers/apps');
  process.exit(1);
}

// Validate API key format
if (!FOURSQUARE_API_KEY.startsWith('fsq3')) {
  console.error('❌ Invalid Foursquare API key format!');
  console.error('');
  console.error('Your API key should start with "fsq3"');
  console.error(`Your key starts with: "${FOURSQUARE_API_KEY.substring(0, 10)}..."`);
  console.error('');
  console.error('Make sure you are using the v3 API key from:');
  console.error('https://foursquare.com/developers/apps');
  process.exit(1);
}

// Trento coordinates
const TRENTO_LAT = 46.0664;
const TRENTO_LON = 11.1257;
const RADIUS = 5000; // 5km radius

interface FoursquarePlace {
  fsq_id: string;
  name: string;
  categories: Array<{
    id: number;
    name: string;
    short_name: string;
    plural_name: string;
    icon: {
      prefix: string;
      suffix: string;
    };
  }>;
  geocodes: {
    main: {
      latitude: number;
      longitude: number;
    };
  };
  location: {
    address?: string;
    country?: string;
    formatted_address?: string;
    locality?: string;
    postcode?: string;
    region?: string;
  };
  distance?: number;
  rating?: number;
  stats?: {
    total_photos: number;
    total_ratings: number;
    total_tips: number;
  };
  price?: number;
  hours?: {
    display: string;
    is_local_holiday: boolean;
    open_now: boolean;
  };
  closed_bucket?: string;
}

interface FoursquareTip {
  id: string;
  created_at: string;
  text: string;
  agree_count: number;
  disagree_count: number;
}

async function searchPlaces() {
  console.log('🔍 Searching for places in Trento...\n');

  // Foursquare Places API - text search endpoint
  const query = 'tourist attractions restaurants cafes museums';
  const url = `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(query)}&ll=${TRENTO_LAT}%2C${TRENTO_LON}&radius=${RADIUS}&limit=50`;

  console.log('🔑 Using API Key:', FOURSQUARE_API_KEY?.substring(0, 10) + '...');
  console.log('🌐 Request URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': FOURSQUARE_API_KEY!,
        'Accept': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ Error response body:', errorBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const places: FoursquarePlace[] = data.results || [];

    console.log(`✅ Found ${places.length} places\n`);
    console.log('📍 Sample places:\n');

    // Show first 10 places with details
    for (const place of places.slice(0, 10)) {
      console.log(`\n🏷️  ${place.name}`);
      console.log(`   ID: ${place.fsq_id}`);
      
      if (place.categories && place.categories.length > 0) {
        console.log(`   Category: ${place.categories[0].name}`);
      }
      
      if (place.location.formatted_address) {
        console.log(`   Address: ${place.location.formatted_address}`);
      }
      
      if (place.distance) {
        console.log(`   Distance: ${place.distance}m from center`);
      }
      
      if (place.rating) {
        console.log(`   Rating: ${place.rating}/10`);
      }
      
      if (place.stats) {
        console.log(`   Stats: ${place.stats.total_ratings} ratings, ${place.stats.total_tips} tips`);
      }
      
      if (place.price) {
        console.log(`   Price level: ${'$'.repeat(place.price)}`);
      }
      
      if (place.hours) {
        console.log(`   Open now: ${place.hours.open_now ? 'Yes ✅' : 'No ❌'}`);
      }
      
      if (place.closed_bucket) {
        console.log(`   Status: ${place.closed_bucket}`);
      }
    }

    return places;
  } catch (error) {
    console.error('❌ Error fetching places:', error);
    throw error;
  }
}

async function getPlaceDetails(fsqId: string) {
  console.log(`\n\n🔍 Getting detailed info for place: ${fsqId}...\n`);

  const url = `https://api.foursquare.com/v3/places/${fsqId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': FOURSQUARE_API_KEY!,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const place = await response.json();

    console.log('📋 Detailed Information:');
    console.log(JSON.stringify(place, null, 2));

    return place;
  } catch (error) {
    console.error('❌ Error fetching place details:', error);
    throw error;
  }
}

async function getPlaceTips(fsqId: string) {
  console.log(`\n\n💬 Getting tips/reviews for place: ${fsqId}...\n`);

  const url = `https://api.foursquare.com/v3/places/${fsqId}/tips`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': FOURSQUARE_API_KEY!,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const tips: FoursquareTip[] = data || [];

    console.log(`✅ Found ${tips.length} tips/reviews\n`);

    if (tips.length > 0) {
      console.log('📝 Sample reviews:\n');
      for (const tip of tips.slice(0, 5)) {
        console.log(`\n   "${tip.text}"`);
        console.log(`   👍 ${tip.agree_count} agrees | 👎 ${tip.disagree_count} disagrees`);
        console.log(`   Date: ${new Date(tip.created_at).toLocaleDateString()}`);
      }
    } else {
      console.log('   No tips available for this place.');
    }

    return tips;
  } catch (error) {
    console.error('❌ Error fetching tips:', error);
    throw error;
  }
}

async function getCategoryStats(places: FoursquarePlace[]) {
  console.log('\n\n📊 Category Distribution:\n');

  const categoryCount = new Map<string, number>();

  for (const place of places) {
    if (place.categories && place.categories.length > 0) {
      const category = place.categories[0].name;
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    }
  }

  const sorted = Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  for (const [category, count] of sorted) {
    console.log(`   ${category}: ${count} places`);
  }
}

async function main() {
  console.log('🚀 FOURSQUARE API TEST\n');
  console.log('═══════════════════════════════════════\n');

  // 1. Search for places
  const places = await searchPlaces();

  if (places.length === 0) {
    console.log('\n⚠️  No places found. Check API key or location.');
    return;
  }

  // 2. Get category distribution
  await getCategoryStats(places);

  // 3. Get detailed info for first place with reviews
  const placeWithTips = places.find(p => p.stats && p.stats.total_tips > 0);
  
  if (placeWithTips) {
    await getPlaceDetails(placeWithTips.fsq_id);
    await getPlaceTips(placeWithTips.fsq_id);
  } else {
    console.log('\n⚠️  No places with tips found in the sample.');
  }

  console.log('\n\n📊 SUMMARY:');
  console.log(`   Total places found: ${places.length}`);
  console.log(`   Places with ratings: ${places.filter(p => p.rating).length}`);
  console.log(`   Places with tips: ${places.filter(p => p.stats && p.stats.total_tips > 0).length}`);
  console.log(`   Places with price info: ${places.filter(p => p.price).length}`);
  console.log(`   Places currently open: ${places.filter(p => p.hours?.open_now).length}`);

  console.log('\n✅ Test complete! Foursquare API is working.\n');
}

main().catch(console.error);
