'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/core/database/supabase';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { loadExistingProfile, DatabaseProfile } from '@/core/database/newDatabase';
import { calculateProfileCompleteness } from '@/core/services/profileScore';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DatabaseProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push('/login');
          return;
        }

        setUser(user);
        
        // Check if user has a profile
        try {
          const existingProfile = await loadExistingProfile();
          setProfile(existingProfile);
        } catch {
          // Profile doesn't exist
          setProfile(null);
        }
        
      } catch (error) {
        console.error('Error checking user status:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate profile completion stats
  const profileStats = profile ? calculateProfileCompleteness(profile) : { percentage: 0, isComplete: false, missingFields: [] };

  // REGULAR DASHBOARD
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {profile?.full_name || user?.user_metadata?.full_name || 'Traveler'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ready for your next Trento adventure?
          </p>
        </div>

        {/* Main Actions - 3 Columns with 2 Cards Each */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* Column 1: Trip Planning */}
          <div className="space-y-6">
            {/* Plan New Trip */}
            <div className="mb-6">
              <Link href="/plan-trip">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white hover:shadow-lg transition-all duration-200 cursor-pointer min-h-[140px] flex items-center">
                  <div className="text-center space-y-2 w-full">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-xl">🗺️</span>
                    </div>
                    <h3 className="text-lg font-bold">Plan New Trip</h3>
                    <p className="text-indigo-100 text-sm">Create your perfect Trento itinerary</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Leave a Review */}
            <div>
              <Link href="/reviews">
                <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-4 text-white hover:shadow-lg transition-all duration-200 cursor-pointer min-h-[140px] flex items-center">
                  <div className="text-center space-y-2 w-full">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-xl">⭐</span>
                    </div>
                    <h3 className="text-lg font-bold">Leave a Review</h3>
                    <p className="text-pink-100 text-sm">Share your experience with others</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Column 2: Social Features */}
          <div className="space-y-6">
            {/* My Connections */}
            <div className="mb-6">
              <Link href="/connections">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white hover:shadow-lg transition-all duration-200 cursor-pointer min-h-[140px] flex items-center">
                  <div className="text-center space-y-2 w-full">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-xl">🤝</span>
                    </div>
                    <h3 className="text-lg font-bold">My Connections</h3>
                    <p className="text-emerald-100 text-sm">Connect with fellow travelers</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Add Place */}
            <div>
              <Link href="/add-place">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white hover:shadow-lg transition-all duration-200 cursor-pointer min-h-[140px] flex items-center">
                  <div className="text-center space-y-2 w-full">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-xl">�</span>
                    </div>
                    <h3 className="text-lg font-bold">Add Place</h3>
                    <p className="text-amber-100 text-sm">Share amazing places with community</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Column 3: Profile Management */}
          <div className="space-y-6">
            {/* Profile Completeness */}
            <div className="mb-6">
              <Link href="/profile">
                <div className="bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl p-4 text-white hover:shadow-lg transition-all duration-200 cursor-pointer min-h-[140px] flex items-center">
                  <div className="text-center space-y-2 w-full">
                    <div className="relative w-12 h-12 mx-auto">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-white/20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${profileStats.percentage}, 100`}
                          strokeLinecap="round"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          style={{
                            strokeDashoffset: 0,
                            transition: 'stroke-dasharray 1s ease-in-out'
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{profileStats.percentage}%</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold">Profile Completeness</h3>
                    <p className="text-slate-200 text-sm">
                      {profileStats.isComplete 
                        ? 'Profile complete!'
                        : `${profileStats.missingFields.length} sections remaining`
                      }
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {/* My Profile */}
            <div>
              <Link href="/profile">
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-4 text-white hover:shadow-lg transition-all duration-200 cursor-pointer min-h-[140px] flex items-center">
                  <div className="text-center space-y-2 w-full">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-xl">👤</span>
                    </div>
                    <h3 className="text-lg font-bold">My Profile</h3>
                    <p className="text-violet-100 text-sm">View and manage your profile</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
            <strong>Debug Info:</strong>
            <br />User ID: {user?.id}
            <br />User Email: {user?.email}
            <br />Has Metadata: {Object.keys(user?.user_metadata || {}).length > 0 ? 'Yes' : 'No'}
            <br />Metadata Keys: {Object.keys(user?.user_metadata || {}).join(', ')}
          </div>
        )}

      </div>
    </div>
  );
}
