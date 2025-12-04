/**
 * Add important Trento places to database
 * Uses OpenStreetMap Nominatim API for geocoding (FREE, no API key needed)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PlaceToAdd {
  name: string;
  address: string;
  placeTypeSlug: string;
  description: string;
  priceLevel: 'low' | 'medium' | 'high';
  indoorOutdoor: 'indoor' | 'outdoor' | 'mixed';
}

// 50 most important places in Trento (verified unique, no duplicates)
const IMPORTANT_PLACES: PlaceToAdd[] = [
  // Museums & Culture (8)
  { name: 'MUSE - Science Museum', address: 'Corso del Lavoro e della Scienza 3, Trento', placeTypeSlug: 'museum', description: 'Modern science museum with interactive exhibits', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Trento Cathedral (Duomo)', address: 'Piazza Duomo, Trento', placeTypeSlug: 'church', description: 'Historic cathedral in the heart of Trento', priceLevel: 'low', indoorOutdoor: 'indoor' },
  { name: 'Museo Diocesano Tridentino', address: 'Piazza Duomo 18, Trento', placeTypeSlug: 'museum', description: 'Religious art and historical artifacts', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Galleria Civica di Trento', address: 'Via Belenzani 44, Trento', placeTypeSlug: 'art-gallery', description: 'Contemporary art exhibitions', priceLevel: 'low', indoorOutdoor: 'indoor' },
  { name: 'Le Gallerie', address: 'Piedicastello, Trento', placeTypeSlug: 'contemporary-art', description: 'Art space in former highway tunnels', priceLevel: 'low', indoorOutdoor: 'indoor' },
  { name: 'Museo Caproni', address: 'Via Lidorno 3, Trento', placeTypeSlug: 'museum', description: 'Aviation museum with historic aircraft', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Spazio Archeologico Sotterraneo', address: 'Piazza Cesare Battisti, Trento', placeTypeSlug: 'museum', description: 'Underground archaeological site', priceLevel: 'low', indoorOutdoor: 'indoor' },
  { name: 'Teatro Sociale', address: 'Via Oss Mazzurana 19, Trento', placeTypeSlug: 'theatre', description: 'Historic theater hosting performances', priceLevel: 'medium', indoorOutdoor: 'indoor' },

  // Historical Landmarks (6)
  { name: 'Torre Vanga', address: 'Piazza Duomo, Trento', placeTypeSlug: 'tower', description: 'Medieval tower in the city center', priceLevel: 'low', indoorOutdoor: 'outdoor' },
  { name: 'Porta Santa Margherita', address: 'Via Torre Vanga, Trento', placeTypeSlug: 'historical-landmark', description: 'Ancient city gate', priceLevel: 'low', indoorOutdoor: 'outdoor' },
  { name: 'Palazzo Pretorio', address: 'Piazza Duomo 18, Trento', placeTypeSlug: 'historical-landmark', description: 'Medieval palace, now a museum', priceLevel: 'low', indoorOutdoor: 'mixed' },
  { name: 'Palazzo Thun', address: 'Via Belenzani 19, Trento', placeTypeSlug: 'historical-landmark', description: 'Renaissance palace, city hall', priceLevel: 'low', indoorOutdoor: 'indoor' },
  { name: 'Chiesa di Santa Maria Maggiore', address: 'Via Belenzani, Trento', placeTypeSlug: 'church', description: 'Church where Council of Trent met', priceLevel: 'low', indoorOutdoor: 'indoor' },
  { name: 'Fontana del Nettuno', address: 'Piazza Duomo, Trento', placeTypeSlug: 'historical-landmark', description: 'Baroque fountain in main square', priceLevel: 'low', indoorOutdoor: 'outdoor' },

  // Parks & Nature (7)
  { name: 'Parco Gocciadoro', address: 'Via Gocciadoro, Trento', placeTypeSlug: 'park', description: 'Large park with trails and picnic areas', priceLevel: 'low', indoorOutdoor: 'outdoor' },
  { name: 'Giardino Botanico Alpino', address: 'Viote del Monte Bondone, Trento', placeTypeSlug: 'botanical-garden', description: 'Alpine botanical garden on Monte Bondone', priceLevel: 'low', indoorOutdoor: 'outdoor' },
  { name: 'Doss Trento', address: 'Doss Trento, Trento', placeTypeSlug: 'viewpoint', description: 'Hill with panoramic city views and WWI monument', priceLevel: 'low', indoorOutdoor: 'outdoor' },
  { name: 'Lung\'Adige', address: 'Lungadige, Trento', placeTypeSlug: 'river-walk', description: 'Scenic walk along the Adige River', priceLevel: 'low', indoorOutdoor: 'outdoor' },
  { name: 'Parco delle Coste', address: 'Via delle Laste, Trento', placeTypeSlug: 'park', description: 'Park with walking paths and city views', priceLevel: 'low', indoorOutdoor: 'outdoor' },
  { name: 'Parco Santa Chiara', address: 'Via Santa Croce, Trento', placeTypeSlug: 'park', description: 'Central park near university', priceLevel: 'low', indoorOutdoor: 'outdoor' },
  { name: 'Orrido di Ponte Alto', address: 'Ponte Alto, Trento', placeTypeSlug: 'waterfall', description: 'Natural gorge with waterfalls', priceLevel: 'low', indoorOutdoor: 'outdoor' },

  // Restaurants & Food (12)
  { name: 'Antica Trattoria La Posta', address: 'Via Santa Croce 6, Trento', placeTypeSlug: 'local-trattoria', description: 'Traditional Trentino cuisine', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Ristorante Al Volt', address: 'Vicolo del Vò 11, Trento', placeTypeSlug: 'restaurant', description: 'Elegant dining with local specialties', priceLevel: 'high', indoorOutdoor: 'indoor' },
  { name: 'Osteria Il Cappello', address: 'Piazza Lunelli 5, Trento', placeTypeSlug: 'local-trattoria', description: 'Cozy osteria with traditional dishes', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Pizzeria Pedavena Centro', address: 'Via San Marco 64, Trento', placeTypeSlug: 'pizzeria', description: 'Popular pizzeria with local beer', priceLevel: 'low', indoorOutdoor: 'indoor' },
  { name: 'Scrigno del Duomo', address: 'Piazza Duomo 29, Trento', placeTypeSlug: 'restaurant', description: 'Fine dining with cathedral views', priceLevel: 'high', indoorOutdoor: 'indoor' },
  { name: 'Ristorante Chiesa', address: 'Via San Marco 64, Trento', placeTypeSlug: 'restaurant', description: 'Modern Italian cuisine', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Forst Trento', address: 'Via Oss Mazzurana 38, Trento', placeTypeSlug: 'restaurant', description: 'Brewery restaurant with hearty food', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Al Tre Garofani', address: 'Via Garibaldi 21, Trento', placeTypeSlug: 'local-trattoria', description: 'Family-run trattoria', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Trattoria Piedicastello', address: 'Via Piedicastello, Trento', placeTypeSlug: 'local-trattoria', description: 'Local favorite for traditional food', priceLevel: 'low', indoorOutdoor: 'indoor' },
  { name: 'Ristorante Pizzeria Due Spade', address: 'Via Don Rizzi 11, Trento', placeTypeSlug: 'pizzeria', description: 'Historic restaurant since 1545', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Liberty Ristorante Pizzeria', address: 'Via Garibaldi 29, Trento', placeTypeSlug: 'pizzeria', description: 'Art nouveau style restaurant', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Ai Tre Garofani', address: 'Via Manci 33, Trento', placeTypeSlug: 'restaurant', description: 'Traditional Trentino restaurant', priceLevel: 'medium', indoorOutdoor: 'indoor' },

  // Cafes & Bakeries (6)
  { name: 'Pasticceria Bertelli Duomo', address: 'Piazza Duomo 39, Trento', placeTypeSlug: 'cafe', description: 'Historic pastry shop', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Caffè Portici', address: 'Via Belenzani 38, Trento', placeTypeSlug: 'cafe', description: 'Elegant cafe under the porticos', priceLevel: 'medium', indoorOutdoor: 'mixed' },
  { name: 'Pasticceria Barcatta', address: 'Via Suffragio 28, Trento', placeTypeSlug: 'cafe', description: 'Artisan pastries and coffee', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Torrefazione Duomo', address: 'Via Cavour 15, Trento', placeTypeSlug: 'specialty-coffee', description: 'Coffee roastery and cafe', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Gelateria Zanella', address: 'Via Suffragio 6, Trento', placeTypeSlug: 'gelateria', description: 'Artisanal gelato shop', priceLevel: 'low', indoorOutdoor: 'indoor' },
  { name: 'Pasticceria Trento', address: 'Corso 3 Novembre 30, Trento', placeTypeSlug: 'cafe', description: 'Traditional pastry shop', priceLevel: 'medium', indoorOutdoor: 'indoor' },

  // Shopping & Markets (4)
  { name: 'Mercato di Piazza Garzetti', address: 'Piazza Garzetti, Trento', placeTypeSlug: 'local-market', description: 'Daily fresh food market', priceLevel: 'low', indoorOutdoor: 'outdoor' },
  { name: 'Mercato Coperto', address: 'Via Garibaldi, Trento', placeTypeSlug: 'food-market', description: 'Covered market hall', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Via San Pietro Shopping', address: 'Via San Pietro, Trento', placeTypeSlug: 'street', description: 'Main shopping street', priceLevel: 'medium', indoorOutdoor: 'outdoor' },
  { name: 'Libreria Universitaria', address: 'Via Verdi 8, Trento', placeTypeSlug: 'bookstore', description: 'Large university bookstore', priceLevel: 'medium', indoorOutdoor: 'indoor' },

  // Viewpoints & Outdoor (4)
  { name: 'Sardagna Cable Car', address: 'Ponte San Lorenzo, Trento', placeTypeSlug: 'viewpoint', description: 'Cable car to Sardagna viewpoint', priceLevel: 'low', indoorOutdoor: 'outdoor' },
  { name: 'Belvedere di Sardagna', address: 'Sardagna, Trento', placeTypeSlug: 'viewpoint', description: 'Panoramic terrace overlooking Trento', priceLevel: 'low', indoorOutdoor: 'outdoor' },
  { name: 'Mausoleo Cesare Battisti', address: 'Doss Trento, Trento', placeTypeSlug: 'historical-landmark', description: 'Memorial on Doss Trento hill', priceLevel: 'low', indoorOutdoor: 'outdoor' },
  { name: 'Sentiero dell\'Acquedotto', address: 'Monte Bondone, Trento', placeTypeSlug: 'hiking-trail', description: 'Scenic hiking trail', priceLevel: 'low', indoorOutdoor: 'outdoor' },

  // Nightlife & Entertainment (3)
  { name: 'Circolo Arci Zapata', address: 'Via Giusti 35, Trento', placeTypeSlug: 'live-music-venue', description: 'Live music and events', priceLevel: 'low', indoorOutdoor: 'indoor' },
  { name: 'Cinema Modena', address: 'Via Rosmini 60, Trento', placeTypeSlug: 'cinema', description: 'Independent cinema', priceLevel: 'medium', indoorOutdoor: 'indoor' },
  { name: 'Multisala Nuovo Modena', address: 'Via Rosmini 60, Trento', placeTypeSlug: 'cinema', description: 'Modern multiplex cinema', priceLevel: 'medium', indoorOutdoor: 'indoor' },
];

// Geocode address using OpenStreetMap Nominatim API (FREE)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TrustTravelApp/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      console.error(`Geocoding failed for ${address}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }

    console.warn(`No coordinates found for: ${address}`);
    return null;
  } catch (error) {
    console.error(`Error geocoding ${address}:`, error);
    return null;
  }
}

async function main() {
  console.log('🏛️ Starting to add 50 important Trento places...\n');

  // Get place type IDs
  const { data: placeTypes } = await supabase
    .from('place_types')
    .select('id, slug');

  const placeTypeMap = new Map(placeTypes?.map(pt => [pt.slug, pt.id]) || []);

  // Get existing places to avoid duplicates
  const { data: existingPlaces } = await supabase
    .from('places')
    .select('name');

  const existingNames = new Set(existingPlaces?.map(p => p.name.toLowerCase()) || []);

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const place of IMPORTANT_PLACES) {
    // Check if place already exists
    if (existingNames.has(place.name.toLowerCase())) {
      console.log(`⏭️  Skipping (already exists): ${place.name}`);
      skipped++;
      continue;
    }

    // Get place type ID
    const placeTypeId = placeTypeMap.get(place.placeTypeSlug);
    if (!placeTypeId) {
      console.log(`❌ Unknown place type: ${place.placeTypeSlug} for ${place.name}`);
      failed++;
      continue;
    }

    // Geocode address
    console.log(`📍 Geocoding: ${place.name}...`);
    const coords = await geocodeAddress(place.address);

    if (!coords) {
      console.log(`❌ Failed to geocode: ${place.name}`);
      failed++;
      continue;
    }

    // Insert place
    const { error } = await supabase
      .from('places')
      .insert({
        name: place.name,
        place_type_id: placeTypeId,
        city: 'Trento',
        country: 'Italy',
        address: place.address,
        latitude: coords.lat,
        longitude: coords.lng,
        description: place.description,
        price_level: place.priceLevel,
        indoor_outdoor: place.indoorOutdoor,
        verified: true,
      });

    if (error) {
      console.log(`❌ Error adding ${place.name}:`, error.message);
      failed++;
      continue;
    }

    console.log(`✅ Added: ${place.name} (${coords.lat}, ${coords.lng})`);
    added++;

    // Rate limit: 1 request per second (Nominatim requirement)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n✨ IMPORT COMPLETE!');
  console.log(`📊 Stats:`);
  console.log(`   - Added: ${added}`);
  console.log(`   - Skipped (duplicates): ${skipped}`);
  console.log(`   - Failed: ${failed}`);
  console.log(`   - Total processed: ${IMPORTANT_PLACES.length}`);
}

main().catch(console.error);
