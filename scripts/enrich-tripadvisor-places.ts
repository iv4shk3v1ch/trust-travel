/**
 * Enrich TripAdvisor places from collected user review JSON files.
 *
 * Input: review JSON files produced by the browser extension.
 * Output: one normalized JSON file with unique TripAdvisor places and metadata.
 *
 * Usage:
 *   npx tsx scripts/enrich-tripadvisor-places.ts
 *   npx tsx scripts/enrich-tripadvisor-places.ts --input reviews/Milan --output reviews/Milan/milan-places-enriched.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TRIPADVISOR_API_KEY = process.env.TRIPADVISOR_API_KEY;
const TRIPADVISOR_API_BASE = 'https://api.content.tripadvisor.com/api/v1';
const TRIPADVISOR_WEB_BASE = 'https://www.tripadvisor.com';
const GENERATED_FILE_PATTERN = /(places-(enriched|seeds|sample)|matrix-verification)\.json$/i;

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

type PlaceSeed = {
  locationId: string;
  placeName: string;
  city: string;
  reviewUrl: string;
  reviewPath: string;
  usernames: string[];
  reviewCount: number;
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

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeWhitespace(value: string | undefined | null): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function isDailyLimitError(message: string): boolean {
  const normalized = normalizeWhitespace(message).toLowerCase();
  return (
    normalized.includes('maximum number of daily requests exceeded') ||
    normalized.includes('daily requests exceeded') ||
    normalized.includes('limit exceeded') ||
    normalized.includes('http 429') ||
    /"code"\s*:\s*"151"/i.test(message)
  );
}

function toAbsoluteReviewUrl(reviewUrl: string): string {
  if (!reviewUrl) return '';
  if (reviewUrl.startsWith('http://') || reviewUrl.startsWith('https://')) {
    return reviewUrl;
  }
  return `${TRIPADVISOR_WEB_BASE}${reviewUrl}`;
}

function parseLocationId(reviewUrl: string): string | null {
  const match = reviewUrl.match(/-d(\d+)-r\d+/i);
  return match ? match[1] : null;
}

function listJsonFiles(inputDir: string): string[] {
  return fs
    .readdirSync(inputDir)
    .filter(name => name.toLowerCase().endsWith('.json'))
    .filter(name => !GENERATED_FILE_PATTERN.test(name))
    .map(name => path.join(inputDir, name));
}

function loadReviewFile(filePath: string): ReviewFile {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ReviewFile;
}

function collectPlaceSeeds(inputDir: string): PlaceSeed[] {
  const seeds = new Map<string, PlaceSeed>();
  const files = listJsonFiles(inputDir);

  for (const filePath of files) {
    const payload = loadReviewFile(filePath);
    const username = normalizeWhitespace(payload.user?.username) || path.basename(filePath, '.json');
    const city = normalizeWhitespace(payload.user?.city) || 'Unknown';

    for (const review of payload.reviews || []) {
      const reviewPath = normalizeWhitespace(review.reviewUrl);
      const locationId = parseLocationId(reviewPath);
      const placeName = normalizeWhitespace(review.placeName);

      if (!locationId || !placeName || !reviewPath) {
        continue;
      }

      const existing = seeds.get(locationId);
      if (existing) {
        existing.reviewCount += 1;
        if (!existing.usernames.includes(username)) {
          existing.usernames.push(username);
        }
        continue;
      }

      seeds.set(locationId, {
        locationId,
        placeName,
        city,
        reviewUrl: toAbsoluteReviewUrl(reviewPath),
        reviewPath,
        usernames: [username],
        reviewCount: 1
      });
    }
  }

  return Array.from(seeds.values()).sort((a, b) => a.placeName.localeCompare(b.placeName));
}

function loadExistingOutput(outputFile: string): Map<string, EnrichedPlace> {
  if (!fs.existsSync(outputFile)) {
    return new Map();
  }

  const entries = JSON.parse(fs.readFileSync(outputFile, 'utf8')) as EnrichedPlace[];
  return new Map(entries.filter(entry => entry.locationId).map(entry => [entry.locationId, entry]));
}

async function fetchPlaceDetails(locationId: string, currency: string): Promise<any> {
  const url =
    `${TRIPADVISOR_API_BASE}/location/${locationId}/details` +
    `?language=en&currency=${encodeURIComponent(currency)}&key=${TRIPADVISOR_API_KEY}`;

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      Referer: 'http://localhost:3000'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  return response.json();
}

function mapPlace(seed: PlaceSeed, details: any): EnrichedPlace {
  const subcategories = Array.isArray(details?.subcategory)
    ? details.subcategory
        .map((entry: any) => normalizeWhitespace(entry?.name))
        .filter(Boolean)
    : [];

  return {
    locationId: seed.locationId,
    name: normalizeWhitespace(details?.name) || seed.placeName,
    city: seed.city,
    address: normalizeWhitespace(details?.address_obj?.address_string),
    streetAddress: normalizeWhitespace(details?.address_obj?.street1),
    locality: normalizeWhitespace(details?.address_obj?.city),
    country: normalizeWhitespace(details?.address_obj?.country),
    category: normalizeWhitespace(details?.category?.name),
    subcategories,
    latitude: details?.latitude ? Number(details.latitude) : null,
    longitude: details?.longitude ? Number(details.longitude) : null,
    priceLevel: normalizeWhitespace(details?.price_level),
    ranking: normalizeWhitespace(details?.ranking_data?.ranking_string),
    phone: normalizeWhitespace(details?.phone),
    website: normalizeWhitespace(details?.website),
    reviewUrl: seed.reviewUrl,
    reviewPath: seed.reviewPath,
    sourceReviewCount: seed.reviewCount,
    sourceUsers: seed.usernames,
    apiStatus: 'ok'
  };
}

async function enrichPlaces(
  seeds: PlaceSeed[],
  currency: string,
  delayMs: number,
  concurrency: number,
  existingOutput: Map<string, EnrichedPlace>,
  retryAll: boolean
): Promise<EnrichedPlace[]> {
  const seedByLocationId = new Map(seeds.map(seed => [seed.locationId, seed]));
  const completed = new Map<string, EnrichedPlace>();
  let dailyLimitReached = false;
  let dailyLimitMessage = '';

  for (const [locationId, existing] of existingOutput.entries()) {
    const seed = seedByLocationId.get(locationId);
    if (!seed) {
      continue;
    }

    if (existing.apiStatus === 'ok' && !retryAll) {
      completed.set(locationId, {
        ...existing,
        sourceReviewCount: seed.reviewCount,
        sourceUsers: seed.usernames,
        reviewUrl: seed.reviewUrl,
        reviewPath: seed.reviewPath,
        city: seed.city,
        name: existing.name || seed.placeName
      });
    }
  }

  const pending = seeds.filter(seed => {
    if (retryAll) {
      return true;
    }
    return !completed.has(seed.locationId);
  });

  const fetched = new Map<string, EnrichedPlace>();
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= pending.length || dailyLimitReached) {
        return;
      }

      const seed = pending[index];
      process.stdout.write(`[${index + 1}/${pending.length}] ${seed.placeName} (${seed.locationId}) ... `);

      try {
        const details = await fetchPlaceDetails(seed.locationId, currency);
        fetched.set(seed.locationId, mapPlace(seed, details));
        process.stdout.write('ok\n');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isDailyLimitError(message)) {
          dailyLimitReached = true;
          dailyLimitMessage = message;
        }
        fetched.set(seed.locationId, {
          locationId: seed.locationId,
          name: seed.placeName,
          city: seed.city,
          address: '',
          streetAddress: '',
          locality: '',
          country: '',
          category: '',
          subcategories: [],
          latitude: null,
          longitude: null,
          priceLevel: '',
          ranking: '',
          phone: '',
          website: '',
          reviewUrl: seed.reviewUrl,
          reviewPath: seed.reviewPath,
          sourceReviewCount: seed.reviewCount,
          sourceUsers: seed.usernames,
          apiStatus: 'failed',
          apiError: message
        });
        process.stdout.write(`failed: ${message}\n`);
      }

      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, pending.length || 1));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  const merged = seeds
    .map(seed => fetched.get(seed.locationId) || completed.get(seed.locationId) || existingOutput.get(seed.locationId))
    .filter(Boolean) as EnrichedPlace[];

  if (dailyLimitReached) {
    console.log('\nTripAdvisor daily limit reached; kept existing output for all untouched places.');
    if (dailyLimitMessage) {
      console.log(dailyLimitMessage);
    }
  }

  return merged;
}

function ensureDirForFile(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  if (!TRIPADVISOR_API_KEY) {
    throw new Error('TRIPADVISOR_API_KEY is missing in .env.local');
  }

  const inputDir = path.resolve(getArgValue('--input') || 'reviews/Milan');
  const outputFile = path.resolve(
    getArgValue('--output') || path.join(inputDir, 'places-enriched.json')
  );
  const currency = getArgValue('--currency') || 'EUR';
  const delayMs = Number(getArgValue('--delay-ms') || '150');
  const concurrency = Number(getArgValue('--concurrency') || '3');
  const limit = Number(getArgValue('--limit') || '0');
  const writeSeedsOnly = hasFlag('--seeds-only');
  const retryAll = hasFlag('--retry-all');

  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input directory not found: ${inputDir}`);
  }

  let seeds = collectPlaceSeeds(inputDir);
  if (!seeds.length) {
    throw new Error(`No TripAdvisor place seeds found in ${inputDir}`);
  }

  if (limit > 0) {
    seeds = seeds.slice(0, limit);
  }

  console.log(`Found ${seeds.length} unique TripAdvisor places in ${inputDir}`);

  let places: EnrichedPlace[];
  if (writeSeedsOnly) {
    places = seeds.map(seed => ({
      locationId: seed.locationId,
      name: seed.placeName,
      city: seed.city,
      address: '',
      streetAddress: '',
      locality: '',
      country: '',
      category: '',
      subcategories: [],
      latitude: null,
      longitude: null,
      priceLevel: '',
      ranking: '',
      phone: '',
      website: '',
      reviewUrl: seed.reviewUrl,
      reviewPath: seed.reviewPath,
      sourceReviewCount: seed.reviewCount,
      sourceUsers: seed.usernames,
      apiStatus: 'failed',
      apiError: 'Skipped API fetch because --seeds-only was used'
    }));
  } else {
    const existingOutput = loadExistingOutput(outputFile);
    const existingSuccesses = Array.from(existingOutput.values()).filter(place => place.apiStatus === 'ok').length;
    if (existingSuccesses > 0 && !retryAll) {
      console.log(`Reusing ${existingSuccesses} successful entries already saved in ${outputFile}`);
    }

    places = await enrichPlaces(seeds, currency, delayMs, concurrency, existingOutput, retryAll);
  }

  ensureDirForFile(outputFile);
  fs.writeFileSync(outputFile, JSON.stringify(places, null, 2));

  const okCount = places.filter(place => place.apiStatus === 'ok').length;
  const failedCount = places.length - okCount;

  console.log(`\nSaved ${places.length} places to ${outputFile}`);
  console.log(`API success: ${okCount}`);
  console.log(`API failed: ${failedCount}`);
}

main().catch(error => {
  console.error('Failed to enrich TripAdvisor places:', error);
  process.exit(1);
});
