/**
 * TripAdvisor Web Scraper - Import Reviews by User
 * 
 * This script scrapes TripAdvisor user profile pages to extract:
 * - All reviews from collected users
 * - Place information from reviews
 * - User profile data
 * 
 * Features:
 * - Filters out transport-related places (trains, metro, buses, airports)
 * - Checks for duplicate users, places, and reviews
 * - Creates synthetic user profiles based on review patterns
 * - Maps TripAdvisor categories to our 18 subcategories
 * 
 * Usage: npx tsx scripts/import-tripadvisor-scraper.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Use stealth plugin to avoid basic bot detection
puppeteerExtra.use(StealthPlugin());

// Load environment variables
dotenv.config({ path: '.env.local' });

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// City ID mapping
const CITY_ID_MAP: Record<string, string> = {
  'g187849': 'Milan',
  'g187791': 'Rome',
  'g187895': 'Florence',
  'g187861': 'Trento'
};

// Transport-related keywords to filter out (case-insensitive)
const TRANSPORT_KEYWORDS = [
  // Stations
  'train station', 'railway station', 'stazione', 'bahnhof', 'gare',
  'metro station', 'subway station', 'underground station', 'tube station',
  'bus station', 'bus terminal', 'coach station', 'autostazione',
  'tram stop', 'tram station',
  
  // Airports
  'airport', 'aeroporto', 'flughafen', 'aéroport',
  
  // Transport services
  'railway', 'railroad', 'ferrovie', 'trenitalia', 'italo',
  'metro', 'metropolitana', 'subway', 'underground',
  'bus line', 'bus service', 'autobus',
  'tram service', 'tramway',
  'taxi', 'uber', 'transfer service',
  
  // Specific stations in Italian cities
  'centrale', 'termini', 'tiburtina', 'ostiense', 'porta garibaldi',
  'cadorna', 'rogoredo', 'lambrate', 'santa maria novella', 'campo di marte',
  
  // Generic transport
  'platform', 'track', 'binario', 'quai'
];

// Category mapping (same as before)
const TRIPADVISOR_CATEGORY_MAPPING: Record<string, string> = {
  'restaurant': 'restaurant', 'fine_dining': 'restaurant', 'italian': 'restaurant',
  'pizza': 'restaurant', 'trattoria': 'restaurant', 'osteria': 'restaurant',
  'bistro': 'restaurant', 'steakhouse': 'restaurant', 'seafood': 'restaurant',
  
  'fast_food': 'street_food', 'street_food': 'street_food', 'food_truck': 'street_food',
  'takeaway': 'street_food', 'sandwich': 'street_food', 'kebab': 'street_food',
  
  'cafe': 'cafe', 'coffee_tea': 'cafe', 'bakery': 'cafe', 'pastry_shop': 'cafe',
  'dessert': 'cafe', 'gelato': 'cafe', 'ice_cream': 'cafe',
  
  'bar': 'bar', 'bar_pub': 'bar', 'wine_bar': 'bar', 'cocktail_bar': 'bar',
  'pub': 'bar', 'brewery': 'bar', 'lounge': 'bar', 'aperitivo': 'bar',
  
  'nightclub': 'nightclub', 'club': 'nightclub', 'dance_club': 'nightclub',
  
  'museum': 'museum', 'history_museum': 'museum', 'science_museum': 'museum',
  'specialty_museum': 'museum', 'natural_history_museum': 'museum',
  
  'art_gallery': 'art_gallery', 'gallery': 'art_gallery', 'art_museum': 'art_gallery',
  
  'historic_site': 'historical_site', 'ancient_ruins': 'historical_site',
  'castle': 'historical_site', 'fort': 'historical_site', 'archaeological_site': 'historical_site',
  
  'landmark': 'landmark', 'monument': 'landmark', 'tower': 'landmark', 'fountain': 'landmark',
  'bridge': 'landmark', 'church': 'landmark', 'cathedral': 'landmark', 'basilica': 'landmark',
  'religious_site': 'landmark', 'architectural_building': 'landmark',
  
  'park': 'park', 'nature_park': 'park', 'city_park': 'park', 'garden': 'park',
  'botanical_garden': 'park', 'playground': 'park',
  
  'viewpoint': 'viewpoint', 'lookout': 'viewpoint', 'scenic_drive': 'viewpoint',
  
  'hiking_trail': 'hiking_trail', 'trail': 'hiking_trail', 'walking_trail': 'hiking_trail',
  'nature_trail': 'hiking_trail', 'mountain': 'hiking_trail', 'biking_trail': 'hiking_trail',
  
  'beach': 'lake_river_beach', 'lake': 'lake_river_beach', 'river': 'lake_river_beach',
  'waterfront': 'lake_river_beach', 'pier': 'lake_river_beach',
  
  'market': 'market', 'flea_market': 'market', 'food_market': 'market', 'farmers_market': 'market',
  
  'shopping': 'shopping_area', 'shopping_mall': 'shopping_area', 'shopping_center': 'shopping_area',
  'store': 'shopping_area', 'boutique': 'shopping_area', 'gift_shop': 'shopping_area',
  
  'theater': 'entertainment_venue', 'cinema': 'entertainment_venue', 'concert_hall': 'entertainment_venue',
  'opera_house': 'entertainment_venue', 'amusement_park': 'entertainment_venue',
  'zoo': 'entertainment_venue', 'aquarium': 'entertainment_venue',
  
  'spa': 'spa_wellness', 'wellness': 'spa_wellness', 'thermal_bath': 'spa_wellness',
  'sauna': 'spa_wellness', 'massage': 'spa_wellness', 'yoga_studio': 'spa_wellness',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isTransportRelated(placeName: string, category: string = ''): boolean {
  const combined = `${placeName} ${category}`.toLowerCase();
  
  return TRANSPORT_KEYWORDS.some(keyword => 
    combined.includes(keyword.toLowerCase())
  );
}

function extractUserAndCity(url: string): { username: string; cityId: string; city: string } | null {
  // Format: https://www.tripadvisor.com/members-citypage/USERNAME/gCITYID
  const match = url.match(/members-citypage\/([^\/]+)\/(g\d+)/);
  
  if (!match) return null;
  
  const username = match[1];
  const cityId = match[2];
  const city = CITY_ID_MAP[cityId];
  
  if (!city) {
    console.warn(`⚠️  Unknown city ID: ${cityId}`);
    return null;
  }
  
  return { username, cityId, city };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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

function mapCategory(tripadvisorCategory: string, placeName: string = '', placeType: string = ''): string {
  const lowerCategory = tripadvisorCategory.toLowerCase().replace(/\s+/g, '_');
  if (TRIPADVISOR_CATEGORY_MAPPING[lowerCategory]) {
    return TRIPADVISOR_CATEGORY_MAPPING[lowerCategory];
  }
  
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
  
  return 'restaurant';
}

function inferIndoorOutdoor(categorySlug: string): string {
  const outdoor = ['park', 'viewpoint', 'hiking_trail', 'lake_river_beach'];
  const indoor = ['museum', 'art_gallery', 'shopping_area', 'spa_wellness', 'entertainment_venue'];
  
  if (outdoor.includes(categorySlug)) return 'outdoor';
  if (indoor.includes(categorySlug)) return 'indoor';
  return 'mixed';
}

// ============================================================================
// WEB SCRAPING FUNCTIONS
// ============================================================================

async function fetchUserReviewsPage(url: string): Promise<string> {
  // Try a simple fetch first
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (response.ok) {
      return response.text();
    }

    // If blocked (403) fall through to headless browser
    if (response.status !== 403) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    console.warn(`⚠️  Fetch returned ${response.status} — falling back to headless browser for ${url}`);
  } catch (err) {
    // Continue to puppeteer fallback on network errors or 403
    console.warn(`⚠️  Fetch failed for ${url}:`, (err as Error).message);
  }

  // Puppeteer fallback
  try {
    const browser = await puppeteerExtra.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // give time for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    const html = await page.content();
    await browser.close();
    return html;
  } catch (err) {
    throw new Error(`Puppeteer failed to fetch ${url}: ${(err as Error).message}`);
  }
}

interface ScrapedReview {
  placeName: string;
  placeCategory: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
  tripType?: string;
}

function parseUserReviews(html: string): ScrapedReview[] {
  const $ = cheerio.load(html);
  const reviews: ScrapedReview[] = [];
  
  // TripAdvisor uses various selectors - we'll try multiple patterns
  // This is a simplified version - may need adjustment based on actual HTML
  
  $('.review-container, .location-review-card-Card__card, [data-reviewid]').each((_, element) => {
    try {
      const $review = $(element);
      
      // Extract place name
      const placeName = $review.find('.location-name, .review-location, a[href*="/Restaurant"], a[href*="/Attraction"]').first().text().trim();
      
      if (!placeName || isTransportRelated(placeName)) {
        return; // Skip transport places
      }
      
      // Extract rating (usually 1-5 bubbles)
      let rating = 3; // default
      const ratingClass = $review.find('[class*="bubble"], [class*="rating"]').attr('class') || '';
      const ratingMatch = ratingClass.match(/(\d+)_?\d*/);
      if (ratingMatch) {
        rating = parseInt(ratingMatch[1]) / 10; // TripAdvisor uses 50 = 5 stars
      }
      
      // Extract review text
      const reviewText = $review.find('.review-text, .partial_entry, [data-test-target="review-body"]').first().text().trim();
      
      // Extract date
      const reviewDate = $review.find('.review-date, .ratingDate, [data-test-target="review-date"]').first().text().trim();
      
      // Extract category/type if available
      const placeCategory = $review.find('.category, .cuisine, [data-test-target="category"]').first().text().trim();
      
      reviews.push({
        placeName,
        placeCategory,
        rating,
        reviewText,
        reviewDate,
      });
      
    } catch (error) {
      console.warn('⚠️  Error parsing review:', error);
    }
  });
  
  return reviews;
}

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

async function checkDuplicatePlace(
  name: string,
  city: string
): Promise<string | null> {
  // Strategy 1: Exact name match
  const { data: exactMatch } = await supabase
    .from('places')
    .select('id')
    .eq('name', name)
    .eq('city', city)
    .single();
  
  if (exactMatch) {
    return exactMatch.id;
  }
  
  // Strategy 2: Similar name (Levenshtein distance < 3)
  const { data: allPlaces } = await supabase
    .from('places')
    .select('id, name')
    .eq('city', city);
  
  for (const place of allPlaces || []) {
    const similarity = levenshteinDistance(name.toLowerCase(), place.name.toLowerCase());
    if (similarity < 3) {
      console.log(`⚠️  Similar place: "${name}" ≈ "${place.name}"`);
      return place.id;
    }
  }
  
  return null;
}

async function getOrCreatePlaceType(categorySlug: string): Promise<string> {
  const { data: existing } = await supabase
    .from('place_types')
    .select('id')
    .eq('slug', categorySlug)
    .single();
  
  if (existing) return existing.id;
  
  throw new Error(`Place type ${categorySlug} does not exist in database`);
}

async function importPlace(
  placeName: string,
  categorySlug: string,
  city: string
): Promise<string> {
  const placeTypeId = await getOrCreatePlaceType(categorySlug);
  
  // Since we don't have coordinates from scraping, use city center as placeholder
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    'Milan': { lat: 45.4642, lng: 9.1900 },
    'Rome': { lat: 41.9028, lng: 12.4964 },
    'Florence': { lat: 43.7696, lng: 11.2558 },
    'Trento': { lat: 46.0664, lng: 11.1257 }
  };
  
  const coords = cityCoordinates[city] || { lat: 0, lng: 0 };
  
  const { data, error } = await supabase
    .from('places')
    .insert({
      name: placeName,
      place_type_id: placeTypeId,
      city: city,
      latitude: coords.lat,
      longitude: coords.lng,
      indoor_outdoor: inferIndoorOutdoor(categorySlug),
      data_source: 'tripadvisor_scraper',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (error) {
    console.error(`❌ Failed to import place ${placeName}:`, error);
    throw error;
  }
  
  console.log(`✅ Imported place: ${placeName}`);
  return data.id;
}

async function checkUserExists(username: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('external_id', `tripadvisor_${username}`)
    .single();
  
  return data?.id || null;
}

async function createSyntheticUser(username: string, reviews: ScrapedReview[]): Promise<string> {
  // Check if already exists
  const existing = await checkUserExists(username);
  if (existing) {
    console.log(`ℹ️  User already exists: ${username}`);
    return existing;
  }
  
  // Analyze reviews to generate profile
  const profile = analyzeUserProfile(reviews);
  
  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: `tripadvisor_${username}@synthetic.trusttravel.com`,
    password: Math.random().toString(36).slice(-12),
    email_confirm: true,
    user_metadata: {
      full_name: `TripAdvisor ${username}`,
      is_synthetic: true,
      source: 'tripadvisor_scraper'
    }
  });
  
  if (authError || !authUser.user) {
    throw authError || new Error('Failed to create user');
  }
  
  // Create user profile
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      email: `tripadvisor_${username}@synthetic.trusttravel.com`,
      full_name: `TripAdvisor ${username}`,
      is_synthetic: true,
      external_id: `tripadvisor_${username}`,
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
    throw profileError;
  }
  
  console.log(`✅ Created user: ${username} → ${userProfile.id}`);
  return userProfile.id;
}

function analyzeUserProfile(reviews: ScrapedReview[]): {
  budget: string;
  env_preference: string;
  activity_style: string;
  food_restrictions: string | null;
} {
  const profile = {
    budget: 'medium',
    env_preference: 'balanced',
    activity_style: 'balanced',
    food_restrictions: null as string | null
  };
  
  // Analyze from place names and review text
  const allText = reviews.map(r => `${r.placeName} ${r.reviewText}`.toLowerCase()).join(' ');
  
  // Budget inference
  if (allText.match(/expensive|luxury|fine dining|michelin/)) {
    profile.budget = 'high';
  } else if (allText.match(/cheap|budget|affordable|inexpensive/)) {
    profile.budget = 'low';
  }
  
  // Environment preference
  const outdoorKeywords = ['park', 'trail', 'nature', 'hiking', 'outdoor', 'garden'];
  const indoorKeywords = ['museum', 'gallery', 'restaurant', 'cafe', 'bar'];
  
  const outdoorCount = outdoorKeywords.filter(kw => allText.includes(kw)).length;
  const indoorCount = indoorKeywords.filter(kw => allText.includes(kw)).length;
  
  if (outdoorCount > indoorCount * 1.5) profile.env_preference = 'nature';
  else if (indoorCount > outdoorCount * 1.5) profile.env_preference = 'city';
  
  // Food restrictions
  const restrictions: string[] = [];
  if (allText.match(/vegan|plant-based|vegetarian/)) restrictions.push('vegan');
  if (allText.match(/halal|muslim/)) restrictions.push('halal');
  if (allText.match(/gluten-free|celiac/)) restrictions.push('gluten-free');
  
  if (restrictions.length > 0) {
    profile.food_restrictions = restrictions.join(', ');
  }
  
  return profile;
}

async function checkDuplicateReview(
  userId: string,
  placeId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('place_id', placeId)
    .single();
  
  return !!data;
}

async function importReview(
  placeId: string,
  userId: string,
  review: ScrapedReview
): Promise<void> {
  // Check for duplicate
  const isDuplicate = await checkDuplicateReview(userId, placeId);
  if (isDuplicate) {
    console.log(`⚠️  Duplicate review skipped`);
    return;
  }
  
  // Parse date (format varies, use current date as fallback)
  let visitDate = new Date().toISOString().split('T')[0];
  if (review.reviewDate) {
    try {
      const parsed = new Date(review.reviewDate);
      if (!isNaN(parsed.getTime())) {
        visitDate = parsed.toISOString().split('T')[0];
      }
    } catch {
      // Use default
    }
  }
  
  const { error } = await supabase
    .from('reviews')
    .insert({
      place_id: placeId,
      user_id: userId,
      overall_rating: review.rating,
      comment: review.reviewText || null,
      visit_date: visitDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    throw error;
  }
  
  console.log(`✅ Imported review`);
}

// ============================================================================
// MAIN IMPORT LOGIC
// ============================================================================

async function importFromUserList(userListFile: string) {
  console.log('\n🚀 Starting TripAdvisor Web Scraper Import\n');
  console.log(`📁 Reading user list from: ${userListFile}\n`);
  
  const userList = fs.readFileSync(userListFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
  
  console.log(`👥 Found ${userList.length} URLs in list\n`);
  
  // Track stats
  const stats = {
    urlsProcessed: 0,
    uniqueUsers: new Set<string>(),
    placesImported: 0,
    placesDuplicate: 0,
    placesTransport: 0,
    reviewsImported: 0,
    reviewsDuplicate: 0,
    errors: 0
  };
  
  // Process each URL
  for (const url of userList) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔗 Processing: ${url}`);
      console.log(`${'='.repeat(60)}\n`);
      
      const parsed = extractUserAndCity(url);
      if (!parsed) {
        console.log(`⚠️  Invalid URL format - skipping\n`);
        stats.errors++;
        continue;
      }
      
      const { username, city } = parsed;
      console.log(`👤 User: ${username}`);
      console.log(`🌍 City: ${city}\n`);
      
      // Fetch and parse reviews
      console.log(`📥 Fetching reviews...`);
      const html = await fetchUserReviewsPage(url);
      const reviews = parseUserReviews(html);
      
      console.log(`✅ Found ${reviews.length} reviews\n`);
      
      if (reviews.length === 0) {
        console.log(`⚠️  No reviews found - skipping\n`);
        continue;
      }
      
      // Create or get user
      const userId = await createSyntheticUser(username, reviews);
      stats.uniqueUsers.add(username);
      
      // Process each review
      for (const review of reviews) {
        try {
          // Check if transport-related
          if (isTransportRelated(review.placeName, review.placeCategory)) {
            console.log(`🚂 Skipped transport: ${review.placeName}`);
            stats.placesTransport++;
            continue;
          }
          
          // Check for duplicate place
          let placeId = await checkDuplicatePlace(review.placeName, city);
          
          if (placeId) {
            stats.placesDuplicate++;
          } else {
            // Map category and import
            const categorySlug = mapCategory(review.placeCategory, review.placeName);
            placeId = await importPlace(review.placeName, categorySlug, city);
            stats.placesImported++;
          }
          
          // Import review
          await importReview(placeId, userId, review);
          stats.reviewsImported++;
          
        } catch (error) {
          console.error(`❌ Error processing review:`, error);
          stats.errors++;
        }
      }
      
      stats.urlsProcessed++;
      
      // Rate limiting - be nice to TripAdvisor
      await sleep(2000); // 2 seconds between requests
      
    } catch (error) {
      console.error(`❌ Error processing URL ${url}:`, error);
      stats.errors++;
    }
  }
  
  // Final report
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 IMPORT COMPLETE`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`🔗 URLs processed: ${stats.urlsProcessed}/${userList.length}`);
  console.log(`👥 Unique users: ${stats.uniqueUsers.size}`);
  console.log(`📍 Places imported: ${stats.placesImported}`);
  console.log(`🔄 Places skipped (duplicates): ${stats.placesDuplicate}`);
  console.log(`🚂 Places skipped (transport): ${stats.placesTransport}`);
  console.log(`⭐ Reviews imported: ${stats.reviewsImported}`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log(`\n✅ Data ready for collaborative filtering!\n`);
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    stats: {
      urlsProcessed: stats.urlsProcessed,
      uniqueUsers: stats.uniqueUsers.size,
      placesImported: stats.placesImported,
      placesDuplicate: stats.placesDuplicate,
      placesTransport: stats.placesTransport,
      reviewsImported: stats.reviewsImported,
      errors: stats.errors
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'scraper-import-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`📄 Report saved to: scripts/scraper-import-report.json\n`);
}

// ============================================================================
// RUN SCRIPT
// ============================================================================

const userListFile = path.join(__dirname, 'milan-users.txt');

if (!fs.existsSync(userListFile)) {
  console.error(`❌ User list file not found: ${userListFile}`);
  process.exit(1);
}

importFromUserList(userListFile).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
