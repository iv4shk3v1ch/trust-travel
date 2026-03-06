/**
 * Conservatively merge duplicate places in the live database.
 *
 * Merge policy:
 * - same city
 * - exact normalized place name
 * - plus one strong identity signal:
 *   1) exact normalized address
 *   2) exact normalized website
 *   3) coordinates within 75 meters
 *
 * For each duplicate component:
 * - choose one canonical place
 * - merge reviews onto the canonical place, keeping one review per user
 * - merge user_interactions onto the canonical place, keeping one action per user/action_type
 * - delete the duplicate place rows
 *
 * Usage:
 *   npx tsx scripts/merge-duplicate-places.ts
 *   npx tsx scripts/merge-duplicate-places.ts --apply
 *   npx tsx scripts/merge-duplicate-places.ts --cities Milan,Rome,Florence,Trento
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_CITIES = ['Milan', 'Rome', 'Florence', 'Trento'];
const LANDMARK_SLUG = 'landmark';
const COORDINATE_DISTANCE_METERS = 75;

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
  place_types?: { slug?: string | null; name?: string | null } | null;
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

type DuplicateComponent = {
  city: string;
  normalizedName: string;
  places: PlaceRow[];
  evidence: Set<'address' | 'website' | 'coords'>;
};

type CanonicalPlan = {
  component: DuplicateComponent;
  canonical: PlaceRow;
  duplicates: PlaceRow[];
  reviewsToMove: Array<{ id: string; placeId: string }>;
  reviewsToDelete: string[];
  interactionsToMove: Array<{ id: string; placeId: string }>;
  interactionsToDelete: string[];
  placeUpdate: Partial<PlaceRow> | null;
};

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
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

function normalizeWebsite(value: string | null | undefined): string {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return '';

  try {
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    const pathname = url.pathname.replace(/\/+$/, '').toLowerCase();
    return `${host}${pathname}`;
  } catch {
    return normalized.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
  }
}

function parseSortableDate(value: string | null | undefined): number {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return 0;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? 0 : timestamp;
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

function haversineMeters(a: PlaceRow, b: PlaceRow): number | null {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) {
    return null;
  }

  const toRad = (value: number) => value * Math.PI / 180;
  const earthRadius = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const haversine =
    Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function countMetadata(place: PlaceRow): number {
  let score = 0;
  if (normalizeWhitespace(place.address)) score += 1;
  if (place.latitude != null && place.longitude != null) score += 1;
  if (normalizeWhitespace(place.website)) score += 1;
  if (normalizeWhitespace(place.description)) score += 1;
  if (place.place_types?.slug && place.place_types.slug !== LANDMARK_SLUG) score += 1;
  return score;
}

async function loadPlaces(cities: string[]): Promise<PlaceRow[]> {
  const rows: PlaceRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('places')
      .select('id,name,city,address,latitude,longitude,website,description,place_type_id,created_at,updated_at,place_types(slug,name)')
      .in('city', cities)
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as PlaceRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
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

function placePairEvidence(a: PlaceRow, b: PlaceRow): Array<'address' | 'website' | 'coords'> {
  const evidence: Array<'address' | 'website' | 'coords'> = [];
  const addressA = normalizeName(a.address);
  const addressB = normalizeName(b.address);
  if (addressA && addressA === addressB) {
    evidence.push('address');
  }

  const websiteA = normalizeWebsite(a.website);
  const websiteB = normalizeWebsite(b.website);
  if (websiteA && websiteA === websiteB) {
    evidence.push('website');
  }

  const distance = haversineMeters(a, b);
  if (distance != null && distance <= COORDINATE_DISTANCE_METERS) {
    evidence.push('coords');
  }

  return evidence;
}

function buildDuplicateComponents(places: PlaceRow[]): DuplicateComponent[] {
  const byName = new Map<string, PlaceRow[]>();

  for (const place of places) {
    const key = `${place.city}|${normalizeName(place.name)}`;
    const bucket = byName.get(key) || [];
    bucket.push(place);
    byName.set(key, bucket);
  }

  const components: DuplicateComponent[] = [];

  for (const [key, group] of byName.entries()) {
    if (group.length < 2) continue;

    const parent = new Map(group.map(place => [place.id, place.id]));
    const edgeEvidence = new Map<string, Set<'address' | 'website' | 'coords'>>();

    const find = (id: string): string => {
      let current = parent.get(id)!;
      while (current !== parent.get(current)) {
        current = parent.get(current)!;
      }
      let node = id;
      while (parent.get(node) !== current) {
        const next = parent.get(node)!;
        parent.set(node, current);
        node = next;
      }
      return current;
    };

    const union = (a: string, b: string, evidence: Array<'address' | 'website' | 'coords'>) => {
      const rootA = find(a);
      const rootB = find(b);
      if (rootA !== rootB) {
        parent.set(rootB, rootA);
      }
      const pairKey = [a, b].sort().join('|');
      const bucket = edgeEvidence.get(pairKey) || new Set<'address' | 'website' | 'coords'>();
      evidence.forEach(item => bucket.add(item));
      edgeEvidence.set(pairKey, bucket);
    };

    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        const evidence = placePairEvidence(group[i], group[j]);
        if (evidence.length > 0) {
          union(group[i].id, group[j].id, evidence);
        }
      }
    }

    const buckets = new Map<string, PlaceRow[]>();
    for (const place of group) {
      const root = find(place.id);
      const bucket = buckets.get(root) || [];
      bucket.push(place);
      buckets.set(root, bucket);
    }

    for (const bucket of buckets.values()) {
      if (bucket.length < 2) continue;

      const evidence = new Set<'address' | 'website' | 'coords'>();
      for (let i = 0; i < bucket.length; i += 1) {
        for (let j = i + 1; j < bucket.length; j += 1) {
          placePairEvidence(bucket[i], bucket[j]).forEach(item => evidence.add(item));
        }
      }

      const [city, normalizedName] = key.split('|');
      components.push({ city, normalizedName, places: bucket, evidence });
    }
  }

  return components.sort((a, b) => b.places.length - a.places.length);
}

function chooseCanonicalPlace(
  places: PlaceRow[],
  reviewCountByPlace: Map<string, number>,
  interactionCountByPlace: Map<string, number>
): PlaceRow {
  return [...places].sort((a, b) => {
    const scoreA =
      (reviewCountByPlace.get(a.id) || 0) * 1000
      + (interactionCountByPlace.get(a.id) || 0) * 100
      + countMetadata(a) * 10;
    const scoreB =
      (reviewCountByPlace.get(b.id) || 0) * 1000
      + (interactionCountByPlace.get(b.id) || 0) * 100
      + countMetadata(b) * 10;

    if (scoreB !== scoreA) return scoreB - scoreA;
    return parseSortableDate(b.updated_at) - parseSortableDate(a.updated_at);
  })[0];
}

function mergePlaceMetadata(canonical: PlaceRow, duplicates: PlaceRow[]): Partial<PlaceRow> | null {
  const candidates = [canonical, ...duplicates];
  const bestAddress = [...candidates]
    .map(place => normalizeWhitespace(place.address))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] || '';
  const bestWebsite = [...candidates]
    .map(place => normalizeWhitespace(place.website))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] || '';
  const bestDescription = [...candidates]
    .map(place => normalizeWhitespace(place.description))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] || '';
  const coordinateSource = candidates.find(place => place.latitude != null && place.longitude != null);
  const specificType = candidates.find(place => place.place_types?.slug && place.place_types.slug !== LANDMARK_SLUG);

  const updates: Partial<PlaceRow> = {};

  if (!normalizeWhitespace(canonical.address) && bestAddress) {
    updates.address = bestAddress;
  }
  if (!normalizeWhitespace(canonical.website) && bestWebsite) {
    updates.website = bestWebsite;
  }
  if (!normalizeWhitespace(canonical.description) && bestDescription) {
    updates.description = bestDescription;
  }
  if ((canonical.latitude == null || canonical.longitude == null) && coordinateSource) {
    updates.latitude = coordinateSource.latitude;
    updates.longitude = coordinateSource.longitude;
  }
  if (canonical.place_types?.slug === LANDMARK_SLUG && specificType?.place_type_id) {
    updates.place_type_id = specificType.place_type_id;
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

function buildPlan(
  components: DuplicateComponent[],
  reviews: ReviewRow[],
  interactions: InteractionRow[]
): CanonicalPlan[] {
  const reviewsByPlace = new Map<string, ReviewRow[]>();
  const interactionsByPlace = new Map<string, InteractionRow[]>();

  for (const review of reviews) {
    const bucket = reviewsByPlace.get(review.place_id) || [];
    bucket.push(review);
    reviewsByPlace.set(review.place_id, bucket);
  }

  for (const interaction of interactions) {
    const bucket = interactionsByPlace.get(interaction.place_id) || [];
    bucket.push(interaction);
    interactionsByPlace.set(interaction.place_id, bucket);
  }

  const reviewCountByPlace = new Map<string, number>();
  const interactionCountByPlace = new Map<string, number>();
  for (const [placeId, rows] of reviewsByPlace.entries()) reviewCountByPlace.set(placeId, rows.length);
  for (const [placeId, rows] of interactionsByPlace.entries()) interactionCountByPlace.set(placeId, rows.length);

  return components.map(component => {
    const canonical = chooseCanonicalPlace(component.places, reviewCountByPlace, interactionCountByPlace);
    const duplicates = component.places.filter(place => place.id !== canonical.id);
    const placeIds = new Set(component.places.map(place => place.id));

    const componentReviews = reviews.filter(review => placeIds.has(review.place_id));
    const componentInteractions = interactions.filter(interaction => placeIds.has(interaction.place_id));

    const reviewsToMove: Array<{ id: string; placeId: string }> = [];
    const reviewsToDelete: string[] = [];
    const interactionsToMove: Array<{ id: string; placeId: string }> = [];
    const interactionsToDelete: string[] = [];

    const reviewsByUser = new Map<string, ReviewRow[]>();
    for (const review of componentReviews) {
      const bucket = reviewsByUser.get(review.user_id) || [];
      bucket.push(review);
      reviewsByUser.set(review.user_id, bucket);
    }

    for (const rows of reviewsByUser.values()) {
      rows.sort(compareReviews);
      const keep = rows[0];
      if (keep.place_id !== canonical.id) {
        reviewsToMove.push({ id: keep.id, placeId: canonical.id });
      }
      for (const row of rows.slice(1)) {
        reviewsToDelete.push(row.id);
      }
    }

    const interactionsByKey = new Map<string, InteractionRow[]>();
    for (const interaction of componentInteractions) {
      const key = `${interaction.user_id}|${interaction.action_type || ''}`;
      const bucket = interactionsByKey.get(key) || [];
      bucket.push(interaction);
      interactionsByKey.set(key, bucket);
    }

    for (const rows of interactionsByKey.values()) {
      rows.sort(compareInteractions);
      const keep = rows[0];
      if (keep.place_id !== canonical.id) {
        interactionsToMove.push({ id: keep.id, placeId: canonical.id });
      }
      for (const row of rows.slice(1)) {
        interactionsToDelete.push(row.id);
      }
    }

    return {
      component,
      canonical,
      duplicates,
      reviewsToMove,
      reviewsToDelete,
      interactionsToMove,
      interactionsToDelete,
      placeUpdate: mergePlaceMetadata(canonical, duplicates)
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

  const places = await loadPlaces(cities);
  const reviews = await loadReviews();
  const interactions = await loadInteractions();
  const components = buildDuplicateComponents(places);
  const plan = buildPlan(components, reviews, interactions);

  const placeUpdates = plan
    .filter(item => item.placeUpdate)
    .map(item => ({ id: item.canonical.id, fields: item.placeUpdate! }));
  const reviewsToMove = plan.flatMap(item => item.reviewsToMove);
  const reviewsToDelete = plan.flatMap(item => item.reviewsToDelete);
  const interactionsToMove = plan.flatMap(item => item.interactionsToMove);
  const interactionsToDelete = plan.flatMap(item => item.interactionsToDelete);
  const duplicatePlaceIds = plan.flatMap(item => item.duplicates.map(place => place.id));

  const evidenceCounts = {
    address: plan.filter(item => item.component.evidence.has('address')).length,
    website: plan.filter(item => item.component.evidence.has('website')).length,
    coords: plan.filter(item => item.component.evidence.has('coords')).length
  };

  console.log(`Places scanned: ${places.length}`);
  console.log(`Safe duplicate components: ${plan.length}`);
  console.log(`- address-backed: ${evidenceCounts.address}`);
  console.log(`- website-backed: ${evidenceCounts.website}`);
  console.log(`- coordinate-backed: ${evidenceCounts.coords}`);
  console.log(`Canonical places to enrich from duplicates: ${placeUpdates.length}`);
  console.log(`Duplicate place rows to delete: ${duplicatePlaceIds.length}`);
  console.log(`Reviews to move: ${reviewsToMove.length}`);
  console.log(`Reviews to delete after merge: ${reviewsToDelete.length}`);
  console.log(`Interactions to move: ${interactionsToMove.length}`);
  console.log(`Interactions to delete after merge: ${interactionsToDelete.length}`);

  for (const item of plan.slice(0, 15)) {
    const evidence = Array.from(item.component.evidence).join(',') || 'unknown';
    console.log(
      `- ${item.component.city}: ${item.canonical.name} -> ${item.component.places.length} rows [${evidence}]`
    );
  }

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to merge safe duplicate places.');
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
  if (duplicatePlaceIds.length > 0) {
    await deleteRows('places', duplicatePlaceIds);
  }

  console.log('Duplicate place merge applied.');
}

main().catch(error => {
  console.error('Duplicate place merge failed:', error);
  process.exit(1);
});
