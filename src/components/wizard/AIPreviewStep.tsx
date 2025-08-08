'use client';

import React, { useState, useEffect } from 'react';
import type { TravelPlan } from '@/types/travel-plan';
import type { UserProfile } from './OnboardingWizard';

interface AIPreviewStepProps {
  profile: UserProfile;
  trip: Partial<TravelPlan>;
  onNext: (suggestions: TripSuggestions) => void;
  onBack: () => void;
}

interface TripSuggestions {
  itinerary: {
    title: string;
    description: string;
    activities: Array<{
      time: string;
      activity: string;
      location: string;
      reason: string;
    }>;
  };
  personalizedTips: string[];
  estimatedBudget: {
    category: string;
    range: string;
  };
}

export default function AIPreviewStep({ profile, trip, onNext, onBack }: AIPreviewStepProps) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<TripSuggestions | null>(null);

  useEffect(() => {
    // Simulate AI generation
    const generateSuggestions = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock suggestions based on user data
      const mockSuggestions: TripSuggestions = {
        itinerary: {
          title: `Perfect ${trip.travelType} adventure in ${trip.destination?.area?.replace('-', ' ')}`,
          description: `A personalized itinerary crafted for your ${profile.travelStyle} travel style`,
          activities: [
            {
              time: '9:00 AM',
              activity: 'Start with coffee at a local café',
              location: 'Piazza Duomo',
              reason: `Perfect for ${profile.travelStyle} travelers who love ${profile.interests.includes('food-wine') ? 'authentic local flavors' : 'cultural experiences'}`
            },
            {
              time: '10:30 AM',
              activity: trip.destination?.area === 'trento-city' ? 'Explore Castello del Buonconsiglio' : 'Hike scenic mountain trails',
              location: trip.destination?.area === 'trento-city' ? 'Historic Center' : 'Dolomites foothills',
              reason: `Matches your interest in ${profile.interests.includes('culture') ? 'history and culture' : 'nature and outdoors'}`
            },
            {
              time: '1:00 PM',
              activity: 'Lunch at recommended local spot',
              location: 'Traditional osteria',
              reason: `Selected based on your ${profile.travelStyle} preferences`
            },
            {
              time: '3:00 PM',
              activity: profile.interests.includes('shopping') ? 'Browse local artisan shops' : 'Visit scenic viewpoint',
              location: profile.interests.includes('shopping') ? 'Via Belenzani' : 'Dos Trento',
              reason: 'Tailored to your interests'
            }
          ]
        },
        personalizedTips: [
          `As a ${profile.age.replace('-', ' to ')} year old, you&apos;ll appreciate the mix of active and relaxed activities`,
          `Your ${profile.travelStyle} travel style means we&apos;ve selected experiences that offer great value`,
          `Based on your interests in ${profile.interests.slice(0, 2).join(' and ')}, we&apos;ve included special recommendations`,
          `Traveling ${trip.travelType} means you can enjoy both social and independent experiences`
        ],
        estimatedBudget: {
          category: profile.travelStyle === 'budget' ? 'Budget-Friendly' : 
                   profile.travelStyle === 'luxury' ? 'Premium' : 'Moderate',
          range: profile.travelStyle === 'budget' ? '€30-50/day' : 
                 profile.travelStyle === 'luxury' ? '€150-250/day' : '€70-120/day'
        }
      };

      setSuggestions(mockSuggestions);
      setLoading(false);
    };

    generateSuggestions();
  }, [profile, trip]);

  const handleContinue = () => {
    if (suggestions) {
      onNext(suggestions);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤖</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Your AI-Powered Itinerary
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Based on your profile and preferences, here&apos;s what we recommend
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {/* Loading Animation */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
                <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                  Crafting your perfect itinerary...
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-green-600 dark:text-green-400">✨ Analyzing your interests: {profile.interests.join(', ')}</div>
                <div className="text-sm text-green-600 dark:text-green-400">🎯 Matching your {profile.travelStyle} travel style</div>
                <div className="text-sm text-green-600 dark:text-green-400">📍 Finding the best spots in {trip.destination?.area?.replace('-', ' ')}</div>
                <div className="text-sm text-green-600 dark:text-green-400">⏰ Optimizing for {trip.travelType} travel</div>
              </div>
            </div>

            {/* Loading Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ) : suggestions && (
          <div className="space-y-6">
            {/* Itinerary */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {suggestions.itinerary.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{suggestions.itinerary.description}</p>
              
              <div className="space-y-4">
                {suggestions.itinerary.activities.map((activity, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0 w-20 text-sm font-medium text-green-700 dark:text-green-400">
                      {activity.time}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">
                        {activity.activity}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        📍 {activity.location}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        💡 {activity.reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Personalized Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-4">
                ✨ Personalized for You
              </h3>
              <div className="space-y-3">
                {suggestions.personalizedTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-blue-800 dark:text-blue-300">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Estimate */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-2">
                💰 Estimated Budget
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {suggestions.estimatedBudget.range}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {suggestions.estimatedBudget.category} range for your trip
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-6 text-center">
              <div className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                Love what you see? 
              </div>
              <p className="text-indigo-700 dark:text-indigo-400 mb-4">
                Complete your profile to get even more personalized recommendations and connect with travel companions!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                onClick={onBack}
                className="flex-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-4 px-6 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-4 px-6 rounded-lg font-medium transition-all transform hover:scale-[1.02] focus:ring-4 focus:ring-green-200"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
