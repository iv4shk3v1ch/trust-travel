'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/database/supabase';
import { Header } from '@/shared/components/Header';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Place {
  id: string;
  name: string;
  category: string;
  address: string | null;
  photo_urls: string[];
  price_level: string | null;
  average_rating: number;
  indoor_outdoor: string | null;
}

interface ItineraryDay {
  id: string;
  date: string;
  places: Place[];
}

interface SavedItinerary {
  id: string;
  name: string;
  start_date: string;
  num_days: number;
  days: ItineraryDay[];
  updated_at: string;
}

export default function ItineraryPage() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [tripName, setTripName] = useState('My Trip to Italy');
  const [startDate, setStartDate] = useState('');
  const [numDays, setNumDays] = useState(3);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Save/Load state
  const [currentItineraryId, setCurrentItineraryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Initialize itinerary with empty days
  useEffect(() => {
    if (startDate && numDays > 0) {
      const days: ItineraryDay[] = [];
      const start = new Date(startDate);
      
      // Preserve existing places when changing dates
      const existingDays = new Map(itinerary.map(d => [d.id, d.places]));
      
      for (let i = 0; i < numDays; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const dayId = `day-${i}`;
        days.push({
          id: dayId,
          date: date.toISOString().split('T')[0],
          places: existingDays.get(dayId) || []
        });
      }
      
      setItinerary(days);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, numDays]);

  // Fetch saved places for adding to itinerary
  const fetchSavedPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/favorites?include_details=true', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedPlaces(data.places || []);
      }
    } catch (error) {
      console.error('Error fetching saved places:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSavedPlaces();
  }, [fetchSavedPlaces]);

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    if (!destination) return;
    
    // Moving within the same day
    if (source.droppableId === destination.droppableId) {
      const dayIndex = itinerary.findIndex(d => d.id === source.droppableId);
      if (dayIndex === -1) return;
      
      const newPlaces = Array.from(itinerary[dayIndex].places);
      const [removed] = newPlaces.splice(source.index, 1);
      newPlaces.splice(destination.index, 0, removed);
      
      const newItinerary = [...itinerary];
      newItinerary[dayIndex].places = newPlaces;
      setItinerary(newItinerary);
    } else {
      // Moving between days
      const sourceDayIndex = itinerary.findIndex(d => d.id === source.droppableId);
      const destDayIndex = itinerary.findIndex(d => d.id === destination.droppableId);
      
      if (sourceDayIndex === -1 || destDayIndex === -1) return;
      
      const sourcePlaces = Array.from(itinerary[sourceDayIndex].places);
      const destPlaces = Array.from(itinerary[destDayIndex].places);
      const [removed] = sourcePlaces.splice(source.index, 1);
      destPlaces.splice(destination.index, 0, removed);
      
      const newItinerary = [...itinerary];
      newItinerary[sourceDayIndex].places = sourcePlaces;
      newItinerary[destDayIndex].places = destPlaces;
      setItinerary(newItinerary);
    }
  };

  // Add place to specific day
  const addPlaceToDay = (place: Place, dayId: string) => {
    const newItinerary = itinerary.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          places: [...day.places, place]
        };
      }
      return day;
    });
    setItinerary(newItinerary);
    setIsAddingPlace(false);
    setSelectedDay(null);
  };

  // Remove place from day
  const removePlaceFromDay = (dayId: string, placeIndex: number) => {
    const newItinerary = itinerary.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          places: day.places.filter((_, index) => index !== placeIndex)
        };
      }
      return day;
    });
    setItinerary(newItinerary);
  };

  // Calculate statistics
  const getTotalPlaces = () => {
    return itinerary.reduce((total, day) => total + day.places.length, 0);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Save itinerary
  const handleSaveItinerary = async () => {
    if (!startDate || itinerary.length === 0) {
      setSaveMessage('Please set a start date first');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/login');
        return;
      }

      const payload = {
        name: tripName,
        start_date: startDate,
        num_days: numDays,
        days: itinerary
      };

      const url = currentItineraryId 
        ? '/api/itineraries'
        : '/api/itineraries';
      
      const method = currentItineraryId ? 'PUT' : 'POST';
      const body = currentItineraryId
        ? { ...payload, id: currentItineraryId }
        : payload;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentItineraryId(data.itinerary.id);
        setSaveMessage('✅ Itinerary saved successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving itinerary:', error);
      setSaveMessage('❌ Failed to save itinerary');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved itineraries
  const handleLoadItineraries = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/itineraries', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedItineraries(data.itineraries || []);
        setIsLoadModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading itineraries:', error);
    }
  };

  // Load specific itinerary
  const loadItinerary = (savedItinerary: SavedItinerary) => {
    setTripName(savedItinerary.name);
    setStartDate(savedItinerary.start_date);
    setNumDays(savedItinerary.num_days);
    setItinerary(savedItinerary.days);
    setCurrentItineraryId(savedItinerary.id);
    setIsLoadModalOpen(false);
  };

  // Share itinerary
  const handleShareItinerary = async () => {
    if (!currentItineraryId) {
      setSaveMessage('Please save the itinerary first');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/itineraries/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ itinerary_id: currentItineraryId }),
      });

      if (response.ok) {
        const data = await response.json();
        setShareUrl(data.share_url);
        setIsShareModalOpen(true);
      }
    } catch (error) {
      console.error('Error sharing itinerary:', error);
    }
  };

  // Copy share link
  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setSaveMessage('✅ Link copied to clipboard!');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 -mx-2 w-full"
                placeholder="Trip Name"
              />
              <div className="flex flex-wrap gap-3 mt-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Number of Days</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={numDays}
                    onChange={(e) => setNumDays(parseInt(e.target.value) || 1)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
                  />
                </div>
              </div>
            </div>
            
            {/* Statistics */}
            <div className="flex gap-3">
              <div className="text-center bg-blue-50 rounded-lg px-4 py-2">
                <div className="text-xl font-bold text-blue-600">{numDays}</div>
                <div className="text-xs text-gray-600">Days</div>
              </div>
              <div className="text-center bg-purple-50 rounded-lg px-4 py-2">
                <div className="text-xl font-bold text-purple-600">{getTotalPlaces()}</div>
                <div className="text-xs text-gray-600">Places</div>
              </div>
            </div>
          </div>
        </div>

        {!startDate ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Set a start date to begin</h3>
            <p className="text-gray-600">Choose your travel dates above to start planning your itinerary</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {itinerary.map((day, dayIndex) => (
                <div key={day.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Day Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm opacity-90">Day {dayIndex + 1}</div>
                        <div className="font-semibold">{formatDate(day.date)}</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDay(day.id);
                          setIsAddingPlace(true);
                        }}
                        className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition"
                        title="Add place"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Places List */}
                  <Droppable droppableId={day.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-4 min-h-[200px] ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                      >
                        {day.places.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <div className="text-4xl mb-2">📍</div>
                            <p className="text-sm">No places added yet</p>
                            <p className="text-xs mt-1">Click + to add places</p>
                          </div>
                        ) : (
                          day.places.map((place, index) => (
                            <Draggable key={`${day.id}-${place.id}-${index}`} draggableId={`${day.id}-${place.id}-${index}`} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white border border-gray-200 rounded-lg p-3 mb-3 ${
                                    snapshot.isDragging ? 'shadow-lg' : ''
                                  }`}
                                >
                                  <div className="flex gap-3">
                                    {/* Drag Handle */}
                                    <div className="flex flex-col justify-center text-gray-400">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                      </svg>
                                    </div>
                                    
                                    {/* Place Image */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={place.photo_urls?.[0] || '/placeholder-place.svg'}
                                      alt={place.name}
                                      className="w-16 h-16 object-cover rounded-lg"
                                    />
                                    
                                    {/* Place Info */}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm text-gray-800 truncate">
                                        {place.name}
                                      </h4>
                                      <p className="text-xs text-gray-500 capitalize">
                                        {place.category.replace(/-/g, ' ')}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-yellow-500">⭐ {place.average_rating.toFixed(1)}</span>
                                        {place.price_level && (
                                          <span className="text-xs text-gray-500">
                                            {place.price_level === 'low' && '€'}
                                            {place.price_level === 'medium' && '€€'}
                                            {place.price_level === 'high' && '€€€'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Remove Button */}
                                    <button
                                      onClick={() => removePlaceFromDay(day.id, index)}
                                      className="text-gray-400 hover:text-red-500 transition"
                                      title="Remove"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Action Buttons - Always visible */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {saveMessage && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
              {saveMessage}
            </div>
          )}
          
          <div className="flex gap-4">
            <button
              onClick={handleLoadItineraries}
              className="bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border border-gray-300"
            >
              📂 Load
            </button>
            
            <button
              onClick={handleSaveItinerary}
              disabled={isSaving || !startDate}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50"
              title={!startDate ? 'Set a start date first' : ''}
            >
              {isSaving ? '💾 Saving...' : '💾 Save'}
            </button>
            
            <button
              onClick={handleShareItinerary}
              disabled={!currentItineraryId}
              className="bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border border-gray-300 disabled:opacity-50"
              title={!currentItineraryId ? 'Save the itinerary first' : ''}
            >
              🔗 Share
            </button>
          </div>
        </div>
      </div>

      {/* Load Itineraries Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Load Saved Itinerary</h3>
              <button
                onClick={() => setIsLoadModalOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {savedItineraries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📋</div>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">No saved itineraries</h4>
                  <p className="text-gray-500">Create and save your first itinerary to see it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedItineraries.map((savedItinerary: SavedItinerary) => (
                    <button
                      key={savedItinerary.id}
                      onClick={() => loadItinerary(savedItinerary)}
                      className="w-full text-left bg-white border-2 border-gray-200 hover:border-blue-500 rounded-lg p-4 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{savedItinerary.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(savedItinerary.start_date).toLocaleDateString()} · {savedItinerary.num_days} days
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Last updated: {new Date(savedItinerary.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {savedItinerary.days.reduce((sum: number, day: ItineraryDay) => sum + day.places.length, 0)}
                          </div>
                          <div className="text-xs text-gray-500">places</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && shareUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Share Itinerary</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">Share this link with anyone to let them view your itinerary:</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 break-all text-sm">
                {shareUrl}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyShareLink}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  📋 Copy Link
                </button>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Place Modal */}
      {isAddingPlace && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Add Place to Day {itinerary.findIndex(d => d.id === selectedDay) + 1}</h3>
              <button
                onClick={() => {
                  setIsAddingPlace(false);
                  setSelectedDay(null);
                }}
                className="text-white hover:bg-white/20 rounded-full p-1 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading your saved places...</p>
                </div>
              ) : savedPlaces.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">💔</div>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">No saved places</h4>
                  <p className="text-gray-500 mb-4">Save some places first to add them to your itinerary</p>
                  <button
                    onClick={() => router.push('/explore')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Explore Places
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedPlaces.map(place => (
                    <button
                      key={place.id}
                      onClick={() => addPlaceToDay(place, selectedDay)}
                      className="text-left bg-white border-2 border-gray-200 hover:border-blue-500 rounded-lg p-3 transition"
                    >
                      <div className="flex gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={place.photo_urls?.[0] || '/placeholder-place.svg'}
                          alt={place.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 truncate">{place.name}</h4>
                          <p className="text-xs text-gray-500 capitalize">{place.category.replace(/-/g, ' ')}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-yellow-500">⭐ {place.average_rating.toFixed(1)}</span>
                            {place.price_level && (
                              <span className="text-xs text-gray-500">
                                {place.price_level === 'low' && '€'}
                                {place.price_level === 'medium' && '€€'}
                                {place.price_level === 'high' && '€€€'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
