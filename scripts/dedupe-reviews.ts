/**
 * Collapse duplicate reviews to one row per user/place.
 *
 * Policy:
 * - keep the latest review by visit_date
 * - break ties with updated_at, then created_at, then longer comment
 * - delete the remaining rows in each duplicate group
 *
 * Usage:
 *   npx tsx scripts/dedupe-reviews.ts --dry-run
 *   npx tsx scripts/dedupe-reviews.ts --apply
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function normalizeWhitespace(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function parseSortableDate(value: string | null | undefined): number {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return 0;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function compareRows(a: ReviewRow, b: ReviewRow): number {
  const visitDiff = parseSortableDate(b.visit_date) - parseSortableDate(a.visit_date);
  if (visitDiff !== 0) return visitDiff;

  const updatedDiff = parseSortableDate(b.updated_at) - parseSortableDate(a.updated_at);
  if (updatedDiff !== 0) return updatedDiff;

  const createdDiff = parseSortableDate(b.created_at) - parseSortableDate(a.created_at);
  if (createdDiff !== 0) return createdDiff;

  return normalizeWhitespace(b.comment).length - normalizeWhitespace(a.comment).length;
}

async function loadAllReviews(): Promise<ReviewRow[]> {
  const rows: ReviewRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, user_id, place_id, visit_date, overall_rating, comment, created_at, updated_at')
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...(data as ReviewRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function deleteReviews(ids: string[]): Promise<void> {
  const batchSize = 500;
  for (let index = 0; index < ids.length; index += batchSize) {
    const chunk = ids.slice(index, index + batchSize);
    const { error } = await supabase.from('reviews').delete().in('id', chunk);
    if (error) throw error;
  }
}

async function main() {
  const apply = hasFlag('--apply');
  const reviews = await loadAllReviews();
  const groups = new Map<string, ReviewRow[]>();

  for (const review of reviews) {
    const key = `${review.user_id}|${review.place_id}`;
    const bucket = groups.get(key) || [];
    bucket.push(review);
    groups.set(key, bucket);
  }

  const duplicateGroups = Array.from(groups.entries())
    .map(([key, rows]) => ({ key, rows: rows.sort(compareRows) }))
    .filter(group => group.rows.length > 1)
    .sort((a, b) => b.rows.length - a.rows.length);

  const idsToDelete = duplicateGroups.flatMap(group => group.rows.slice(1).map(row => row.id));

  console.log(`Reviews scanned: ${reviews.length}`);
  console.log(`Duplicate user/place groups: ${duplicateGroups.length}`);
  console.log(`Duplicate rows to delete: ${idsToDelete.length}`);

  for (const group of duplicateGroups.slice(0, 10)) {
    const keep = group.rows[0];
    console.log(`- ${group.key}: ${group.rows.length} rows, keeping ${keep.id} (${keep.visit_date || 'no-date'})`);
  }

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to delete duplicates.');
    return;
  }

  if (!idsToDelete.length) {
    console.log('No duplicate rows to delete.');
    return;
  }

  await deleteReviews(idsToDelete);
  console.log('Duplicate rows deleted.');
}

main().catch(error => {
  console.error('Review dedupe failed:', error);
  process.exit(1);
});
