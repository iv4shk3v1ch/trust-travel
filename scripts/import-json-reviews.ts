/**
 * Import TripAdvisor review JSON files into the rating matrix.
 *
 * This script reads collected review JSON files from `reviews/<City>`, reuses or
 * creates synthetic TripAdvisor profiles, imports enriched places, and inserts
 * reviews into the live `profiles` / `places` / `reviews` schema.
 *
 * Usage:
 *   npx tsx scripts/import-json-reviews.ts
 *   npx tsx scripts/import-json-reviews.ts --root reviews --cities Milan,Rome,Florence,Trento
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_CITIES = ['Milan', 'Rome', 'Florence', 'Trento'];
const GENERATED_FILE_PATTERN = /(places-(enriched|seeds|sample)|matrix-verification)\.json$/i;
const PLACE_CATEGORY_KEYWORDS: Array<{ slug: string; keywords: string[] }> = [
  { slug: 'accommodation', keywords: ['accommodation', 'hotel', 'hostel', 'motel', 'inn', 'guesthouse', 'guest house', 'b&b', 'bnb', 'bed and breakfast', 'suite', 'residence', 'residenza', 'apartment', 'apartments', 'aparthotel', 'lodging', 'resort'] },
  { slug: 'restaurant', keywords: ['restaurant', 'ristorante', 'trattoria', 'osteria', 'pizzeria', 'dining', 'eatery', 'steakhouse', 'seafood'] },
  { slug: 'street_food', keywords: ['street food', 'street_food', 'panzerotti', 'sandwich', 'burger', 'takeaway', 'fast food'] },
  { slug: 'cafe', keywords: ['cafe', 'caf\u00e9', 'coffee', 'espresso', 'bakery', 'pastry', 'pasticceria', 'gelato', 'dessert', 'tea room'] },
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
  /\bhotel\b/i,
  /\bhostel\b/i,
  /\bmotel\b/i,
  /\binn\b/i,
  /\bguest ?house\b/i,
  /\bb\s*&\s*b\b/i,
  /\bbnb\b/i,
  /\bbed and breakfast\b/i,
  /\bsuites?\b/i,
  /\bresidence\b/i,
  /\bresidenza\b/i,
  /\baparthotel\b/i,
  /\baccommodation\b/i,
  /\blodging\b/i,
  /\bresort\b/i,
  /\bholiday home\b/i,
  /\bholiday house\b/i
] as const;

const STRONG_RELIGIOUS_SITE_PATTERNS = [
  /\bchurch\b/i,
  /\bchiesa\b/i,
  /\bbasilica\b/i,
  /\bcattedrale\b/i,
  /\bcathedral\b/i,
  /\babbey\b/i,
  /\babbazia\b/i,
  /\bchapel\b/i,
  /\boratorio\b/i,
  /\bsantuario\b/i,
  /\bmonastery\b/i,
  /\bmonastero\b/i
] as const;

const TRANSPORT_PATTERNS = [
  /\btrain station\b/i,
  /\bbus station\b/i,
  /\brailway station\b/i,
  /\bstazione ferroviaria\b/i,
  /\bstazione centrale\b/i,
  /\bairport\b/i,
  /\baeroporto\b/i,
  /\bmetro\b/i,
  /\bsubway\b/i,
  /\bterminal\b/i,
  /\brailway\b/i,
  /\btrenitalia\b/i,
  /\btrenord\b/i,
  /\bfunivia\b/i,
  /\bautostazione\b/i,
  /^\s*stazione\b/i,
  /^\s*station\b/i
] as const;

const VENUE_CONTEXT_PATTERNS = [
  /\brestaurant\b/i,
  /\bristorante\b/i,
  /\btrattoria\b/i,
  /\bosteria\b/i,
  /\bhosteria\b/i,
  /\bpizzeria\b/i,
  /\bcafe\b/i,
  /\bcaff[eè]\b/i,
  /\bbar\b/i,
  /\bpub\b/i,
  /\bgelato\b/i,
  /\bpanino\b/i,
  /\bmarket\b/i,
  /\bshop\b/i,
  /\bboutique\b/i
] as const;

type RawReview = {
  placeName: string;
  placeCategory?: string;
  rating?: number;
  reviewText?: string;
  reviewDate?: string;
  rawDateText?: string;
  reviewUrl?: string;
};

type ReviewFile = {
  user?: {
    username?: string;
    city?: string;
  };
  reviews?: RawReview[];
};

type EnrichedPlace = {
  locationId: string;
  name: string;
  city: string;
  address: string;
  streetAddress: string;
  locality: string;
  country: string;
  category: string;
  subcategories: string[];
  latitude: number | null;
  longitude: number | null;
  priceLevel: string;
  ranking: string;
  phone: string;
  website: string;
  reviewUrl: string;
  reviewPath: string;
  sourceReviewCount: number;
  sourceUsers: string[];
  apiStatus: 'ok' | 'failed';
  apiError?: string;
};

type ReviewRecord = {
  username: string;
  city: string;
  review: RawReview;
  locationId: string | null;
};

type PlaceRow = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  place_type_id: string | null;
};

type ExistingReviewRow = {
  id: string;
  user_id: string;
  place_id: string;
  visit_date: string | null;
  overall_rating: number | null;
  comment: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function normalizeWhitespace(value: string | undefined | null): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function normalizeName(value: string | undefined | null): string {
  return normalizeWhitespace(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchesPattern(value: string, patterns: readonly RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(value));
}

function looksAccommodation(placeName: string, enriched?: EnrichedPlace): boolean {
  const nameSignals = [normalizeWhitespace(placeName), normalizeWhitespace(enriched?.name)]
    .filter(Boolean)
    .join(' ');
  const categorySignals = [
    normalizeWhitespace(enriched?.category),
    normalizeWhitespace(enriched?.ranking),
    ...(enriched?.subcategories || []).map(entry => normalizeWhitespace(entry))
  ]
    .filter(Boolean)
    .join(' ');

  return matchesPattern(nameSignals, ACCOMMODATION_PATTERNS)
    || /\bhotel\b/i.test(categorySignals)
    || /\b(b&bs|inns|specialty lodging)\b/i.test(categorySignals);
}

function looksReligiousSite(placeName: string, reviewCategory: string | undefined, enriched?: EnrichedPlace): boolean {
  const nameSignals = [normalizeWhitespace(placeName), normalizeWhitespace(enriched?.name)]
    .filter(Boolean)
    .join(' ');
  const categorySignals = [
    normalizeWhitespace(reviewCategory),
    normalizeWhitespace(enriched?.category),
    normalizeWhitespace(enriched?.ranking),
    ...(enriched?.subcategories || []).map(entry => normalizeWhitespace(entry))
  ]
    .filter(Boolean)
    .join(' ');

  if (matchesPattern(nameSignals, STRONG_RELIGIOUS_SITE_PATTERNS)) {
    return true;
  }

  if (/\bduomo di\b/i.test(nameSignals) || /^\s*duomo\b/i.test(nameSignals)) {
    return true;
  }

  return /\bchurch(es)?\b/i.test(categorySignals) || /\bcathedrals?\b/i.test(categorySignals);
}

function looksTransport(placeName: string, enriched?: EnrichedPlace): boolean {
  const nameSignals = [normalizeWhitespace(placeName), normalizeWhitespace(enriched?.name)]
    .filter(Boolean)
    .join(' ');
  const categorySignals = [
    normalizeWhitespace(enriched?.category),
    normalizeWhitespace(enriched?.ranking),
    ...(enriched?.subcategories || []).map(entry => normalizeWhitespace(entry))
  ]
    .filter(Boolean)
    .join(' ');

  if (/\btransport\b/i.test(categorySignals)) {
    return true;
  }

  if (matchesPattern(nameSignals, VENUE_CONTEXT_PATTERNS)) {
    return false;
  }

  return matchesPattern(nameSignals, TRANSPORT_PATTERNS);
}

function parseLocationId(reviewUrl: string | undefined): string | null {
  const match = normalizeWhitespace(reviewUrl).match(/-d(\d+)-r\d+/i);
  return match ? match[1] : null;
}

function makeUserPlaceKey(userId: string, placeId: string): string {
  return `${userId}|${placeId}`;
}

function parseSortableDate(value: string | null | undefined): number {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return 0;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function chooseLongerText(primary: string | null | undefined, secondary: string | null | undefined): string | null {
  const a = normalizeWhitespace(primary);
  const b = normalizeWhitespace(secondary);
  if (!a && !b) return null;
  return a.length >= b.length ? a || null : b || null;
}

function isIncomingReviewNewer(review: RawReview, existing: ExistingReviewRow): boolean {
  const incomingDate = parseSortableDate(review.reviewDate);
  const existingDate = parseSortableDate(existing.visit_date);

  if (incomingDate !== existingDate) {
    return incomingDate > existingDate;
  }

  const incomingText = normalizeWhitespace(review.reviewText);
  const existingText = normalizeWhitespace(existing.comment);
  if (incomingText.length !== existingText.length) {
    return incomingText.length > existingText.length;
  }

  return (review.rating ?? 0) >= (existing.overall_rating ?? 0);
}

function slugifyUsername(username: string): string {
  const base = normalizeWhitespace(username).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  const hash = Buffer.from(username).toString('hex').slice(0, 12);
  return (base || 'user').slice(0, 32) + '-' + hash;
}

function mapPriceLevel(value: string | undefined): string | null {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return null;

  const dollarCount = (normalized.match(/\$/g) || []).length;
  if (dollarCount <= 1) return 'low';
  if (dollarCount <= 3) return 'medium';
  return 'high';
}

function detectUnsupportedPlaceKind(placeName: string, enriched?: EnrichedPlace): 'transport' | null {
  if (looksTransport(placeName, enriched)) return 'transport';

  return null;
}

function mapCategorySlug(placeName: string, reviewCategory: string | undefined, enriched?: EnrichedPlace): string | null {
  if (detectUnsupportedPlaceKind(placeName, enriched)) {
    return null;
  }

  if (looksAccommodation(placeName, enriched)) {
    return 'accommodation';
  }

  if (looksReligiousSite(placeName, reviewCategory, enriched)) {
    return 'historical_site';
  }

  const haystack = [
    placeName,
    reviewCategory,
    enriched?.category,
    ...(enriched?.subcategories || [])
  ]
    .map(entry => normalizeWhitespace(entry))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const candidate of PLACE_CATEGORY_KEYWORDS) {
    if (candidate.keywords.some(keyword => haystack.includes(keyword))) {
      return candidate.slug;
    }
  }

  return 'landmark';
}

function inferIndoorOutdoor(categorySlug: string): string {
  if (['park', 'viewpoint', 'hiking_trail', 'lake_river_beach'].includes(categorySlug)) {
    return 'outdoor';
  }
  if (['museum', 'art_gallery', 'shopping_area', 'spa_wellness', 'restaurant', 'cafe', 'bar', 'nightclub', 'entertainment_venue', 'accommodation'].includes(categorySlug)) {
    return 'indoor';
  }
  return 'mixed';
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

function listReviewFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter(name => name.toLowerCase().endsWith('.json'))
    .filter(name => !GENERATED_FILE_PATTERN.test(name))
    .map(name => path.join(dir, name));
}

function loadReviewFiles(rootDir: string, cities: string[]): ReviewRecord[] {
  const records: ReviewRecord[] = [];

  for (const city of cities) {
    const cityDir = path.join(rootDir, city);
    if (!fs.existsSync(cityDir)) {
      throw new Error(`Review folder not found: ${cityDir}`);
    }

    for (const filePath of listReviewFiles(cityDir)) {
      const payload = JSON.parse(fs.readFileSync(filePath, 'utf8')) as ReviewFile;
      const username = normalizeWhitespace(payload.user?.username) || path.basename(filePath, '.json');
      const payloadCity = normalizeWhitespace(payload.user?.city) || city;

      for (const review of payload.reviews || []) {
        if (!normalizeWhitespace(review.placeName) || typeof review.rating !== 'number' || !normalizeWhitespace(review.reviewDate)) {
          continue;
        }

        records.push({
          username,
          city: payloadCity,
          review,
          locationId: parseLocationId(review.reviewUrl)
        });
      }
    }
  }

  return records;
}

function loadEnrichedPlaces(rootDir: string, cities: string[]): Map<string, EnrichedPlace> {
  const byLocationId = new Map<string, EnrichedPlace>();

  for (const city of cities) {
    const cityDir = path.join(rootDir, city);
    const enrichedFiles = fs
      .readdirSync(cityDir)
      .filter(name => /places-enriched\.json$/i.test(name))
      .map(name => path.join(cityDir, name));

    for (const filePath of enrichedFiles) {
      const places = JSON.parse(fs.readFileSync(filePath, 'utf8')) as EnrichedPlace[];
      for (const place of places) {
        if (place.locationId) {
          byLocationId.set(place.locationId, place);
        }
      }
    }
  }

  return byLocationId;
}

async function loadPlaceTypeMap(client: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await client.from('place_types').select('id, slug');
  if (error) throw error;

  return new Map((data || []).map((row: any) => [row.slug, row.id]));
}

async function ensurePlaceType(client: SupabaseClient, slug: string, name: string): Promise<void> {
  const { data, error } = await client
    .from('place_types')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (data?.id) return;

  const { error: insertError } = await client.from('place_types').insert({ slug, name });
  if (insertError) throw insertError;
}

async function loadExistingPlaces(client: SupabaseClient, cities: string[]): Promise<PlaceRow[]> {
  const { data, error } = await client
    .from('places')
    .select('id, name, city, address, place_type_id')
    .in('city', cities);

  if (error) throw error;
  return (data || []) as PlaceRow[];
}

class PlaceMatcher {
  private exact = new Map<string, PlaceRow>();
  private exactAddress = new Map<string, PlaceRow>();
  private byCity = new Map<string, PlaceRow[]>();

  constructor(private places: PlaceRow[]) {
    for (const place of places) {
      this.add(place);
    }
  }

  private add(place: PlaceRow) {
    const exactKey = `${place.city}|${normalizeName(place.name)}`;
    if (!this.exact.has(exactKey)) {
      this.exact.set(exactKey, place);
    }

    const normalizedAddress = normalizeName(place.address);
    if (normalizedAddress) {
      const addressKey = `${place.city}|${normalizedAddress}`;
      if (!this.exactAddress.has(addressKey)) {
        this.exactAddress.set(addressKey, place);
      }
    }

    const bucket = this.byCity.get(place.city) || [];
    bucket.push(place);
    this.byCity.set(place.city, bucket);
  }

  find(name: string, city: string, address?: string | null): PlaceRow | null {
    const exactKey = `${city}|${normalizeName(name)}`;
    const exact = this.exact.get(exactKey);
    if (exact) return exact;

    const normalizedAddress = normalizeName(address);
    if (normalizedAddress) {
      const exactByAddress = this.exactAddress.get(`${city}|${normalizedAddress}`);
      if (exactByAddress) return exactByAddress;
    }

    const target = normalizeName(name);
    const candidates = this.byCity.get(city) || [];
    for (const candidate of candidates) {
      const distance = levenshteinDistance(target, normalizeName(candidate.name));
      if (distance <= 2) {
        return candidate;
      }
    }

    return null;
  }

  addInserted(place: PlaceRow) {
    this.add(place);
  }
}

async function findExistingProfileId(client: SupabaseClient, username: string): Promise<string | null> {
  const fullName = `TripAdvisor ${username}`;
  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('full_name', fullName)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

async function findAuthUserByEmail(client: SupabaseClient, email: string): Promise<string | null> {
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const match = data.users.find(user => (user.email || '').toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) return null;

    page += 1;
  }
}

async function getOrCreateSyntheticProfile(client: SupabaseClient, username: string): Promise<string> {
  const existingProfileId = await findExistingProfileId(client, username);
  if (existingProfileId) return existingProfileId;

  const emailLocal = slugifyUsername(username);
  const email = `${emailLocal}@synthetic.trusttravel.com`;
  let authUserId = await findAuthUserByEmail(client, email);

  if (!authUserId) {
    const { data, error } = await client.auth.admin.createUser({
      email,
      password: `TripA-${Math.random().toString(36).slice(-12)}!`,
      email_confirm: true,
      user_metadata: { full_name: `TripAdvisor ${username}` }
    });

    if (error || !data.user) {
      throw error || new Error(`Failed to create auth user for ${username}`);
    }

    authUserId = data.user.id;
  }

  const profilePayload = {
    id: authUserId,
    full_name: `TripAdvisor ${username}`,
    age: null,
    gender: null,
    budget: 'medium',
    env_preference: 'balanced',
    activity_style: 'balanced',
    food_restrictions: ''
  };

  const { error: profileError } = await client.from('profiles').upsert(profilePayload, { onConflict: 'id' });
  if (profileError) throw profileError;

  return authUserId;
}

async function loadExistingReviewsByPair(client: SupabaseClient, userIds: string[]): Promise<Map<string, ExistingReviewRow>> {
  const reviewsByPair = new Map<string, ExistingReviewRow>();

  if (!userIds.length) {
    return reviewsByPair;
  }

  const chunkSize = 100;
  for (let index = 0; index < userIds.length; index += chunkSize) {
    const chunk = userIds.slice(index, index + chunkSize);
    const { data, error } = await client
      .from('reviews')
      .select('id, user_id, place_id, visit_date, overall_rating, comment, created_at, updated_at')
      .in('user_id', chunk);

    if (error) throw error;

    for (const row of (data || []) as ExistingReviewRow[]) {
      const key = makeUserPlaceKey(row.user_id, row.place_id);
      const current = reviewsByPair.get(key);
      if (!current) {
        reviewsByPair.set(key, row);
        continue;
      }

      if (parseSortableDate(row.visit_date) > parseSortableDate(current.visit_date)) {
        reviewsByPair.set(key, row);
      }
    }
  }

  return reviewsByPair;
}

async function importPlace(
  client: SupabaseClient,
  placeTypeId: string,
  categorySlug: string,
  city: string,
  review: RawReview,
  enriched?: EnrichedPlace
): Promise<PlaceRow> {
  const address = normalizeWhitespace(enriched?.address || review.placeName);
  const { data, error } = await client
    .from('places')
    .insert({
      name: enriched?.name || review.placeName,
      city,
      country: enriched?.country || 'Italy',
      address: enriched?.address || null,
      latitude: enriched?.latitude ?? null,
      longitude: enriched?.longitude ?? null,
      phone: enriched?.phone || null,
      website: enriched?.website || null,
      description: enriched?.ranking || null,
      price_level: mapPriceLevel(enriched?.priceLevel),
      indoor_outdoor: inferIndoorOutdoor(categorySlug),
      verified: false,
      place_type_id: placeTypeId,
      service_type: null,
      updated_at: new Date().toISOString()
    })
    .select('id, name, city, address, place_type_id')
    .single();

  if (error) {
    throw new Error(`Failed to insert place ${address}: ${error.message}`);
  }

  return data as PlaceRow;
}

async function insertReview(
  client: SupabaseClient,
  userId: string,
  placeId: string,
  review: RawReview
): Promise<ExistingReviewRow> {
  const payload = {
    user_id: userId,
    place_id: placeId,
    overall_rating: review.rating,
    comment: normalizeWhitespace(review.reviewText) || null,
    visit_date: review.reviewDate,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from('reviews')
    .insert(payload)
    .select('id, user_id, place_id, visit_date, overall_rating, comment, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as ExistingReviewRow;
}

async function updateReview(
  client: SupabaseClient,
  existing: ExistingReviewRow,
  review: RawReview
): Promise<ExistingReviewRow> {
  const payload = {
    overall_rating: review.rating,
    visit_date: review.reviewDate,
    comment: chooseLongerText(review.reviewText, existing.comment),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from('reviews')
    .update(payload)
    .eq('id', existing.id)
    .select('id, user_id, place_id, visit_date, overall_rating, comment, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as ExistingReviewRow;
}

async function main() {
  const rootDir = path.resolve(getArgValue('--root') || 'reviews');
  const cities = (getArgValue('--cities') || DEFAULT_CITIES.join(','))
    .split(',')
    .map(city => normalizeWhitespace(city))
    .filter(Boolean);

  if (!fs.existsSync(rootDir)) {
    throw new Error(`Review root not found: ${rootDir}`);
  }

  await ensurePlaceType(supabase, 'accommodation', 'Accommodation');

  const reviewRecords = loadReviewFiles(rootDir, cities);
  if (!reviewRecords.length) {
    throw new Error(`No review records found in ${rootDir}`);
  }

  const enrichedPlaces = loadEnrichedPlaces(rootDir, cities);
  const placeTypeMap = await loadPlaceTypeMap(supabase);
  const existingPlaces = await loadExistingPlaces(supabase, cities);
  const placeMatcher = new PlaceMatcher(existingPlaces);

  const usernames = Array.from(new Set(reviewRecords.map(record => record.username))).sort();
  const userIdByUsername = new Map<string, string>();

  console.log(`Found ${reviewRecords.length} reviews across ${cities.length} cities`);
  console.log(`Found ${usernames.length} TripAdvisor users`);
  console.log(`Loaded ${enrichedPlaces.size} enriched places`);

  for (const username of usernames) {
    const userId = await getOrCreateSyntheticProfile(supabase, username);
    userIdByUsername.set(username, userId);
  }

  const existingReviewsByPair = await loadExistingReviewsByPair(supabase, Array.from(userIdByUsername.values()));

  const stats = {
    users: usernames.length,
    placesCreated: 0,
    placesReused: 0,
    reviewsImported: 0,
    reviewsUpdated: 0,
    reviewsSkipped: 0,
    reviewsSkippedUnsupported: 0,
    missingEnrichment: 0,
    byCity: new Map<string, { reviewsImported: number; placesCreated: number }>()
  };

  const seenWithinRun = new Set<string>();

  for (const record of reviewRecords) {
    const userId = userIdByUsername.get(record.username)!;
    const enrichedEntry = record.locationId ? enrichedPlaces.get(record.locationId) : undefined;
    const enriched = enrichedEntry?.apiStatus === 'ok' ? enrichedEntry : undefined;
    if (!enriched) {
      stats.missingEnrichment += 1;
    }

    const canonicalName = enriched?.name || record.review.placeName;
    let place = placeMatcher.find(canonicalName, record.city, enriched?.address);

    if (place) {
      stats.placesReused += 1;
    } else {
      const categorySlug = mapCategorySlug(record.review.placeName, record.review.placeCategory, enriched);
      if (!categorySlug) {
        stats.reviewsSkippedUnsupported += 1;
        continue;
      }

      const placeTypeId = placeTypeMap.get(categorySlug);
      if (!placeTypeId) {
        throw new Error(`Missing place type slug in database: ${categorySlug}`);
      }

      place = await importPlace(supabase, placeTypeId, categorySlug, record.city, record.review, enriched);
      placeMatcher.addInserted(place);
      stats.placesCreated += 1;

      const cityStats = stats.byCity.get(record.city) || { reviewsImported: 0, placesCreated: 0 };
      cityStats.placesCreated += 1;
      stats.byCity.set(record.city, cityStats);
    }

    const reviewKey = makeUserPlaceKey(userId, place.id);
    const existingReview = existingReviewsByPair.get(reviewKey);
    const alreadyHandled = seenWithinRun.has(reviewKey);

    if (existingReview) {
      if (!alreadyHandled && isIncomingReviewNewer(record.review, existingReview)) {
        const updatedReview = await updateReview(supabase, existingReview, record.review);
        existingReviewsByPair.set(reviewKey, updatedReview);
        stats.reviewsUpdated += 1;
      } else {
        stats.reviewsSkipped += 1;
      }
      seenWithinRun.add(reviewKey);
      continue;
    }

    const insertedReview = await insertReview(supabase, userId, place.id, record.review);
    existingReviewsByPair.set(reviewKey, insertedReview);
    seenWithinRun.add(reviewKey);
    stats.reviewsImported += 1;

    const cityStats = stats.byCity.get(record.city) || { reviewsImported: 0, placesCreated: 0 };
    cityStats.reviewsImported += 1;
    stats.byCity.set(record.city, cityStats);
  }

  console.log('\nTripAdvisor import complete');
  console.log(`Users processed: ${stats.users}`);
  console.log(`Places created: ${stats.placesCreated}`);
  console.log(`Places reused: ${stats.placesReused}`);
  console.log(`Reviews imported: ${stats.reviewsImported}`);
  console.log(`Reviews updated in place: ${stats.reviewsUpdated}`);
  console.log(`Reviews skipped as duplicates: ${stats.reviewsSkipped}`);
  console.log(`Reviews skipped as unsupported places: ${stats.reviewsSkippedUnsupported}`);
  console.log(`Reviews without enriched place details: ${stats.missingEnrichment}`);

  for (const city of cities) {
    const cityStats = stats.byCity.get(city) || { reviewsImported: 0, placesCreated: 0 };
    console.log(`- ${city}: ${cityStats.reviewsImported} reviews imported, ${cityStats.placesCreated} new places`);
  }
}

main().catch(error => {
  console.error('TripAdvisor import failed:', error);
  process.exit(1);
});
