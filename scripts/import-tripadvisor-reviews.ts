/**
 * TripAdvisor Reviews Import Script
 * 
 * This script fetches reviews from TripAdvisor API for places in our database
 * and imports them into the Supabase reviews table.
 * 
 * Features:
 * - Fetches up to 5 reviews per place from TripAdvisor
 * - Maps TripAdvisor data to our database schema
 * - Handles rating conversion (TripAdvisor uses 1-5, we use 0-5)
 * - Parses visit dates from review data
 * - Associates reviews with existing user or creates placeholder
 * 
 * Usage: npm run import:reviews
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

interface TripAdvisorReview {
  id: string;
  lang: string;
  location_id: string;
  published_date: string;
  rating: number;
  helpful_votes: number;
  rating_image_url: string;
  url: string;
  text: string;
  title: string;
  trip_type: string;
  travel_date: string;
  user: {
    username: string;
    user_location: {
      name: string;
      id: string;
    };
  };
}

interface TripAdvisorReviewsResponse {
  data: TripAdvisorReview[];
  error?: {
    code: string;
    message: string;
  };
}

interface Place {
  id: string;
  name: string;
  city: string;
  latitude?: number;
  longitude?: number;
  tripadvisor_id?: string;
}

/**
 * Fetch reviews from TripAdvisor API with pagination
 */
async function fetchTripAdvisorReviews(locationId: string, limit: number = 15): Promise<TripAdvisorReview[]> {
  const allReviews: TripAdvisorReview[] = [];
  
  // Try to fetch multiple pages - aim for 10-15 reviews total
  const maxPages = 5; // Fetch up to 5 pages (could get 15+ reviews)
  
  for (let page = 0; page < maxPages && allReviews.length < limit; page++) {
    const url = new URL(`${TRIPADVISOR_BASE_URL}/location/${locationId}/reviews`);
    url.searchParams.set('key', TRIPADVISOR_API_KEY);
    url.searchParams.set('language', 'en');
    
    // Some APIs use offset, some use page
    if (page > 0) {
      url.searchParams.set('offset', (page * 5).toString());
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (page === 0) {
          console.error(`   ❌ API Error: ${response.status} ${response.statusText}`);
        }
        break;
      }

      const data: TripAdvisorReviewsResponse = await response.json();
      
      if (data.error) {
        if (page === 0) {
          console.error(`   ❌ TripAdvisor API Error: ${data.error.code} - ${data.error.message}`);
        }
        break;
      }

      const reviews = data.data || [];
      if (reviews.length === 0) {
        break; // No more reviews available
      }

      allReviews.push(...reviews);
      
      // If we got fewer reviews than expected, no point fetching next page
      if (reviews.length < 3) {
        break;
      }
      
      // Small delay between pagination requests
      if (page < maxPages - 1 && allReviews.length < limit) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    } catch (error) {
      if (page === 0) {
        console.error('   ❌ Error fetching reviews:', error);
      }
      break;
    }
  }

  return allReviews.slice(0, limit);
}

/**
 * Parse travel date from TripAdvisor format (e.g., "2023-10-01")
 */
function parseTravelDate(travelDate: string): string {
  if (!travelDate) {
    // Default to 6 months ago if no date provided
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return sixMonthsAgo.toISOString().split('T')[0];
  }
  
  // TripAdvisor format is already YYYY-MM-DD
  return travelDate;
}

/**
 * Convert TripAdvisor rating (1-5) to our rating (0-5)
 * TripAdvisor uses discrete values: 1, 2, 3, 4, 5
 * We'll keep them as-is since both use the same scale
 */
function convertRating(tripAdvisorRating: number): number {
  return Math.max(0, Math.min(5, tripAdvisorRating));
}

/**
 * Get or create a placeholder user for reviews
 * Since we don't have actual TripAdvisor user accounts in our system,
 * we'll use a single "tripadvisor_import" user
 */
async function getOrCreateImportUser(): Promise<string> {
  // First, check if we have any existing user
  const { data: existingUsers, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (fetchError) {
    console.error('❌ Error fetching users:', fetchError);
    throw fetchError;
  }

  if (existingUsers && existingUsers.length > 0) {
    console.log(`✅ Using existing user: ${existingUsers[0].id}`);
    return existingUsers[0].id;
  }

  // If no users exist, we need to create one through auth
  // For now, we'll use a hardcoded user ID that should exist from testing
  console.warn('⚠️  No users found. You may need to create a user first.');
  throw new Error('No users available for review import');
}

/**
 * Search for TripAdvisor location ID by place name and coordinates
 * Uses nearby search with exact coordinates for better matching
 */
async function searchTripAdvisorLocation(
  placeName: string,
  city: string,
  latitude?: number,
  longitude?: number
): Promise<string | null> {
  // If we have coordinates, try nearby search first (most accurate)
  if (latitude && longitude) {
    const url = new URL(`${TRIPADVISOR_BASE_URL}/location/nearby_search`);
    url.searchParams.set('key', TRIPADVISOR_API_KEY);
    url.searchParams.set('latLong', `${latitude},${longitude}`);
    url.searchParams.set('radius', '0.5'); // Very small radius (500m)
    url.searchParams.set('radiusUnit', 'km');
    url.searchParams.set('language', 'en');

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          // Try to find exact or close match by name
          const exactMatch = data.data.find((result: { name?: string }) => 
            result.name?.toLowerCase() === placeName.toLowerCase()
          );
          
          if (exactMatch) {
            return exactMatch.location_id;
          }
          
          // Try partial match
          const partialMatch = data.data.find((result: { name?: string }) => 
            result.name?.toLowerCase().includes(placeName.toLowerCase().split(' ')[0])
          );
          
          if (partialMatch) {
            return partialMatch.location_id;
          }
          
          // If no good match, return first result (it's very close geographically)
          if (data.data.length > 0) {
            return data.data[0].location_id;
          }
        }
      }
    } catch {
      // Continue to text search
    }
  }

  // Fallback to text search with multiple variations
  const searchVariations = [
    `${placeName} ${city} Italy`,
    `${placeName} ${city}`,
    `${placeName} Trento Italy`,
    placeName,
  ];

  for (const searchQuery of searchVariations) {
    const url = new URL(`${TRIPADVISOR_BASE_URL}/location/search`);
    url.searchParams.set('key', TRIPADVISOR_API_KEY);
    url.searchParams.set('searchQuery', searchQuery);
    url.searchParams.set('language', 'en');

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        // Filter results to avoid cities/regions
        const validResults = data.data.filter((result: { name?: string; location_string?: string }) => {
          const name = result.name?.toLowerCase() || '';
          const locationString = result.location_string?.toLowerCase() || '';
          
          // Skip if it's just the city name
          if (name === 'trento' || name === city.toLowerCase()) {
            return false;
          }
          
          // Skip provinces and regions
          if (name.includes('province') || name.includes('region') || locationString.includes('province')) {
            return false;
          }
          
          return true;
        });
        
        if (validResults.length > 0) {
          return validResults[0].location_id;
        }
      }
      
      // Small delay between search attempts
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Import reviews for a single place
 */
async function importReviewsForPlace(place: Place, userId: string): Promise<number> {
  console.log(`\n📍 Processing: ${place.name} (${place.city})`);

  // Check how many reviews this place already has
  const { data: existingReviews, error: countError } = await supabase
    .from('reviews')
    .select('id', { count: 'exact' })
    .eq('place_id', place.id);

  if (countError) {
    console.error(`   ❌ Error checking existing reviews:`, countError.message);
    return 0;
  }

  const existingCount = existingReviews?.length || 0;
  
  if (existingCount >= 10) {
    console.log(`   ✅ Already has ${existingCount} reviews, skipping`);
    return 0;
  }

  const reviewsNeeded = 15 - existingCount;
  console.log(`   📊 Current reviews: ${existingCount}, targeting ${Math.min(15, existingCount + reviewsNeeded)} total`);

  // Search for TripAdvisor location if we don't have the ID
  let locationId: string | null | undefined = place.tripadvisor_id;
  
  if (!locationId) {
    console.log(`   🔍 Searching TripAdvisor for: ${place.name}...`);
    locationId = await searchTripAdvisorLocation(
      place.name,
      place.city,
      place.latitude ? Number(place.latitude) : undefined,
      place.longitude ? Number(place.longitude) : undefined
    );
    
    if (!locationId) {
      console.log(`   ⏭️  No TripAdvisor location found, skipping`);
      return 0;
    }
    
    console.log(`   ✅ Found location ID: ${locationId}`);
  }

  // Fetch reviews from TripAdvisor
  console.log(`   📥 Fetching reviews...`);
  const tripAdvisorReviews = await fetchTripAdvisorReviews(locationId);

  if (tripAdvisorReviews.length === 0) {
    console.log(`   ⏭️  No reviews found on TripAdvisor`);
    return 0;
  }

  console.log(`   ✅ Found ${tripAdvisorReviews.length} reviews on TripAdvisor`);

  // Import reviews (take what we need, up to 5 total per place)
  const reviewsToImport = tripAdvisorReviews.slice(0, reviewsNeeded);
  let importedCount = 0;

  for (const taReview of reviewsToImport) {
    try {
      const reviewData = {
        user_id: userId,
        place_id: place.id,
        overall_rating: convertRating(taReview.rating),
        comment: `${taReview.title}\n\n${taReview.text}`.trim(),
        visit_date: parseTravelDate(taReview.travel_date),
        created_at: new Date(taReview.published_date).toISOString(),
        updated_at: new Date(taReview.published_date).toISOString(),
      };

      const { error } = await supabase
        .from('reviews')
        .insert(reviewData);

      if (error) {
        console.error(`   ❌ Error inserting review:`, error.message);
        continue;
      }

      importedCount++;
    } catch (error) {
      console.error(`   ❌ Error processing review:`, error);
    }
  }

  console.log(`   ✅ Imported ${importedCount}/${reviewsToImport.length} reviews`);
  
  // Rate limiting - wait 200ms between places to respect API limits
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return importedCount;
}

/**
 * Main import function
 */
async function importAllReviews() {
  console.log('🚀 Starting TripAdvisor Reviews Import\n');
  console.log('=' . repeat(60));

  // Validate API key
  if (!TRIPADVISOR_API_KEY) {
    console.error('❌ TRIPADVISOR_API_KEY not found in environment variables');
    process.exit(1);
  }

  // Validate Supabase credentials
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials not found in environment variables');
    process.exit(1);
  }

  // Get user for reviews
  console.log('👤 Getting user for review import...');
  let userId: string;
  try {
    userId = await getOrCreateImportUser();
  } catch (error) {
    console.error('❌ Failed to get user:', error);
    process.exit(1);
  }

  // Fetch all places from database
  console.log('\n📍 Fetching places from database...');
  const { data: places, error: placesError } = await supabase
    .from('places')
    .select('id, name, city, latitude, longitude')
    .order('name', { ascending: true });

  if (placesError) {
    console.error('❌ Error fetching places:', placesError);
    process.exit(1);
  }

  if (!places || places.length === 0) {
    console.log('⚠️  No places found in database');
    process.exit(0);
  }

  // Get review counts for each place and sort by those needing reviews most
  const placesWithCounts = await Promise.all(
    places.map(async (place) => {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id', { count: 'exact' })
        .eq('place_id', place.id);
      return {
        ...place,
        reviewCount: reviews?.length || 0,
      };
    })
  );

  // Sort: places with 0 reviews first, then 1, then 2, etc.
  const sortedPlaces = placesWithCounts
    .filter(p => p.reviewCount < 10) // Only process places with <10 reviews
    .sort((a, b) => a.reviewCount - b.reviewCount);

  console.log(`✅ Found ${places.length} total places`);
  console.log(`   📋 ${sortedPlaces.length} places need more reviews (<10)\n`);
  console.log('='.repeat(60));

  // Import reviews for each place
  let totalImported = 0;
  let processedCount = 0;
  let skippedCount = 0;

  for (const place of sortedPlaces) {
    const imported = await importReviewsForPlace(place, userId);
    
    if (imported > 0) {
      totalImported += imported;
      processedCount++;
    } else {
      skippedCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary:');
  console.log(`   ✅ Places with reviews imported: ${processedCount}`);
  console.log(`   ⏭️  Places skipped (no reviews): ${skippedCount}`);
  console.log(`   📝 Total reviews imported: ${totalImported}`);
  console.log('='.repeat(60));
  console.log('\n✨ Import completed!\n');
}

// Run the import
importAllReviews().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
