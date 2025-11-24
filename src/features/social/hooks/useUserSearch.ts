'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/database/supabase';
import { useAuth } from '@/features/auth/AuthContext';

// Types
interface UserProfile {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  budget: string;
  env_preference: string;
  activity_style: string;
  food_restrictions: string;
}

// Query keys
export const userSearchKeys = {
  all: ['user-search'] as const,
  suggested: () => [...userSearchKeys.all, 'suggested'] as const,
  search: (query: string) => [...userSearchKeys.all, 'query', query] as const,
};

// Calculate user similarity score
function calculateSimilarity(user1: UserProfile, user2: UserProfile): number {
  let score = 0;
  
  // Age similarity (closer ages get higher score)
  const ageDiff = Math.abs(user1.age - user2.age);
  score += Math.max(0, 20 - ageDiff);
  
  // Budget level compatibility
  if (user1.budget === user2.budget) {
    score += 30;
  } else if (
    (user1.budget === 'low' && user2.budget === 'medium') ||
    (user1.budget === 'medium' && user2.budget === 'low') ||
    (user1.budget === 'medium' && user2.budget === 'high') ||
    (user1.budget === 'high' && user2.budget === 'medium')
  ) {
    score += 15;
  }
  
  // Environment preference compatibility
  if (user1.env_preference === user2.env_preference) {
    score += 25;
  } else if (user1.env_preference === 'balanced' || user2.env_preference === 'balanced') {
    score += 12;
  }
  
  // Activity style compatibility
  if (user1.activity_style === user2.activity_style) {
    score += 25;
  } else if (user1.activity_style === 'balanced' || user2.activity_style === 'balanced') {
    score += 12;
  }
  
  // Food restrictions compatibility
  if (user1.food_restrictions === user2.food_restrictions) {
    score += 20;
  }
  
  return score;
}

// Fetch suggested users
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchSuggestedUsers(userId: string, userProfile: any) {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', userId)
    .limit(6);

  if (error) throw error;

  if (!users || users.length === 0) return [];

  // Sort by similarity if we have user profile with required fields
  if (userProfile && userProfile.age && userProfile.budget) {
    return users
      .map(user => ({
        ...user,
        similarity: calculateSimilarity(userProfile as UserProfile, user as UserProfile)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 6);
  }

  return users;
}

// Fetch search results
async function fetchSearchResults(searchQuery: string, userId: string) {
  const searchTerm = searchQuery.trim().toLowerCase();
  
  if (!searchTerm) return [];

  // Get all users first, then filter
  const { data: allUsers, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', userId);

  if (error) throw error;

  // Filter users based on search term
  const filteredUsers = (allUsers || []).filter(user => {
    if (user.full_name?.toLowerCase().includes(searchTerm)) return true;
    if (user.env_preference?.toLowerCase().includes(searchTerm)) return true;
    if (user.activity_style?.toLowerCase().includes(searchTerm)) return true;
    if (user.food_restrictions?.toLowerCase().includes(searchTerm)) return true;
    if (user.budget?.toLowerCase().includes(searchTerm)) return true;
    if (user.gender?.toLowerCase().includes(searchTerm)) return true;
    return false;
  });

  return filteredUsers;
}

/**
 * Hook to fetch suggested users based on similarity to current user
 */
export function useSuggestedUsers() {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: userSearchKeys.suggested(),
    queryFn: () => fetchSuggestedUsers(user?.id || '', profile),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes - suggested users don't change often
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Hook to search for users by query string
 */
export function useUserSearch(searchQuery: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: userSearchKeys.search(searchQuery),
    queryFn: () => fetchSearchResults(searchQuery, user?.id || ''),
    enabled: !!user?.id && searchQuery.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
  });
}
