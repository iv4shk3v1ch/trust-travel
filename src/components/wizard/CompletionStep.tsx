'use client';

import React from 'react';
import type { TravelPlan } from '@/types/travel-plan';
import type { UserProfile } from './OnboardingWizard';

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

interface CompletionStepProps {
  profile: UserProfile;
  trip: Partial<TravelPlan>;
  suggestions: TripSuggestions;
  onComplete: () => void;
  onBack: () => void;
}

export default function CompletionStep({ profile, trip, suggestions, onComplete, onBack }: CompletionStepProps) {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <span className="text-4xl">🎉</span>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-xl">✨</span>
          </div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center animate-pulse" style={{ animationDelay: '0.5s' }}>
            <span className="text-sm">🌟</span>
          </div>
        </div>

        {/* Welcome Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to TrustTravel, {profile.name}! 🎊
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Your profile is set up and your first AI-powered itinerary is ready!
        </p>

        {/* Quick Summary */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-4">Here&apos;s what we&apos;ve set up for you:</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Profile Created</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{profile.interests.length} interests • {profile.travelStyle} style</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-2xl">🗺️</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Trip Planned</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{trip.destination?.area?.replace('-', ' ')} • {trip.travelType} travel</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">AI Recommendations</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Personalized itinerary ready</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Budget Estimated</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{suggestions.estimatedBudget.range}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">What&apos;s next?</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div className="text-left">
                <div className="font-medium text-blue-900 dark:text-blue-300">Explore your dashboard</div>
                <div className="text-sm text-blue-700 dark:text-blue-400">View your itinerary, manage trips, and discover more recommendations</div>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div className="text-left">
                <div className="font-medium text-purple-900 dark:text-purple-300">Find travel companions</div>
                <div className="text-sm text-purple-700 dark:text-purple-400">Connect with like-minded travelers for your Trento adventure</div>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div className="text-left">
                <div className="font-medium text-green-900 dark:text-green-300">Fine-tune your profile</div>
                <div className="text-sm text-green-700 dark:text-green-400">Add more details later for even better AI recommendations</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <button
            onClick={onComplete}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-8 rounded-lg font-semibold text-lg transition-all transform hover:scale-[1.02] focus:ring-4 focus:ring-indigo-200"
          >
            Enter Dashboard 🚀
          </button>
          
          <button
            onClick={onBack}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium transition-colors"
          >
            ← Go back to make changes
          </button>
        </div>

        {/* Encouraging message */}
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-300 text-sm">
            💡 <strong>Pro tip:</strong> The more you use TrustTravel, the better our AI gets at understanding your preferences!
          </p>
        </div>
      </div>
    </div>
  );
}
