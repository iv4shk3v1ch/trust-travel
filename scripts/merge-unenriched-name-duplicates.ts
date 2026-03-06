/**
 * Merge conservative duplicate place pairs where:
 * - same city
 * - same normalized name
 * - exactly 2 rows in the group
 * - one row is "weak" (no address, no coordinates, no website)
 * - the other row is "strong" (has at least one of address/coordinates/website)
 *
 * This targets partially enriched imports where the same place was inserted twice,
 * and one copy still has missing metadata.
 *
 * Usage:
 *   npx tsx scripts/merge-unenriched-name-duplicates.ts
 *   npx tsx scripts/merge-unenriched-name-duplicates.ts --cities Milan,Rome,Florence,Trento
 *   npx tsx scripts/merge-unenriched-name-duplicates.ts --apply
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_CITIES = ['Milan', 'Rome', 'Florence', 'Trento'];

type PlaceRow = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  description: string | null;
  place_type_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ReviewRow = {
  id: string;
  user_id: string;
  place_id: string;
  visit_date: string | null;
  overall_rating: number | null;
  comment: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type InteractionRow = {
  id: string;
  user_id: string;
  place_id: string;
  action_type: string | null;
  created_at: string | null;
};

type MergeCandidate = {
  city: string;
  normalizedName: string;
  strong: PlaceRow;
  weak: PlaceRow;
};

type MergePlan = {
  candidate: MergeCandidate;
  reviewsToMove: Array<{ id: string; placeId: string }>;
  reviewsToDelete: string[];
  interactionsToMove: Array<{ id: string; placeId: string }>;
  interactionsToDelete: string[];
  canonicalUpdate: Partial<PlaceRow> | null;
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
  return normalizeWhitespace(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseSortableDate(value: string | null | undefined): number {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return 0;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isWeak(place: PlaceRow): boolean {
  return (
    !normalizeWhitespace(place.address) &&
    place.latitude == null &&
    place.longitude == null &&
    !normalizeWhitespace(place.website)
  );
}

function isStrong(place: PlaceRow): boolean {
  return !isWeak(place);
}

function compareReviews(a: ReviewRow, b: ReviewRow): number {
  const visitDiff = parseSortableDate(b.visit_date) - parseSortableDate(a.visit_date);
  if (visitDiff !== 0) return visitDiff;

  const updatedDiff = parseSortableDate(b.updated_at) - parseSortableDate(a.updated_at);
  if (updatedDiff !== 0) return updatedDiff;

  const createdDiff = parseSortableDate(b.created_at) - parseSortableDate(a.created_at);
  if (createdDiff !== 0) return createdDiff;

  return normalizeWhitespace(b.comment).length - normalizeWhitespace(a.comment).length;
}

function compareInteractions(a: InteractionRow, b: InteractionRow): number {
  return parseSortableDate(b.created_at) - parseSortableDate(a.created_at);
}

async function loadPlaces(cities: string[]): Promise<PlaceRow[]> {
  const allowedCities = new Set(cities.map(city => normalizeName(city)));
  const rows: PlaceRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('places')
      .select('id,name,city,address,latitude,longitude,website,description,place_type_id,created_at,updated_at')
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as PlaceRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows.filter(row => allowedCities.has(normalizeName(row.city)));
}

async function loadReviews(): Promise<ReviewRow[]> {
  const rows: ReviewRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('reviews')
      .select('id,user_id,place_id,visit_date,overall_rating,comment,created_at,updated_at')
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as ReviewRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function loadInteractions(): Promise<InteractionRow[]> {
  const rows: InteractionRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('user_interactions')
      .select('id,user_id,place_id,action_type,created_at')
      .range(offset, offset + pageSize - 1);

    if (error) {
      const message = error.message || '';
      if (/relation .* does not exist/i.test(message)) {
        return [];
      }
      throw error;
    }

    if (!data || data.length === 0) break;
    rows.push(...(data as InteractionRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

function buildCandidates(places: PlaceRow[]): MergeCandidate[] {
  const byName = new Map<string, PlaceRow[]>();

  for (const place of places) {
    const key = `${normalizeName(place.city)}|${normalizeName(place.name)}`;
    if (!key || key === '|') continue;
    const bucket = byName.get(key) || [];
    bucket.push(place);
    byName.set(key, bucket);
  }

  const candidates: MergeCandidate[] = [];

  for (const [key, group] of byName.entries()) {
    if (group.length !== 2) continue;

    const weak = group.find(isWeak);
    const strong = group.find(isStrong);
    if (!weak || !strong) continue;

    const [city, normalizedName] = key.split('|');
    candidates.push({
      city,
      normalizedName,
      strong,
      weak
    });
  }

  return candidates.sort((a, b) => a.strong.city.localeCompare(b.strong.city) || a.strong.name.localeCompare(b.strong.name));
}

function buildPlan(
  candidates: MergeCandidate[],
  reviews: ReviewRow[],
  interactions: InteractionRow[]
): MergePlan[] {
  const reviewsByPlace = new Map<string, ReviewRow[]>();
  const interactionsByPlace = new Map<string, InteractionRow[]>();

  for (const row of reviews) {
    const bucket = reviewsByPlace.get(row.place_id) || [];
    bucket.push(row);
    reviewsByPlace.set(row.place_id, bucket);
  }

  for (const row of interactions) {
    const bucket = interactionsByPlace.get(row.place_id) || [];
    bucket.push(row);
    interactionsByPlace.set(row.place_id, bucket);
  }

  return candidates.map(candidate => {
    const reviewsToMove: Array<{ id: string; placeId: string }> = [];
    const reviewsToDelete: string[] = [];
    const interactionsToMove: Array<{ id: string; placeId: string }> = [];
    const interactionsToDelete: string[] = [];

    const allReviews = [
      ...(reviewsByPlace.get(candidate.strong.id) || []),
      ...(reviewsByPlace.get(candidate.weak.id) || [])
    ];

    const reviewsByUser = new Map<string, ReviewRow[]>();
    for (const review of allReviews) {
      const bucket = reviewsByUser.get(review.user_id) || [];
      bucket.push(review);
      reviewsByUser.set(review.user_id, bucket);
    }

    for (const rows of reviewsByUser.values()) {
      rows.sort(compareReviews);
      const keep = rows[0];
      if (keep.place_id !== candidate.strong.id) {
        reviewsToMove.push({ id: keep.id, placeId: candidate.strong.id });
      }
      for (const row of rows.slice(1)) {
        reviewsToDelete.push(row.id);
      }
    }

    const allInteractions = [
      ...(interactionsByPlace.get(candidate.strong.id) || []),
      ...(interactionsByPlace.get(candidate.weak.id) || [])
    ];
    const interactionsByKey = new Map<string, InteractionRow[]>();
    for (const interaction of allInteractions) {
      const key = `${interaction.user_id}|${interaction.action_type || ''}`;
      const bucket = interactionsByKey.get(key) || [];
      bucket.push(interaction);
      interactionsByKey.set(key, bucket);
    }

    for (const rows of interactionsByKey.values()) {
      rows.sort(compareInteractions);
      const keep = rows[0];
      if (keep.place_id !== candidate.strong.id) {
        interactionsToMove.push({ id: keep.id, placeId: candidate.strong.id });
      }
      for (const row of rows.slice(1)) {
        interactionsToDelete.push(row.id);
      }
    }

    const canonicalUpdate: Partial<PlaceRow> = {};
    if (!normalizeWhitespace(candidate.strong.description) && normalizeWhitespace(candidate.weak.description)) {
      canonicalUpdate.description = candidate.weak.description;
    }
    if (!candidate.strong.place_type_id && candidate.weak.place_type_id) {
      canonicalUpdate.place_type_id = candidate.weak.place_type_id;
    }

    return {
      candidate,
      reviewsToMove,
      reviewsToDelete,
      interactionsToMove,
      interactionsToDelete,
      canonicalUpdate: Object.keys(canonicalUpdate).length ? canonicalUpdate : null
    };
  });
}

async function updateRows(table: 'reviews' | 'user_interactions', updates: Array<{ id: string; placeId: string }>): Promise<void> {
  for (const update of updates) {
    const { error } = await supabase
      .from(table)
      .update({ place_id: update.placeId })
      .eq('id', update.id);

    if (error) throw error;
  }
}

async function deleteRows(table: 'reviews' | 'user_interactions' | 'places', ids: string[]): Promise<void> {
  const chunkSize = 500;
  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    const { error } = await supabase.from(table).delete().in('id', chunk);
    if (error) throw error;
  }
}

async function updatePlaces(updates: Array<{ id: string; fields: Partial<PlaceRow> }>): Promise<void> {
  for (const update of updates) {
    const payload = {
      ...update.fields,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('places').update(payload).eq('id', update.id);
    if (error) throw error;
  }
}

async function main() {
  const apply = hasFlag('--apply');
  const cities = (getArgValue('--cities') || DEFAULT_CITIES.join(','))
    .split(',')
    .map(city => normalizeWhitespace(city))
    .filter(Boolean);

  const [places, reviews, interactions] = await Promise.all([
    loadPlaces(cities),
    loadReviews(),
    loadInteractions()
  ]);

  const candidates = buildCandidates(places);
  const plan = buildPlan(candidates, reviews, interactions);

  const placeUpdates = plan
    .filter(item => item.canonicalUpdate)
    .map(item => ({ id: item.candidate.strong.id, fields: item.canonicalUpdate! }));

  const reviewsToMove = plan.flatMap(item => item.reviewsToMove);
  const reviewsToDelete = plan.flatMap(item => item.reviewsToDelete);
  const interactionsToMove = plan.flatMap(item => item.interactionsToMove);
  const interactionsToDelete = plan.flatMap(item => item.interactionsToDelete);
  const weakPlaceIds = plan.map(item => item.candidate.weak.id);

  console.log(`Places scanned: ${places.length}`);
  console.log(`Conservative unenriched duplicate pairs: ${plan.length}`);
  console.log(`Canonical metadata updates: ${placeUpdates.length}`);
  console.log(`Weak duplicate place rows to delete: ${weakPlaceIds.length}`);
  console.log(`Reviews to move: ${reviewsToMove.length}`);
  console.log(`Reviews to delete after merge: ${reviewsToDelete.length}`);
  console.log(`Interactions to move: ${interactionsToMove.length}`);
  console.log(`Interactions to delete after merge: ${interactionsToDelete.length}`);

  for (const item of plan.slice(0, 20)) {
    const strongAddress = normalizeWhitespace(item.candidate.strong.address);
    console.log(`- ${item.candidate.strong.city}: ${item.candidate.strong.name} -> keep ${item.candidate.strong.id.slice(0, 8)}, drop ${item.candidate.weak.id.slice(0, 8)}${strongAddress ? ` [${strongAddress}]` : ''}`);
  }

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to merge these pairs.');
    return;
  }

  if (placeUpdates.length > 0) {
    await updatePlaces(placeUpdates);
  }
  if (reviewsToMove.length > 0) {
    await updateRows('reviews', reviewsToMove);
  }
  if (reviewsToDelete.length > 0) {
    await deleteRows('reviews', reviewsToDelete);
  }
  if (interactionsToMove.length > 0) {
    await updateRows('user_interactions', interactionsToMove);
  }
  if (interactionsToDelete.length > 0) {
    await deleteRows('user_interactions', interactionsToDelete);
  }
  if (weakPlaceIds.length > 0) {
    await deleteRows('places', weakPlaceIds);
  }

  console.log('Unenriched duplicate merge applied.');
}

main().catch(error => {
  console.error('Unenriched duplicate merge failed:', error);
  process.exit(1);
});
