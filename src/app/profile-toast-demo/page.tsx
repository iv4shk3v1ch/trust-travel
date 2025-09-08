'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useProfileUpdateToasts } from '@/hooks/useProfileUpdateToasts';
import { UserPreferences } from '@/types/preferences';

export default function ProfileToastDemo() {
  const { saveProfileWithToasts } = useProfileUpdateToasts();
  const [isLoading, setIsLoading] = useState(false);

  // Base incomplete profile
  const baseProfile: UserPreferences = {
    basicInfo: {
      firstName: 'John',
      lastName: '',
      gender: '',
      ageGroup: ''
    },
    preferences: {
      activities: [],
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
    completedSteps: [],
    isComplete: false
  };

  const testUpdates = [
    {
      label: 'Add Last Name',
      description: 'Complete basic info',
      update: { basicInfo: { ...baseProfile.basicInfo, lastName: 'Doe' } }
    },
    {
      label: 'Add Activities',
      description: 'Add hiking and photography',
      update: { preferences: { ...baseProfile.preferences, activities: ['hiking', 'photography'] } }
    },
    {
      label: 'Add Food Preferences',
      description: 'Add Italian and local cuisine',
      update: { foodAndRestrictions: { ...baseProfile.foodAndRestrictions, foodExcitement: ['italian', 'local'] } }
    },
    {
      label: 'Add Travel Personality',
      description: 'Set as adventurous',
      update: { personalityAndStyle: { ...baseProfile.personalityAndStyle, travelPersonality: ['adventurous'] } }
    },
    {
      label: 'Add Budget Info',
      description: 'Set spending style and travel companions',
      update: { budget: { spendingStyle: 'mid-range', travelWith: 'solo' } }
    },
    {
      label: 'Complete Profile',
      description: 'Fill all remaining fields',
      update: {
        basicInfo: { firstName: 'John', lastName: 'Doe', gender: 'male', ageGroup: '25-34' },
        preferences: { activities: ['hiking', 'photography', 'museums'], placeTypes: ['mountains', 'cities'] },
        foodAndRestrictions: { 
          foodExcitement: ['italian', 'local', 'street-food'], 
          restrictions: [], 
          placesToAvoid: [] 
        },
        personalityAndStyle: { 
          travelPersonality: ['adventurous', 'cultural'], 
          planningStyle: 'flexible' 
        },
        budget: { spendingStyle: 'mid-range', travelWith: 'solo' }
      }
    }
  ];

  const handleTestUpdate = async (update: Partial<UserPreferences>) => {
    setIsLoading(true);
    try {
      const newProfile: UserPreferences = {
        ...baseProfile,
        ...update,
        completedSteps: [1, 2, 3, 4, 5, 6],
        isComplete: true
      };

      const result = await saveProfileWithToasts(newProfile);
      
      if (result.success) {
        console.log('Update successful:', result);
      } else {
        console.error('Update failed:', result.error);
      }
    } catch (error) {
      console.error('Error testing update:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Profile Update Toast Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Test different profile field updates to see contextual toast messages celebrating the impact.
          </p>
        </div>

        {/* Demo Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Test Profile Updates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testUpdates.map((test, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  {test.label}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {test.description}
                </p>
                <Button
                  onClick={() => handleTestUpdate(test.update)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Updating...' : 'Test Update'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              🎉 Toast Features
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
              <li>• Contextual messages based on field type</li>
              <li>• Deduplication prevents spam</li>
              <li>• Only shows for meaningful changes (delta &gt; 0)</li>
              <li>• Analytics tracking with field and delta</li>
              <li>• Staggered timing for multiple updates</li>
              <li>• Trento-specific messaging</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              📊 Sample Messages
            </h3>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-green-700 dark:text-green-300">
                🌲 Now we&apos;ll recommend more hidden hiking trails near Trento
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-green-700 dark:text-green-300">
                🍝 Delicious! We&apos;ll suggest the best local eateries in Trento
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-green-700 dark:text-green-300">
                💰 Smart! We&apos;ll recommend options that fit your budget perfectly
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-yellow-800 dark:text-yellow-200">
            Implementation Notes
          </h3>
          <ul className="space-y-1 text-yellow-700 dark:text-yellow-300 text-sm">
            <li>• Toasts appear only for meaningful changes (profile score increase)</li>
            <li>• Deduplication window: 2 seconds to prevent rapid repeats</li>
            <li>• Analytics event: track(&apos;profile_boost&apos;, &#123; field, delta &#125;)</li>
            <li>• Messages are tailored to Trento travel context</li>
            <li>• Multiple field updates are staggered by 100ms each</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
