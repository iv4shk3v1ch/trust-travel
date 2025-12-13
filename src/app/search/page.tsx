'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { useSuggestedUsers, useUserSearch } from '@/features/social/hooks/useUserSearch';
import { connectToUser, disconnectFromUser, isUserConnected, isMutualConnection } from '@/features/social/connections';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Header } from '@/shared/components/Header';
import { Footer } from '@/shared/components/Footer';
import { useInteractionTracker } from '@/core/services/interactionTracker';
import { useEffect } from 'react';

interface UserProfile {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  budget: string; // 'low', 'medium', 'high'
  env_preference: string; // 'indoor', 'outdoor', 'balanced'
  activity_style: string; // 'relaxed', 'balanced', 'active'
  food_restrictions: string;
}

export default function SearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { track } = useInteractionTracker();
  
  // React Query hooks
  const { data: suggestedUsers = [], isLoading: loadingSuggested } = useSuggestedUsers();
  const { data: searchResults = [], isLoading: searchLoading } = useUserSearch(searchQuery);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Track search when searchResults change
  useEffect(() => {
    if (searchQuery && searchResults.length >= 0) {
      track('search', undefined, {
        search_query: searchQuery,
        results_count: searchResults.length,
        page: 'user_search'
      });
    }
  }, [searchResults, searchQuery, track]);

  const getBudgetLabel = (level: string) => {
    const labels = {
      'low': '💰 Budget Friendly',
      'medium': '💳 Comfort Seeker', 
      'high': '💎 Luxury Traveler'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getActivityStyleLabel = (style: string) => {
    const labels = {
      'relaxed': '🌅 Relaxed Pace',
      'balanced': '⚖️ Balanced Explorer',
      'active': '⚡ High Energy'
    };
    return labels[style as keyof typeof labels] || style;
  };

  const getEnvPreferenceLabel = (pref: string) => {
    const labels = {
      'indoor': '🏛️ Indoor Explorer',
      'outdoor': '🌲 Outdoor Adventurer',
      'balanced': '🌐 Both Indoor & Outdoor'
    };
    return labels[pref as keyof typeof labels] || pref;
  };

  const UserCard = ({ user }: { user: UserProfile }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [mutualStatus, setMutualStatus] = useState<{
      iConnectedToThem: boolean;
      theyConnectedToMe: boolean;
      isMutual: boolean;
    }>({ iConnectedToThem: false, theyConnectedToMe: false, isMutual: false });
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
      const loadStatus = async () => {
        try {
          const [connected, mutual] = await Promise.all([
            isUserConnected(user.id),
            isMutualConnection(user.id)
          ]);
          setIsConnected(connected);
          setMutualStatus(mutual);
        } catch {
          // Connection status loading failed silently
        }
      };
      loadStatus();
    }, [user.id]);

    const handleConnect = async () => {
      setConnecting(true);
      try {
        if (isConnected) {
          const result = await disconnectFromUser(user.id);
          if (result.success) {
            setIsConnected(false);
            setMutualStatus(prev => ({ ...prev, iConnectedToThem: false, isMutual: false }));
          } else {
            alert(result.error || 'Failed to disconnect');
          }
        } else {
          const result = await connectToUser(user.id);
          if (result.success) {
            setIsConnected(true);
            setMutualStatus(prev => ({ ...prev, iConnectedToThem: true, isMutual: prev.theyConnectedToMe }));
          } else {
            alert(result.error || 'Failed to connect');
          }
        }
      } catch {
        alert('An unexpected error occurred');
      } finally {
        setConnecting(false);
      }
    };

    const getConnectionButtonText = () => {
      if (connecting) return 'Processing...';
      if (mutualStatus.isMutual) return '🤝 Connected';
      if (isConnected) return '✓ Connected';
      if (mutualStatus.theyConnectedToMe) return 'Connect Back';
      return 'Connect';
    };

    const getConnectionButtonVariant = (): "outline" | "primary" | "secondary" | "ghost" => {
      if (mutualStatus.isMutual) return 'primary'; // Both connected
      if (isConnected) return 'outline'; // Only I connected
      if (mutualStatus.theyConnectedToMe) return 'primary'; // They connected to me
      return 'outline'; // No connection
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {user.full_name}
              {mutualStatus.isMutual && <span className="ml-2 text-green-500">🤝</span>}
              {mutualStatus.theyConnectedToMe && !mutualStatus.iConnectedToThem && <span className="ml-2 text-blue-500">→</span>}
            </h3>
            <p className="text-sm text-gray-600">
              {user.age} years • {user.gender}
            </p>
          </div>
        </div>

        {/* Travel Preferences */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Budget:</span>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              {getBudgetLabel(user.budget)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Activity Style:</span>
            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
              {getActivityStyleLabel(user.activity_style)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Environment:</span>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
              {getEnvPreferenceLabel(user.env_preference)}
            </span>
          </div>

          {user.food_restrictions && user.food_restrictions.trim() && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Dietary:</span>
              <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">
                {user.food_restrictions}
              </span>
            </div>
          )}
        </div>

        {/* Connection Status */}
        {mutualStatus.theyConnectedToMe && !isConnected && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              💙 This person has connected with you!
            </p>
          </div>
        )}

        <Button 
          variant={getConnectionButtonVariant()}
          className="w-full"
          onClick={handleConnect}
          disabled={connecting}
        >
          {getConnectionButtonText()}
        </Button>
      </div>
    );
  };

  // Show loading state
  const isLoading = loadingSuggested && !suggestedUsers.length;

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-6xl mx-auto px-4">
          {/* Back Button */}
          <button 
            onClick={() => router.push('/explore')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-6"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Find Travel Companions</h1>
            <p className="text-gray-600 mt-1">
              Connect with like-minded travelers who share your interests and style
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex space-x-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by name, environment preference, activity style, budget..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              {searchLoading && (
                <div className="flex items-center px-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Try searching for:</span>
              {['outdoor', 'indoor', 'balanced', 'active', 'relaxed', 'budget', 'luxury'].map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Search Results ({searchResults.length})
              </h2>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    No travelers found matching &ldquo;{searchQuery}&rdquo;. Try different keywords!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Suggested Users */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {searchQuery ? 'More Travelers You Might Like' : 'Travelers You Might Connect With'}
            </h2>
            {suggestedUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedUsers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No other travelers found yet. Be the first to complete your profile!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
