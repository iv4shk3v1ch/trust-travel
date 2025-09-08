'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get current user
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !currentUser) {
          router.push('/login');
          return;
        }

        setUser(currentUser);
        
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

  // REGULAR DASHBOARD - NO MORE ONBOARDING WIZARD
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.user_metadata?.firstName || 'Traveler'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ready for your next Trento adventure?
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Plan New Trip */}
          <Link href="/plan-trip">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-200 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🗺️</span>
                </div>
                <h3 className="text-xl font-semibold">Plan New Trip</h3>
              </div>
              <p className="text-indigo-100">Create your perfect Trento itinerary</p>
            </div>
          </Link>

          {/* Find Companions */}
          <Link href="/search">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-200 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold">Find Companions</h3>
              </div>
              <p className="text-emerald-100">Connect with travelers in Trento</p>
            </div>
          </Link>

          {/* My Profile */}
          <Link href="/profile">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-200 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="text-xl font-semibold">My Profile</h3>
              </div>
              <p className="text-orange-100">Manage your travel preferences</p>
            </div>
          </Link>

        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Travel Network</h3>
            <div className="space-y-3">
              <Link href="/connections">
                <Button variant="outline" className="w-full justify-start">
                  <span className="mr-2">🤝</span>
                  My Connections
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline" className="w-full justify-start">
                  <span className="mr-2">🔍</span>
                  Find Travelers
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Trip Management</h3>
            <div className="space-y-3">
              <Link href="/plan-trip">
                <Button variant="outline" className="w-full justify-start">
                  <span className="mr-2">➕</span>
                  Plan New Trip
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start" disabled>
                <span className="mr-2">📋</span>
                My Trips (Soon)
              </Button>
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
