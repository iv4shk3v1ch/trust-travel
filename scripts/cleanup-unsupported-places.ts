/**
 * Find and optionally remove unsupported imported places from the matrix.
 *
 * Current policy removes accommodation and transport entries because they do not
 * belong to the app taxonomy and pollute collaborative filtering.
 *
 * Usage:
 *   npx tsx scripts/cleanup-unsupported-places.ts --dry-run
 *   npx tsx scripts/cleanup-unsupported-places.ts --apply
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCOMMODATION_KEYWORDS = [
  'hotel', 'hostel', 'motel', 'inn', 'guesthouse', 'guest house', 'guest-house',
  'b&b', 'b & b', 'bnb', 'bed and breakfast', 'bed & breakfast', 'suite', 'suites',
  'residence', 'residenza', 'rooms', 'room', 'apartment', 'apartments', 'aparthotel',
  'lodging', 'accommodation', 'resort', 'vacation rental', 'holiday home', 'holiday house'
];

const TRANSPORT_KEYWORDS = [
  'station', 'stazione', 'airport', 'aeroporto', 'metro', 'subway', 'train', 'tram',
  'bus', 'terminal', 'railway', 'trenitalia', 'trenord', 'funivia', 'autostazione'
];

type PlaceRow = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  description: string | null;
  website: string | null;
  place_type_id: string | null;
  place_types?: { slug?: string | null; name?: string | null } | null;
};

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function normalize(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function classifyUnsupportedPlace(place: PlaceRow): 'accommodation' | 'transport' | null {
  const haystack = [place.name, place.address, place.description, place.website]
    .map(normalize)
    .filter(Boolean)
    .join(' ');

  if (ACCOMMODATION_KEYWORDS.some(keyword => haystack.includes(keyword))) {
    return 'accommodation';
  }

  if (TRANSPORT_KEYWORDS.some(keyword => haystack.includes(keyword))) {
    return 'transport';
  }

  return null;
}

async function loadPlaces(): Promise<PlaceRow[]> {
  const rows: PlaceRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('places')
      .select('id,name,city,address,description,website,place_type_id,place_types(slug,name)')
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as PlaceRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function countReviewsForPlaces(placeIds: string[]): Promise<number> {
  if (!placeIds.length) return 0;
  let total = 0;
  const chunkSize = 500;
  for (let index = 0; index < placeIds.length; index += chunkSize) {
    const chunk = placeIds.slice(index, index + chunkSize);
    const { count, error } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .in('place_id', chunk);
    if (error) throw error;
    total += count || 0;
  }
  return total;
}

async function deleteReviews(placeIds: string[]): Promise<void> {
  const chunkSize = 500;
  for (let index = 0; index < placeIds.length; index += chunkSize) {
    const chunk = placeIds.slice(index, index + chunkSize);
    const { error } = await supabase.from('reviews').delete().in('place_id', chunk);
    if (error) throw error;
  }
}

async function deletePlaces(placeIds: string[]): Promise<void> {
  const chunkSize = 500;
  for (let index = 0; index < placeIds.length; index += chunkSize) {
    const chunk = placeIds.slice(index, index + chunkSize);
    const { error } = await supabase.from('places').delete().in('id', chunk);
    if (error) throw error;
  }
}

async function main() {
  const apply = hasFlag('--apply');
  const places = await loadPlaces();
  const flagged = places
    .map(place => ({ place, kind: classifyUnsupportedPlace(place) }))
    .filter(entry => entry.kind);

  const byKind = flagged.reduce((acc, entry) => {
    acc[entry.kind!] = (acc[entry.kind!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const placeIds = flagged.map(entry => entry.place.id);
  const linkedReviews = await countReviewsForPlaces(placeIds);

  console.log(`Unsupported places found: ${flagged.length}`);
  console.log(`- accommodation: ${byKind.accommodation || 0}`);
  console.log(`- transport: ${byKind.transport || 0}`);
  console.log(`Linked reviews to remove: ${linkedReviews}`);

  for (const entry of flagged.slice(0, 25)) {
    console.log(`- [${entry.kind}] ${entry.place.city}: ${entry.place.name} (${entry.place.place_types?.slug || 'unknown'})`);
  }

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to delete flagged reviews and places.');
    return;
  }

  if (!placeIds.length) {
    console.log('No unsupported places to remove.');
    return;
  }

  await deleteReviews(placeIds);
  await deletePlaces(placeIds);
  console.log('Unsupported places and linked reviews deleted.');
}

main().catch(error => {
  console.error('Unsupported-place cleanup failed:', error);
  process.exit(1);
});
