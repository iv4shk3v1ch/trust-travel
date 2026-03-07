/**
 * Fill critical missing place fields with safe placeholders and optionally
 * remove orphaned low-information places with no reviews.
 *
 * Policy:
 * - If address is missing, set it to "<city>, Italy" (or "<city>" if country unknown).
 * - If description is missing, set a short metadata status note.
 * - If a place has no reviews and no address/coordinates/description, delete it.
 *
 * Usage:
 *   npx tsx scripts/fill-missing-place-details.ts
 *   npx tsx scripts/fill-missing-place-details.ts --apply
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PlaceRow = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  updated_at: string | null;
};

type ReviewCountRow = {
  place_id: string;
};

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function normalize(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

async function loadPlaces(): Promise<PlaceRow[]> {
  const rows: PlaceRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('places')
      .select('id,name,city,country,address,latitude,longitude,description,updated_at')
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as PlaceRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function loadReviews(): Promise<ReviewCountRow[]> {
  const rows: ReviewCountRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('reviews')
      .select('place_id')
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as ReviewCountRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function updatePlaces(updates: Array<{ id: string; payload: Partial<PlaceRow> }>): Promise<void> {
  for (const update of updates) {
    const { error } = await supabase.from('places').update(update.payload).eq('id', update.id);
    if (error) throw error;
  }
}

async function deletePlaces(ids: string[]): Promise<void> {
  const chunkSize = 500;
  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    const { error } = await supabase.from('places').delete().in('id', chunk);
    if (error) throw error;
  }
}

async function main() {
  const apply = hasFlag('--apply');
  const [places, reviews] = await Promise.all([loadPlaces(), loadReviews()]);
  const reviewCountByPlace = new Map<string, number>();
  for (const row of reviews) {
    reviewCountByPlace.set(row.place_id, (reviewCountByPlace.get(row.place_id) || 0) + 1);
  }

  const updates: Array<{ id: string; payload: Partial<PlaceRow> }> = [];
  const deletions: string[] = [];
  let addressFilled = 0;
  let descriptionFilled = 0;

  for (const place of places) {
    const reviewCount = reviewCountByPlace.get(place.id) || 0;
    const hasAddress = Boolean(normalize(place.address));
    const hasDescription = Boolean(normalize(place.description));
    const hasCoordinates = place.latitude != null && place.longitude != null;

    if (!hasAddress && !hasCoordinates && !hasDescription && reviewCount === 0) {
      deletions.push(place.id);
      continue;
    }

    const payload: Partial<PlaceRow> = {};
    if (!hasAddress) {
      const city = normalize(place.city) || 'Unknown city';
      const country = normalize(place.country) || 'Italy';
      payload.address = `${city}, ${country}`;
      addressFilled += 1;
    }

    if (!hasDescription) {
      payload.description = reviewCount > 0
        ? 'Metadata pending enrichment from review source.'
        : 'Metadata pending enrichment.';
      descriptionFilled += 1;
    }

    if (Object.keys(payload).length > 0) {
      payload.updated_at = new Date().toISOString();
      updates.push({ id: place.id, payload });
    }
  }

  console.log(`Places scanned: ${places.length}`);
  console.log(`Reviews scanned: ${reviews.length}`);
  console.log(`Places queued for update: ${updates.length}`);
  console.log(`- address filled: ${addressFilled}`);
  console.log(`- description filled: ${descriptionFilled}`);
  console.log(`Orphan low-information places to delete: ${deletions.length}`);

  for (const item of updates.slice(0, 15)) {
    console.log(`- update ${item.id.slice(0, 8)}`);
  }

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to persist updates.');
    return;
  }

  if (updates.length > 0) {
    await updatePlaces(updates);
  }
  if (deletions.length > 0) {
    await deletePlaces(deletions);
  }

  console.log('Missing-place-detail cleanup applied.');
}

main().catch(error => {
  console.error('Missing-place-detail cleanup failed:', error);
  process.exit(1);
});
