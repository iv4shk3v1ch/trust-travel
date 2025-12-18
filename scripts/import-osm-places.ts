/**
 * Import places from OpenStreetMap for Trento
 * Uses Overpass API to fetch POI data with coordinates, addresses, and metadata
 * 
 * Run with: npx tsx scripts/import-osm-places.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use SERVICE_ROLE key for imports (bypasses RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('💡 Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Trento bounding box coordinates (approximate)
const TRENTO_BBOX = {
  south: 46.0450,
  west: 11.0900,
  north: 46.0950,
  east: 11.1450,
};

/**
 * OSM category to your place_type mapping
 * Maps OpenStreetMap tags to your database place_types
 */
const OSM_TO_PLACE_TYPE: Record<string, string> = {
  // Food & Drink
  'restaurant': 'restaurant',
  'cafe': 'cafe',
  'bar': 'aperetivo-bar', // Default bar type
  'pub': 'craft-beer-pub',
  'fast_food': 'street-food',
  'ice_cream': 'gelateria',
  'food_court': 'food-market',
  'biergarten': 'craft-beer-pub',
  
  // Culture & Entertainment
  'museum': 'museum',
  'theatre': 'theatre',
  'cinema': 'cinema',
  'arts_centre': 'cultural-center',
  'gallery': 'art-gallery',
  'nightclub': 'underground-club',
  'casino': 'commercial-nightclub',
  'library': 'library',
  
  // Nature & Outdoors
  'park': 'park',
  'garden': 'botanical-garden',
  'viewpoint': 'viewpoint',
  'beach': 'beach',
  'picnic_site': 'picnic-area',
  
  // Historical & Landmarks
  'castle': 'castle',
  'monument': 'historical-landmark',
  'memorial': 'historical-landmark',
  'ruins': 'historical-landmark',
  'tower': 'tower',
  'city_gate': 'historical-landmark',
  'fort': 'castle',
  'archaeological_site': 'historical-landmark',
  
  // Religious
  'place_of_worship': 'church',
  'church': 'church',
  'cathedral': 'church',
  'chapel': 'church',
  'monastery': 'church',
  
  // Shopping
  'marketplace': 'local-market',
  'shop': 'artisanal-shop', // Generic shop
  'bookshop': 'bookstore',
  'clothes': 'vintage-store',
  'shopping_centre': 'shoopping-centre',
  'mall': 'shoopping-centre',
  
  // Recreation
  'spa': 'spa',
  'sports_centre': 'yoga-studio',
  'fitness_centre': 'yoga-studio',
  'swimming_pool': 'thermal-bath',
  'sauna': 'spa',
  
  // Other
  'community_centre': 'cultural-center',
  'events_venue': 'cultural-event-venue',
  'music_venue': 'live-music-venue',
  'studio': 'contemporary-art',
};

/**
 * Query Overpass API for places in Trento
 */
async function queryOverpassAPI() {
  const { south, west, north, east } = TRENTO_BBOX;
  
  // Overpass QL query - get interesting POI
  const query = `
    [out:json][timeout:60];
    (
      // Food & Drink
      node["amenity"~"^(restaurant|cafe|bar|pub|fast_food|ice_cream|food_court|biergarten)$"](${south},${west},${north},${east});
      way["amenity"~"^(restaurant|cafe|bar|pub|fast_food|ice_cream|food_court|biergarten)$"](${south},${west},${north},${east});
      
      // Culture & Entertainment
      node["amenity"~"^(theatre|cinema|arts_centre|gallery|nightclub|casino|library)$"](${south},${west},${north},${east});
      way["amenity"~"^(theatre|cinema|arts_centre|gallery|nightclub|casino|library)$"](${south},${west},${north},${east});
      
      // Tourism
      node["tourism"~"^(museum|gallery|viewpoint|attraction|artwork|theme_park|zoo)$"](${south},${west},${north},${east});
      way["tourism"~"^(museum|gallery|viewpoint|attraction|artwork|theme_park|zoo)$"](${south},${west},${north},${east});
      
      // Historical
      node["historic"~"^(castle|monument|memorial|ruins|tower|city_gate|fort|archaeological_site)$"](${south},${west},${north},${east});
      way["historic"~"^(castle|monument|memorial|ruins|tower|city_gate|fort|archaeological_site)$"](${south},${west},${north},${east});
      
      // Nature & Parks
      node["leisure"~"^(park|garden|nature_reserve|picnic_site|beach_resort|sports_centre|fitness_centre|swimming_pool)$"](${south},${west},${north},${east});
      way["leisure"~"^(park|garden|nature_reserve|picnic_site|beach_resort|sports_centre|fitness_centre|swimming_pool)$"](${south},${west},${north},${east});
      
      // Shopping
      node["shop"~"^(books|clothes|mall|gift|art|music|antiques|wine|coffee)$"](${south},${west},${north},${east});
      way["shop"~"^(books|clothes|mall|gift|art|music|antiques|wine|coffee)$"](${south},${west},${north},${east});
      
      // Religious
      node["amenity"="place_of_worship"](${south},${west},${north},${east});
      way["amenity"="place_of_worship"](${south},${west},${north},${east});
    );
    out center tags;
  `;

  const url = 'https://overpass-api.de/api/interpreter';
  
  console.log('🌍 Querying Overpass API for Trento places...');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ Found ${data.elements.length} POI from OpenStreetMap`);
  
  return data.elements;
}

/**
 * OSM Element type from Overpass API
 */
interface OSMElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * Map OSM element to your database schema
 */
function mapOSMToPlace(element: OSMElement, placeTypes: Map<string, string>) {
  const tags = element.tags || {};
  
  // Determine place type
  const osmType = 
    tags.amenity || 
    tags.tourism || 
    tags.historic || 
    tags.leisure || 
    tags.shop || 
    'attraction';
  
  const placeTypeSlug = OSM_TO_PLACE_TYPE[osmType] || 'restaurant'; // Default fallback
  const placeTypeId = placeTypes.get(placeTypeSlug);
  
  if (!placeTypeId) {
    console.warn(`⚠️ No place_type found for: ${placeTypeSlug}`);
    return null;
  }
  
  // Get coordinates (center for ways, direct for nodes)
  const lat = element.lat || element.center?.lat;
  const lon = element.lon || element.center?.lon;
  
  if (!lat || !lon) {
    console.warn(`⚠️ No coordinates for: ${tags.name || 'Unknown'}`);
    return null;
  }
  
  // Extract name (skip if no name)
  const name = tags.name || tags['name:en'] || tags['name:it'];
  if (!name) {
    return null; // Skip places without names
  }
  
  // Build description from OSM tags
  const descriptionParts = [];
  if (tags.description) descriptionParts.push(tags.description);
  if (tags.cuisine) descriptionParts.push(`Cuisine: ${tags.cuisine}`);
  if (tags.building && tags.building !== 'yes') descriptionParts.push(`Building: ${tags.building}`);
  
  // Determine indoor/outdoor
  let indoorOutdoor: 'indoor' | 'outdoor' | 'mixed' = 'mixed';
  if (osmType.includes('park') || osmType.includes('garden') || osmType.includes('viewpoint')) {
    indoorOutdoor = 'outdoor';
  } else if (osmType.includes('museum') || osmType.includes('theatre') || osmType.includes('cinema')) {
    indoorOutdoor = 'indoor';
  }
  
  // Determine price level from OSM tags
  let priceLevel: 'low' | 'medium' | 'high' = 'medium';
  if (tags['charge'] === 'no' || tags['fee'] === 'no') {
    priceLevel = 'low';
  } else if (tags['charge:'] || tags['fee']) {
    priceLevel = 'medium';
  }
  
  return {
    name,
    place_type_id: placeTypeId,
    city: tags['addr:city'] || 'Trento',
    country: 'Italy',
    address: tags['addr:street'] 
      ? `${tags['addr:street']}${tags['addr:housenumber'] ? ' ' + tags['addr:housenumber'] : ''}`
      : null,
    latitude: lat,
    longitude: lon,
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || tags.url || null,
    working_hours: tags.opening_hours || null,
    description: descriptionParts.length > 0 ? descriptionParts.join('. ') : null,
    price_level: priceLevel,
    indoor_outdoor: indoorOutdoor,
    verified: false,
    created_by: null, // Will be set to special OSM user
  };
}

/**
 * Main import function
 */
async function importOSMPlaces() {
  try {
    console.log('🚀 Starting OpenStreetMap import for Trento\n');
    
    // 1. Fetch place types from database
    console.log('1️⃣ Fetching place types...');
    const { data: placeTypesData, error: placeTypesError } = await supabase
      .from('place_types')
      .select('id, slug');
    
    if (placeTypesError || !placeTypesData) {
      throw new Error(`Failed to fetch place types: ${placeTypesError?.message}`);
    }
    
    const placeTypes = new Map(placeTypesData.map(pt => [pt.slug, pt.id]));
    console.log(`✅ Loaded ${placeTypes.size} place types\n`);
    
    // 2. Query OpenStreetMap
    console.log('2️⃣ Querying OpenStreetMap...');
    const osmElements = await queryOverpassAPI();
    console.log('');
    
    // 3. Transform OSM data
    console.log('3️⃣ Transforming OSM data to database schema...');
    const places = osmElements
      .map((el: OSMElement) => mapOSMToPlace(el, placeTypes))
      .filter((place: ReturnType<typeof mapOSMToPlace>) => place !== null);
    
    console.log(`✅ Transformed ${places.length} valid places\n`);
    
    // 4. Check for duplicates by name + coordinates
    console.log('4️⃣ Checking for duplicates...');
    const { data: existingPlaces } = await supabase
      .from('places')
      .select('name, latitude, longitude')
      .eq('city', 'Trento');
    
    const existingSet = new Set(
      existingPlaces?.map(p => `${p.name}|${p.latitude}|${p.longitude}`) || []
    );
    
    const newPlaces = places.filter((place: ReturnType<typeof mapOSMToPlace>) => {
      if (!place) return false;
      const key = `${place.name}|${place.latitude}|${place.longitude}`;
      return !existingSet.has(key);
    });
    
    console.log(`✅ ${newPlaces.length} new places (${places.length - newPlaces.length} duplicates skipped)\n`);
    
    if (newPlaces.length === 0) {
      console.log('🎉 No new places to import. Database is up to date!');
      return;
    }
    
    // 5. Insert in batches (Supabase limit: 1000 per request)
    console.log('5️⃣ Inserting places into database...');
    const batchSize = 100;
    let inserted = 0;
    let failed = 0;
    
    for (let i = 0; i < newPlaces.length; i += batchSize) {
      const batch = newPlaces.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('places')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Batch ${i / batchSize + 1} failed:`, error.message);
        failed += batch.length;
      } else {
        inserted += batch.length;
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${batch.length} places`);
      }
    }
    
    console.log('\n---\n');
    console.log('📊 IMPORT SUMMARY:');
    console.log(`Total OSM places found: ${osmElements.length}`);
    console.log(`Valid places: ${places.length}`);
    console.log(`New places: ${newPlaces.length}`);
    console.log(`Successfully inserted: ${inserted}`);
    console.log(`Failed: ${failed}`);
    console.log('\n🎉 Import complete!');
    console.log('\n💡 Next steps:');
    console.log('1. Run: npm run generate:place-embeddings');
    console.log('2. Verify data in Supabase dashboard');
    console.log('3. Test recommendations with new places');
    
  } catch (error) {
    console.error('\n❌ Import failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run import
importOSMPlaces();
