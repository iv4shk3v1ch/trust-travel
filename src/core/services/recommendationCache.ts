/**
 * Recommendation Result Cache
 * 
 * LRU cache for expensive recommendation queries to dramatically improve
 * performance for repeat/similar searches.
 * 
 * Cache Strategy:
 * - Key: Hash of context (location + categories + tags + budget + userId)
 * - TTL: 15 minutes
 * - Max Size: 500 unique queries
 * - Eviction: Least Recently Used (LRU)
 * 
 * Expected Impact:
 * - First query: ~200-300ms (DB + computation)
 * - Cached query: <5ms (memory lookup)
 * - 40x faster for repeat queries
 * - 80%+ cache hit rate in production
 */

import { LRUCache } from 'lru-cache';
import type { RecommendationContext, RecommendedPlace } from './recommendationEngineV2';

// Cache configuration
const CACHE_CONFIG = {
  max: 500,                          // Maximum 500 unique queries cached
  ttl: 1000 * 60 * 15,              // 15 minutes TTL
  updateAgeOnGet: true,              // LRU behavior - updates age on access
  allowStale: false,                 // Never return stale results
  ttlAutopurge: true,                // Automatically purge expired items
};

// Initialize LRU cache
const cache = new LRUCache<string, RecommendedPlace[]>(CACHE_CONFIG);

// Cache statistics (for monitoring)
let stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  evictions: 0,
  totalQueries: 0,
};

/**
 * Generate a consistent cache key from recommendation context
 * 
 * The key includes all parameters that affect results:
 * - intent type
 * - location
 * - categories (sorted for consistency)
 * - experience tags (sorted)
 * - budget
 * - userId (for personalized results)
 * - timeContext
 * - environment
 */
function generateCacheKey(context: RecommendationContext): string {
  const key = {
    intent: context.intent,
    location: context.location?.toLowerCase().trim() || 'any',
    categories: [...(context.categories || [])].sort(),
    experienceTags: [...(context.experienceTags || [])].sort(),
    budget: context.budget || 'any',
    userId: context.userId || 'anonymous',
    timeContext: context.timeContext || 'anytime',
    environment: context.environment || 'any',
    // Note: We don't include userProfile in the key because userId already makes it unique
  };
  
  return JSON.stringify(key);
}

/**
 * Get cached recommendations or null if not found
 */
export function getCachedRecommendations(
  context: RecommendationContext
): RecommendedPlace[] | null {
  stats.totalQueries++;
  
  const key = generateCacheKey(context);
  const cached = cache.get(key);
  
  if (cached) {
    stats.hits++;
    const hitRate = ((stats.hits / stats.totalQueries) * 100).toFixed(1);
    console.log(`✅ Cache HIT (${hitRate}% hit rate) - Key: ${key.substring(0, 100)}...`);
    return cached;
  }
  
  stats.misses++;
  console.log(`❌ Cache MISS - Key: ${key.substring(0, 100)}...`);
  return null;
}

/**
 * Store recommendations in cache
 */
export function setCachedRecommendations(
  context: RecommendationContext,
  recommendations: RecommendedPlace[]
): void {
  const key = generateCacheKey(context);
  
  // Track evictions (when cache is full and we need to remove LRU item)
  const sizeBefore = cache.size;
  cache.set(key, recommendations);
  const sizeAfter = cache.size;
  
  if (sizeBefore >= CACHE_CONFIG.max && sizeAfter === CACHE_CONFIG.max) {
    stats.evictions++;
  }
  
  stats.sets++;
  console.log(`💾 Cached ${recommendations.length} recommendations - Cache size: ${cache.size}/${CACHE_CONFIG.max}`);
}

/**
 * Invalidate cache for a specific user (e.g., after profile update)
 */
export function invalidateUserCache(userId: string): number {
  let invalidated = 0;
  
  // Find all keys containing this userId
  for (const [key] of cache.entries()) {
    if (key.includes(`"userId":"${userId}"`)) {
      cache.delete(key);
      invalidated++;
    }
  }
  
  if (invalidated > 0) {
    console.log(`🗑️ Invalidated ${invalidated} cache entries for user ${userId}`);
  }
  
  return invalidated;
}

/**
 * Invalidate cache for a specific location (e.g., after new places added)
 */
export function invalidateLocationCache(location: string): number {
  let invalidated = 0;
  const normalizedLocation = location.toLowerCase().trim();
  
  for (const [key] of cache.entries()) {
    if (key.includes(`"location":"${normalizedLocation}"`)) {
      cache.delete(key);
      invalidated++;
    }
  }
  
  if (invalidated > 0) {
    console.log(`🗑️ Invalidated ${invalidated} cache entries for location "${location}"`);
  }
  
  return invalidated;
}

/**
 * Clear entire cache (e.g., during deployment or major data updates)
 */
export function clearCache(): void {
  const sizeBefore = cache.size;
  cache.clear();
  console.log(`🗑️ Cleared entire cache (${sizeBefore} entries)`);
  
  // Reset stats
  stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
    totalQueries: 0,
  };
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  const hitRate = stats.totalQueries > 0 
    ? ((stats.hits / stats.totalQueries) * 100).toFixed(1)
    : '0.0';
  
  return {
    ...stats,
    hitRate: `${hitRate}%`,
    currentSize: cache.size,
    maxSize: CACHE_CONFIG.max,
    utilizationPercent: ((cache.size / CACHE_CONFIG.max) * 100).toFixed(1) + '%',
  };
}

/**
 * Prewarm cache with common queries (optional, for production optimization)
 * 
 * This can be called during app initialization or via a cron job to
 * populate the cache with frequently requested queries.
 */
export async function prewarmCache(
  commonQueries: RecommendationContext[],
  fetchFunction: (ctx: RecommendationContext) => Promise<RecommendedPlace[]>
): Promise<number> {
  let prewarmed = 0;
  
  console.log(`🔥 Prewarming cache with ${commonQueries.length} common queries...`);
  
  for (const query of commonQueries) {
    try {
      const results = await fetchFunction(query);
      setCachedRecommendations(query, results);
      prewarmed++;
    } catch (error) {
      console.error(`Failed to prewarm query:`, error);
    }
  }
  
  console.log(`✅ Prewarmed ${prewarmed}/${commonQueries.length} cache entries`);
  return prewarmed;
}
