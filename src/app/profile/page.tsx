'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext } from '@/features/auth/AuthContext';
import { calculateProfileCompleteness } from '@/core/services/profileScore';
import { Button } from '@/shared/components/Button';
import { Header } from '@/shared/components/Header';
import { Footer } from '@/shared/components/Footer';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile: currentProfile, loading } = useAuthContext();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!currentProfile) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Trust Travel!
              </h1>
              <p className="text-gray-600 mb-8">
                Complete your profile to start getting personalized travel recommendations.
              </p>
              <Button onClick={() => router.push('/profile/edit')}>
                Create Your Profile
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const completionStats = calculateProfileCompleteness(currentProfile);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Back Navigation */}
          <button 
            onClick={() => router.push('/explore')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-6"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          {/* Header with Edit Button */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                My Profile
              </h1>
              <p className="text-gray-600">
                Your travel preferences and personal information
              </p>
            </div>
            <Button onClick={() => router.push('/profile/edit')}>
              Edit Profile
            </Button>
          </div>

          {/* Profile Completion Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Profile Completion
                </h3>
                <p className="text-sm text-gray-600">
                  {completionStats.isComplete 
                    ? 'Your profile is complete!' 
                    : `${completionStats.missingFields.length} fields remaining`
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {completionStats.percentage}%
                </div>
                <div className="text-xs text-gray-500">Complete</div>
              </div>
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionStats.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Basic Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900">{currentProfile.full_name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Age</label>
                  <p className="text-sm text-gray-900">{currentProfile.age || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Gender</label>
                  <p className="text-sm text-gray-900 capitalize">
                    {currentProfile.gender?.replace(/-/g, ' ') || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Travel Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Travel Preferences
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Budget</label>
                  <p className="text-sm text-gray-900 capitalize">
                    {currentProfile.budget || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Environment Preference</label>
                  <p className="text-sm text-gray-900 capitalize">
                    {currentProfile.env_preference || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Activity Style</label>
                  <p className="text-sm text-gray-900 capitalize">
                    {currentProfile.activity_style || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Food Restrictions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:col-span-2">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Dietary Restrictions
              </h3>
              <p className="text-sm text-gray-900">
                {currentProfile.food_restrictions || 'No restrictions specified'}
              </p>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
