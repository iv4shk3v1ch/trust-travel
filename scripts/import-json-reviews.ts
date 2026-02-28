/**
 * Import JSON Reviews - Process extracted TripAdvisor data
 * 
 * Reads JSON files from Downloads/tripadvisor-reviews/ and imports to database
 * - Checks for duplicate users, places, reviews
 * - Maps categories
 * - Creates synthetic user profiles
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Category mapping (same as scraper)
const CATEGORY_MAPPING: Record<string, string> = {
  'restaurant': 'restaurant', 'italian': 'restaurant', 'pizza': 'restaurant',
  'trattoria': 'restaurant', 'osteria': 'restaurant', 'fine_dining': 'restaurant',
  'fast_food': 'street_food', 'street_food': 'street_food', 'takeaway': 'street_food',
  'cafe': 'cafe', 'coffee': 'cafe', 'bakery': 'cafe', 'dessert': 'cafe', 'gelato': 'cafe',
  'bar': 'bar', 'pub': 'bar', 'wine_bar': 'bar', 'cocktail': 'bar',
  'nightclub': 'nightclub', 'club': 'nightclub',
  'museum': 'museum', 'history': 'museum',
  'art_gallery': 'art_gallery', 'gallery': 'art_gallery',
  'church': 'landmark', 'cathedral': 'landmark', 'basilica': 'landmark',
  'monument': 'landmark', 'tower': 'landmark', 'fountain': 'landmark',
  'historic': 'historical_site', 'castle': 'historical_site', 'ancient': 'historical_site',
  'park': 'park', 'garden': 'park',
  'viewpoint': 'viewpoint', 'lookout': 'viewpoint',
  'hiking': 'hiking_trail', 'trail': 'hiking_trail',
  'beach': 'lake_river_beach', 'lake': 'lake_river_beach', 'river': 'lake_river_beach',
  'market': 'market',
  'shopping': 'shopping_area', 'mall': 'shopping_area', 'store': 'shopping_area',
  'theater': 'entertainment_venue', 'cinema': 'entertainment_venue',
  'spa': 'spa_wellness', 'wellness': 'spa_wellness',
};

function mapCategory(category: string, placeName: string): string {
  const combined = `${category} ${placeName}`.toLowerCase();
  
  for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
    if (combined.includes(key)) return value;
  }
  
  // Fallback inference
  if (combined.match(/restaurant|trattoria|osteria|pizzeria|dining|food/)) return 'restaurant';
  if (combined.match(/cafe|coffee|bakery|pastry|gelato/)) return 'cafe';
  if (combined.match(/bar|pub|wine|cocktail/)) return 'bar';
  if (combined.match(/museum/)) return 'museum';
  if (combined.match(/church|cathedral|basilica/)) return 'landmark';
  if (combined.match(/park|garden/)) return 'park';
  
  return 'restaurant'; // default
}

function inferIndoorOutdoor(categorySlug: string): string {
  const outdoor = ['park', 'viewpoint', 'hiking_trail', 'lake_river_beach'];
  const indoor = ['museum', 'art_gallery', 'shopping_area', 'spa_wellness', 'entertainment_venue'];
  
  if (outdoor.includes(categorySlug)) return 'outdoor';
  if (indoor.includes(categorySlug)) return 'indoor';
  return 'mixed';
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

async function checkDuplicatePlace(name: string, city: string): Promise<string | null> {
  // Exact match
  const { data: exactMatch } = await supabase
    .from('places')
    .select('id')
    .eq('name', name)
    .eq('city', city)
    .single();
  
  if (exactMatch) return exactMatch.id;
  
  // Similar name
  const { data: allPlaces } = await supabase
    .from('places')
    .select('id, name')
    .eq('city', city);
  
  for (const place of allPlaces || []) {
    const similarity = levenshteinDistance(name.toLowerCase(), place.name.toLowerCase());
    if (similarity < 3) {
      console.log(`   ⚠️  Similar: "${name}" ≈ "${place.name}"`);
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
  
  throw new Error(`Place type ${categorySlug} not found in database`);
}

async function importPlace(placeName: string, categorySlug: string, city: string): Promise<string> {
  const placeTypeId = await getOrCreatePlaceType(categorySlug);
  
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
      data_source: 'tripadvisor_manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (error) throw error;
  
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

interface Review {
  placeName: string;
  placeCategory: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
}

async function createSyntheticUser(username: string, reviews: Review[]): Promise<string> {
  const existing = await checkUserExists(username);
  if (existing) return existing;
  
  // Analyze reviews for profile
  const allText = reviews.map(r => `${r.placeName} ${r.reviewText}`.toLowerCase()).join(' ');
  
  let budget = 'medium';
  if (allText.match(/expensive|luxury|fine dining|michelin/)) budget = 'high';
  else if (allText.match(/cheap|budget|affordable/)) budget = 'low';
  
  let env_preference = 'balanced';
  const outdoorCount = (allText.match(/park|trail|nature|hiking|outdoor|garden/g) || []).length;
  const indoorCount = (allText.match(/museum|gallery|restaurant|cafe|bar/g) || []).length;
  if (outdoorCount > indoorCount * 1.5) env_preference = 'nature';
  else if (indoorCount > outdoorCount * 1.5) env_preference = 'city';
  
  const restrictions: string[] = [];
  if (allText.match(/vegan|plant-based/)) restrictions.push('vegan');
  if (allText.match(/halal/)) restrictions.push('halal');
  if (allText.match(/gluten-free|celiac/)) restrictions.push('gluten-free');
  
  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: `tripadvisor_${username}@synthetic.trusttravel.com`,
    password: Math.random().toString(36).slice(-12),
    email_confirm: true,
    user_metadata: {
      full_name: `TripAdvisor ${username}`,
      is_synthetic: true,
      source: 'tripadvisor_manual'
    }
  });
  
  if (authError || !authUser.user) throw authError || new Error('Failed to create user');
  
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      email: `tripadvisor_${username}@synthetic.trusttravel.com`,
      full_name: `TripAdvisor ${username}`,
      is_synthetic: true,
      external_id: `tripadvisor_${username}`,
      budget,
      env_preference,
      activity_style: 'balanced',
      food_restrictions: restrictions.length > 0 ? restrictions.join(', ') : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (profileError) throw profileError;
  
  return userProfile.id;
}

async function checkDuplicateReview(userId: string, placeId: string): Promise<boolean> {
  const { data } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('place_id', placeId)
    .single();
  
  return !!data;
}

async function importReview(placeId: string, userId: string, review: Review): Promise<void> {
  if (await checkDuplicateReview(userId, placeId)) return;
  
  const { error } = await supabase
    .from('reviews')
    .insert({
      place_id: placeId,
      user_id: userId,
      overall_rating: review.rating,
      comment: review.reviewText || null,
      visit_date: review.reviewDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  
  if (error) throw error;
}

async function importJSONFiles() {
  console.log('\n🚀 Starting JSON Review Import\n');
  
  // Find JSON files
  const downloadsPath = path.join(os.homedir(), 'Downloads', 'tripadvisor-reviews');
  
  if (!fs.existsSync(downloadsPath)) {
    console.error(`❌ Directory not found: ${downloadsPath}`);
    console.log('\n💡 Make sure you\'ve extracted reviews using the browser extension first!');
    return;
  }
  
  const files = fs.readdirSync(downloadsPath).filter(f => f.endsWith('.json'));
  
  console.log(`📁 Found ${files.length} JSON files in ${downloadsPath}\n`);
  
  if (files.length === 0) {
    console.log('⚠️  No JSON files found. Use the browser extension to extract reviews first.');
    return;
  }
  
  const stats = {
    filesProcessed: 0,
    uniqueUsers: new Set<string>(),
    placesImported: 0,
    placesDuplicate: 0,
    reviewsImported: 0,
    reviewsDuplicate: 0,
    errors: 0
  };
  
  for (const file of files) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📄 Processing: ${file}`);
      console.log(`${'='.repeat(60)}\n`);
      
      const filePath = path.join(downloadsPath, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      console.log(`👤 User: ${data.user.username}`);
      console.log(`🌍 City: ${data.user.city}`);
      console.log(`⭐ Reviews: ${data.reviews.length}\n`);
      
      // Create user
      const userId = await createSyntheticUser(data.user.username, data.reviews);
      stats.uniqueUsers.add(data.user.username);
      console.log(`✅ User created/found\n`);
      
      // Process reviews
      for (const review of data.reviews) {
        try {
          // Check for duplicate place
          let placeId = await checkDuplicatePlace(review.placeName, data.user.city);
          
          if (placeId) {
            stats.placesDuplicate++;
          } else {
            // Map category and import
            const categorySlug = mapCategory(review.placeCategory, review.placeName);
            placeId = await importPlace(review.placeName, categorySlug, data.user.city);
            console.log(`   ✅ Place: ${review.placeName} (${categorySlug})`);
            stats.placesImported++;
          }
          
          // Import review
          await importReview(placeId, userId, review);
          stats.reviewsImported++;
          
        } catch (error) {
          console.error(`   ❌ Error processing review:`, error);
          stats.errors++;
        }
      }
      
      stats.filesProcessed++;
      
    } catch (error) {
      console.error(`❌ Error processing file ${file}:`, error);
      stats.errors++;
    }
  }
  
  // Final report
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 IMPORT COMPLETE`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`📄 Files processed: ${stats.filesProcessed}/${files.length}`);
  console.log(`👥 Unique users: ${stats.uniqueUsers.size}`);
  console.log(`📍 Places imported: ${stats.placesImported}`);
  console.log(`🔄 Places skipped (duplicates): ${stats.placesDuplicate}`);
  console.log(`⭐ Reviews imported: ${stats.reviewsImported}`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log(`\n✅ Data ready for collaborative filtering!\n`);
}

importJSONFiles().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
