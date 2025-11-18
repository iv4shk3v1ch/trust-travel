/**
 * Add Test Places to Database
 * 
 * Adds sample places to test the recommendation system
 * while you work on getting real data from TripAdvisor
 * 
 * Usage: npm run add:test-places
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test places data for Trento
const TEST_PLACES = [
  {
    name: 'Pizzeria Pedavena',
    slug: 'pizzeria',
    address: 'Via Giuseppe Verdi, 15, Trento',
    lat: 46.0664,
    lng: 11.1211,
    description: 'Traditional Neapolitan pizza in the heart of Trento. Family-owned for 30 years.',
    price: 'medium',
    indoor_outdoor: 'indoor',
    phone: '+39 0461 234567',
    rating: 4.5,
    reviews: 120
  },
  {
    name: 'Ristorante Al Vo',
    slug: 'restaurant',
    address: 'Vicolo del Vo 11, Trento',
    lat: 46.0685,
    lng: 11.1205,
    description: 'Fine dining with a modern twist on Trentino cuisine. Wine cellar with 200+ labels.',
    price: 'high',
    indoor_outdoor: 'indoor',
    phone: '+39 0461 985374',
    website: 'https://www.ristorantealvo.it',
    rating: 4.7,
    reviews: 89
  },
  {
    name: 'Caffè Pasticceria Bertelli',
    slug: 'cafe',
    address: 'Largo Carducci, 12, Trento',
    lat: 46.0672,
    lng: 11.1218,
    description: 'Historic café serving excellent espresso and homemade pastries since 1899.',
    price: 'medium',
    indoor_outdoor: 'mixed',
    phone: '+39 0461 981037',
    rating: 4.6,
    reviews: 156
  },
  {
    name: 'Osteria a Le Due Spade',
    slug: 'local-trattoria',
    address: 'Via Don Arcangelo Rizzi, 11, Trento',
    lat: 46.0678,
    lng: 11.1215,
    description: 'Traditional Trentino trattoria. Try the canederli and local wines.',
    price: 'medium',
    indoor_outdoor: 'indoor',
    phone: '+39 0461 234343',
    rating: 4.4,
    reviews: 203
  },
  {
    name: 'Birreria Pedavena',
    slug: 'craft-beer-pub',
    address: 'Piazza Fiera, 13, Trento',
    lat: 46.0695,
    lng: 11.1190,
    description: 'Historic brewery and pub. 10 beers on tap, traditional pub food.',
    price: 'medium',
    indoor_outdoor: 'mixed',
    phone: '+39 0461 986255',
    website: 'https://www.birreriapedavena.com',
    rating: 4.3,
    reviews: 187
  },
  {
    name: 'Castello del Buonconsiglio',
    slug: 'castle',
    address: 'Via Bernardo Clesio, 5, Trento',
    lat: 46.0730,
    lng: 11.1260,
    description: 'Historic castle and museum. One of the most important monuments in Trentino.',
    price: 'low',
    indoor_outdoor: 'mixed',
    phone: '+39 0461 233770',
    website: 'https://www.buonconsiglio.it',
    rating: 4.8,
    reviews: 1450
  },
  {
    name: 'MUSE - Museo delle Scienze',
    slug: 'museum',
    address: 'Corso del Lavoro e della Scienza, 3, Trento',
    lat: 46.0681,
    lng: 11.1162,
    description: 'Science museum designed by Renzo Piano. Interactive exhibits about nature and environment.',
    price: 'low',
    indoor_outdoor: 'indoor',
    phone: '+39 0461 270311',
    website: 'https://www.muse.it',
    rating: 4.7,
    reviews: 2340
  },
  {
    name: 'Piazza Duomo',
    slug: 'city-square',
    address: 'Piazza Duomo, Trento',
    lat: 46.0679,
    lng: 11.1211,
    description: 'Main square of Trento. Surrounded by historic buildings and the beautiful Duomo cathedral.',
    price: 'low',
    indoor_outdoor: 'outdoor',
    rating: 4.6,
    reviews: 890
  },
  {
    name: 'Parco di Gocciadoro',
    slug: 'park',
    address: 'Via al Parco di Gocciadoro, Trento',
    lat: 46.0620,
    lng: 11.1155,
    description: 'Large public park with walking paths, picnic areas, and beautiful views of the mountains.',
    price: 'low',
    indoor_outdoor: 'outdoor',
    rating: 4.4,
    reviews: 234
  },
  {
    name: 'Doss Trento',
    slug: 'viewpoint',
    address: 'Via Salita al Doss Trento, Trento',
    lat: 46.0725,
    lng: 11.1145,
    description: 'Hill overlooking Trento with panoramic views. WWI memorial and hiking trails.',
    price: 'low',
    indoor_outdoor: 'outdoor',
    rating: 4.7,
    reviews: 567
  },
  {
    name: 'Gelateria Zanella',
    slug: 'gelateria',
    address: 'Via Suffragio, 6, Trento',
    lat: 46.0668,
    lng: 11.1208,
    description: 'Artisanal gelato made fresh daily. Try the pistachio and stracciatella.',
    price: 'low',
    indoor_outdoor: 'mixed',
    phone: '+39 0461 916458',
    rating: 4.8,
    reviews: 456
  },
  {
    name: 'Bar Pasi',
    slug: 'aperetivo-bar',
    address: 'Piazza Cesare Battisti, 16, Trento',
    lat: 46.0671,
    lng: 11.1213,
    description: 'Popular aperitivo spot. Great spritz and buffet. Lively atmosphere.',
    price: 'medium',
    indoor_outdoor: 'mixed',
    phone: '+39 0461 237787',
    rating: 4.2,
    reviews: 123
  }
];

async function getPlaceTypeMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('place_types')
    .select('id, slug');
  
  if (error) throw error;
  
  const map = new Map<string, string>();
  data?.forEach(pt => map.set(pt.slug, pt.id));
  return map;
}

async function addTestPlaces() {
  console.log('🧪 Adding test places to database\n');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials not found');
    process.exit(1);
  }
  
  try {
    // Get place type mappings
    const placeTypeMap = await getPlaceTypeMap();
    console.log(`✅ Loaded ${placeTypeMap.size} place types\n`);
    
    let added = 0;
    let skipped = 0;
    
    for (const testPlace of TEST_PLACES) {
      const placeTypeId = placeTypeMap.get(testPlace.slug);
      
      if (!placeTypeId) {
        console.warn(`⚠️  Unknown place type: ${testPlace.slug}`);
        continue;
      }
      
      // Check if exists
      const { data: existing } = await supabase
        .from('places')
        .select('id')
        .eq('name', testPlace.name)
        .limit(1)
        .single();
      
      if (existing) {
        console.log(`⏭️  Skipping "${testPlace.name}" (already exists)`);
        skipped++;
        continue;
      }
      
      // Insert place
      const { error } = await supabase
        .from('places')
        .insert([{
          name: testPlace.name,
          place_type_id: placeTypeId,
          city: 'Trento',
          country: 'Italy',
          address: testPlace.address,
          latitude: testPlace.lat,
          longitude: testPlace.lng,
          phone: testPlace.phone || null,
          website: testPlace.website || null,
          description: testPlace.description,
          price_level: testPlace.price,
          indoor_outdoor: testPlace.indoor_outdoor,
          avg_rating: testPlace.rating,
          review_count: testPlace.reviews,
          verified: true,
          photo_urls: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      
      if (error) {
        console.error(`❌ Error adding "${testPlace.name}":`, error.message);
        continue;
      }
      
      console.log(`✅ Added: ${testPlace.name}`);
      added++;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`✅ Added: ${added}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log('='.repeat(50));
    
    if (added > 0) {
      console.log('\n✨ Test places added successfully!');
      console.log('\n💡 Now try the chatbot:');
      console.log('   "find me a good pizza place"');
      console.log('   "show me museums in Trento"');
      console.log('   "where can I get coffee?"\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTestPlaces();
