'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { UserPreferences } from '@/types/preferences';
import { useProfileUpdateToasts } from '@/hooks/useProfileUpdateToasts';

export default function ProfileFixerPage() {
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.id);
  const { saveProfileWithToasts } = useProfileUpdateToasts();
  const [isLoading, setIsLoading] = useState(false);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const fixProfile = async () => {
    setIsLoading(true);
    try {
      const completeProfile: UserPreferences = {
        ...profile,
        preferences: {
          ...profile.preferences,
          // Add second place type if missing
          placeTypes: profile.preferences.placeTypes.length < 2 
            ? [...profile.preferences.placeTypes, 'cities'] 
            : profile.preferences.placeTypes
        },
        personalityAndStyle: {
          // Add travel personality if missing
          travelPersonality: profile.personalityAndStyle.travelPersonality.length < 1
            ? ['adventurous']
            : profile.personalityAndStyle.travelPersonality,
          // Add planning style if missing
          planningStyle: profile.personalityAndStyle.planningStyle || 'flexible'
        },
        budget: {
          // Add spending style if missing
          spendingStyle: profile.budget.spendingStyle || 'mid-range',
          // Add travel companion if missing
          travelWith: profile.budget.travelWith || 'solo'
        },
        completedSteps: [1, 2, 3, 4, 5, 6],
        isComplete: true
      };

      const result = await saveProfileWithToasts(completeProfile);
      
      if (result.success) {
        console.log('Profile completed successfully!', result);
        alert('Profile completed! You should now see 100% completion.');
      } else {
        console.error('Failed to complete profile:', result.error);
        alert('Failed to complete profile: ' + result.error);
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const missingFields = [];
  
  // Check what's missing
  if (profile.preferences.placeTypes.length < 2) {
    missingFields.push({
      field: 'placeTypes',
      current: profile.preferences.placeTypes,
      required: '2+ items',
      fix: 'Will add "cities" to your existing preferences'
    });
  }
  
  if (profile.personalityAndStyle.travelPersonality.length < 1) {
    missingFields.push({
      field: 'travelPersonality',
      current: profile.personalityAndStyle.travelPersonality,
      required: '1+ items',
      fix: 'Will add "adventurous" as your travel personality'
    });
  }
  
  if (!profile.personalityAndStyle.planningStyle) {
    missingFields.push({
      field: 'planningStyle',
      current: profile.personalityAndStyle.planningStyle,
      required: 'Non-empty value',
      fix: 'Will set to "flexible"'
    });
  }
  
  if (!profile.budget.spendingStyle) {
    missingFields.push({
      field: 'spendingStyle',
      current: profile.budget.spendingStyle,
      required: 'Non-empty value',
      fix: 'Will set to "mid-range"'
    });
  }
  
  if (!profile.budget.travelWith) {
    missingFields.push({
      field: 'travelWith',
      current: profile.budget.travelWith,
      required: 'Non-empty value',
      fix: 'Will set to "solo"'
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Profile Completion Fixer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your profile is missing some required fields. Use this tool to complete them automatically.
          </p>
        </div>

        {/* Missing Fields */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Missing Fields ({missingFields.length} remaining)
          </h2>
          
          {missingFields.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Profile Complete! 🎉
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your profile should now show 100% completion
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {missingFields.map((missing, index) => (
                <div key={index} className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        {missing.field}
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                        Current: {Array.isArray(missing.current) ? `[${missing.current.join(', ')}]` : `"${missing.current}"`}
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Required: {missing.required}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 italic">
                        Fix: {missing.fix}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <Button
                  onClick={fixProfile}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Completing Profile...' : `Complete Profile (Add ${missingFields.length} Missing Fields)`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200">
            How This Works
          </h3>
          <ul className="space-y-1 text-blue-700 dark:text-blue-300 text-sm">
            <li>• This tool identifies exactly what&apos;s preventing 100% completion</li>
            <li>• It adds sensible default values for missing required fields</li>
            <li>• You&apos;ll see celebration toasts for each field completed</li>
            <li>• After completion, your profile chip should show 100%</li>
            <li>• You can always edit these values later in the main profile form</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
