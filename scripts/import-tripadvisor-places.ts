/**
 * TripAdvisor Places Import Script
 * 
 * This script fetches POI (Points of Interest) from TripAdvisor API for Trento, Italy
 * and imports them into the Supabase database.
 * 
 * Usage: npx tsx scripts/import-tripadvisor-places.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// TripAdvisor API configuration
const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY || '';
const TRIPADVISOR_BASE_URL = 'https://api.content.tripadvisor.com/api/v1';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Trento location coordinates (center of city)
const TRENTO_LAT = 46.0664;
const TRENTO_LNG = 11.1211;
const SEARCH_RADIUS = 10; // km

/**
 * Map TripAdvisor categories to our place types
 */
const CATEGORY_MAPPING: Record<string, string> = {
  // Restaurants & Food
  'restaurants': 'restaurant',
  'pizza': 'pizzeria',
  'italian': 'restaurant',
  'cafes': 'cafe',
  'coffee_and_tea': 'cafe',
  'bakeries': 'cafe',
  'bars_pubs': 'aperetivo-bar',
  'wine_bars': 'aperetivo-bar',
  'beer_bars': 'craft-beer-pub',
  'fast_food': 'street-food',
  'food_trucks': 'street-food',
  'dessert': 'gelateria',
  'ice_cream': 'gelateria',
  
  // Attractions & Culture
  'museums': 'museum',
  'art_museums': 'art-gallery',
  'history_museums': 'museum',
  'specialty_museums': 'museum',
  'architectural_buildings': 'historical-landmark',
  'historic_sites': 'historical-landmark',
  'castles': 'castle',
  'churches_cathedrals': 'church',
  'monuments_statues': 'historical-landmark',
  'points_of_interest': 'viewpoint',
  'observation_decks_towers': 'tower',
  'scenic_walking_areas': 'street',
  'neighborhoods': 'old-town',
  'piers_boardwalks': 'river-walk',
  'bridges': 'bridge',
  
  // Nature & Outdoors
  'parks': 'park',
  'nature_parks': 'park',
  'gardens': 'botanical-garden',
  'hiking_trails': 'hiking-trail',
  'lookouts': 'viewpoint',
  'scenic_drives': 'viewpoint',
  'nature_wildlife_areas': 'forest-walk',
  'bodies_of_water': 'lake',
  'waterfalls': 'waterfall',
  'mountains': 'mountain-peak',
  'beaches': 'beach',
  
  // Entertainment & Nightlife
  'nightlife': 'underground-club',
  'dance_clubs': 'underground-club',
  'comedy_clubs': 'comedy-club',
  'jazz_clubs': 'live-music-venue',
  'bars_clubs': 'aperetivo-bar',
  'karaoke_bars': 'karaoke-bar',
  'performances': 'theatre',
  'theaters': 'theatre',
  'concerts_shows': 'live-music-venue',
  'opera': 'theatre',
  'cinemas': 'cinema',
  
  // Shopping
  'shopping': 'local-market',
  'shopping_malls': 'shoopping-centre',
  'flea_markets': 'local-market',
  'farmers_markets': 'food-market',
  'antique_shops': 'vintage-store',
  'gift_specialty_shops': 'artisanal-shop',
  'art_galleries': 'art-gallery',
  
  // Activities
  'spas_wellness': 'spa',
  'yoga_pilates': 'yoga-studio',
  'amusement_parks': 'adventure-park',
  
  // Cultural
  'cultural_centers': 'cultural-center',
  'libraries': 'library',
  'festivals': 'festival-area'
};

/**
 * Categories to EXCLUDE (schools, medical, businesses, etc.)
 */
const EXCLUDED_CATEGORIES = [
  'schools',
  'universities',
  'hospitals',
  'medical_services',
  'clinics',
  'pharmacies',
  'banks',
  'atms',
  'post_offices',
  'police_stations',
  'fire_stations',
  'government_buildings',
  'courthouses',
  'embassies',
  'real_estate',
  'car_rentals',
  'gas_stations',
  'parking',
  'transportation',
  'airports',
  'train_stations',
  'bus_stations',
  'auto_services',
  'insurance',
  'laundry',
  'dry_cleaning',
  'storage',
  'moving_companies'
];

interface TripAdvisorLocation {
  location_id: string;
  name: string;
  description?: string;
  address_obj?: {
    street1?: string;
    street2?: string;
    city?: string;
    country?: string;
    postalcode?: string;
    address_string?: string;
  };
  latitude?: string;
  longitude?: string;
  phone?: string;
  website?: string;
  price_level?: string; // "$", "$$", "$$$", "$$$$"
  rating?: string;
  num_reviews?: string;
  photo?: {
    images?: {
      large?: { url?: string };
      original?: { url?: string };
    };
  };
  subcategory?: Array<{ key: string; name: string }>;
  category?: { key: string; name: string };
  hours?: {
    periods?: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
  };
}

interface TripAdvisorSearchResponse {
  data: TripAdvisorLocation[];
  paging?: {
    total_results?: string;
  };
}

/**
 * Fetch place types from database for slug mapping
 */
async function getPlaceTypeMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('place_types')
    .select('id, slug');
  
  if (error) {
    console.error('❌ Error fetching place types:', error);
    throw error;
  }
  
  const map = new Map<string, string>();
  data?.forEach(pt => map.set(pt.slug, pt.id));
  
  console.log(`✅ Loaded ${map.size} place types from database`);
  return map;
}

/**
 * Map TripAdvisor price level to our schema
 */
function mapPriceLevel(taPrice?: string): 'low' | 'medium' | 'high' {
  if (!taPrice) return 'medium';
  
  const dollarCount = (taPrice.match(/\$/g) || []).length;
  
  if (dollarCount <= 1) return 'low';
  if (dollarCount === 2) return 'medium';
  return 'high';
}

/**
 * Map TripAdvisor category to our place type slug
 */
function mapCategory(location: TripAdvisorLocation): string | null {
  // Check main category
  const mainCategory = location.category?.key;
  if (mainCategory && EXCLUDED_CATEGORIES.includes(mainCategory)) {
    return null; // Excluded category
  }
  
  // Check subcategories
  const subcategories = location.subcategory || [];
  
  // Try to find a matching category
  for (const sub of subcategories) {
    if (!sub || !sub.key) continue; // Skip if no key
    const key = sub.key.toLowerCase();
    
    // Check if excluded
    if (EXCLUDED_CATEGORIES.includes(key)) {
      return null;
    }
    
    // Check if mapped
    if (CATEGORY_MAPPING[key]) {
      return CATEGORY_MAPPING[key];
    }
  }
  
  // Check main category mapping
  if (mainCategory && CATEGORY_MAPPING[mainCategory.toLowerCase()]) {
    return CATEGORY_MAPPING[mainCategory.toLowerCase()];
  }
  
  // Default mappings based on name/description
  const name = location.name?.toLowerCase() || '';
  const desc = location.description?.toLowerCase() || '';
  
  if (name.includes('pizz') || desc.includes('pizz')) return 'pizzeria';
  if (name.includes('cafe') || name.includes('caffè')) return 'cafe';
  if (name.includes('bar')) return 'aperetivo-bar';
  if (name.includes('museum') || name.includes('museo')) return 'museum';
  if (name.includes('church') || name.includes('chiesa')) return 'church';
  if (name.includes('castle') || name.includes('castello')) return 'castle';
  if (name.includes('park') || name.includes('parco')) return 'park';
  
  // If still no match, use generic 'restaurant' for food places
  if (mainCategory === 'restaurants') return 'restaurant';
  
  // Otherwise, skip this place
  return null;
}

/**
 * Determine if place is indoor/outdoor/mixed
 */
function determineEnvironment(location: TripAdvisorLocation, placeTypeSlug: string): 'indoor' | 'outdoor' | 'mixed' {
  const outdoorTypes = [
    'park', 'hiking-trail', 'viewpoint', 'lake', 'river-walk',
    'waterfall', 'mountain-peak', 'forest-walk', 'beach',
    'botanical-garden', 'adventure-park', 'picnic-area', 'bridge'
  ];
  
  const indoorTypes = [
    'museum', 'art-gallery', 'theatre', 'cinema', 'library',
    'shopping-centre', 'comedy-club', 'underground-club'
  ];
  
  if (outdoorTypes.includes(placeTypeSlug)) return 'outdoor';
  if (indoorTypes.includes(placeTypeSlug)) return 'indoor';
  
  return 'mixed';
}

/**
 * Fetch locations from TripAdvisor API
 */
async function fetchTripAdvisorLocations(category?: string): Promise<TripAdvisorLocation[]> {
  const url = new URL(`${TRIPADVISOR_BASE_URL}/location/nearby_search`);
  url.searchParams.set('latLong', `${TRENTO_LAT},${TRENTO_LNG}`);
  url.searchParams.set('radius', SEARCH_RADIUS.toString());
  url.searchParams.set('radiusUnit', 'km');
  url.searchParams.set('language', 'en');
  url.searchParams.set('key', TRIPADVISOR_API_KEY); // Add API key as query parameter
  
  if (category) {
    url.searchParams.set('category', category);
  }
  
  console.log(`🔍 Fetching from TripAdvisor: ${category || 'all categories'}...`);
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TripAdvisor API error (${response.status}): ${errorText}`);
    }
    
    const data: TripAdvisorSearchResponse = await response.json();
    console.log(`✅ Found ${data.data?.length || 0} locations`);
    
    return data.data || [];
  } catch (error) {
    console.error(`❌ Error fetching from TripAdvisor:`, error);
    return [];
  }
}

/**
 * Fetch detailed location data from TripAdvisor
 */
async function fetchLocationDetails(locationId: string): Promise<TripAdvisorLocation | null> {
  const url = `${TRIPADVISOR_BASE_URL}/location/${locationId}/details?key=${TRIPADVISOR_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`⚠️ Could not fetch details for ${locationId}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching location details for ${locationId}:`, error);
    return null;
  }
}

/**
 * Import a single location into the database
 */
async function importLocation(
  location: TripAdvisorLocation,
  placeTypeMap: Map<string, string>
): Promise<boolean> {
  try {
    // Map category to place type
    const placeTypeSlug = mapCategory(location);
    if (!placeTypeSlug) {
      console.log(`⏭️  Skipping "${location.name}" (excluded or unmapped category)`);
      return false;
    }
    
    const placeTypeId = placeTypeMap.get(placeTypeSlug);
    if (!placeTypeId) {
      console.warn(`⚠️  Unknown place type slug: ${placeTypeSlug} for "${location.name}"`);
      return false;
    }
    
    // Check if already exists (by name and approximate location)
    const { data: existing } = await supabase
      .from('places')
      .select('id')
      .eq('name', location.name)
      .eq('city', 'Trento')
      .limit(1)
      .single();
    
    if (existing) {
      console.log(`⏭️  Skipping "${location.name}" (already exists)`);
      return false;
    }
    
    // Prepare place data
    const placeData = {
      name: location.name,
      place_type_id: placeTypeId,
      city: 'Trento',
      country: 'Italy',
      address: location.address_obj?.address_string || location.address_obj?.street1 || null,
      latitude: location.latitude ? parseFloat(location.latitude) : null,
      longitude: location.longitude ? parseFloat(location.longitude) : null,
      phone: location.phone || null,
      website: location.website || null,
      description: location.description || null,
      photo_urls: location.photo?.images?.original?.url 
        ? [location.photo.images.original.url] 
        : [],
      price_level: mapPriceLevel(location.price_level),
      indoor_outdoor: determineEnvironment(location, placeTypeSlug),
      avg_rating: location.rating ? parseFloat(location.rating) : 0.0,
      review_count: location.num_reviews ? parseInt(location.num_reviews) : 0,
      verified: true, // TripAdvisor data is verified
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert into database
    const { error } = await supabase
      .from('places')
      .insert([placeData]);
    
    if (error) {
      console.error(`❌ Error inserting "${location.name}":`, error.message);
      return false;
    }
    
    console.log(`✅ Imported: ${location.name} (${placeTypeSlug})`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing "${location.name}":`, error);
    return false;
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting TripAdvisor import for Trento, Italy\n');
  
  // Validate API key
  if (!TRIPADVISOR_API_KEY) {
    console.error('❌ TRIPADVISOR_API_KEY not found in environment variables');
    process.exit(1);
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials not found in environment variables');
    process.exit(1);
  }
  
  console.log('✅ API credentials loaded\n');
  
  // Load place types
  const placeTypeMap = await getPlaceTypeMap();
  console.log('');
  
  // Categories to search (TripAdvisor categories)
  const searchCategories = [
    'restaurants',
    'attractions',
    'geos', // Geographic places
    'nightlife',
    'shopping'
  ];
  
  let allLocations: TripAdvisorLocation[] = [];
  
  // Fetch locations for each category
  for (const category of searchCategories) {
    const locations = await fetchTripAdvisorLocations(category);
    allLocations = allLocations.concat(locations);
    
    // Rate limiting: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Total locations found: ${allLocations.length}`);
  
  // Remove duplicates by location_id
  const uniqueLocations = Array.from(
    new Map(allLocations.map(loc => [loc.location_id, loc])).values()
  );
  
  console.log(`📊 Unique locations: ${uniqueLocations.length}\n`);
  
  // Import each location
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (let i = 0; i < uniqueLocations.length; i++) {
    const location = uniqueLocations[i];
    
    console.log(`[${i + 1}/${uniqueLocations.length}] Processing: ${location.name}`);
    
    // Fetch detailed info if needed
    let detailedLocation = location;
    if (!location.description || !location.phone) {
      const details = await fetchLocationDetails(location.location_id);
      if (details) {
        detailedLocation = { ...location, ...details };
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const success = await importLocation(detailedLocation, placeTypeMap);
    
    if (success) {
      imported++;
    } else {
      skipped++;
    }
    
    // Rate limiting: wait 500ms between inserts
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary:');
  console.log(`✅ Imported: ${imported}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(50));
  
  console.log('\n✨ Import complete!');
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
