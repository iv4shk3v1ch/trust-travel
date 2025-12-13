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
import PlaceDetailsDrawer from './PlaceDetailsDrawer';
import dynamic from 'next/dynamic';
import type { RecommendedPlace } from '@/core/services/recommendationEngineV2';

// Lazy load map for better performance
const ExploreMap = dynamic(() => import('./ExploreMap'), {
  ssr: false,
  loading: () => <div className="bg-gray-100 animate-pulse h-full rounded-lg"></div>
});

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

export default function ExplorePage() {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState<'collapsed' | 'half' | 'full'>('collapsed'); // Mobile bottom sheet
  const [selectedPlace, setSelectedPlace] = useState<RecommendedPlace | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Category filter
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search query
  const [allPlaces, setAllPlaces] = useState<RecommendedPlace[]>([]); // All fetched places
  const [loading, setLoading] = useState(true);
  
  // Advanced filters
  const [priceFilter, setPriceFilter] = useState<number[]>([]);
  const [environmentFilter, setEnvironmentFilter] = useState<string>(''); // 'indoor', 'outdoor', or ''
  const [distanceFilter, setDistanceFilter] = useState<number>(10); // km
  
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

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch all recommendations and saved places
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) return;

        // Fetch recommendations and saved places in parallel
        const [placesResponse, favoritesResponse] = await Promise.all([
          fetch('/api/explore?section=for-you', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/favorites', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const placesData = await placesResponse.json();
        const favoritesData = await favoritesResponse.json();
        
        console.log('🔍 API Response:', {
          totalPlaces: placesData.places?.length || 0,
          section: placesData.section,
          count: placesData.count
        });
        
        setAllPlaces(placesData.places || []);
        setSavedPlaceIds(favoritesData.savedPlaceIds || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Category groups (organized by type)
  const categoryGroups = {
    'Food & Dining': ['restaurant', 'local-trattoria', 'pizzeria', 'street-food', 'cafe', 'specialty-coffee-bar', 'specialty-coffee', 'food-market', 'co-working-café', 'scenic-cafe'],
    'Bars & Nightlife': ['aperetivo-bar', 'craft-beer-pub', 'rooftop-bar', 'dessert-bar', 'karaoke-bar', 'student-pub', 'underground-club', 'commercial-nightclub'],
    'Culture & Arts': ['museum', 'art-gallery', 'contemporary-art-space', 'street-art-area', 'theatre', 'cinema', 'comedy-club', 'cultural-event-venue', 'exhibition-hall', 'cultural-center', 'library'],
    'Historic & Landmarks': ['historical-landmark', 'castle', 'church', 'tower', 'bridge', 'old-town', 'city-square', 'street'],
    'Nature & Outdoors': ['park', 'botanical-garden', 'viewpoint', 'lake', 'river-walk', 'hiking-trail', 'mountain-peak', 'waterfall', 'forest-walk', 'beach', 'adventure-park', 'picnic-area'],
    'Shopping': ['vintage-store', 'local-market', 'concept-store', 'artisanal-shop', 'wine-shop', 'bookstore', 'shopping-centre'],
    'Wellness & Leisure': ['spa', 'thermal-bath', 'yoga-studio', 'live-music-venue', 'local-festival-area'],
  };

  // State for filter modal
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter places by search and all filter criteria
  const filteredPlaces = allPlaces.filter(place => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter - match exact category slug or if no filters selected
    const matchesCategory = selectedCategories.length === 0 ||
      selectedCategories.includes(place.category);

    // Price filter - handle price_level as string or number
    const matchesPrice = priceFilter.length === 0 || (() => {
      const priceLevel = place.price_level ? 
        (typeof place.price_level === 'string' ? parseInt(place.price_level) : place.price_level) : 2;
      const matches = priceFilter.includes(priceLevel);
      return matches;
    })();

    // Environment filter
    const matchesEnvironment = !environmentFilter ||
      (environmentFilter === 'indoor' && place.indoor_outdoor === 'indoor') ||
      (environmentFilter === 'outdoor' && place.indoor_outdoor === 'outdoor');

    // Distance filter (if user location available - for now we skip this)
    const matchesDistance = true; // TODO: Implement geolocation-based distance filtering

    return matchesSearch && matchesCategory && matchesPrice && matchesEnvironment && matchesDistance;
  });

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
            Sign in to explore Trento
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Explore Trento
                </h1>
                <p className="text-sm text-gray-600">
                  {loading ? (
                    <span className="animate-pulse">Loading places...</span>
                  ) : (
                    <span>
                      {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'}
                      {(searchQuery || selectedCategories.length > 0) && ' matching your filters'}
                    </span>
                  )}
                </p>
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
                    {/* Price Filter */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">💰 Price Level</h3>
                      <div className="flex gap-2">
                        {[1, 2, 3].map(price => (
                          <button
                            key={price}
                            onClick={() => {
                              setPriceFilter(prev =>
                                prev.includes(price)
                                  ? prev.filter(p => p !== price)
                                  : [...prev, price]
                              );
                            }}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                              priceFilter.includes(price)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {'€'.repeat(price)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Environment Filter */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">🏞️ Environment</h3>
                      <div className="flex gap-2">
                        {['', 'indoor', 'outdoor'].map(env => (
                          <button
                            key={env}
                            onClick={() => setEnvironmentFilter(env)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                              environmentFilter === env
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {env === '' ? 'Any' : env === 'indoor' ? '🏛️ Indoor' : '🌳 Outdoor'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Distance Filter */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">📍 Distance (within {distanceFilter} km)</h3>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={distanceFilter}
                        onChange={(e) => setDistanceFilter(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1 km</span>
                        <span>50 km</span>
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">🏷️ Categories</h3>
                      {Object.entries(categoryGroups).map(([groupName, categories]) => (
                        <div key={groupName} className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">{groupName}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {categories.map(category => (
                              <button
                                key={category}
                                onClick={() => {
                                  setSelectedCategories(prev =>
                                    prev.includes(category)
                                      ? prev.filter(c => c !== category)
                                      : [...prev, category]
                                  );
                                }}
                                className={`px-3 py-2 rounded-lg text-sm text-left transition ${
                                  selectedCategories.includes(category)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        setSelectedCategories([]);
                        setPriceFilter([]);
                        setEnvironmentFilter('');
                        setDistanceFilter(10);
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
                    {searchQuery 
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
                </div>
              ) : (
                // Place cards
                filteredPlaces.map(place => (
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
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Map (Desktop only) */}
          <div className="w-1/2 lg:w-3/5 sticky top-0 h-full">
            <ExploreMap
              places={filteredPlaces}
              selectedPlace={selectedPlace}
              onPlaceClick={(place) => {
                setSelectedPlace(place);
                // Scroll to the place card
                const cardElement = placeCardRefs.current.get(place.id);
                if (cardElement) {
                  cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            />
          </div>
        </div>
        ) : (
          /* Mobile: Full-screen map + bottom sheet */
          <div className="h-[calc(100vh-64px)] relative">
            {/* Full-screen Map */}
            <div className="absolute inset-0 z-0">
              <ExploreMap
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
                      Explore Trento
                    </h2>
                    <p className="text-sm text-gray-600">
                      {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'} on map
                    </p>
                  </div>
                ) : (
                  /* Expanded: Show full list */
                  <div className="px-4 pb-6">
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
                        </div>
                      ) : (
                        filteredPlaces.map(place => (
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
                        ))
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

      {/* Place Details Drawer */}
      <PlaceDetailsDrawer
        place={selectedPlace}
        isOpen={isDetailsOpen}
        isSaved={selectedPlace ? savedPlaceIds.includes(selectedPlace.id) : false}
        onClose={() => setIsDetailsOpen(false)}
        onSave={() => selectedPlace && handleLike(selectedPlace.id)}
      />

      {/* Add to Itinerary Modal */}
      {isItineraryModalOpen && selectedPlaceForItinerary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Add to Itinerary</h3>
                <p className="text-sm text-purple-100">{selectedPlaceForItinerary.name}</p>
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your itineraries...</p>
                </div>
              ) : userItineraries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📋</div>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">No itineraries yet</h4>
                  <p className="text-gray-500 mb-4">Create an itinerary first to add places</p>
                  <a
                    href="/itinerary"
                    className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
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
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-500 transition"
                    >
                      <h4 className="font-semibold text-gray-800 mb-2">{itinerary.name}</h4>
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
                              className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition text-center"
                            >
                              <div className="font-semibold">Day {dayIndex + 1}</div>
                              <div className="text-xs text-purple-600">
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
