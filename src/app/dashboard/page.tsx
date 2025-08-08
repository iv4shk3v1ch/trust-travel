'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import OnboardingWizard from '@/components/wizard/OnboardingWizard';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Check if user needs onboarding
        // For now, we'll check if they have a profile in our database
        // You can adjust this logic based on your needs
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, onboarding_completed')
          .eq('id', session.user.id)
          .single();

        if (error || !profile?.onboarding_completed) {
          // New user or hasn't completed onboarding
          setShowOnboarding(true);
        }
        
        setCheckingOnboarding(false);
      } else {
        router.push('/login');
      }
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleOnboardingComplete = async () => {
    // Mark onboarding as completed in the database
    if (user) {
      await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          onboarding_completed: true,
          email: user.email 
        });
    }
    
    setShowOnboarding(false);
  };

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-6 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <div className="text-lg text-gray-600">Setting up your experience...</div>
        </div>
      </div>
    );
  }

  // Show onboarding wizard for new users
  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // Regular dashboard for returning users
  return (
    <div className="space-y-6">
      {/* Welcome Back Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ready for your next adventure? Let&apos;s make it amazing.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Member since</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {new Date(user?.created_at || '').toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Primary CTAs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan New Trip - Primary Action */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-3xl mb-3">🗺️</div>
            <h3 className="text-xl font-bold mb-2">Plan Your Next Adventure</h3>
            <p className="text-indigo-100 mb-4">
              Get AI-powered recommendations for your perfect Trento experience
            </p>
            <Link 
              href="/plan-trip"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Start Planning
              <span>→</span>
            </Link>
          </div>
          <div className="absolute -right-6 -bottom-6 text-6xl opacity-20">🚀</div>
        </div>

        {/* Find Companions - Secondary Action */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-3xl mb-3">🤝</div>
            <h3 className="text-xl font-bold mb-2">Find Travel Companions</h3>
            <p className="text-blue-100 mb-4">
              Connect with like-minded travelers who share your interests
            </p>
            <Link 
              href="/search"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Discover People
              <span>→</span>
            </Link>
          </div>
          <div className="absolute -right-6 -bottom-6 text-6xl opacity-20">👥</div>
        </div>
      </div>

      {/* Quick Stats/Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">0</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Planned Trips</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Connections</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Reviews</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">New</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Member</div>
        </div>
      </div>

      {/* Secondary Options */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">More Options</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/profile"
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-800/30 transition-colors">
              <span className="text-xl">👤</span>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile</div>
          </Link>

          <Link 
            href="/connections"
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/30 transition-colors">
              <span className="text-xl">🔗</span>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Connections</div>
          </Link>

          <button 
            onClick={() => setShowOnboarding(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
              <span className="text-xl">✨</span>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Improve AI</div>
          </button>

          <Link 
            href="/test-env"
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
              <span className="text-xl">🔧</span>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Test</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
