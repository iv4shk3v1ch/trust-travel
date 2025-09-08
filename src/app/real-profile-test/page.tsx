'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { loadProfile } from '@/lib/database';
import { UserPreferences } from '@/types/preferences';
import { getProfileScore, ProfileScoreResult } from '@/services/profileScore';

export default function RealProfileTestPage() {
  const { user } = useAuth();
  const [realProfile, setRealProfile] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<ProfileScoreResult | null>(null);

  const testRealProfile = useCallback(async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading real profile from database...');
      const profile = await loadProfile();
      
      if (profile) {
        console.log('✅ Real profile loaded:', profile);
        setRealProfile(profile);
        
        // Calculate score
        const profileScore = getProfileScore(profile);
        setScore(profileScore);
        
        console.log('📊 Profile score:', profileScore);
      } else {
        setError('No profile found in database');
      }
    } catch (err) {
      console.error('❌ Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      testRealProfile();
    }
  }, [user, testRealProfile]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Please Log In</h1>
          <p className="text-gray-600 dark:text-gray-400">You need to be authenticated to test real profile loading.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Real Profile Database Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This page tests loading your actual profile from the database and calculating its completion score.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Profile Test Results
            </h2>
            <Button onClick={testRealProfile} disabled={loading}>
              {loading ? 'Loading...' : '🔄 Reload Profile'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-800 dark:text-red-200">❌ Error: {error}</p>
            </div>
          )}

          {realProfile && (
            <div className="space-y-6">
              {/* Score Summary */}
              {score && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                    🎉 Profile Score: {score.totalScore}/100 ({score.totalScore}%)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">Basic Info</p>
                      <p className="text-green-600 dark:text-green-400">{score.sectionScores.basicInfo}/30</p>
                    </div>
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">Preferences</p>
                      <p className="text-green-600 dark:text-green-400">{score.sectionScores.preferences}/25</p>
                    </div>
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">Food</p>
                      <p className="text-green-600 dark:text-green-400">{score.sectionScores.foodAndRestrictions}/20</p>
                    </div>
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">Personality</p>
                      <p className="text-green-600 dark:text-green-400">{score.sectionScores.personalityAndStyle}/15</p>
                    </div>
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">Budget</p>
                      <p className="text-green-600 dark:text-green-400">{score.sectionScores.budget}/10</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Data */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Real Profile Data
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-96">
                    {JSON.stringify(realProfile, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Key Fields Check */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Key Fields Verification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Activities:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {realProfile.preferences.activities.length} items
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Place Types:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {realProfile.preferences.placeTypes.length} items
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Food Preferences:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {realProfile.foodAndRestrictions.foodExcitement.length} items
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Travel Personality:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {realProfile.personalityAndStyle.travelPersonality.length} items
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Planning Style:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {realProfile.personalityAndStyle.planningStyle || 'Empty'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Spending Style:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {realProfile.budget.spendingStyle || 'Empty'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading profile from database...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
