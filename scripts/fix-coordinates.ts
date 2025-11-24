/**
 * Fix Place Coordinates using OpenStreetMap Nominatim API
 * 
 * Fetches correct coordinates for all places based on their addresses
 * Uses OpenStreetMap Nominatim API (no API key needed, but rate-limited)
 * 
 * Usage: npm run fix:coordinates
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenStreetMap Nominatim API (free, no key needed)
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'TrustTravel/1.0'; // Required by Nominatim

interface Place {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
}

/**
 * Fetch coordinates from OpenStreetMap Nominatim
 */
async function fetchCoordinates(address: string, city: string, country: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Construct search query
    const query = `${address}, ${city}, ${country}`;
    const url = new URL(NOMINATIM_API);
    url.searchParams.append('q', query);
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', '1');
    url.searchParams.append('addressdetails', '1');
    
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status}`);
      return null;
    }
    
    const data: NominatimResult[] = await response.json();
    
    if (data.length === 0) {
      console.warn(`⚠️  No results found for: ${query}`);
      return null;
    }
    
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
    
  } catch (error) {
    console.error(`❌ Error fetching coordinates:`, error);
    return null;
  }
}

/**
 * Add delay between requests (Nominatim rate limit: max 1 request/second)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fixAllCoordinates() {
  console.log('🗺️  Fixing coordinates using OpenStreetMap\n');
  console.log('⏱️  Rate limit: 1 request/second (Nominatim policy)\n');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials not found');
    process.exit(1);
  }
  
  try {
    // Fetch all places
    const { data: places, error } = await supabase
      .from('places')
      .select('id, name, address, city, country, latitude, longitude')
      .order('name');
    
    if (error) throw error;
    
    if (!places || places.length === 0) {
      console.log('ℹ️  No places found in database');
      return;
    }
    
    console.log(`📍 Found ${places.length} places to process\n`);
    console.log('='.repeat(60));
    
    let updated = 0;
    let failed = 0;
    let skipped = 0;
    
    for (let i = 0; i < places.length; i++) {
      const place = places[i] as Place;
      const progress = `[${i + 1}/${places.length}]`;
      
      console.log(`\n${progress} ${place.name}`);
      console.log(`   Address: ${place.address}`);
      
      if (!place.address || place.address.trim() === '') {
        console.log('   ⏭️  Skipped: No address');
        skipped++;
        continue;
      }
      
      // Fetch new coordinates
      const coords = await fetchCoordinates(place.address, place.city, place.country);
      
      if (!coords) {
        console.log('   ❌ Failed: Could not find coordinates');
        failed++;
        await delay(1000); // Respect rate limit even on failure
        continue;
      }
      
      // Show old vs new coordinates
      if (place.latitude && place.longitude) {
        console.log(`   Old: ${place.latitude.toFixed(6)}, ${place.longitude.toFixed(6)}`);
      } else {
        console.log(`   Old: (none)`);
      }
      console.log(`   New: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      
      // Update database
      const { error: updateError } = await supabase
        .from('places')
        .update({
          latitude: coords.lat,
          longitude: coords.lng,
          updated_at: new Date().toISOString()
        })
        .eq('id', place.id);
      
      if (updateError) {
        console.log(`   ❌ Failed to update database: ${updateError.message}`);
        failed++;
      } else {
        console.log('   ✅ Updated');
        updated++;
      }
      
      // Respect Nominatim rate limit: 1 request per second
      if (i < places.length - 1) {
        await delay(1000);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log('='.repeat(60));
    
    if (updated > 0) {
      console.log('\n✨ Coordinates fixed successfully!');
      console.log('\n💡 All places now have accurate coordinates from OpenStreetMap');
    }
    
    if (failed > 0) {
      console.log('\n⚠️  Some places failed - you may need to:');
      console.log('   - Check if addresses are formatted correctly');
      console.log('   - Manually verify failed locations');
      console.log('   - Try running the script again for failed items');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Add option to fix only places with missing or invalid coordinates
async function fixMissingCoordinates() {
  console.log('🗺️  Fixing MISSING coordinates using OpenStreetMap\n');
  console.log('⏱️  Rate limit: 1 request/second (Nominatim policy)\n');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials not found');
    process.exit(1);
  }
  
  try {
    // Fetch only places with missing coordinates
    const { data: places, error } = await supabase
      .from('places')
      .select('id, name, address, city, country, latitude, longitude')
      .or('latitude.is.null,longitude.is.null')
      .order('name');
    
    if (error) throw error;
    
    if (!places || places.length === 0) {
      console.log('✅ All places already have coordinates!');
      return;
    }
    
    console.log(`📍 Found ${places.length} places without coordinates\n`);
    console.log('='.repeat(60));
    
    let updated = 0;
    let failed = 0;
    let skipped = 0;
    
    for (let i = 0; i < places.length; i++) {
      const place = places[i] as Place;
      const progress = `[${i + 1}/${places.length}]`;
      
      console.log(`\n${progress} ${place.name}`);
      console.log(`   Address: ${place.address}`);
      
      if (!place.address || place.address.trim() === '') {
        console.log('   ⏭️  Skipped: No address');
        skipped++;
        continue;
      }
      
      // Fetch coordinates
      const coords = await fetchCoordinates(place.address, place.city, place.country);
      
      if (!coords) {
        console.log('   ❌ Failed: Could not find coordinates');
        failed++;
        await delay(1000);
        continue;
      }
      
      console.log(`   New: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      
      // Update database
      const { error: updateError } = await supabase
        .from('places')
        .update({
          latitude: coords.lat,
          longitude: coords.lng,
          updated_at: new Date().toISOString()
        })
        .eq('id', place.id);
      
      if (updateError) {
        console.log(`   ❌ Failed to update database: ${updateError.message}`);
        failed++;
      } else {
        console.log('   ✅ Updated');
        updated++;
      }
      
      // Respect rate limit
      if (i < places.length - 1) {
        await delay(1000);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const mode = args[0];

if (mode === '--missing-only') {
  fixMissingCoordinates();
} else if (mode === '--all' || !mode) {
  fixAllCoordinates();
} else {
  console.log('Usage:');
  console.log('  npm run fix:coordinates              # Fix all coordinates');
  console.log('  npm run fix:coordinates --missing-only # Fix only missing coordinates');
  process.exit(1);
}
