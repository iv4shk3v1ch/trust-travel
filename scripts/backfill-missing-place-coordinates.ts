/**
 * Backfill missing place coordinates using Nominatim geocoding.
 *
 * Safety defaults:
 * - Dry-run by default (no DB writes)
 * - Rate-limited requests (default 1100ms)
 * - Query/result cache in scripts/.cache/geocode-cache.json
 *
 * Usage:
 *   npx tsx scripts/backfill-missing-place-coordinates.ts
 *   npx tsx scripts/backfill-missing-place-coordinates.ts --apply
 *   npx tsx scripts/backfill-missing-place-coordinates.ts --apply --city Rome
 *   npx tsx scripts/backfill-missing-place-coordinates.ts --apply --max 200
 *   npx tsx scripts/backfill-missing-place-coordinates.ts --apply --city Rome --max 120 --max-queries-per-place 1
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const CACHE_DIR = path.resolve('scripts/.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'geocode-cache.json');

const ITALY_BOUNDS = { minLat: 35, maxLat: 48, minLon: 6, maxLon: 19 };
const CITY_CENTERS: Record<string, [number, number]> = {
  Trento: [46.0664, 11.1257],
  Milan: [45.4642, 9.19],
  Rome: [41.9028, 12.4964],
  Florence: [43.7696, 11.2558],
};

const CITY_ALIASES: Record<string, string[]> = {
  Trento: ['trento'],
  Milan: ['milan', 'milano'],
  Rome: ['rome', 'roma'],
  Florence: ['florence', 'firenze'],
};

type PlaceRow = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

type CacheRecord = {
  lat: number | null;
  lon: number | null;
  source: 'nominatim' | 'none' | 'error';
  at: string;
};

type CacheMap = Record<string, CacheRecord>;

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function normalize(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isLikelyValidForCity(city: string | null, lat: number, lon: number, label: string): boolean {
  if (hasFlag('--no-city-guard')) return true;

  if (lat < ITALY_BOUNDS.minLat || lat > ITALY_BOUNDS.maxLat || lon < ITALY_BOUNDS.minLon || lon > ITALY_BOUNDS.maxLon) {
    return false;
  }
  if (!city || !CITY_CENTERS[city]) return true;
  const labelNorm = normalize(label).toLowerCase();
  const aliases = CITY_ALIASES[city] || [city.toLowerCase()];
  if (aliases.some(alias => labelNorm.includes(alias))) return true;
  const [cityLat, cityLon] = CITY_CENTERS[city];
  return haversineKm(lat, lon, cityLat, cityLon) <= 180;
}

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function loadCache(): CacheMap {
  try {
    if (!fs.existsSync(CACHE_FILE)) return {};
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) as CacheMap;
  } catch {
    return {};
  }
}

function saveCache(cache: CacheMap) {
  ensureCacheDir();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function buildQueries(place: PlaceRow): string[] {
  const address = normalize(place.address);
  const city = normalize(place.city);
  const country = normalize(place.country) || 'Italy';
  const name = normalize(place.name);
  const queries = new Set<string>();

  if (address) queries.add([address, city, country].filter(Boolean).join(', '));
  if (address) queries.add([address, country].filter(Boolean).join(', '));
  if (name) queries.add([name, city, country].filter(Boolean).join(', '));
  if (name) queries.add([name, country].filter(Boolean).join(', '));

  return Array.from(queries).filter(Boolean);
}

async function geocodeQuery(
  query: string,
  cache: CacheMap,
  requestDelayMs: number
): Promise<{ lat: number | null; lon: number | null; label: string }> {
  const cached = cache[query];
  const retryMisses = hasFlag('--retry-misses');
  if (cached && !(retryMisses && cached.lat == null && cached.lon == null)) {
    return { lat: cached.lat, lon: cached.lon, label: '' };
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '0');

  const timeoutMs = Math.max(5000, Number(getArgValue('--request-timeout-ms') || '12000'));
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        // Required by Nominatim usage policy: identify your application.
        'User-Agent': 'TrustTravelThesis/1.0 (contact: research-thesis)'
      }
    });
  } catch {
    clearTimeout(timeoutId);
    cache[query] = { lat: null, lon: null, source: 'error', at: new Date().toISOString() };
    await sleep(requestDelayMs);
    return { lat: null, lon: null, label: '' };
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    cache[query] = { lat: null, lon: null, source: 'none', at: new Date().toISOString() };
    await sleep(requestDelayMs);
    return { lat: null, lon: null };
  }

  type NominatimResult = { lat: string; lon: string; display_name?: string };
  const rows = (await response.json()) as NominatimResult[];
  const first = rows?.[0];
  const lat = first ? Number(first.lat) : null;
  const lon = first ? Number(first.lon) : null;
  const label = first?.display_name || '';
  cache[query] = {
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
    source: Number.isFinite(lat) && Number.isFinite(lon) ? 'nominatim' : 'none',
    at: new Date().toISOString()
  };
  await sleep(requestDelayMs);
  return { lat: cache[query].lat, lon: cache[query].lon, label };
}

async function loadMissingPlaces(cityFilter?: string, max?: number): Promise<PlaceRow[]> {
  let query = supabase
    .from('places')
    .select('id,name,city,country,address,latitude,longitude')
    .or('latitude.is.null,longitude.is.null')
    .order('city', { ascending: true })
    .order('name', { ascending: true });

  if (cityFilter) query = query.eq('city', cityFilter);
  if (max && max > 0) query = query.limit(max);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as PlaceRow[];
}

async function main() {
  const apply = hasFlag('--apply');
  const city = getArgValue('--city');
  const max = Number(getArgValue('--max') || '0') || undefined;
  const requestDelayMs = Math.max(1000, Number(getArgValue('--sleep-ms') || '1100'));
  const maxQueriesPerPlace = Math.max(1, Number(getArgValue('--max-queries-per-place') || '2'));
  const progressEvery = Math.max(1, Number(getArgValue('--progress-every') || '10'));

  const cache = loadCache();
  const places = await loadMissingPlaces(city, max);

  let updated = 0;
  let noResult = 0;
  let rejected = 0;
  let alreadyCached = 0;
  const startedAt = Date.now();

  console.log(`Missing-coordinate places to process: ${places.length}`);
  if (city) console.log(`City filter: ${city}`);
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);

  for (let index = 0; index < places.length; index += 1) {
    const place = places[index];
    const queries = buildQueries(place).slice(0, maxQueriesPerPlace);
    let picked: { lat: number; lon: number } | null = null;

    for (const query of queries) {
      if (cache[query]) alreadyCached += 1;
      const result = await geocodeQuery(query, cache, requestDelayMs);
      if (result.lat == null || result.lon == null) continue;
      if (!isLikelyValidForCity(place.city, result.lat, result.lon, result.label)) {
        continue;
      }
      picked = { lat: result.lat, lon: result.lon };
      break;
    }

    if (!picked) {
      // Could be truly unresolved or resolved outside city quality guard
      const hadAnyHit = queries.some(q => cache[q]?.lat != null && cache[q]?.lon != null);
      if (hadAnyHit) rejected += 1;
      else noResult += 1;
      continue;
    }

    if (apply) {
      const { error } = await supabase
        .from('places')
        .update({
          latitude: picked.lat,
          longitude: picked.lon,
          updated_at: new Date().toISOString(),
        })
        .eq('id', place.id);
      if (error) {
        console.error(`Update failed for ${place.id} (${place.name}): ${error.message}`);
        continue;
      }
    }

    updated += 1;
    if (updated <= 15) {
      console.log(`- ${place.city || 'Unknown'} | ${place.name} -> ${picked.lat.toFixed(6)}, ${picked.lon.toFixed(6)}`);
    }

    if ((index + 1) % progressEvery === 0 || index === places.length - 1) {
      const elapsedSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const done = index + 1;
      const perItem = elapsedSec / done;
      const etaSec = Math.round((places.length - done) * perItem);
      console.log(
        `Progress ${done}/${places.length} | updated=${updated} noResult=${noResult} rejected=${rejected} | elapsed=${elapsedSec}s eta=${etaSec}s`
      );
    }
  }

  saveCache(cache);

  console.log('---');
  console.log(`Updated coords: ${updated}`);
  console.log(`No geocode result: ${noResult}`);
  console.log(`Rejected by city/Italy guard: ${rejected}`);
  console.log(`Cache hits: ${alreadyCached}`);
  console.log(`Cache file: ${CACHE_FILE}`);
}

main().catch(error => {
  console.error('Coordinate backfill failed:', error);
  process.exit(1);
});
