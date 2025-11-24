import { NextResponse } from 'next/server';
import { getCacheStats, clearCache } from '@/core/services/recommendationCache';

/**
 * GET /api/cache/stats - Get cache statistics
 * 
 * Returns current cache performance metrics:
 * - Hit rate
 * - Cache size
 * - Hits/misses/evictions
 */
export async function GET() {
  try {
    const stats = getCacheStats();
    
    return NextResponse.json({
      success: true,
      stats,
      message: 'Cache statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cache/stats - Clear entire cache
 * 
 * Useful during deployments or after major data updates.
 * Note: This is a destructive operation, use with caution!
 */
export async function DELETE() {
  try {
    clearCache();
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
