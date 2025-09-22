'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function Home() {
  const [selectedTravelType, setSelectedTravelType] = useState<string>('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  const travelTypes = [
    { id: 'solo', label: 'Solo', icon: '👤', desc: 'Independent exploration' },
    { id: 'date', label: 'Romantic', icon: '❤️', desc: 'With your special someone' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧', desc: 'Fun for all ages' },
    { id: 'friends', label: 'Friends', icon: '👫', desc: 'Group adventures' }
  ];

  const recommendations = useMemo(() => ({
    solo: {
      title: "Perfect Solo Day in Trento",
      activities: [
        { time: "9:00 AM", activity: "Castello del Buonconsiglio", icon: "🏰", desc: "Explore medieval art & history" },
        { time: "11:30 AM", activity: "Via Belenzani stroll", icon: "🚶", desc: "Renaissance architecture walk" },
        { time: "1:00 PM", activity: "Local osteria lunch", icon: "🍝", desc: "Authentic Trentino cuisine" },
        { time: "3:00 PM", activity: "MUSE Science Museum", icon: "🔬", desc: "Interactive exhibits" },
        { time: "6:00 PM", activity: "Aperitivo at Piazza Duomo", icon: "🍷", desc: "People-watching & wine" }
      ]
    },
    date: {
      title: "Romantic Trento Experience",
      activities: [
        { time: "10:00 AM", activity: "Cable car to Sardagna", icon: "🚡", desc: "Panoramic city views" },
        { time: "12:00 PM", activity: "Wine tasting in Lavis", icon: "🍇", desc: "Local vineyard tour" },
        { time: "2:30 PM", activity: "Lunch at Osteria a le Due Spade", icon: "🍽️", desc: "Michelin-recommended dining" },
        { time: "4:00 PM", activity: "Walk in Parco di Gocciadoro", icon: "🌳", desc: "Peaceful gardens" },
        { time: "7:30 PM", activity: "Sunset at Doss Trento", icon: "🌅", desc: "City lights & monuments" }
      ]
    },
    family: {
      title: "Family Fun Day in Trento",
      activities: [
        { time: "9:30 AM", activity: "MUSE Science Museum", icon: "🔬", desc: "Kids love the dinosaurs!" },
        { time: "12:00 PM", activity: "Picnic at Parco Fratelli Michelin", icon: "🧺", desc: "Playground & green space" },
        { time: "2:00 PM", activity: "Trento Christmas Markets", icon: "🎄", desc: "Seasonal treats & crafts" },
        { time: "4:00 PM", activity: "Gelateria Zanella", icon: "🍦", desc: "Best gelato in the city" },
        { time: "6:00 PM", activity: "Evening stroll Via Manci", icon: "👨‍👩‍👧", desc: "Family-friendly shopping" }
      ]
    },
    friends: {
      title: "Epic Friends Adventure",
      activities: [
        { time: "10:00 AM", activity: "Group bike tour", icon: "🚴", desc: "Explore Trento cycling paths" },
        { time: "1:00 PM", activity: "Food tour & tastings", icon: "🍕", desc: "Sample local specialties" },
        { time: "3:30 PM", activity: "Escape room challenge", icon: "🧩", desc: "Team building fun" },
        { time: "6:00 PM", activity: "Aperitivo crawl", icon: "🍻", desc: "Best bars in historic center" },
        { time: "9:00 PM", activity: "Live music at Auditorium", icon: "🎵", desc: "Cultural evening events" }
      ]
    }
  }), []);

  useEffect(() => {
    if (showRecommendations && selectedTravelType && recommendations[selectedTravelType as keyof typeof recommendations]) {
      const timer = setInterval(() => {
        setAnimationStep(prev => {
          if (prev >= recommendations[selectedTravelType as keyof typeof recommendations].activities.length) {
            clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
      return () => clearInterval(timer);
    }
  }, [showRecommendations, selectedTravelType, recommendations]);

  const handleTravelTypeSelect = (type: string) => {
    setSelectedTravelType(type);
    setShowRecommendations(true);
    setAnimationStep(0);
  };

  const resetDemo = () => {
    setSelectedTravelType('');
    setShowRecommendations(false);
    setAnimationStep(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            TrustTravel
          </h1>
          <div className="space-x-4">
            <Link 
              href="/login"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            This weekend in 
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Trento</span>?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Here&apos;s your perfect day... powered by AI that knows Trento like a local
          </p>
        </div>

        {!showRecommendations ? (
          /* Travel Type Selection */
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Who are you traveling with?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our AI will create a personalized day just for you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {travelTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTravelTypeSelect(type.id)}
                  className="group p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    {type.icon}
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {type.label}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {type.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* AI Recommendations Display */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">AI generating your perfect day...</span>
                </div>
                <button 
                  onClick={resetDemo}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ↺ Try another
                </button>
              </div>

              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                {recommendations[selectedTravelType as keyof typeof recommendations]?.title}
              </h3>

              <div className="space-y-4">
                {recommendations[selectedTravelType as keyof typeof recommendations]?.activities.map((activity, index) => (
                  <div 
                    key={index}
                    className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-500 ${
                      index < animationStep 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 opacity-100 transform translate-x-0' 
                        : 'opacity-30 transform translate-x-4'
                    }`}
                  >
                    <div className="text-3xl">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {activity.time}
                        </span>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {activity.activity}
                        </h4>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {activity.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {animationStep >= recommendations[selectedTravelType as keyof typeof recommendations]?.activities.length && (
                <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700 text-center animate-fade-in">
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    ✨ Love this itinerary?
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Get personalized recommendations, connect with local guides, and find travel companions
                  </p>
                  <div className="space-y-4">
                    <Link href="/signup">
                      <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105">
                        Get Your Full Trip Plan — It&apos;s Free! 🚀
                      </button>
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Join 1,000+ travelers discovering Trento
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Features Preview */}
        {!showRecommendations && (
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🤖</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                AI-Powered Recommendations
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Personalized itineraries based on your travel style and preferences
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🤝</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Find Travel Companions
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Connect with like-minded travelers for shared adventures
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🛡️</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Trusted Community
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Verified travelers sharing real experiences and recommendations
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
