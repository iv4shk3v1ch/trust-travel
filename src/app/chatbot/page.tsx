'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/database/supabase';
import { ChatbotInterface, ChatbotInterfaceHandle } from '@/features/chatbot/components/ChatbotInterface';
import { Header } from '@/shared/components/Header';
import { Footer } from '@/shared/components/Footer';
import dynamic from 'next/dynamic';
import type { RecommendedPlace } from '@/core/services/recommendationEngineV2';
import type { RecommendedPlace as RecommendedPlaceV1 } from '@/core/services/recommender';

// Lazy load map from explore page
const ExploreMap = dynamic(() => import('../explore/ExploreMap'), {
  ssr: false,
  loading: () => <div className="bg-gray-100 animate-pulse h-full rounded-lg"></div>
});

export default function ChatbotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<RecommendedPlace | null>(null);
  const chatbotRef = useRef<ChatbotInterfaceHandle>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Callback to receive recommendations from ChatbotInterface
  const handleRecommendationsUpdate = (places: RecommendedPlace[]) => {
    setRecommendations(places);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-[1920px] mx-auto w-full relative">
        {/* Desktop: Side-by-side layout (like explore page) */}
        {!isMobile ? (
          <div className="flex h-[calc(100vh-64px)]">
            {/* Left Panel: Chat Interface - Full Height */}
            <div className="w-1/2 lg:w-2/5 flex flex-col bg-white border-r border-gray-200">
              <ChatbotInterface 
                ref={chatbotRef}
                compact={true}
                showBackButton={true}
                onBack={() => router.push('/explore')}
                onRecommendationsUpdate={handleRecommendationsUpdate}
                onPlaceSelect={(place) => setSelectedPlace(place as unknown as RecommendedPlace)}
              />
            </div>

            {/* Right Panel: Map (Desktop only) */}
            <div className="w-1/2 lg:w-3/5 sticky top-0 h-full relative">
              {recommendations.length > 0 ? (
                <>
                  <div className="absolute inset-0">
                    <ExploreMap
                      places={recommendations}
                      selectedPlace={selectedPlace}
                      onPlaceClick={(place) => {
                        setSelectedPlace(place);
                        // Also trigger the highlight animation in chat
                        // Cast to handle type mismatch between recommender versions
                        chatbotRef.current?.handleMapMarkerClick(place as unknown as RecommendedPlaceV1);
                      }}
                    />
                  </div>
                  
                  {/* Inline Details Panel - like Google Maps */}
                  {selectedPlace && (
                    <div 
                      className="absolute top-4 right-4 bottom-4 w-96 bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
                      style={{ zIndex: 1000 }}
                    >
                      {/* Close button */}
                      <button
                        onClick={() => {
                          setSelectedPlace(null);
                        }}
                        className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition shadow-lg"
                        style={{ zIndex: 1001 }}
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
                              <span className="text-yellow-500 text-lg">⭐</span>
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
                              <p className="text-gray-700 text-sm">
                                📍 {selectedPlace.address}
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
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                            Save Place
                          </button>
                          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
                            Add to Trip
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Empty state - map placeholder */
                <div className="h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center max-w-md px-4">
                    <div className="text-6xl mb-6">🗺️</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">
                      Interactive Map
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Start chatting with the AI assistant and discovered places will appear on the map with their locations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mobile: Full screen chat with floating map button */
          <div className="min-h-[calc(100vh-64px)] bg-gray-50">
            <div className="px-4 py-6">
              {/* Back Button */}
              <button 
                onClick={() => router.push('/explore')}
                className="flex items-center text-gray-600 hover:text-blue-600 transition mb-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  🤖 AI Travel Assistant
                </h1>
                <p className="text-sm text-gray-600">
                  {recommendations.length > 0 
                    ? `${recommendations.length} ${recommendations.length === 1 ? 'place' : 'places'} discovered`
                    : 'Chat to discover personalized recommendations'}
                </p>
              </div>

              {/* Chat Interface */}
              <div className="bg-white shadow-sm border border-gray-200 overflow-hidden mb-6 h-[70vh]">
                <ChatbotInterface 
                  compact={true} 
                  onRecommendationsUpdate={handleRecommendationsUpdate} 
                />
              </div>

              {/* Quick Tips */}
              <div className="space-y-3 mb-20">
                <h3 className="text-sm font-semibold text-gray-700">💡 Try asking:</h3>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-600">
                    🍽️ &quot;I want to try authentic Italian cuisine&quot;
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-600">
                    🏛️ &quot;Show me historical sites and museums&quot;
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-600">
                    🏔️ &quot;Looking for outdoor activities and hiking trails&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}