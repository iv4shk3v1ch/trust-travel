'use client';

import React from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading } = useAuthGuard();

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name || 'Traveler'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ready for your next Trento adventure?
          </p>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
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

          {/* My Connections */}
          <Link href="/connections">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-200 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-xl font-semibold">My Connections</h3>
              </div>
              <p className="text-emerald-100">Connect with fellow travelers</p>
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

          {/* Leave Review */}
          <Link href="/reviews">
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-200 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <h3 className="text-xl font-semibold">Leave Review</h3>
              </div>
              <p className="text-pink-100">Share your travel experiences</p>
            </div>
          </Link>

        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
            <strong>Debug Info:</strong>
            <br />User ID: {user?.id}
            <br />User Email: {user?.email}
            <br />User Name: {user?.name}
          </div>
        )}

      </div>
    </div>
  );
}
