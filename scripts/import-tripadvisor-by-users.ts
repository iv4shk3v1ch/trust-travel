/**
 * Import TripAdvisor Places & Reviews by User List
 * 
 * This script:
 * 1. Reads a list of TripAdvisor user IDs/usernames
 * 2. Fetches all their reviews in target cities (Milan, Rome, Florence, Trento)
 * 3. Extracts places from reviews and checks for duplicates
 * 4. Maps TripAdvisor categories to our 18 subcategories
 * 5. Creates synthetic user profiles based on review patterns
 * 6. Imports both places and reviews into database
 * 
 * Usage:
 *   1. Create milan-users.txt with one user per line (username or URL)
 *   2. Run: npx tsx scripts/import-tripadvisor-by-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY!;
const TRIPADVISOR_API_BASE = 'https://api.content.tripadvisor.com/api/v1';

// Target cities
const TARGET_CITIES = ['Milan', 'Rome', 'Florence', 'Trento'];

// API rate limiting
const MAX_REQUESTS_PER_DAY = 5000;
let requestCount = 0;

// ============================================================================
// TRIPADVISOR CATEGORY MAPPING
// ============================================================================

const TRIPADVISOR_CATEGORY_MAPPING: Record<string, string> = {
  // Food & Drink - Restaurants
  'restaurant': 'restaurant',
  'fine_dining': 'restaurant',
  'italian': 'restaurant',
  'pizza': 'restaurant',
  'trattoria': 'restaurant',
  'osteria': 'restaurant',
  'bistro': 'restaurant',
  'steakhouse': 'restaurant',
  'seafood': 'restaurant',
  'asian': 'restaurant',
  'mediterranean': 'restaurant',
  
  // Food & Drink - Street Food
  'fast_food': 'street_food',
  'street_food': 'street_food',
  'food_truck': 'street_food',
  'takeaway': 'street_food',
  'sandwich': 'street_food',
  'kebab': 'street_food',
  
  // Food & Drink - Cafes
  'cafe': 'cafe',
  'coffee_tea': 'cafe',
  'bakery': 'cafe',
  'pastry_shop': 'cafe',
  'dessert': 'cafe',
  'gelato': 'cafe',
  'ice_cream': 'cafe',
  
  // Food & Drink - Bars
  'bar': 'bar',
  'bar_pub': 'bar',
  'wine_bar': 'bar',
  'cocktail_bar': 'bar',
  'pub': 'bar',
  'brewery': 'bar',
  'beer_bar': 'bar',
  'lounge': 'bar',
  'aperitivo': 'bar',
  
  // Nightlife
  'nightclub': 'nightclub',
  'club': 'nightclub',
  'dance_club': 'nightclub',
  'disco': 'nightclub',
  
  // Culture & Sights - Museums
  'museum': 'museum',
  'history_museum': 'museum',
  'science_museum': 'museum',
  'specialty_museum': 'museum',
  'natural_history_museum': 'museum',
  
  // Culture & Sights - Art Galleries
  'art_gallery': 'art_gallery',
  'gallery': 'art_gallery',
  'art_museum': 'art_gallery',
  
  // Culture & Sights - Historical Sites
  'historic_site': 'historical_site',
  'ancient_ruins': 'historical_site',
  'castle': 'historical_site',
  'fort': 'historical_site',
  'archaeological_site': 'historical_site',
  'battlefield': 'historical_site',
  
  // Culture & Sights - Landmarks
  'landmark': 'landmark',
  'monument': 'landmark',
  'observation_deck': 'landmark',
  'tower': 'landmark',
  'fountain': 'landmark',
  'statue': 'landmark',
  'bridge': 'landmark',
  'church': 'landmark',
  'cathedral': 'landmark',
  'basilica': 'landmark',
  'religious_site': 'landmark',
  'architectural_building': 'landmark',
  
  // Nature & Outdoor - Parks
  'park': 'park',
  'nature_park': 'park',
  'city_park': 'park',
  'garden': 'park',
  'botanical_garden': 'park',
  'playground': 'park',
  
  // Nature & Outdoor - Viewpoints
  'viewpoint': 'viewpoint',
  'lookout': 'viewpoint',
  'scenic_drive': 'viewpoint',
  'scenic_spot': 'viewpoint',
  
  // Nature & Outdoor - Hiking Trails
  'hiking_trail': 'hiking_trail',
  'trail': 'hiking_trail',
  'walking_trail': 'hiking_trail',
  'nature_trail': 'hiking_trail',
  'mountain': 'hiking_trail',
  'biking_trail': 'hiking_trail',
  
  // Nature & Outdoor - Lakes/Rivers/Beaches
  'beach': 'lake_river_beach',
  'lake': 'lake_river_beach',
  'river': 'lake_river_beach',
  'waterfront': 'lake_river_beach',
  'pier': 'lake_river_beach',
  
  // Shopping & Activities - Markets
  'market': 'market',
  'flea_market': 'market',
  'food_market': 'market',
  'farmers_market': 'market',
  
  // Shopping & Activities - Shopping Areas
  'shopping': 'shopping_area',
  'shopping_mall': 'shopping_area',
  'shopping_center': 'shopping_area',
  'store': 'shopping_area',
  'boutique': 'shopping_area',
  'gift_shop': 'shopping_area',
  
  // Shopping & Activities - Entertainment Venues
  'theater': 'entertainment_venue',
  'cinema': 'entertainment_venue',
  'concert_hall': 'entertainment_venue',
  'performance_venue': 'entertainment_venue',
  'opera_house': 'entertainment_venue',
  'amusement_park': 'entertainment_venue',
  'water_park': 'entertainment_venue',
  'zoo': 'entertainment_venue',
  'aquarium': 'entertainment_venue',
  
  // Shopping & Activities - Spa & Wellness
  'spa': 'spa_wellness',
  'wellness': 'spa_wellness',
  'thermal_bath': 'spa_wellness',
  'sauna': 'spa_wellness',
  'massage': 'spa_wellness',
  'yoga_studio': 'spa_wellness',
  'gym': 'spa_wellness',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractUserId(input: string): string {
  // Handle URLs: https://www.tripadvisor.com/members/username123
  if (input.includes('tripadvisor.com/members/')) {
    const match = input.match(/members\/([^\/\?]+)/);
    return match ? match[1] : input;
  }
  
  // Handle profile IDs or usernames directly
  return input.trim();
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function mapCategory(tripadvisorCategory: string, placeName: string = '', placeType: string = ''): string {
  // Direct mapping
  const lowerCategory = tripadvisorCategory.toLowerCase().replace(/\s+/g, '_');
  if (TRIPADVISOR_CATEGORY_MAPPING[lowerCategory]) {
    return TRIPADVISOR_CATEGORY_MAPPING[lowerCategory];
  }
  
  // Fallback: Infer from keywords
  const combined = `${tripadvisorCategory} ${placeName} ${placeType}`.toLowerCase();
  
  if (combined.match(/restaurant|trattoria|osteria|pizzeria|dining|food|eat/)) return 'restaurant';
  if (combined.match(/cafe|coffee|bakery|pastry|gelato|dessert/)) return 'cafe';
  if (combined.match(/bar|pub|wine|cocktail|brewery|beer/)) return 'bar';
  if (combined.match(/museum|museo|exhibition/)) return 'museum';
  if (combined.match(/art|gallery/)) return 'art_gallery';
  if (combined.match(/church|cathedral|basilica|chapel|religious|temple/)) return 'landmark';
  if (combined.match(/trail|hiking|mountain/)) return 'hiking_trail';
  if (combined.match(/lake|beach|river/)) return 'lake_river_beach';
  if (combined.match(/park|garden/)) return 'park';
  if (combined.match(/market/)) return 'market';
  if (combined.match(/shop|store|mall|boutique/)) return 'shopping_area';
  
  // Default to restaurant (most common)
  return 'restaurant';
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TRIPADVISOR API FUNCTIONS
// ============================================================================

async function makeApiRequest(endpoint: string): Promise<any> {
  if (requestCount >= MAX_REQUESTS_PER_DAY) {
    throw new Error(`API limit reached (${MAX_REQUESTS_PER_DAY} requests/day)`);
  }
  
  requestCount++;
  
  const url = `${TRIPADVISOR_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'accept': 'application/json',
      'Referer': 'http://localhost:3000'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  // Rate limiting: don't hammer the API
  await sleep(200); // 200ms between requests = max 300 requests/minute
  
  return response.json();
}

async function searchLocationId(cityName: string): Promise<string | null> {
  try {
    console.log(`🔍 Searching for ${cityName} location ID...`);
    const data = await makeApiRequest(`/location/search?searchQuery=${encodeURIComponent(cityName)}&language=en&key=${TRIPADVISOR_API_KEY}`);
    
    if (data.data && data.data.length > 0) {
      const locationId = data.data[0].location_id;
      console.log(`✅ Found ${cityName}: ${locationId}`);
      return locationId;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Failed to find location ID for ${cityName}:`, error);
    return null;
  }
}

async function fetchUserReviews(userId: string, locationId: string): Promise<any[]> {
  try {
    console.log(`📥 Fetching reviews from user ${userId} in location ${locationId}...`);
    
    // Note: TripAdvisor API might not have direct user review endpoint
    // You may need to use their member profile endpoint or scraping
    // This is a placeholder - adjust based on actual API structure
    
    const data = await makeApiRequest(`/location/${locationId}/reviews?key=${TRIPADVISOR_API_KEY}&language=en`);
    
    // Filter reviews by user if possible
    const userReviews = data.data?.filter((review: any) => 
      review.user?.username === userId || review.user?.id === userId
    ) || [];
    
    console.log(`✅ Found ${userReviews.length} reviews from user ${userId}`);
    return userReviews;
  } catch (error) {
    console.error(`❌ Failed to fetch reviews for user ${userId}:`, error);
    return [];
  }
}

async function fetchPlaceDetails(locationId: string): Promise<any> {
  try {
    const data = await makeApiRequest(`/location/${locationId}/details?key=${TRIPADVISOR_API_KEY}&language=en&currency=EUR`);
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch place details for ${locationId}:`, error);
    return null;
  }
}

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

async function checkDuplicatePlace(
  name: string,
  lat: number,
  lng: number,
  city: string
): Promise<string | null> {
  // Strategy 1: Exact name match in same city
  const { data: exactMatch } = await supabase
    .from('places')
    .select('id')
    .eq('name', name)
    .eq('city', city)
    .single();
  
  if (exactMatch) {
    console.log(`⚠️  Duplicate (exact name): ${name}`);
    return exactMatch.id;
  }
  
  // Strategy 2: Similar name + close coordinates
  const { data: allPlaces } = await supabase
    .from('places')
    .select('id, name, latitude, longitude')
    .eq('city', city);
  
  for (const place of allPlaces || []) {
    const distance = calculateDistance(lat, lng, place.latitude, place.longitude);
    const nameSimilarity = levenshteinDistance(name.toLowerCase(), place.name.toLowerCase());
    
    // If within 100m and name differs by <3 chars, it's a duplicate
    if (distance < 0.1 && nameSimilarity < 3) {
      console.log(`⚠️  Duplicate (similar): "${name}" ≈ "${place.name}" (${(distance * 1000).toFixed(0)}m away)`);
      return place.id;
    }
  }
  
  // Strategy 3: Exact coordinates
  const { data: coordMatch } = await supabase
    .from('places')
    .select('id')
    .eq('latitude', lat)
    .eq('longitude', lng)
    .single();
  
  if (coordMatch) {
    console.log(`⚠️  Duplicate (coordinates): ${name}`);
    return coordMatch.id;
  }
  
  return null;
}

async function getOrCreatePlaceType(categorySlug: string): Promise<string> {
  // Try to find existing place type
  const { data: existing } = await supabase
    .from('place_types')
    .select('id')
    .eq('slug', categorySlug)
    .single();
  
  if (existing) return existing.id;
  
  // If not found, this shouldn't happen (types should be pre-populated)
  console.error(`❌ Place type not found: ${categorySlug}`);
  throw new Error(`Place type ${categorySlug} does not exist in database`);
}

async function importPlace(placeData: any, categorySlug: string, city: string): Promise<string> {
  const placeTypeId = await getOrCreatePlaceType(categorySlug);
  
  const { data, error } = await supabase
    .from('places')
    .insert({
      name: placeData.name,
      description: placeData.description || null,
      place_type_id: placeTypeId,
      city: city,
      latitude: placeData.latitude,
      longitude: placeData.longitude,
      address: placeData.address_obj?.address_string || null,
      price_level: placeData.price_level || null,
      indoor_outdoor: inferIndoorOutdoor(categorySlug),
      data_source: 'tripadvisor',
      external_id: placeData.location_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (error) {
    console.error(`❌ Failed to import place ${placeData.name}:`, error);
    throw error;
  }
  
  console.log(`✅ Imported place: ${placeData.name}`);
  return data.id;
}

function inferIndoorOutdoor(categorySlug: string): string {
  const outdoor = ['park', 'viewpoint', 'hiking_trail', 'lake_river_beach'];
  const indoor = ['museum', 'art_gallery', 'shopping_area', 'spa_wellness', 'entertainment_venue'];
  
  if (outdoor.includes(categorySlug)) return 'outdoor';
  if (indoor.includes(categorySlug)) return 'indoor';
  return 'mixed';
}

async function createSyntheticUser(userId: string, reviews: any[]): Promise<string> {
  // Analyze reviews to generate profile
  const profile = analyzeUserProfile(reviews);
  
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('external_id', `tripadvisor_${userId}`)
    .single();
  
  if (existingUser) {
    console.log(`ℹ️  User already exists: ${userId}`);
    return existingUser.id;
  }
  
  // Create auth user (synthetic)
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: `tripadvisor_${userId}@synthetic.trusttravel.com`,
    password: Math.random().toString(36).slice(-12),
    email_confirm: true,
    user_metadata: {
      full_name: `TripAdvisor User ${userId}`,
      is_synthetic: true,
      source: 'tripadvisor'
    }
  });
  
  if (authError || !authUser.user) {
    console.error(`❌ Failed to create synthetic user ${userId}:`, authError);
    throw authError;
  }
  
  // Create user profile
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      email: `tripadvisor_${userId}@synthetic.trusttravel.com`,
      full_name: `TripAdvisor User ${userId}`,
      is_synthetic: true,
      external_id: `tripadvisor_${userId}`,
      age: profile.age,
      gender: profile.gender,
      budget: profile.budget,
      env_preference: profile.env_preference,
      activity_style: profile.activity_style,
      food_restrictions: profile.food_restrictions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (profileError) {
    console.error(`❌ Failed to create user profile:`, profileError);
    throw profileError;
  }
  
  console.log(`✅ Created synthetic user: ${userId} → ${userProfile.id}`);
  return userProfile.id;
}

function analyzeUserProfile(reviews: any[]): any {
  // Analyze review patterns to infer user profile
  const profile: any = {
    age: null,
    gender: null,
    budget: 'medium',
    env_preference: 'balanced',
    activity_style: 'balanced',
    food_restrictions: null
  };
  
  // Analyze ratings distribution
  const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  
  // Infer budget from places visited
  const hasLuxuryPlaces = reviews.some(r => r.price_level === '$$$$ ' || r.price_level === '$$$$');
  const hasBudgetPlaces = reviews.some(r => r.price_level === '$' || r.price_level === '$$');
  
  if (hasLuxuryPlaces && !hasBudgetPlaces) profile.budget = 'high';
  else if (hasBudgetPlaces && !hasLuxuryPlaces) profile.budget = 'low';
  
  // Infer environment preference from place types
  const outdoorKeywords = ['park', 'trail', 'nature', 'hiking', 'beach', 'mountain'];
  const indoorKeywords = ['museum', 'gallery', 'restaurant', 'cafe', 'bar'];
  
  const outdoorCount = reviews.filter(r => 
    outdoorKeywords.some(kw => r.text?.toLowerCase().includes(kw))
  ).length;
  
  const indoorCount = reviews.filter(r => 
    indoorKeywords.some(kw => r.text?.toLowerCase().includes(kw))
  ).length;
  
  if (outdoorCount > indoorCount * 1.5) profile.env_preference = 'nature';
  else if (indoorCount > outdoorCount * 1.5) profile.env_preference = 'city';
  
  // Check for food restrictions
  const veganKeywords = ['vegan', 'plant-based', 'vegetarian'];
  const halalKeywords = ['halal', 'muslim', 'islamic'];
  const glutenKeywords = ['gluten-free', 'celiac', 'gluten'];
  
  const restrictions: string[] = [];
  if (reviews.some(r => veganKeywords.some(kw => r.text?.toLowerCase().includes(kw)))) {
    restrictions.push('vegan');
  }
  if (reviews.some(r => halalKeywords.some(kw => r.text?.toLowerCase().includes(kw)))) {
    restrictions.push('halal');
  }
  if (reviews.some(r => glutenKeywords.some(kw => r.text?.toLowerCase().includes(kw)))) {
    restrictions.push('gluten-free');
  }
  
  if (restrictions.length > 0) {
    profile.food_restrictions = restrictions.join(', ');
  }
  
  return profile;
}

async function importReview(
  placeId: string,
  userId: string,
  reviewData: any
): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .insert({
      place_id: placeId,
      user_id: userId,
      overall_rating: reviewData.rating || null,
      comment: reviewData.text || null,
      visit_date: reviewData.published_date || new Date().toISOString().split('T')[0],
      price_range: mapPriceRange(reviewData.price_level),
      created_at: reviewData.published_date || new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error(`❌ Failed to import review:`, error);
    throw error;
  }
  
  console.log(`✅ Imported review from user ${userId}`);
}

function mapPriceRange(tripAdvisorPrice: string | null): string | null {
  if (!tripAdvisorPrice) return null;
  
  // TripAdvisor uses $ symbols
  const dollarCount = (tripAdvisorPrice.match(/\$/g) || []).length;
  
  switch (dollarCount) {
    case 1: return '0-10';
    case 2: return '10-20';
    case 3: return '20-35';
    case 4: return '35-50';
    default: return null;
  }
}

// ============================================================================
// MAIN IMPORT LOGIC
// ============================================================================

async function importFromUserList(userListFile: string) {
  console.log('\n🚀 Starting TripAdvisor Import\n');
  console.log(`📁 Reading user list from: ${userListFile}\n`);
  
  // Read user list
  const userList = fs.readFileSync(userListFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')) // Skip empty lines and comments
    .map(extractUserId);
  
  console.log(`👥 Found ${userList.length} users in list\n`);
  
  // Get location IDs for target cities
  const cityLocationIds: Record<string, string> = {};
  for (const city of TARGET_CITIES) {
    const locationId = await searchLocationId(city);
    if (locationId) {
      cityLocationIds[city] = locationId;
    }
  }
  
  console.log(`\n🌍 Target cities:`, Object.keys(cityLocationIds).join(', '), '\n');
  
  // Stats tracking
  const stats = {
    usersProcessed: 0,
    usersWithMultipleCities: 0,
    placesImported: 0,
    placesDuplicate: 0,
    reviewsImported: 0,
    errors: 0
  };
  
  // Process each user
  for (const userId of userList) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👤 Processing user: ${userId}`);
      console.log(`${'='.repeat(60)}\n`);
      
      const userReviews: any[] = [];
      const citiesWithReviews = new Set<string>();
      
      // Fetch reviews from all cities
      for (const [city, locationId] of Object.entries(cityLocationIds)) {
        const reviews = await fetchUserReviews(userId, locationId);
        
        if (reviews.length > 0) {
          citiesWithReviews.add(city);
          userReviews.push(...reviews.map(r => ({ ...r, city })));
        }
      }
      
      if (userReviews.length === 0) {
        console.log(`⚠️  No reviews found for user ${userId} - skipping\n`);
        continue;
      }
      
      console.log(`📊 Found ${userReviews.length} reviews across ${citiesWithReviews.size} cities: ${Array.from(citiesWithReviews).join(', ')}\n`);
      
      // Create synthetic user profile
      const internalUserId = await createSyntheticUser(userId, userReviews);
      
      // Process each review
      for (const review of userReviews) {
        try {
          const placeData = await fetchPlaceDetails(review.location_id);
          
          if (!placeData) {
            console.log(`⚠️  Could not fetch place details for ${review.location_id} - skipping`);
            continue;
          }
          
          // Check for duplicate
          const existingPlaceId = await checkDuplicatePlace(
            placeData.name,
            placeData.latitude,
            placeData.longitude,
            review.city
          );
          
          let placeId: string;
          
          if (existingPlaceId) {
            placeId = existingPlaceId;
            stats.placesDuplicate++;
          } else {
            // Map category
            const categorySlug = mapCategory(
              placeData.category?.name || '',
              placeData.name,
              placeData.subcategory?.[0]?.name || ''
            );
            
            // Import place
            placeId = await importPlace(placeData, categorySlug, review.city);
            stats.placesImported++;
          }
          
          // Import review
          await importReview(placeId, internalUserId, review);
          stats.reviewsImported++;
          
        } catch (error) {
          console.error(`❌ Error processing review:`, error);
          stats.errors++;
        }
      }
      
      stats.usersProcessed++;
      if (citiesWithReviews.size >= 2) {
        stats.usersWithMultipleCities++;
      }
      
      console.log(`\n✅ Completed user ${userId}`);
      console.log(`📊 API requests used: ${requestCount}/${MAX_REQUESTS_PER_DAY}`);
      
    } catch (error) {
      console.error(`❌ Error processing user ${userId}:`, error);
      stats.errors++;
    }
  }
  
  // Final report
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 IMPORT COMPLETE`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`👥 Users processed: ${stats.usersProcessed}/${userList.length}`);
  console.log(`🌍 Cross-city users: ${stats.usersWithMultipleCities}`);
  console.log(`📍 Places imported: ${stats.placesImported}`);
  console.log(`🔄 Places skipped (duplicates): ${stats.placesDuplicate}`);
  console.log(`⭐ Reviews imported: ${stats.reviewsImported}`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log(`🔧 API requests used: ${requestCount}/${MAX_REQUESTS_PER_DAY}`);
  console.log(`\n✅ Data ready for collaborative filtering!\n`);
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    apiUsage: {
      used: requestCount,
      limit: MAX_REQUESTS_PER_DAY,
      remaining: MAX_REQUESTS_PER_DAY - requestCount
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'import-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`📄 Report saved to: scripts/import-report.json\n`);
}

// ============================================================================
// RUN SCRIPT
// ============================================================================

const userListFile = path.join(__dirname, 'milan-users.txt');

if (!fs.existsSync(userListFile)) {
  console.error(`❌ User list file not found: ${userListFile}`);
  console.log(`\n📝 Please create ${userListFile} with one user per line:`);
  console.log(`   username123`);
  console.log(`   https://www.tripadvisor.com/members/username456`);
  console.log(`   another_user\n`);
  process.exit(1);
}

importFromUserList(userListFile).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
