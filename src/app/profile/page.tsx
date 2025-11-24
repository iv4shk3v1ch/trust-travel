'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext } from '@/features/auth/AuthContext';
import { calculateProfileCompleteness } from '@/core/services/profileScore';
import { Button } from '@/shared/components/Button';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile: currentProfile, loading } = useAuthContext(); // ✅ Use AuthContext instead of manual fetching

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

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
              Complete your profile to start getting personalized travel recommendations.
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
        
        {/* Back Navigation */}
        <div className="mb-6">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <span className="mr-2">←</span>
            Back to Dashboard
          </button>
        </div>
        
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
                  : `${completionStats.missingFields.length} fields remaining`
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
                <p className="text-gray-900 dark:text-white capitalize">
                  {currentProfile.gender?.replace(/-/g, ' ') || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Travel Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Travel Preferences
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget</label>
                <p className="text-gray-900 dark:text-white capitalize">
                  {currentProfile.budget || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Environment Preference</label>
                <p className="text-gray-900 dark:text-white capitalize">
                  {currentProfile.env_preference || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Activity Style</label>
                <p className="text-gray-900 dark:text-white capitalize">
                  {currentProfile.activity_style || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Food Restrictions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dietary Restrictions
            </h3>
            <p className="text-gray-900 dark:text-white">
              {currentProfile.food_restrictions || 'No restrictions specified'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
