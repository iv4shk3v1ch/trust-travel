'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { useSuggestedUsers, useUserSearch } from '@/features/social/hooks/useUserSearch';
import { connectToUser, disconnectFromUser, isUserConnected, isMutualConnection } from '@/features/social/connections';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user.full_name}
              {mutualStatus.isMutual && <span className="ml-2 text-green-500">🤝</span>}
              {mutualStatus.theyConnectedToMe && !mutualStatus.iConnectedToThem && <span className="ml-2 text-blue-500">→</span>}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user.age} years • {user.gender}
            </p>
          </div>
        </div>

        {/* Travel Preferences */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget:</span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
              {getBudgetLabel(user.budget)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Activity Style:</span>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
              {getActivityStyleLabel(user.activity_style)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Environment:</span>
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full">
              {getEnvPreferenceLabel(user.env_preference)}
            </span>
          </div>

          {user.food_restrictions && user.food_restrictions.trim() && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dietary:</span>
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                {user.food_restrictions}
              </span>
            </div>
          )}
        </div>

        {/* Connection Status */}
        {mutualStatus.theyConnectedToMe && !isConnected && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Find Travel Companions</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Connect with like-minded travelers who share your interests and style
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
          >
            ← Back to Dashboard
          </Button>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex space-x-4">
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
              <div className="flex items-center px-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Try searching for:</span>
            {['outdoor', 'indoor', 'balanced', 'active', 'relaxed', 'budget', 'luxury'].map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Search Results ({searchResults.length})
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No travelers found matching &ldquo;{searchQuery}&rdquo;. Try different keywords!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Suggested Users */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {searchQuery ? 'More Travelers You Might Like' : 'Travelers You Might Connect With'}
          </h2>
          {suggestedUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No other travelers found yet. Be the first to complete your profile!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
