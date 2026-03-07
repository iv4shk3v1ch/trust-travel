/**
 * Explore Page - Personalized Discovery Interface
 * Replaces chatbot with curated sections of places
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth';
import { supabase } from '@/core/database/supabase';
import { Header } from '@/shared/components/Header';
import { Footer } from '@/shared/components/Footer';
import PlaceCard from './PlaceCard';
import dynamic from 'next/dynamic';
import type { RecommendedPlace, RecommendationMode } from '@/core/services/recommender';

// Lazy load map for better performance
const ExploreMap = dynamic(() => import('./ExploreMap'), {
  ssr: false,
  loading: () => <div className="bg-gray-100 animate-pulse h-full rounded-lg"></div>
});

const PAGE_SIZE = 20;

interface ItineraryPlace {
  id: string;
  name: string;
  category: string;
  address: string | null;
  photo_urls: string[];
  price_level: string | null;
  average_rating: number;
  indoor_outdoor: string | null;
}

interface SavedItinerary {
  id: string;
  name: string;
  start_date: string;
  num_days: number;
  days: Array<{ id: string; date: string; places: ItineraryPlace[] }>;
}

type ExploreApiResponse = {
  places?: RecommendedPlace[];
  page?: number;
  hasMore?: boolean;
  diagnostics?: {
    collaborativeCoverage?: 'available' | 'missing';
  };
};

function mergeUniquePlaces(existing: RecommendedPlace[], incoming: RecommendedPlace[]): RecommendedPlace[] {
  if (!incoming.length) return existing;
  const byId = new Map<string, RecommendedPlace>();
  for (const place of existing) {
    byId.set(place.id, place);
  }
  for (const place of incoming) {
    byId.set(place.id, place);
  }
  return Array.from(byId.values());
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState<string>('Trento');
  const [recommendationMode, setRecommendationMode] = useState<RecommendationMode>('cf_only');
  const [collaborativeCoverage, setCollaborativeCoverage] = useState<'available' | 'missing' | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState<'collapsed' | 'half' | 'full'>('collapsed'); // Mobile bottom sheet
  const [selectedPlace, setSelectedPlace] = useState<RecommendedPlace | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Category filter
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search query
  const [allPlaces, setAllPlaces] = useState<RecommendedPlace[]>([]); // All fetched places
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Advanced filters (UPDATED TO NEW SCHEMA)
  const [priceFilter, setPriceFilter] = useState<string[]>([]); // 'budget', 'moderate', 'expensive', 'luxury'
  const [environmentFilter, setEnvironmentFilter] = useState<string>(''); // 'indoor', 'outdoor', 'mixed', or ''
  
  // Saved places
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);

  // Itinerary modal state
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [selectedPlaceForItinerary, setSelectedPlaceForItinerary] = useState<RecommendedPlace | null>(null);
  const [userItineraries, setUserItineraries] = useState<SavedItinerary[]>([]);
  const [loadingItineraries, setLoadingItineraries] = useState(false);

  // Bottom sheet touch handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Refs for scrolling to place cards
  const placeCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const fetchRequestVersionRef = useRef(0);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchExplorePage = async (page: number, append: boolean) => {
    if (!user) return;

    const requestVersion = ++fetchRequestVersionRef.current;
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const placesResponse = await fetch(
        `/api/explore?section=for-you&city=${encodeURIComponent(selectedCity)}&mode=${encodeURIComponent(recommendationMode)}&page=${page}&pageSize=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!placesResponse.ok) {
        throw new Error(`Explore API request failed: ${placesResponse.status}`);
      }

      const placesData = (await placesResponse.json()) as ExploreApiResponse;
      if (requestVersion !== fetchRequestVersionRef.current) {
        return;
      }

      const nextPlaces = placesData.places || [];
      setAllPlaces(prev => (append ? mergeUniquePlaces(prev, nextPlaces) : nextPlaces));
      setHasMore(Boolean(placesData.hasMore));
      setCurrentPage(placesData.page || page);
      setCollaborativeCoverage(placesData.diagnostics?.collaborativeCoverage || null);
    } catch (error) {
      console.error('Error fetching explore places:', error);
    } finally {
      if (requestVersion !== fetchRequestVersionRef.current) {
        return;
      }
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchSavedPlaces = async () => {
    if (!user) return;
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const favoritesResponse = await fetch('/api/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!favoritesResponse.ok) {
        throw new Error(`Favorites API request failed: ${favoritesResponse.status}`);
      }

      const favoritesData = await favoritesResponse.json();
      setSavedPlaceIds(favoritesData.savedPlaceIds || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || loading || !hasMore) return;
    await fetchExplorePage(currentPage + 1, true);
  };

  // Fetch all recommendations and saved places
  useEffect(() => {
    if (!user) return;
    setAllPlaces([]);
    setHasMore(false);
    setCurrentPage(1);
    setCollaborativeCoverage(null);
    fetchExplorePage(1, false);
    fetchSavedPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedCity, recommendationMode]);

  // NEW SCHEMA: 5 Main categories for filtering
  const mainCategories = {
    'food_drink': { label: 'Food & Drink', icon: '🍽️' },
    'nightlife': { label: 'Nightlife', icon: '🌙' },
    'culture_sights': { label: 'Culture & Sights', icon: '🏛️' },
    'nature_outdoor': { label: 'Nature & Outdoor', icon: '🌳' },
    'shopping_activities': { label: 'Shopping & Activities', icon: '🛍️' },
  };

  // State for filter modal
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter places by search and all filter criteria (UPDATED FOR NEW SCHEMA)
  const filteredPlaces = allPlaces.filter(place => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter - Now uses main categories from subcategory mapping
    const matchesCategory = selectedCategories.length === 0 || (() => {
      // Place category is a subcategory (e.g., 'restaurant')
      // We need to check if its parent main category is selected
      // For now, we'll do a simpler match - TODO: add proper main category mapping in API
      return selectedCategories.some(selectedMain => {
        // This is a temporary match - ideally we'd have main_category field from DB
        if (selectedMain === 'food_drink') {
          return ['restaurant', 'street_food', 'cafe', 'bar'].includes(place.category);
        }
        if (selectedMain === 'nightlife') {
          return ['nightclub'].includes(place.category);
        }
        if (selectedMain === 'culture_sights') {
          return ['museum', 'art_gallery', 'historical_site', 'landmark'].includes(place.category);
        }
        if (selectedMain === 'nature_outdoor') {
          return ['park', 'viewpoint', 'hiking_trail', 'lake_river_beach'].includes(place.category);
        }
        if (selectedMain === 'shopping_activities') {
          return ['market', 'shopping_area', 'entertainment_venue', 'spa_wellness'].includes(place.category);
        }
        return false;
      });
    })();

    // Price filter - Now uses price_category strings
    const matchesPrice = priceFilter.length === 0 || (() => {
      const priceCategory = place.price_category || place.price_level || 'moderate';
      return priceFilter.includes(priceCategory);
    })();

    // Environment filter
    const matchesEnvironment = !environmentFilter ||
      place.indoor_outdoor === environmentFilter ||
      (environmentFilter === 'mixed' && place.indoor_outdoor === 'mixed');

    // Distance filter (if user location available - for now we skip this)
    const matchesDistance = true; // TODO: Implement geolocation-based distance filtering

    return matchesSearch && matchesCategory && matchesPrice && matchesEnvironment && matchesDistance;
  });
  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedCategories.length > 0 ||
    priceFilter.length > 0 ||
    environmentFilter
  );

  // Debug logging
  console.log('🎯 Filter State:', {
    allPlaces: allPlaces.length,
    filteredPlaces: filteredPlaces.length,
    selectedCategories: selectedCategories.length,
    priceFilter: priceFilter.length,
    environmentFilter,
    searchQuery
  });

  // Handle place actions
  const handleLike = async (placeId: string) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        console.error('❌ No auth token');
        return;
      }

      const isSaved = savedPlaceIds.includes(placeId);
      const action = isSaved ? 'unsave' : 'save';

      console.log('🔄 Toggling favorite:', { placeId, action, isSaved });

      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ place_id: placeId, action })
      });

      console.log('📡 Response status:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('📦 Response body:', result);

      if (response.ok) {
        // Update local state
        if (isSaved) {
          setSavedPlaceIds(prev => prev.filter(id => id !== placeId));
          console.log('✅ Removed from favorites');
        } else {
          setSavedPlaceIds(prev => [...prev, placeId]);
          console.log('✅ Added to favorites');
        }
      } else {
        console.error('❌ Failed to toggle favorite. Status:', response.status);
        console.error('❌ Error details:', result);
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
    }
  };

  const handleViewDetails = (place: RecommendedPlace) => {
    setSelectedPlace(place);
    setIsDetailsOpen(true);
  };

  const handleWriteReview = (place: RecommendedPlace) => {
    // Navigate to reviews page with place pre-selected
    window.location.href = `/reviews?placeId=${place.id}&placeName=${encodeURIComponent(place.name)}`;
  };

  const handleAddToItinerary = async (place: RecommendedPlace) => {
    setSelectedPlaceForItinerary(place);
    setLoadingItineraries(true);
    setIsItineraryModalOpen(true);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/itineraries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserItineraries(data.itineraries || []);
      }
    } catch (error) {
      console.error('Error loading itineraries:', error);
    } finally {
      setLoadingItineraries(false);
    }
  };

  const addPlaceToItinerary = async (itineraryId: string, dayIndex: number) => {
    if (!selectedPlaceForItinerary) return;

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      // Get the current itinerary
      const itinerary = userItineraries.find(it => it.id === itineraryId);
      if (!itinerary) return;

      // Add place to the selected day
      const updatedDays = [...itinerary.days];
      if (!updatedDays[dayIndex]) {
        updatedDays[dayIndex] = { id: `day-${dayIndex}`, date: '', places: [] };
      }
      
      // Check if place already exists in this day
      if (updatedDays[dayIndex].places.some((p: ItineraryPlace) => p.id === selectedPlaceForItinerary.id)) {
        alert('This place is already in this day!');
        return;
      }

      updatedDays[dayIndex].places.push({
        id: selectedPlaceForItinerary.id,
        name: selectedPlaceForItinerary.name,
        category: selectedPlaceForItinerary.category,
        address: selectedPlaceForItinerary.address || null,
        photo_urls: selectedPlaceForItinerary.photo_urls || [],
        price_level: selectedPlaceForItinerary.price_level || null,
        average_rating: selectedPlaceForItinerary.average_rating,
        indoor_outdoor: selectedPlaceForItinerary.indoor_outdoor || null
      });

      // Update itinerary
      const response = await fetch('/api/itineraries', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: itineraryId,
          days: updatedDays
        })
      });

      if (response.ok) {
        alert(`✅ Added "${selectedPlaceForItinerary.name}" to itinerary!`);
        setIsItineraryModalOpen(false);
        setSelectedPlaceForItinerary(null);
      }
    } catch (error) {
      console.error('Error adding place to itinerary:', error);
      alert('Failed to add place to itinerary');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Sign in to explore Italian cities
          </h1>
          <p className="text-gray-600 mb-8">
            Get personalized recommendations based on your preferences
          </p>
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle bottom sheet swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (Math.abs(distance) < minSwipeDistance) return;

    if (distance > 0) {
      // Swipe up
      if (bottomSheetHeight === 'collapsed') setBottomSheetHeight('half');
      else if (bottomSheetHeight === 'half') setBottomSheetHeight('full');
    } else {
      // Swipe down
      if (bottomSheetHeight === 'full') setBottomSheetHeight('half');
      else if (bottomSheetHeight === 'half') setBottomSheetHeight('collapsed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-[1920px] mx-auto w-full relative">
        {/* Desktop: Side-by-side layout */}
        {!isMobile ? (
          <div className="flex h-[calc(100vh-64px)]">
            {/* Left Panel: Sections & Cards */}
            <div className="w-1/2 lg:w-2/5 overflow-y-auto bg-gray-50 relative z-10">
              {/* Search Bar + Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
              <div className="mb-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  Explore {selectedCity}
                </h1>
                <p className="text-sm text-gray-600">
                  {loading ? (
                    <span className="animate-pulse">Loading places...</span>
                  ) : (
                    <span>
                      {filteredPlaces.length}{hasMore ? '+' : ''} {filteredPlaces.length === 1 ? 'place' : 'places'}
                      {hasActiveFilters && ' matching your filters'}
                    </span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Trento', 'Milan', 'Rome', 'Florence'].map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Mode</label>
                  <select
                    value={recommendationMode}
                    onChange={(e) => setRecommendationMode(e.target.value as RecommendationMode)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cf_only">CF Only</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="popular">Popular</option>
                  </select>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search places by name, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <svg
                  className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Button */}
            <div className="sticky top-[116px] z-[9] bg-white border-b border-gray-200 px-4 py-3">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="font-medium text-gray-700">
                    {(() => {
                      const activeFilterCount = selectedCategories.length + priceFilter.length + 
                        (environmentFilter ? 1 : 0);
                      return activeFilterCount === 0 
                        ? 'Filters' 
                        : `${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} active`;
                    })()}
                  </span>
                </div>
                {(selectedCategories.length > 0 || priceFilter.length > 0 || environmentFilter) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategories([]);
                      setPriceFilter([]);
                      setEnvironmentFilter('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </button>
            </div>

            {/* Filter Modal */}
            {isFilterOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-[100]"
                  onClick={() => setIsFilterOpen(false)}
                />

                {/* Modal - Bottom sheet on mobile, centered on desktop */}
                <div className={`fixed bg-white shadow-2xl z-[110] overflow-hidden ${
                  isMobile
                    ? 'bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh] animate-slide-up'
                    : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] rounded-lg'
                }`}>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="overflow-y-auto p-4 max-h-[60vh]">
                    {/* Price Filter - NEW SCHEMA */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">💰 Price Category</h3>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'budget', label: '€', desc: '<€10' },
                          { value: 'moderate', label: '€€', desc: '€10-30' },
                          { value: 'expensive', label: '€€€', desc: '€30-60' },
                          { value: 'luxury', label: '€€€€', desc: '>€60' }
                        ].map(({ value, label, desc }) => (
                          <button
                            key={value}
                            onClick={() => {
                              setPriceFilter(prev =>
                                prev.includes(value)
                                  ? prev.filter(p => p !== value)
                                  : [...prev, value]
                              );
                            }}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                              priceFilter.includes(value)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="font-bold">{label}</div>
                            <div className="text-xs mt-0.5 opacity-80">{desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Environment Filter */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">🏞️ Environment</h3>
                      <div className="flex gap-2">
                        {[
                          { value: '', label: 'Any', icon: '🌐' },
                          { value: 'indoor', label: 'Indoor', icon: '🏛️' },
                          { value: 'outdoor', label: 'Outdoor', icon: '🌳' }
                        ].map(({ value, label, icon }) => (
                          <button
                            key={value || 'any'}
                            onClick={() => setEnvironmentFilter(value)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                              environmentFilter === value
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {icon} {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category Filter - NEW: 5 Main Categories */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">🏷️ Categories</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(mainCategories).map(([slug, { label, icon }]) => (
                          <button
                            key={slug}
                            onClick={() => {
                              setSelectedCategories(prev =>
                                prev.includes(slug)
                                  ? prev.filter(c => c !== slug)
                                  : [...prev, slug]
                              );
                            }}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-left transition ${
                              selectedCategories.includes(slug)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <span className="text-xl">{icon}</span>
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        setSelectedCategories([]);
                        setPriceFilter([]);
                        setEnvironmentFilter('');
                      }}
                      className="text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Clear All Filters
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Show {filteredPlaces.length} {filteredPlaces.length === 1 ? 'Place' : 'Places'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Places List */}
            <div className={`px-4 py-6 space-y-4 ${isMobile ? 'pb-24' : ''}`}>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))
              ) : filteredPlaces.length === 0 ? (
                // Empty state
                <div className="bg-white rounded-lg p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No places found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {recommendationMode === 'cf_only' && collaborativeCoverage === 'missing'
                      ? 'This account does not have enough overlapping review history for pure collaborative filtering yet. Complete the home-city seed onboarding and use Hybrid until you accumulate more real overlapping reviews.'
                      : searchQuery 
                      ? `No results for "${searchQuery}"`
                      : selectedCategories.length > 0 
                        ? 'Try selecting different categories or clear filters'
                        : 'No places available at the moment'}
                  </p>
                  {(searchQuery || selectedCategories.length > 0) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategories([]);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  )}
                  {hasMore && (
                    <div className="mt-4">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isLoadingMore ? 'Loading more...' : `Load more places (${PAGE_SIZE})`}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Place cards */}
                  {filteredPlaces.map(place => (
                    <div
                      key={place.id}
                      ref={(el) => {
                        if (el) placeCardRefs.current.set(place.id, el);
                        else placeCardRefs.current.delete(place.id);
                      }}
                    >
                      <PlaceCard
                        place={place}
                        isSaved={savedPlaceIds.includes(place.id)}
                        onLike={() => handleLike(place.id)}
                        onViewDetails={() => handleViewDetails(place)}
                        onWriteReview={() => handleWriteReview(place)}
                        onAddToItinerary={() => handleAddToItinerary(place)}
                        onClick={() => {
                          // Center map on this place
                          setSelectedPlace(place);
                        }}
                      />
                    </div>
                  ))}

                  {hasMore && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isLoadingMore ? 'Loading more...' : `Load ${PAGE_SIZE} more`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Panel: Map (Desktop only) */}
          <div className="w-1/2 lg:w-3/5 sticky top-0 h-full relative">
            <div className="absolute inset-0">
              <ExploreMap
                city={selectedCity}
                places={filteredPlaces}
                selectedPlace={selectedPlace}
                onPlaceClick={(place) => {
                  setSelectedPlace(place);
                  setIsDetailsOpen(true); // Open inline details panel
                  // Scroll to the place card
                  const cardElement = placeCardRefs.current.get(place.id);
                  if (cardElement) {
                    cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
              />
            </div>
            
            {/* Inline Details Panel - Google Maps style */}
            {isDetailsOpen && selectedPlace && (
              <div 
                className="absolute top-4 right-4 bottom-4 w-96 bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
                style={{ zIndex: 1000 }}
              >
                {/* Close button */}
                <button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setSelectedPlace(null);
                  }}
                  className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition shadow-lg z-10"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Header Image */}
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={selectedPlace.photo_urls?.[0] || '/placeholder-place.svg'}
                      alt={selectedPlace.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {selectedPlace.name}
                    </h2>
                    
                    {/* Category */}
                    <p className="text-sm text-gray-600 capitalize mb-3">
                      {selectedPlace.category.replace(/-/g, ' ')}
                    </p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="ml-1 font-semibold text-gray-900">
                          {selectedPlace.average_rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        ({selectedPlace.review_count} reviews)
                      </span>
                    </div>
                    
                    {/* Description */}
                    {selectedPlace.description && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {selectedPlace.description}
                        </p>
                      </div>
                    )}
                    
                    {/* Address */}
                    {selectedPlace.address && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                        <p className="text-gray-700 text-sm flex items-start gap-2">
                          <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {selectedPlace.address}
                        </p>
                      </div>
                    )}
                    
                    {/* Match Score */}
                    {selectedPlace.final_score && (
                      <div className="mb-4 bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Match Score</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {(selectedPlace.final_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons at Bottom */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => selectedPlace && handleLike(selectedPlace.id)}
                      className={`px-4 py-2 rounded-lg transition font-medium text-sm flex items-center justify-center gap-2 ${
                        savedPlaceIds.includes(selectedPlace.id)
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <svg className="w-5 h-5" fill={savedPlaceIds.includes(selectedPlace.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {savedPlaceIds.includes(selectedPlace.id) ? 'Saved' : 'Save'}
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedPlaceForItinerary(selectedPlace);
                        setIsItineraryModalOpen(true);
                      }}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add to Trip
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        ) : (
          /* Mobile: Full-screen map + bottom sheet */
          <div className="h-[calc(100vh-64px)] relative">
            {/* Full-screen Map */}
            <div className="absolute inset-0 z-0">
              <ExploreMap
                city={selectedCity}
                places={filteredPlaces}
                selectedPlace={selectedPlace}
                onPlaceClick={(place) => {
                  setSelectedPlace(place);
                  setBottomSheetHeight('half'); // Expand to show place details
                  // Scroll to the place card
                  setTimeout(() => {
                    const cardElement = placeCardRefs.current.get(place.id);
                    if (cardElement) {
                      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 300); // Wait for bottom sheet animation
                }}
              />
            </div>

            {/* Bottom Sheet */}
            <div
              className={`absolute left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out z-20 ${
                bottomSheetHeight === 'collapsed'
                  ? 'bottom-0 h-20'
                  : bottomSheetHeight === 'half'
                  ? 'bottom-0 h-[50vh]'
                  : 'bottom-0 h-[calc(100vh-100px)]'
              }`}
            >
              {/* Drag Handle */}
              <div
                className="w-full py-3 cursor-grab active:cursor-grabbing flex justify-center select-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                  if (bottomSheetHeight === 'collapsed') setBottomSheetHeight('half');
                  else if (bottomSheetHeight === 'half') setBottomSheetHeight('full');
                  else setBottomSheetHeight('collapsed');
                }}
              >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Bottom Sheet Content */}
              <div className="h-[calc(100%-48px)] overflow-y-auto">
                {bottomSheetHeight === 'collapsed' ? (
                  /* Collapsed: Show summary */
                  <div className="px-4 pb-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      Explore {selectedCity}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {filteredPlaces.length}{hasMore ? '+' : ''} {filteredPlaces.length === 1 ? 'place' : 'places'} on map
                    </p>
                  </div>
                ) : (
                  /* Expanded: Show full list */
                  <div className="px-4 pb-6">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                        <select
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {['Trento', 'Milan', 'Rome', 'Florence'].map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Mode</label>
                        <select
                          value={recommendationMode}
                          onChange={(e) => setRecommendationMode(e.target.value as RecommendationMode)}
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="cf_only">CF Only</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="popular">Popular</option>
                        </select>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search places..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-4 py-2.5 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <svg
                          className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter Button */}
                    <div className="mb-4">
                      <button
                        onClick={() => setIsFilterOpen(true)}
                        className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters
                        {(selectedCategories.length > 0 || priceFilter.length > 0 || environmentFilter) && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {selectedCategories.length + priceFilter.length + (environmentFilter ? 1 : 0)}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Place Cards */}
                    <div className="space-y-3">
                      {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
                        ))
                      ) : filteredPlaces.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-gray-500 text-lg mb-2">No places found</p>
                          <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                          {hasMore && (
                            <button
                              onClick={handleLoadMore}
                              disabled={isLoadingMore}
                              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isLoadingMore ? 'Loading more...' : `Load more places (${PAGE_SIZE})`}
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          {filteredPlaces.map(place => (
                            <div
                              key={place.id}
                              ref={(el) => {
                                if (el) placeCardRefs.current.set(place.id, el);
                                else placeCardRefs.current.delete(place.id);
                              }}
                            >
                              <PlaceCard
                                place={place}
                                isSaved={savedPlaceIds.includes(place.id)}
                                onLike={() => handleLike(place.id)}
                                onViewDetails={() => handleViewDetails(place)}
                                onWriteReview={() => handleWriteReview(place)}
                                onAddToItinerary={() => handleAddToItinerary(place)}
                                onClick={() => {
                                  setSelectedPlace(place);
                                  setBottomSheetHeight('collapsed'); // Collapse to show map
                                }}
                              />
                            </div>
                          ))}

                          {hasMore && (
                            <div className="pt-1 pb-2 text-center">
                              <button
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                                className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {isLoadingMore ? 'Loading more...' : `Load ${PAGE_SIZE} more`}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Floating Filter Button (only when bottom sheet is collapsed) */}
        {isMobile && bottomSheetHeight === 'collapsed' && (
          <button
            onClick={() => setIsFilterOpen(true)}
            className="fixed bottom-24 right-6 z-30 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {(selectedCategories.length > 0 || priceFilter.length > 0 || environmentFilter) && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {selectedCategories.length + priceFilter.length + (environmentFilter ? 1 : 0)}
              </span>
            )}
          </button>
        )}

        {/* Floating Add Place Button */}
        <button
          onClick={() => window.location.href = '/add-place'}
          className={`fixed right-6 z-30 bg-gradient-to-r from-green-500 to-emerald-600 text-white w-16 h-16 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group ${
            isMobile && bottomSheetHeight === 'collapsed' ? 'bottom-40' : 'bottom-6'
          }`}
          title="Add new place"
        >
          <svg 
            className="w-8 h-8 transition-transform group-hover:rotate-90" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </main>

      {/* Add to Itinerary Modal */}
      {isItineraryModalOpen && selectedPlaceForItinerary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Add to Itinerary</h3>
                <p className="text-sm text-blue-100">{selectedPlaceForItinerary.name}</p>
              </div>
              <button
                onClick={() => {
                  setIsItineraryModalOpen(false);
                  setSelectedPlaceForItinerary(null);
                }}
                className="text-white hover:bg-white/20 rounded-full p-1 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              {loadingItineraries ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your itineraries...</p>
                </div>
              ) : userItineraries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📋</div>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">No itineraries yet</h4>
                  <p className="text-gray-500 mb-4">Create an itinerary first to add places</p>
                  <a
                    href="/itinerary"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Create Itinerary
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600 mb-4">Select an itinerary and day to add this place:</p>
                  {userItineraries.map((itinerary) => (
                    <div
                      key={itinerary.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition"
                    >  <h4 className="font-semibold text-gray-800 mb-2">{itinerary.name}</h4>
                      <p className="text-sm text-gray-500 mb-3">
                        {new Date(itinerary.start_date).toLocaleDateString()} · {itinerary.num_days} days
                      </p>
                      
                      {/* Day selector */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {Array.from({ length: itinerary.num_days }, (_, dayIndex) => {
                          const dayDate = new Date(itinerary.start_date);
                          dayDate.setDate(dayDate.getDate() + dayIndex);
                          const placesCount = itinerary.days[dayIndex]?.places?.length || 0;
                          
                          return (
                            <button
                              key={dayIndex}
                              onClick={() => addPlaceToItinerary(itinerary.id, dayIndex)}
                              className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition text-center"
                            >
                              <div className="font-semibold">Day {dayIndex + 1}</div>
                              <div className="text-xs text-blue-600">
                                {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {placesCount} {placesCount === 1 ? 'place' : 'places'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
