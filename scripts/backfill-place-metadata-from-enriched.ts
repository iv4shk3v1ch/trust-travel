import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_CITIES = ['Milan', 'Rome'];
const GENERATED_FILE_PATTERN = /(places-(enriched|seeds|sample)|matrix-verification)\.json$/i;
const PLACE_CATEGORY_KEYWORDS: Array<{ slug: string; keywords: string[] }> = [
  { slug: 'accommodation', keywords: ['accommodation', 'hotel', 'hostel', 'motel', 'inn', 'guesthouse', 'guest house', 'b&b', 'bnb', 'bed and breakfast', 'suite', 'residence', 'residenza', 'apartment', 'apartments', 'aparthotel', 'lodging', 'resort'] },
  { slug: 'restaurant', keywords: ['restaurant', 'ristorante', 'trattoria', 'osteria', 'pizzeria', 'dining', 'eatery', 'steakhouse', 'seafood'] },
  { slug: 'street_food', keywords: ['street food', 'street_food', 'panzerotti', 'sandwich', 'burger', 'takeaway', 'fast food'] },
  { slug: 'cafe', keywords: ['cafe', 'café', 'coffee', 'espresso', 'bakery', 'pastry', 'pasticceria', 'gelato', 'dessert', 'tea room'] },
  { slug: 'bar', keywords: ['bar', 'pub', 'wine bar', 'cocktail', 'brewery', 'enoteca'] },
  { slug: 'nightclub', keywords: ['nightclub', 'club', 'disco'] },
  { slug: 'museum', keywords: ['museum', 'museo', 'science museum', 'history museum', 'art museum'] },
  { slug: 'art_gallery', keywords: ['art gallery', 'gallery', 'galleria'] },
  { slug: 'historical_site', keywords: ['historical site', 'historic site', 'castle', 'fort', 'palace', 'archaeological', 'ruins', 'church', 'chiesa', 'basilica', 'cathedral', 'duomo', 'abbey', 'abbazia', 'chapel', 'oratorio', 'santuario', 'monastery', 'monastero'] },
  { slug: 'landmark', keywords: ['landmark', 'monument', 'piazza', 'square', 'tower', 'bridge', 'fountain', 'street', 'district'] },
  { slug: 'park', keywords: ['park', 'garden', 'botanical garden', 'villa'] },
  { slug: 'viewpoint', keywords: ['viewpoint', 'observation deck', 'panoramic', 'scenic', 'belvedere', 'vista point'] },
  { slug: 'hiking_trail', keywords: ['hiking', 'trail', 'walk', 'trek', 'path'] },
  { slug: 'lake_river_beach', keywords: ['beach', 'lake', 'river', 'waterfront', 'lagoon'] },
  { slug: 'market', keywords: ['market', 'mercato', 'food market', 'farmer market'] },
  { slug: 'shopping_area', keywords: ['shopping', 'mall', 'outlet', 'boutique', 'department store'] },
  { slug: 'entertainment_venue', keywords: ['theater', 'theatre', 'opera', 'cinema', 'concert', 'arena', 'stadium'] },
  { slug: 'spa_wellness', keywords: ['spa', 'wellness', 'thermal', 'terme'] }
];

const ACCOMMODATION_PATTERNS = [
  /\bhotel\b/i, /\bhostel\b/i, /\bmotel\b/i, /\binn\b/i, /\bguest ?house\b/i, /\bb\s*&\s*b\b/i,
  /\bbnb\b/i, /\bbed and breakfast\b/i, /\bsuites?\b/i, /\bresidence\b/i, /\bresidenza\b/i,
  /\baparthotel\b/i, /\baccommodation\b/i, /\blodging\b/i, /\bresort\b/i, /\bholiday home\b/i
] as const;

const STRONG_RELIGIOUS_SITE_PATTERNS = [
  /\bchurch\b/i, /\bchiesa\b/i, /\bbasilica\b/i, /\bcattedrale\b/i, /\bcathedral\b/i, /\babbey\b/i,
  /\babbazia\b/i, /\bchapel\b/i, /\boratorio\b/i, /\bsantuario\b/i, /\bmonastery\b/i, /\bmonastero\b/i
] as const;

const TRANSPORT_PATTERNS = [
  /\btrain station\b/i, /\bbus station\b/i, /\brailway station\b/i, /\bstazione ferroviaria\b/i,
  /\bstazione centrale\b/i, /\bairport\b/i, /\baeroporto\b/i, /\bmetro\b/i, /\bsubway\b/i,
  /\bterminal\b/i, /\brailway\b/i, /\btrenitalia\b/i, /\btrenord\b/i, /^\s*stazione\b/i, /^\s*station\b/i
] as const;

type EnrichedPlace = {
  locationId: string;
  name: string;
  city: string;
  address: string;
  category: string;
  subcategories: string[];
  latitude: number | null;
  longitude: number | null;
  priceLevel: string;
  ranking: string;
  phone: string;
  website: string;
  apiStatus: 'ok' | 'failed';
};

type PlaceRow = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  price_level: string | null;
  place_type_id: string | null;
  place_types: { slug: string | null; name: string | null } | null;
};

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function normalizeWhitespace(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function normalizeName(value: string | null | undefined): string {
  return normalizeWhitespace(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
}

function listEnrichedFiles(rootDir: string, cities: string[]): string[] {
  const allowed = new Set(cities.map(city => city.toLowerCase()));
  const files: string[] = [];

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!/places-enriched\.json$/i.test(entry.name)) continue;
      const cityName = path.basename(path.dirname(fullPath)).toLowerCase();
      if (!allowed.has(cityName)) continue;
      files.push(fullPath);
    }
  };

  if (fs.existsSync(rootDir)) {
    walk(rootDir);
  }

  return files;
}

function loadEnrichedPlaces(rootDir: string, cities: string[]): EnrichedPlace[] {
  const rows: EnrichedPlace[] = [];
  for (const filePath of listEnrichedFiles(rootDir, cities)) {
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8')) as EnrichedPlace[];
    rows.push(...payload.filter(entry => entry.apiStatus === 'ok'));
  }
  return rows;
}

function matchesPattern(value: string, patterns: readonly RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(value));
}

function looksAccommodation(placeName: string, enriched: EnrichedPlace): boolean {
  const nameSignals = [normalizeWhitespace(placeName), normalizeWhitespace(enriched.name)].filter(Boolean).join(' ');
  const categorySignals = [normalizeWhitespace(enriched.category), normalizeWhitespace(enriched.ranking), ...(enriched.subcategories || []).map(normalizeWhitespace)].filter(Boolean).join(' ');
  return matchesPattern(nameSignals, ACCOMMODATION_PATTERNS) || /\bhotel\b/i.test(categorySignals) || /\b(b&bs|inns|specialty lodging)\b/i.test(categorySignals);
}

function looksReligiousSite(placeName: string, enriched: EnrichedPlace): boolean {
  const nameSignals = [normalizeWhitespace(placeName), normalizeWhitespace(enriched.name)].filter(Boolean).join(' ');
  const categorySignals = [normalizeWhitespace(enriched.category), normalizeWhitespace(enriched.ranking), ...(enriched.subcategories || []).map(normalizeWhitespace)].filter(Boolean).join(' ');
  if (matchesPattern(nameSignals, STRONG_RELIGIOUS_SITE_PATTERNS)) return true;
  if (/\bduomo di\b/i.test(nameSignals) || /^\s*duomo\b/i.test(nameSignals)) return true;
  return /\bchurch(es)?\b/i.test(categorySignals) || /\bcathedrals?\b/i.test(categorySignals);
}

function looksTransport(placeName: string, enriched: EnrichedPlace): boolean {
  const haystack = [normalizeWhitespace(placeName), normalizeWhitespace(enriched.name), normalizeWhitespace(enriched.category), normalizeWhitespace(enriched.ranking), ...(enriched.subcategories || []).map(normalizeWhitespace)]
    .filter(Boolean)
    .join(' ');
  return matchesPattern(haystack, TRANSPORT_PATTERNS) || /\btransport\b/i.test(haystack);
}

function mapCategorySlug(placeName: string, enriched: EnrichedPlace): string | null {
  if (looksTransport(placeName, enriched)) return null;
  if (looksAccommodation(placeName, enriched)) return 'accommodation';
  if (looksReligiousSite(placeName, enriched)) return 'historical_site';

  const haystack = [placeName, enriched.category, ...(enriched.subcategories || [])]
    .map(normalizeWhitespace)
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const candidate of PLACE_CATEGORY_KEYWORDS) {
    if (candidate.keywords.some(keyword => haystack.includes(keyword))) return candidate.slug;
  }

  return 'landmark';
}

function mapPriceLevel(value: string | undefined): string | null {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return null;
  const dollarCount = (normalized.match(/\$/g) || []).length;
  if (dollarCount <= 1) return 'low';
  if (dollarCount <= 3) return 'medium';
  return 'high';
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i += 1) matrix[i] = [i];
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

async function loadPlaceTypes(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('place_types').select('id, slug');
  if (error) throw error;
  return new Map((data || []).map((row: any) => [row.slug, row.id]));
}

async function loadPlaces(cities: string[]): Promise<PlaceRow[]> {
  const { data, error } = await supabase
    .from('places')
    .select('id,name,city,address,country,latitude,longitude,phone,website,description,price_level,place_type_id,place_types(slug,name)')
    .in('city', cities);
  if (error) throw error;
  return (data || []) as PlaceRow[];
}

function chooseMatch(enriched: EnrichedPlace, places: PlaceRow[]): { place: PlaceRow; strategy: string } | null {
  const cityPlaces = places.filter(place => place.city === enriched.city);
  const targetName = normalizeName(enriched.name);
  const targetAddress = normalizeName(enriched.address);

  if (targetAddress) {
    const addressMatches = cityPlaces.filter(place => normalizeName(place.address) === targetAddress);
    if (addressMatches.length === 1) return { place: addressMatches[0], strategy: 'address' };
  }

  const nameMatches = cityPlaces.filter(place => normalizeName(place.name) === targetName);
  if (nameMatches.length === 1) return { place: nameMatches[0], strategy: 'exact_name' };

  if (targetAddress && nameMatches.length > 1) {
    const narrowed = nameMatches.filter(place => normalizeName(place.address) === targetAddress);
    if (narrowed.length === 1) return { place: narrowed[0], strategy: 'name+address' };
  }

  const fuzzy = cityPlaces.filter(place => levenshteinDistance(targetName, normalizeName(place.name)) <= 2);
  if (fuzzy.length === 1) return { place: fuzzy[0], strategy: 'fuzzy_name' };

  return null;
}

async function main() {
  const apply = hasFlag('--apply');
  const rootDir = path.resolve(getArgValue('--root') || 'reviews');
  const cities = (getArgValue('--cities') || DEFAULT_CITIES.join(',')).split(',').map(normalizeWhitespace).filter(Boolean);
  const enrichedFiles = listEnrichedFiles(rootDir, cities);

  const [enrichedPlaces, existingPlaces, placeTypes] = await Promise.all([
    Promise.resolve(loadEnrichedPlaces(rootDir, cities)),
    loadPlaces(cities),
    loadPlaceTypes()
  ]);

  const updates: Array<{ id: string; payload: Record<string, unknown>; strategy: string; name: string; city: string }> = [];
  const stats = {
    enriched: enrichedPlaces.length,
    matched: 0,
    unmatched: 0,
    unchanged: 0,
    updatedByAddress: 0,
    updatedByExactName: 0,
    updatedByNameAddress: 0,
    updatedByFuzzyName: 0
  };

  for (const enriched of enrichedPlaces) {
    const match = chooseMatch(enriched, existingPlaces);
    if (!match) {
      stats.unmatched += 1;
      continue;
    }

    stats.matched += 1;
    const payload: Record<string, unknown> = {};
    if (!normalizeWhitespace(match.place.address) && normalizeWhitespace(enriched.address)) payload.address = enriched.address;
    if (!normalizeWhitespace(match.place.country) && enriched.city) payload.country = 'Italy';
    if ((match.place.latitude == null || match.place.longitude == null) && enriched.latitude != null && enriched.longitude != null) {
      payload.latitude = enriched.latitude;
      payload.longitude = enriched.longitude;
    }
    if (!normalizeWhitespace(match.place.phone) && normalizeWhitespace(enriched.phone)) payload.phone = enriched.phone;
    if (!normalizeWhitespace(match.place.website) && normalizeWhitespace(enriched.website)) payload.website = enriched.website;
    if (!normalizeWhitespace(match.place.description) && normalizeWhitespace(enriched.ranking)) payload.description = enriched.ranking;
    if (!match.place.price_level && mapPriceLevel(enriched.priceLevel)) payload.price_level = mapPriceLevel(enriched.priceLevel);

    const categorySlug = mapCategorySlug(enriched.name, enriched);
    if (categorySlug && placeTypes.has(categorySlug)) {
      const currentSlug = normalizeWhitespace(match.place.place_types?.slug);
      if (!currentSlug || currentSlug === 'landmark') {
        payload.place_type_id = placeTypes.get(categorySlug)!;
      }
    }

    if (!Object.keys(payload).length) {
      stats.unchanged += 1;
      continue;
    }

    payload.updated_at = new Date().toISOString();
    updates.push({ id: match.place.id, payload, strategy: match.strategy, name: match.place.name, city: match.place.city });
    if (match.strategy === 'address') stats.updatedByAddress += 1;
    if (match.strategy === 'exact_name') stats.updatedByExactName += 1;
    if (match.strategy === 'name+address') stats.updatedByNameAddress += 1;
    if (match.strategy === 'fuzzy_name') stats.updatedByFuzzyName += 1;
  }

  console.log(`Root dir: ${rootDir}`);
  console.log(`Cities: ${cities.join(', ')}`);
  console.log(`Enriched files found: ${enrichedFiles.length}`);
  console.log(`Enriched entries scanned: ${stats.enriched}`);
  console.log(`Matched to existing places: ${stats.matched}`);
  console.log(`Unmatched enriched entries: ${stats.unmatched}`);
  console.log(`Places already complete / unchanged: ${stats.unchanged}`);
  console.log(`Places queued for update: ${updates.length}`);
  console.log(`- address matches: ${stats.updatedByAddress}`);
  console.log(`- exact name matches: ${stats.updatedByExactName}`);
  console.log(`- name+address matches: ${stats.updatedByNameAddress}`);
  console.log(`- fuzzy name matches: ${stats.updatedByFuzzyName}`);

  for (const row of updates.slice(0, 15)) {
    console.log(`- ${row.city}: ${row.name} [${row.strategy}]`);
  }

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to backfill place metadata.');
    return;
  }

  for (const update of updates) {
    const { error } = await supabase.from('places').update(update.payload).eq('id', update.id);
    if (error) throw error;
  }

  console.log('Place metadata backfill applied.');
}

main().catch(error => {
  console.error('Place metadata backfill failed:', error);
  process.exit(1);
});
