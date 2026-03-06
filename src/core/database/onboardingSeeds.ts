import { supabase } from './supabase';
import type { SeedRatingValue, SupportedCity } from '@/shared/config/anchorPlaces';

export interface UserSeedRatingRow {
  id?: string;
  user_id: string;
  city: SupportedCity;
  anchor_key: string;
  anchor_name: string;
  concept_key: string;
  place_category: string;
  main_category: string;
  experience_tags: string[];
  rating: number;
  created_at?: string;
  updated_at?: string;
}

export async function loadUserSeedRatings(userId: string, city: SupportedCity): Promise<Record<string, SeedRatingValue>> {
  const { data, error } = await supabase
    .from('user_seed_ratings')
    .select('anchor_key, rating')
    .eq('user_id', userId)
    .eq('city', city);

  if (error) {
    throw error;
  }

  const result: Record<string, SeedRatingValue> = {};
  for (const row of data || []) {
    result[row.anchor_key] = row.rating as SeedRatingValue;
  }

  return result;
}

export async function saveUserSeedRatings(
  userId: string,
  city: SupportedCity,
  rows: UserSeedRatingRow[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('user_seed_ratings')
    .delete()
    .eq('user_id', userId)
    .eq('city', city);

  if (deleteError) {
    throw deleteError;
  }

  if (!rows.length) return;

  const { error } = await supabase
    .from('user_seed_ratings')
    .insert(rows);

  if (error) {
    throw error;
  }
}
