'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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

interface SharedItinerary {
  id: string;
  name: string;
  start_date: string;
  num_days: number;
  days: ItineraryDay[];
}

export default function SharedItineraryPage() {
  const params = useParams();
  const token = params?.token as string;
  
  const [itinerary, setItinerary] = useState<SharedItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedItinerary = async () => {
      if (!token) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/itineraries/share?token=${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('This itinerary was not found or is no longer shared');
          } else {
            setError('Failed to load itinerary');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setItinerary(data.itinerary);
      } catch (err) {
        console.error('Error fetching shared itinerary:', err);
        setError('Failed to load itinerary');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedItinerary();
  }, [token]);

  // Calculate statistics
  const totalPlaces = itinerary?.days.reduce((sum, day) => sum + day.places.length, 0) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading shared itinerary...</p>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Itinerary Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This itinerary does not exist or is no longer available.'}</p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">✈️</div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Shared Itinerary</h1>
              <p className="text-sm text-gray-500">Read-only view</p>
            </div>
          </div>
          <Link
            href="/signup"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition text-sm"
          >
            Create Your Own
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Trip Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{itinerary.name}</h2>
          <div className="flex flex-wrap gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span>{new Date(itinerary.start_date).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🗓️</span>
              <span>{itinerary.num_days} {itinerary.num_days === 1 ? 'day' : 'days'}</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600">{itinerary.num_days}</div>
            <div className="text-gray-600 mt-2">Days Planned</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-purple-600">{totalPlaces}</div>
            <div className="text-gray-600 mt-2">Places to Visit</div>
          </div>
        </div>

        {/* Itinerary Days */}
        {itinerary.days.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No places planned yet</h3>
            <p className="text-gray-500">This itinerary is still being built</p>
          </div>
        ) : (
          <div className="space-y-6">
            {itinerary.days.map((day, dayIndex) => {
              const dayDate = new Date(itinerary.start_date);
              dayDate.setDate(dayDate.getDate() + dayIndex);
              
              return (
                <div key={day.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Day Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">Day {dayIndex + 1}</h3>
                        <p className="text-blue-100 text-sm">
                          {dayDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{day.places.length}</div>
                        <div className="text-sm text-blue-100">
                          {day.places.length === 1 ? 'place' : 'places'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Places List */}
                  <div className="p-4">
                    {day.places.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📍</div>
                        <p>No places added for this day</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {day.places.map((place, placeIndex) => (
                          <div 
                            key={place.id}
                            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
                          >
                            <div className="flex gap-4">
                              {/* Place Number */}
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                                {placeIndex + 1}
                              </div>

                              {/* Place Image */}
                              {place.photo_urls && place.photo_urls.length > 0 ? (
                                <Image
                                  src={place.photo_urls[0]}
                                  alt={place.name}
                                  width={96}
                                  height={96}
                                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                                />
                              ) : (
                                <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-3xl">📍</span>
                                </div>
                              )}

                              {/* Place Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-800 text-lg mb-1">
                                  {place.name}
                                </h4>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                    {place.category}
                                  </span>
                                  {place.price_level && (
                                    <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                      {place.price_level}
                                    </span>
                                  )}
                                  {place.indoor_outdoor && (
                                    <span className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                                      {place.indoor_outdoor === 'indoor' ? '🏠 Indoor' : '🌳 Outdoor'}
                                    </span>
                                  )}
                                </div>
                                {place.address && (
                                  <p className="text-gray-600 text-sm flex items-center gap-1">
                                    <span>📍</span>
                                    <span className="truncate">{place.address}</span>
                                  </p>
                                )}
                                {place.average_rating > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-yellow-500">⭐</span>
                                    <span className="text-gray-700 font-medium">{place.average_rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Like this itinerary?</h3>
          <p className="text-blue-100 mb-6">Create your own personalized travel plans with TrustTravel</p>
          <Link
            href="/signup"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
