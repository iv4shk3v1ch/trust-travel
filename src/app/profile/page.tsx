'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MultiStepForm } from '@/components/forms/MultiStepForm';
import { UserPreferences } from '@/types/preferences';
import { supabase } from '@/lib/supabase';
import { loadProfile, saveProfile } from '@/lib/database';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [currentPreferences, setCurrentPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        // First try to load from database
        const preferences = await loadProfile();
        
        if (preferences) {
          setCurrentPreferences(preferences);
        } else {
          // Fallback to user metadata if database doesn't have data
          const fallbackPreferences = session.user.user_metadata?.preferences;
          if (fallbackPreferences) {
            setCurrentPreferences(fallbackPreferences);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to user metadata on database error
        const fallbackPreferences = session.user.user_metadata?.preferences;
        if (fallbackPreferences) {
          setCurrentPreferences(fallbackPreferences);
        }
      }
      
      setLoading(false);
    };

    loadUserData();
  }, [router]);

  const handleUpdateComplete = async (preferences: UserPreferences) => {
    try {
      console.log('Starting profile update with preferences:', preferences);
      
      // Save to database first
      await saveProfile(preferences);
      console.log('Database save completed successfully');
      
      // Also update user metadata as backup
      await supabase.auth.updateUser({
        data: { preferences }
      });
      console.log('User metadata updated successfully');
      
      setCurrentPreferences(preferences);
      setEditing(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setEditing(false)}
              className="mb-4"
            >
              ← Back to Profile
            </Button>
          </div>
          <MultiStepForm
            onComplete={handleUpdateComplete}
            initialData={currentPreferences || undefined}
            isNewUser={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Travel Profile</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your travel preferences and personal information
            </p>
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>

        {!currentPreferences ? (
          /* No preferences yet */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Complete Your Profile
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Set up your travel preferences to get personalized recommendations
              </p>
              <Button onClick={() => setEditing(true)}>
                Set Up Profile
              </Button>
            </div>
          </div>
        ) : (
          /* Show current preferences */
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Profile Status
                  </h2>
                  <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                    ✓ Profile completed on {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Button onClick={() => setEditing(true)}>
                  Edit Preferences
                </Button>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Basic Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {currentPreferences.basicInfo.firstName} {currentPreferences.basicInfo.lastName}</p>
                  <p><span className="font-medium">Gender:</span> {currentPreferences.basicInfo.gender}</p>
                  <p><span className="font-medium">Age Group:</span> {currentPreferences.basicInfo.ageGroup}</p>
                </div>
              </div>

              {/* Travel Activities */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Favorite Activities
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {currentPreferences.preferences.activities.slice(0, 3).map((activity) => (
                      <span key={activity} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                        {activity}
                      </span>
                    ))}
                    {currentPreferences.preferences.activities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                        +{currentPreferences.preferences.activities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Preferred Places */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Preferred Places
                </h3>
                <div className="space-y-2 text-sm">
                  {currentPreferences.preferences.placeTypes.slice(0, 2).map((place) => (
                    <p key={place} className="text-gray-700 dark:text-gray-300">• {place}</p>
                  ))}
                  {currentPreferences.preferences.placeTypes.length > 2 && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      +{currentPreferences.preferences.placeTypes.length - 2} more places
                    </p>
                  )}
                </div>
              </div>

              {/* Food Preferences */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Food & Dining
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Excited by:</span> {currentPreferences.foodAndRestrictions.foodExcitement.slice(0, 2).join(', ')}{currentPreferences.foodAndRestrictions.foodExcitement.length > 2 ? '...' : ''}</p>
                  <p><span className="font-medium">Restrictions:</span> {currentPreferences.foodAndRestrictions.restrictions.length > 0 ? currentPreferences.foodAndRestrictions.restrictions.slice(0, 2).join(', ') : 'None'}</p>
                </div>
              </div>

              {/* Travel Personality */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Travel Personality
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {currentPreferences.personalityAndStyle.travelPersonality.slice(0, 3).map((trait) => (
                      <span key={trait} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                        {trait}
                      </span>
                    ))}
                  </div>
                  <p><span className="font-medium">Planning Style:</span> {currentPreferences.personalityAndStyle.planningStyle}</p>
                </div>
              </div>

              {/* Budget Style */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Budget & Travel Style
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Spending Style:</span> {currentPreferences.budget.spendingStyle}</p>
                  <p><span className="font-medium">Usually travels:</span> {currentPreferences.budget.travelWith}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
