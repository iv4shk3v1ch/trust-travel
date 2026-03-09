/**
 * Fast offline coordinate backfill from local TripAdvisor enriched files.
 * No external API calls.
 *
 * Usage:
 *   npx tsx scripts/backfill-missing-coordinates-from-enriched.ts
 *   npx tsx scripts/backfill-missing-coordinates-from-enriched.ts --apply
 *   npx tsx scripts/backfill-missing-coordinates-from-enriched.ts --city Rome
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing Supabase env vars');

const supabase = createClient(url, key);
const DEFAULT_CITIES = ['Trento', 'Milan', 'Rome', 'Florence'];

type PlaceRow = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

type EnrichedPlace = {
  name: string;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  apiStatus?: string;
};

function normalize(value: string | null | undefined): string {
  return (value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
}

function cleanPlaceName(name: string): string {
  return normalize(name)
    .replace(/\bclosed\b/g, '')
    .replace(/\b(ticket|tickets|guided|guide|tour|tours|entrance|admission|private|small group|max|people|option|options|experience|day trip|hop on hop off|hop on|hop off)\b/g, '')
    .replace(/\bfrom rome\b/g, '')
    .replace(/\bwith\b.*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function getCities(): string[] {
  const cityArg = getArgValue('--city');
  if (cityArg) return [cityArg];
  const citiesArg = getArgValue('--cities');
  if (citiesArg) return citiesArg.split(',').map(c => c.trim()).filter(Boolean);
  return DEFAULT_CITIES;
}

function getEnrichedFilePath(city: string): string {
  return path.resolve('reviews', city, `${city.toLowerCase()}-places-enriched.json`);
}

async function loadMissingPlaces(city: string): Promise<PlaceRow[]> {
  const { data, error } = await supabase
    .from('places')
    .select('id,name,city,address,latitude,longitude')
    .eq('city', city)
    .or('latitude.is.null,longitude.is.null');

  if (error) throw error;
  return (data || []) as PlaceRow[];
}

function loadEnriched(city: string): EnrichedPlace[] {
  const filePath = getEnrichedFilePath(city);
  if (!fs.existsSync(filePath)) return [];
  const rows = JSON.parse(fs.readFileSync(filePath, 'utf8')) as EnrichedPlace[];
  return rows.filter(row => row.apiStatus === 'ok' && row.latitude != null && row.longitude != null);
}

function chooseCandidate(place: PlaceRow, candidates: EnrichedPlace[]): EnrichedPlace | null {
  if (candidates.length === 1) return candidates[0];

  const addressKey = normalize(place.address);
  if (!addressKey) return null;

  const addressMatches = candidates.filter(candidate => normalize(candidate.address) === addressKey);
  if (addressMatches.length === 1) return addressMatches[0];
  return null;
}

function chooseFallbackCandidate(place: PlaceRow, allEnriched: EnrichedPlace[]): EnrichedPlace | null {
  const cleaned = cleanPlaceName(place.name);
  if (!cleaned || cleaned.length < 5) return null;

  const candidates = allEnriched.filter(row => {
    const enrichedName = normalize(row.name);
    return enrichedName.includes(cleaned) || cleaned.includes(enrichedName);
  });

  if (candidates.length === 1) return candidates[0];

  const addressKey = normalize(place.address);
  if (addressKey) {
    const addressMatches = candidates.filter(candidate => normalize(candidate.address) === addressKey);
    if (addressMatches.length === 1) return addressMatches[0];
  }

  return null;
}

async function main() {
  const apply = hasFlag('--apply');
  const cities = getCities();

  let totalMissing = 0;
  let totalMatched = 0;
  let totalUpdated = 0;
  let totalAmbiguous = 0;

  for (const city of cities) {
    const [missingPlaces, enrichedRows] = await Promise.all([
      loadMissingPlaces(city),
      Promise.resolve(loadEnriched(city)),
    ]);

    const byName = new Map<string, EnrichedPlace[]>();
    for (const row of enrichedRows) {
      const key = normalize(row.name);
      if (!key) continue;
      const bucket = byName.get(key) || [];
      bucket.push(row);
      byName.set(key, bucket);
    }

    const updates: Array<{ id: string; latitude: number; longitude: number; name: string }> = [];
    let cityMatched = 0;
    let cityAmbiguous = 0;

    for (const place of missingPlaces) {
      const key = normalize(place.name);
      if (!key) continue;
      const candidates = byName.get(key) || [];
      const chosen = candidates.length
        ? chooseCandidate(place, candidates)
        : chooseFallbackCandidate(place, enrichedRows);
      if (!chosen) {
        cityAmbiguous += 1;
        continue;
      }

      cityMatched += 1;
      updates.push({
        id: place.id,
        latitude: Number(chosen.latitude),
        longitude: Number(chosen.longitude),
        name: place.name,
      });
    }

    totalMissing += missingPlaces.length;
    totalMatched += cityMatched;
    totalAmbiguous += cityAmbiguous;

    console.log(`\n${city}`);
    console.log(`- missing coords: ${missingPlaces.length}`);
    console.log(`- enriched rows with coords: ${enrichedRows.length}`);
    console.log(`- matched: ${cityMatched}`);
    console.log(`- ambiguous skipped: ${cityAmbiguous}`);
    console.log(`- updates queued: ${updates.length}`);

    for (const row of updates.slice(0, 10)) {
      console.log(`  • ${row.name} -> ${row.latitude.toFixed(6)}, ${row.longitude.toFixed(6)}`);
    }

    if (apply && updates.length) {
      for (const row of updates) {
        const { error } = await supabase
          .from('places')
          .update({
            latitude: row.latitude,
            longitude: row.longitude,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        if (error) throw error;
        totalUpdated += 1;
      }
    }
  }

  console.log('\n---');
  console.log(`Total missing scanned: ${totalMissing}`);
  console.log(`Total matched: ${totalMatched}`);
  console.log(`Total ambiguous skipped: ${totalAmbiguous}`);
  console.log(`Total updated: ${apply ? totalUpdated : 0}`);
  if (!apply) {
    console.log('Dry run only. Re-run with --apply to write coordinates.');
  }
}

main().catch(error => {
  console.error('Backfill from enriched failed:', error);
  process.exit(1);
});
