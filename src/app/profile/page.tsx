'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MultiStepForm } from '@/components/forms/MultiStepForm';
import { UserPreferences } from '@/types/preferences';
import { supabase } from '@/lib/supabase';
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

      // Load existing preferences
      const preferences = session.user.user_metadata?.preferences;
      if (preferences) {
        setCurrentPreferences(preferences);
      }
      
      setLoading(false);
    };

    loadUserData();
  }, [router]);

  const handleUpdateComplete = async (preferences: UserPreferences) => {
    try {
      await supabase.auth.updateUser({
        data: { preferences }
      });
      
      setCurrentPreferences(preferences);
      setEditing(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
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
                  <p><span className="font-medium">Nationality:</span> {currentPreferences.basicInfo.nationality}</p>
                  <p><span className="font-medium">Emergency Contact:</span> {currentPreferences.basicInfo.emergencyContact.name}</p>
                </div>
              </div>

              {/* Travel Style */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Travel Style
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Preferred Styles:</span> {currentPreferences.preferences.travelStyle.slice(0, 2).join(', ')}{currentPreferences.preferences.travelStyle.length > 2 ? '...' : ''}</p>
                  <p><span className="font-medium">Group Size:</span> {currentPreferences.preferences.groupSize}</p>
                  <p><span className="font-medium">Planning Style:</span> {currentPreferences.preferences.planningStyle}</p>
                </div>
              </div>

              {/* Budget */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Budget Range
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Daily Budget:</span> {currentPreferences.budget.currency} {currentPreferences.budget.dailyBudget.min} - {currentPreferences.budget.dailyBudget.max}</p>
                  <p><span className="font-medium">Top Priority:</span> {currentPreferences.budget.budgetPriorities[0]}</p>
                </div>
              </div>

              {/* Personality Traits */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Travel Personality
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Adventurousness:</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className={i <= currentPreferences.personality.adventurousness ? 'text-indigo-600' : 'text-gray-300'}>★</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Social Level:</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className={i <= currentPreferences.personality.socialness ? 'text-indigo-600' : 'text-gray-300'}>★</span>
                      ))}
                    </div>
                  </div>
                  <p><span className="font-medium">Languages:</span> {currentPreferences.personality.languages.slice(0, 2).join(', ')}</p>
                </div>
              </div>

              {/* Restrictions Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Special Requirements
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Dietary:</span> {currentPreferences.restrictions.dietaryRestrictions.length > 0 ? currentPreferences.restrictions.dietaryRestrictions.slice(0, 2).join(', ') : 'None'}</p>
                  <p><span className="font-medium">Medical:</span> {currentPreferences.restrictions.medicalConditions.length > 0 ? currentPreferences.restrictions.medicalConditions.slice(0, 2).join(', ') : 'None'}</p>
                  <p><span className="font-medium">Mobility:</span> {currentPreferences.restrictions.mobilityRequirements.length > 0 ? 'Yes' : 'None'}</p>
                </div>
              </div>

              {/* Interests */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentPreferences.personality.interests.slice(0, 4).map((interest) => (
                    <span key={interest} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                      {interest}
                    </span>
                  ))}
                  {currentPreferences.personality.interests.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                      +{currentPreferences.personality.interests.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
