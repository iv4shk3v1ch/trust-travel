/**
 * Verify the imported TripAdvisor rating matrix.
 *
 * Reports exact metrics for the synthetic TripAdvisor cohort across the target cities:
 * - total users
 * - total places
 * - total reviews
 * - users with >= 10 reviews
 * - users with >= 2 cities
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_CITIES = ['Milan', 'Rome', 'Florence', 'Trento'];

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function normalizeWhitespace(value: string | undefined | null): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

async function main() {
  const cities = (getArgValue('--cities') || DEFAULT_CITIES.join(','))
    .split(',')
    .map(city => normalizeWhitespace(city))
    .filter(Boolean);

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .like('full_name', 'TripAdvisor %');

  if (profileError) throw profileError;

  const profileIds = (profiles || []).map(profile => profile.id);
  if (!profileIds.length) {
    console.log('No TripAdvisor synthetic profiles found.');
    return;
  }

  const reviewsByUser: Record<string, number> = {};
  const citiesByUser: Record<string, Set<string>> = {};
  const places = new Set<string>();
  const reviewsByCity: Record<string, number> = {};
  const placesByCity: Record<string, Set<string>> = {};

  const chunkSize = 100;
  const pageSize = 1000;
  let totalReviews = 0;

  for (let index = 0; index < profileIds.length; index += chunkSize) {
    const chunk = profileIds.slice(index, index + chunkSize);
    let offset = 0;

    while (true) {
      const { data, error } = await supabase
        .from('reviews')
        .select('user_id, place_id, places!inner(city)')
        .in('user_id', chunk)
        .in('places.city', cities)
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      for (const row of data) {
        totalReviews += 1;
        const city = row.places.city as string;
        reviewsByUser[row.user_id] = (reviewsByUser[row.user_id] || 0) + 1;
        reviewsByCity[city] = (reviewsByCity[city] || 0) + 1;
        places.add(row.place_id);

        if (!citiesByUser[row.user_id]) {
          citiesByUser[row.user_id] = new Set<string>();
        }
        citiesByUser[row.user_id].add(city);

        if (!placesByCity[city]) {
          placesByCity[city] = new Set<string>();
        }
        placesByCity[city].add(row.place_id);
      }

      if (data.length < pageSize) break;
      offset += pageSize;
    }
  }

  const activeUsers = Object.keys(reviewsByUser).length;
  const usersWith10Reviews = Object.values(reviewsByUser).filter(count => count >= 10).length;
  const usersWith2Cities = Object.values(citiesByUser).filter(citySet => citySet.size >= 2).length;

  console.log('TripAdvisor rating matrix verification');
  console.log(`Cities: ${cities.join(', ')}`);
  console.log(`Total users: ${activeUsers}`);
  console.log(`Total places: ${places.size}`);
  console.log(`Total reviews: ${totalReviews}`);
  console.log(`Users with >= 10 reviews: ${usersWith10Reviews}`);
  console.log(`Users with >= 2 cities: ${usersWith2Cities}`);

  console.log('\nPer-city coverage');
  for (const city of cities) {
    console.log(`- ${city}: ${reviewsByCity[city] || 0} reviews, ${(placesByCity[city] || new Set()).size} places`);
  }

  const distribution = {
    lt5: 0,
    between5And9: 0,
    between10And19: 0,
    gte20: 0
  };

  for (const count of Object.values(reviewsByUser)) {
    if (count < 5) distribution.lt5 += 1;
    else if (count < 10) distribution.between5And9 += 1;
    else if (count < 20) distribution.between10And19 += 1;
    else distribution.gte20 += 1;
  }

  console.log('\nReview-count distribution');
  console.log(`- <5: ${distribution.lt5}`);
  console.log(`- 5-9: ${distribution.between5And9}`);
  console.log(`- 10-19: ${distribution.between10And19}`);
  console.log(`- 20+: ${distribution.gte20}`);
}

main().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
