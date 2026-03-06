/**
 * Coverage smoke test for the thesis recommender modes.
 *
 * Purpose:
 * - verify that `popular`, `cf_only`, and `hybrid` all return results
 * - identify user/city pairs where CF has no collaborative coverage
 *
 * Usage:
 *   npx tsx scripts/evaluate-recommender-coverage.ts
 *   npx tsx scripts/evaluate-recommender-coverage.ts --user 269156dc-a21f-4198-bee3-15bd6a9255bf
 *   npx tsx scripts/evaluate-recommender-coverage.ts --limit 10
 */

import recommenderApi from '../src/core/services/recommender';
import { supabaseAdmin } from '../src/core/database/supabase';

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type ReviewRow = {
  user_id: string;
  places: {
    city: string | null;
  } | null;
};

const TARGET_CITIES = ['Trento', 'Milan', 'Rome', 'Florence'] as const;

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function loadAllReviewRows(): Promise<ReviewRow[]> {
  const rows: ReviewRow[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('user_id, places!inner(city)')
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(
      ...(data as Array<{ user_id: string; places: { city: string | null } | { city: string | null }[] | null }>)
        .map(row => ({
          user_id: row.user_id,
          places: Array.isArray(row.places) ? (row.places[0] || null) : row.places
        }))
    );

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

async function main() {
  const userIdFilter = getArgValue('--user');
  const limit = Number(getArgValue('--limit') || '5');

  const reviewRows = await loadAllReviewRows();
  const reviewsByUser = new Map<string, number>();
  const citiesByUser = new Map<string, Set<string>>();

  for (const row of reviewRows) {
    reviewsByUser.set(row.user_id, (reviewsByUser.get(row.user_id) || 0) + 1);

    const city = row.places?.city;
    if (!city) continue;
    const bucket = citiesByUser.get(row.user_id) || new Set<string>();
    bucket.add(city);
    citiesByUser.set(row.user_id, bucket);
  }

  const candidateUserIds = userIdFilter
    ? [userIdFilter]
    : Array.from(reviewsByUser.entries())
        .filter(([, count]) => count >= 10)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([userId]) => userId);

  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .in('id', candidateUserIds);

  if (profileError) throw profileError;

  const profileById = new Map((profiles as ProfileRow[] || []).map(profile => [profile.id, profile]));

  console.log(`Coverage check for ${candidateUserIds.length} user(s)\n`);

  for (const userId of candidateUserIds) {
    const profile = profileById.get(userId);
    const reviewCount = reviewsByUser.get(userId) || 0;
    const cities = Array.from(citiesByUser.get(userId) || []).sort().join(', ');

    console.log(`User: ${profile?.full_name || userId}`);
    console.log(`- id: ${userId}`);
    console.log(`- reviews: ${reviewCount}`);
    console.log(`- cities: ${cities || 'none'}`);

    for (const city of TARGET_CITIES) {
      const travelPlan = {
        destination: { area: city, region: city },
        dates: { type: 'custom' as const, isFlexible: false },
        travelType: 'solo' as const,
        experienceTags: [],
        specialNeeds: [],
        completedSteps: [],
        isComplete: true,
        categories: []
      };

      const [popular, cfOnly, hybrid] = await Promise.all([
        recommenderApi.recommendPopular(travelPlan, userId),
        recommenderApi.recommendCFOnly(travelPlan, userId),
        recommenderApi.recommendHybrid(travelPlan, userId)
      ]);

      console.log(
        `  ${city}: popular=${popular.length} cf_only=${cfOnly.length} hybrid=${hybrid.length}`
      );

      if (!cfOnly.length) {
        console.log('    ! cf_only returned no places');
      }
    }

    console.log('');
  }
}

main().catch(error => {
  console.error('Coverage evaluation failed:', error);
  process.exit(1);
});
