'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/database/supabase';
import { Header } from '@/shared/components/Header';
import PlaceCard from '@/app/explore/PlaceCard';
import PlaceDetailsDrawer from '@/app/explore/PlaceDetailsDrawer';
import type { RecommendedPlace } from '@/core/services/recommendationEngineV2';

type SortOption = 'recent' | 'rating' | 'match';

export default function FavoritesPage() {
  const router = useRouter();

  const [places, setPlaces] = useState<RecommendedPlace[]>([]);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  
  const [selectedPlace, setSelectedPlace] = useState<RecommendedPlace | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch favorites on mount
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/login');
        return;
      }

      // Fetch saved places with full details
      const response = await fetch('/api/favorites?include_details=true', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', response.status, response.statusText);
        console.error('❌ Error details:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to fetch favorites');
      }

      const data = await response.json();
      setPlaces(data.places || []);
      setSavedPlaceIds(new Set(data.places?.map((p: RecommendedPlace) => p.id) || []));
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Get unique categories from saved places
  const categories = Array.from(new Set(places.map(p => p.category))).sort();

  // Filter and sort places
  const filteredPlaces = places
    .filter(place => selectedCategory === 'all' || place.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return b.average_rating - a.average_rating;
      } else if (sortBy === 'match') {
        return (b.final_score || 0) - (a.final_score || 0);
      }
      return 0; // Recent is default order from API
    });

  // Handle unsave
  const handleUnsave = async (placeId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Optimistic update
      setPlaces(prev => prev.filter(p => p.id !== placeId));
      setSavedPlaceIds(prev => {
        const next = new Set(prev);
        next.delete(placeId);
        return next;
      });

      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          place_id: placeId,
          action: 'unsave',
        }),
      });

      if (!response.ok) {
        // Revert on error
        fetchFavorites();
        throw new Error('Failed to remove favorite');
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  const handleViewDetails = (place: RecommendedPlace) => {
    setSelectedPlace(place);
    setIsDetailsOpen(true);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your favorites...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchFavorites}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  // Empty state
  if (places.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No favorites yet</h2>
          <p className="text-gray-600 mb-6">
            Start exploring and save places you love to see them here!
          </p>
          <button
            onClick={() => router.push('/explore')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Explore Places
          </button>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Back Button */}
          <button 
            onClick={() => router.push('/explore')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition mb-6"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              ❤️ My Favorites
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'}
            </p>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            >
              <option value="all">All Categories ({places.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ({places.filter(p => p.category === cat).length})
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            >
              <option value="recent">Recently Saved</option>
              <option value="rating">Highest Rated</option>
              <option value="match">Best Match</option>
            </select>
          </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlaces.map(place => (
          <div key={place.id} className="relative group">
            <div 
              onClick={() => handleViewDetails(place)}
              className="cursor-pointer"
            >
              <PlaceCard
                place={place}
                isSaved={savedPlaceIds.has(place.id)}
                onLike={() => {}} // Handled by delete button
                onViewDetails={() => {}} // Handled by card click
                hideActions={true} // Hide all action buttons in favorites view
              />
            </div>
            
            {/* Delete button - shows on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUnsave(place.id);
              }}
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              title="Remove from favorites"
            >
              <svg className="w-5 h-5 text-gray-600 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>

      {/* Place Details Drawer */}
      {selectedPlace && (
        <PlaceDetailsDrawer
          place={selectedPlace}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedPlace(null);
          }}
          isSaved={savedPlaceIds.has(selectedPlace.id)}
          onSave={() => handleUnsave(selectedPlace.id)}
        />
      )}
    </div>
    </>
  );
}
