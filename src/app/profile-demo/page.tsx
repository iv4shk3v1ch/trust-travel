'use client';

import React, { useState } from 'react';
import { ProfileCompletenessChip } from '@/components/ui/ProfileCompletenessChip';
import { UserPreferences } from '@/types/preferences';

export default function ProfileCompletenessDemo() {
  const [selectedProfile, setSelectedProfile] = useState<'incomplete' | 'partial' | 'complete'>('partial');

  // Mock profile data for testing different scenarios
  const incompleteProfile: UserPreferences = {
    basicInfo: {
      firstName: 'John',
      lastName: '',
      gender: '',
      ageGroup: ''
    },
    preferences: {
      activities: ['hiking'],
      placeTypes: []
    },
    foodAndRestrictions: {
      foodExcitement: [],
      restrictions: [],
      placesToAvoid: []
    },
    personalityAndStyle: {
      travelPersonality: [],
      planningStyle: ''
    },
    budget: {
      spendingStyle: '',
      travelWith: ''
    },
    completedSteps: [1],
    isComplete: false
  };

  const partialProfile: UserPreferences = {
    basicInfo: {
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male',
      ageGroup: '25-34'
    },
    preferences: {
      activities: ['hiking', 'photography'],
      placeTypes: ['mountains']
    },
    foodAndRestrictions: {
      foodExcitement: ['italian'],
      restrictions: [],
      placesToAvoid: []
    },
    personalityAndStyle: {
      travelPersonality: [],
      planningStyle: ''
    },
    budget: {
      spendingStyle: '',
      travelWith: ''
    },
    completedSteps: [1, 2, 3],
    isComplete: false
  };

  const completeProfile: UserPreferences = {
    basicInfo: {
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male',
      ageGroup: '25-34'
    },
    preferences: {
      activities: ['hiking', 'photography'],
      placeTypes: ['mountains', 'cities']
    },
    foodAndRestrictions: {
      foodExcitement: ['italian', 'local'],
      restrictions: [],
      placesToAvoid: []
    },
    personalityAndStyle: {
      travelPersonality: ['adventurous'],
      planningStyle: 'flexible'
    },
    budget: {
      spendingStyle: 'mid-range',
      travelWith: 'solo'
    },
    completedSteps: [1, 2, 3, 4, 5, 6],
    isComplete: true
  };

  const profiles = {
    incomplete: incompleteProfile,
    partial: partialProfile,
    complete: completeProfile
  };

  const currentProfile = profiles[selectedProfile];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mock Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">
                TrustTravel - Profile Demo
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ProfileCompletenessChip profile={currentProfile} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                John Doe
              </span>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Profile Completeness Chip Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click the progress chip in the header to see the missing items sheet with deep links.
          </p>

          {/* Profile Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Test Different Profile States
            </h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedProfile('incomplete')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedProfile === 'incomplete'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Incomplete (~20%)
              </button>
              <button
                onClick={() => setSelectedProfile('partial')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedProfile === 'partial'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Partial (~60%)
              </button>
              <button
                onClick={() => setSelectedProfile('complete')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedProfile === 'complete'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Complete (100%)
              </button>
            </div>
          </div>

          {/* Features Demo */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                ✨ Key Features
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Compact ring progress indicator</li>
                <li>• Color-coded progress (red → yellow → green)</li>
                <li>• Click to open missing items sheet</li>
                <li>• Prioritized suggestions with point values</li>
                <li>• Deep links to exact form sections</li>
                <li>• &ldquo;Your profile is X% smart&rdquo; messaging</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                🎯 User Experience
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Clear next steps with &ldquo;Add these to boost accuracy&rdquo;</li>
                <li>• CTA buttons for immediate action</li>
                <li>• Visual indication of completion progress</li>
                <li>• Smart suggestion prioritization</li>
                <li>• Completion celebration for 100% profiles</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
