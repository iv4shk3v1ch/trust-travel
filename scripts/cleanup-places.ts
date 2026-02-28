import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Place {
  id: string;
  name: string;
  place_type_id: string;
  price_level: string | null;
  latitude: number | null;
  longitude: number | null;
  place_types?: {
    name: string;
    slug: string;
  };
}

interface PlaceType {
  id: string;
  name: string;
  slug: string;
}

// Historical buildings that shouldn't be restaurants/cafes
const HISTORICAL_BUILDING_KEYWORDS = [
  'palazzo',
  'castello',
  'cattedrale',
  'chiesa',
  'duomo',
  'basilica',
  'torre',
  'porta',
  'rocca',
  'fortezza',
  'monastero',
  'abbazia',
  'santuario',
  'museo',
  'biblioteca',
  'teatro',
  'villa',
];

// Categories that should be free
const FREE_CATEGORIES = [
  'park',
  'church',
  'cathedral',
  'historical-site',
  'viewpoint',
  'square',
  'street',
  'bridge',
  'fountain',
  'monument',
  'garden',
  'hiking-trail',
  'lake',
  'beach',
];

// Categories that should be low price
const LOW_PRICE_CATEGORIES = [
  'street-food',
  'fast-food',
  'ice-cream-shop',
  'bakery',
  'pizzeria-takeaway',
];

// Clothing store keywords (not real vintage)
const CLOTHING_STORE_KEYWORDS = [
  'zara',
  'h&m',
  'bershka',
  'pull&bear',
  'stradivarius',
  'mango',
  'calzedonia',
  'intimissimi',
  'ovs',
  'motivi',
  'terranova',
  'piazza italia',
  'alcott',
  'yamamay',
  'goldenpoint',
  'liu jo',
  'rinascimento',
  'guess',
  'levi',
  'nike',
  'adidas',
  'puma',
  'timberland',
];

async function loadPlaceTypes(): Promise<Map<string, PlaceType>> {
  console.log('📋 Loading place types...');
  const { data, error } = await supabase.from('place_types').select('*');
  
  if (error) {
    console.error('❌ Error loading place types:', error);
    throw error;
  }

  const map = new Map<string, PlaceType>();
  data?.forEach((pt) => {
    map.set(pt.slug, pt);
  });

  console.log(`✅ Loaded ${map.size} place types`);
  return map;
}

async function getAllPlaces(): Promise<Place[]> {
  console.log('📍 Loading all places...');
  const { data, error } = await supabase
    .from('places')
    .select('id, name, place_type_id, price_level, latitude, longitude, place_types!inner(name, slug)');
  
  if (error) {
    console.error('❌ Error loading places:', error);
    throw error;
  }

  console.log(`✅ Loaded ${data?.length || 0} places`);
  return data as Place[];
}

function isHistoricalBuilding(name: string): boolean {
  const lowerName = name.toLowerCase();
  return HISTORICAL_BUILDING_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

function isClothingStore(name: string): boolean {
  const lowerName = name.toLowerCase();
  return CLOTHING_STORE_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

function shouldBeFree(categorySlug: string): boolean {
  return FREE_CATEGORIES.includes(categorySlug);
}

function shouldBeLowPrice(categorySlug: string): boolean {
  return LOW_PRICE_CATEGORIES.includes(categorySlug);
}

function calculateSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const n2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Exact match
  if (n1 === n2) return 1.0;
  
  // One is substring of another
  if (n1.includes(n2) || n2.includes(n1)) {
    const shorter = Math.min(n1.length, n2.length);
    const longer = Math.max(n1.length, n2.length);
    return shorter / longer;
  }
  
  // Levenshtein distance for similar names
  const levenshtein = calculateLevenshtein(n1, n2);
  const maxLen = Math.max(n1.length, n2.length);
  return 1 - (levenshtein / maxLen);
}

function calculateLevenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
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

  return matrix[b.length][a.length];
}

function findDuplicates(places: Place[]): Map<string, Place[]> {
  const duplicates = new Map<string, Place[]>();
  
  // Group by similar names and same location
  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      const place1 = places[i];
      const place2 = places[j];
      
      // Check name similarity
      const nameSimilarity = calculateSimilarity(place1.name, place2.name);
      
      // Check location proximity (if both have coordinates)
      let locationMatch = false;
      if (place1.latitude && place1.longitude && place2.latitude && place2.longitude) {
        const distance = Math.sqrt(
          Math.pow(place1.latitude - place2.latitude, 2) +
          Math.pow(place1.longitude - place2.longitude, 2)
        );
        locationMatch = distance < 0.0001; // ~10 meters
      }
      
      // Consider duplicate if names are very similar or exact location match with similar names
      if (nameSimilarity > 0.85 || (locationMatch && nameSimilarity > 0.6)) {
        const key = place1.id;
        if (!duplicates.has(key)) {
          duplicates.set(key, [place1]);
        }
        duplicates.get(key)!.push(place2);
      }
    }
  }
  
  return duplicates;
}

async function main() {
  console.log('🚀 Starting automated place cleanup...\n');

  const placeTypes = await loadPlaceTypes();
  const places = await getAllPlaces();
  
  let stats = {
    historicalRemoved: 0,
    priceFixed: 0,
    clothingRemoved: 0,
    duplicatesFound: 0,
  };

  // Arrays to track changes
  const placesToDelete: string[] = [];
  const placesToUpdate: Array<{ id: string; updates: any }> = [];

  console.log('\n📊 ANALYZING PLACES...\n');

  // 1. Find historical buildings incorrectly categorized as restaurants/cafes
  console.log('1️⃣ Checking for historical buildings as restaurants...');
  const restaurantType = placeTypes.get('restaurant');
  const cafeType = placeTypes.get('cafe');
  
  for (const place of places) {
    if (!place.place_types) continue;
    
    const isRestaurantOrCafe = 
      place.place_type_id === restaurantType?.id || 
      place.place_type_id === cafeType?.id;
    
    if (isRestaurantOrCafe && isHistoricalBuilding(place.name)) {
      console.log(`   ❌ Found: "${place.name}" (${place.place_types.name})`);
      placesToDelete.push(place.id);
      stats.historicalRemoved++;
    }
  }

  // 2. Fix price levels
  console.log('\n2️⃣ Fixing price levels...');
  for (const place of places) {
    if (!place.place_types) continue;
    
    const categorySlug = place.place_types.slug;
    let newPriceLevel: string | null = null;

    if (shouldBeFree(categorySlug) && place.price_level !== null) {
      newPriceLevel = null; // Free places should have null price_level
      console.log(`   💰 ${place.name} (${place.place_types.name}): ${place.price_level || 'null'} → null (free)`);
    } else if (shouldBeLowPrice(categorySlug) && place.price_level !== 'low') {
      newPriceLevel = 'low';
      console.log(`   💰 ${place.name} (${place.place_types.name}): ${place.price_level || 'null'} → low`);
    }

    if (newPriceLevel !== undefined && newPriceLevel !== place.price_level) {
      placesToUpdate.push({
        id: place.id,
        updates: { price_level: newPriceLevel },
      });
      stats.priceFixed++;
    }
  }

  // 3. Remove clothing stores
  console.log('\n3️⃣ Checking for clothing stores...');
  const vintageStoreType = placeTypes.get('vintage-store');
  
  for (const place of places) {
    if (!place.place_types) continue;
    
    if (place.place_type_id === vintageStoreType?.id && isClothingStore(place.name)) {
      console.log(`   🧥 Removing clothing store: "${place.name}"`);
      placesToDelete.push(place.id);
      stats.clothingRemoved++;
    }
  }

  // 4. Find duplicates
  console.log('\n4️⃣ Searching for duplicates...');
  const duplicates = findDuplicates(places);
  
  for (const [keepId, dupeGroup] of duplicates.entries()) {
    if (dupeGroup.length > 1) {
      console.log(`   🔄 Duplicate group:`);
      dupeGroup.forEach((p, idx) => {
        const marker = idx === 0 ? '✅ KEEP' : '❌ DELETE';
        console.log(`      ${marker}: ${p.name} (${p.place_types?.name})`);
        if (idx > 0 && !placesToDelete.includes(p.id)) {
          placesToDelete.push(p.id);
          stats.duplicatesFound++;
        }
      });
    }
  }

  // Summary
  console.log('\n\n📊 CLEANUP SUMMARY:');
  console.log(`   Historical buildings to remove: ${stats.historicalRemoved}`);
  console.log(`   Price levels to fix: ${stats.priceFixed}`);
  console.log(`   Clothing stores to remove: ${stats.clothingRemoved}`);
  console.log(`   Duplicates to remove: ${stats.duplicatesFound}`);
  console.log(`   \n   Total places to delete: ${placesToDelete.length}`);
  console.log(`   Total places to update: ${placesToUpdate.length}`);

  // Execute changes
  if (placesToDelete.length === 0 && placesToUpdate.length === 0) {
    console.log('\n✅ No changes needed!');
    return;
  }

  console.log('\n⚠️  Ready to apply changes. Continue? (Ctrl+C to cancel)');
  console.log('   Starting in 5 seconds...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('\n🔧 APPLYING CHANGES...\n');

  // Delete places
  if (placesToDelete.length > 0) {
    console.log(`🗑️  Deleting ${placesToDelete.length} places...`);
    const { error } = await supabase
      .from('places')
      .delete()
      .in('id', placesToDelete);
    
    if (error) {
      console.error('❌ Error deleting places:', error);
    } else {
      console.log(`✅ Successfully deleted ${placesToDelete.length} places`);
    }
  }

  // Update places
  if (placesToUpdate.length > 0) {
    console.log(`\n✏️  Updating ${placesToUpdate.length} places...`);
    let successCount = 0;
    
    for (const { id, updates } of placesToUpdate) {
      const { error } = await supabase
        .from('places')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error(`❌ Error updating place ${id}:`, error);
      } else {
        successCount++;
      }
    }
    
    console.log(`✅ Successfully updated ${successCount}/${placesToUpdate.length} places`);
  }

  console.log('\n✅ CLEANUP COMPLETE!\n');
  
  // Show remaining count
  const { count } = await supabase
    .from('places')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📍 Total places remaining: ${count}`);
}

main().catch(console.error);
