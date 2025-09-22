'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadExistingProfile, DatabaseProfile, saveNewProfile } from '@/lib/newDatabase';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { calculateProfileCompleteness } from '@/services/profileScore';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<DatabaseProfile | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        // Load profile using new database function
        const profile = await loadExistingProfile();
        setCurrentProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
      
      setLoading(false);
    };

    loadUserData();
  }, [router]);

  const clearField = async (fieldName: keyof DatabaseProfile) => {
    if (!currentProfile) return;
    
    try {
      // Create updated profile with cleared field
      const updatedProfile = { ...currentProfile };
      
      // Clear array fields (these can be emptied)
      if (fieldName === 'personality_traits') {
        updatedProfile.personality_traits = [];
      } else if (fieldName === 'activities') {
        updatedProfile.activities = [];
      } else if (fieldName === 'food_preferences') {
        updatedProfile.food_preferences = [];
      } else if (fieldName === 'food_restrictions') {
        updatedProfile.food_restrictions = [];
      } else if (fieldName === 'place_types') {
        updatedProfile.place_types = [];
      }
      // Note: budget_level and trip_style are required fields and cannot be cleared
      
      // Save to database
      await saveNewProfile(updatedProfile);
      
      // Update local state
      setCurrentProfile(updatedProfile);
    } catch (error) {
      console.error('Error clearing field:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to Trust Travel!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Complete your profile to start connecting with fellow travelers and planning amazing trips.
            </p>
            <Button onClick={() => router.push('/profile/edit')}>
              Create Your Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const completionStats = calculateProfileCompleteness(currentProfile);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with Edit Button */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your travel preferences and personal information
            </p>
          </div>
          <Button onClick={() => router.push('/profile/edit')}>
            Edit Profile
          </Button>
        </div>

        {/* Profile Completion Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Profile Completion
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {completionStats.isComplete 
                  ? 'Your profile is complete!' 
                  : `${completionStats.missingFields.length} sections remaining`
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">
                {completionStats.percentage}%
              </div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
          <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionStats.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                <p className="text-gray-900 dark:text-white">{currentProfile.full_name || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</label>
                <p className="text-gray-900 dark:text-white">{currentProfile.age || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                <p className="text-gray-900 dark:text-white">{currentProfile.gender || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Travel Style */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Travel Style
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget Level</label>
                <p className="text-gray-900 dark:text-white">
                  {currentProfile.budget_level ? 
                    currentProfile.budget_level.charAt(0).toUpperCase() + currentProfile.budget_level.slice(1) 
                    : 'Not specified'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Trip Style</label>
                <p className="text-gray-900 dark:text-white">
                  {currentProfile.trip_style ? 
                    currentProfile.trip_style.charAt(0).toUpperCase() + currentProfile.trip_style.slice(1) 
                    : 'Not specified'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Personality Traits */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Personality Traits
              </h3>
              {currentProfile.personality_traits && currentProfile.personality_traits.length > 0 && (
                <button
                  onClick={() => clearField('personality_traits')}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-all duration-200"
                  title="Clear all personality traits"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {currentProfile.personality_traits && currentProfile.personality_traits.length > 0 ? (
                currentProfile.personality_traits.map((trait, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                  >
                    {trait}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No traits specified</p>
              )}
            </div>
          </div>

          {/* Activities */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Preferred Activities
              </h3>
              {currentProfile.activities && currentProfile.activities.length > 0 && (
                <button
                  onClick={() => clearField('activities')}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-all duration-200"
                  title="Clear all activities"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {currentProfile.activities && currentProfile.activities.length > 0 ? (
                currentProfile.activities.map((activity, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    {activity}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No activities specified</p>
              )}
            </div>
          </div>

          {/* Food Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Food Preferences & Restrictions
            </h3>
            
            {/* Food Preferences */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300">Preferences</h4>
                {currentProfile.food_preferences && currentProfile.food_preferences.length > 0 && (
                  <button
                    onClick={() => clearField('food_preferences')}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-all duration-200"
                    title="Clear all food preferences"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {currentProfile.food_preferences && currentProfile.food_preferences.length > 0 ? (
                  currentProfile.food_preferences.map((pref, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                    >
                      {pref}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No preferences specified</p>
                )}
              </div>
            </div>

            {/* Food Restrictions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-medium text-gray-700 dark:text-gray-300">Restrictions</h4>
                {currentProfile.food_restrictions && currentProfile.food_restrictions.length > 0 && (
                  <button
                    onClick={() => clearField('food_restrictions')}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-all duration-200"
                    title="Clear all food restrictions"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {currentProfile.food_restrictions && currentProfile.food_restrictions.length > 0 ? (
                  currentProfile.food_restrictions.map((restriction, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    >
                      {restriction}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No restrictions specified</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
