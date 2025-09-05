'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { supabase } from '@/lib/supabase';
import { connectToUser, disconnectFromUser, isUserConnected, isMutualConnection } from '@/lib/connections';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface UserProfile {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  budget_level: 'low' | 'medium' | 'high';
  activities: string[];
  place_types: string[];
  personality_traits: string[];
  trip_style: 'planned' | 'mixed' | 'spontaneous';
  travel_with: string;
}

export default function SearchPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const loadSuggestedUsers = async (userProfile: UserProfile | null) => {
      try {
        console.log('Loading suggested users, current user profile:', userProfile);
        
        // Get users with similar interests or complementary travel styles
        const { data: users, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', userProfile?.id || '')
          .limit(6);

        if (error) {
          console.error('Error loading suggested users:', error);
          setSuggestedUsers([]);
          return;
        }

        console.log('Raw users from database:', users);
        console.log('Loaded suggested users:', users?.length || 0);

        if (users && users.length > 0 && userProfile) {
          // Sort by similarity to current user
          const sortedUsers = users
            .map(user => ({
              ...user,
              similarity: calculateSimilarity(userProfile, user)
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 6);

          setSuggestedUsers(sortedUsers);
        } else {
          setSuggestedUsers(users || []);
        }
      } catch (error) {
        console.error('Error loading suggested users:', error);
        setSuggestedUsers([]);
      }
    };

    const loadData = async () => {
      if (!user) return;

      try {
        console.log('Current user ID:', user.id);

        // Load current user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('Current user profile query result:', userProfile, profileError);

        if (userProfile) {
          setCurrentUser(userProfile);
        } else {
          console.log('No profile found for current user, this might be why search shows no results');
        }

        // Load suggested users (users with similar interests)
        await loadSuggestedUsers(userProfile);
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const calculateSimilarity = (user1: UserProfile, user2: UserProfile): number => {
    let score = 0;
    
    // Age similarity (closer ages get higher score)
    const ageDiff = Math.abs(user1.age - user2.age);
    score += Math.max(0, 20 - ageDiff); // Max 20 points for age
    
    // Common activities
    const commonActivities = user1.activities.filter(activity => 
      user2.activities.includes(activity)
    ).length;
    score += commonActivities * 10; // 10 points per common activity
    
    // Common place types
    const commonPlaces = user1.place_types.filter(place => 
      user2.place_types.includes(place)
    ).length;
    score += commonPlaces * 8; // 8 points per common place type
    
    // Common personality traits
    const commonTraits = user1.personality_traits.filter(trait => 
      user2.personality_traits.includes(trait)
    ).length;
    score += commonTraits * 15; // 15 points per common trait
    
    // Budget level compatibility
    if (user1.budget_level === user2.budget_level) {
      score += 25; // 25 points for same budget level
    }
    
    // Trip style compatibility
    if (user1.trip_style === user2.trip_style) {
      score += 20; // 20 points for same trip style
    }
    
    return score;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const searchTerm = searchQuery.trim().toLowerCase();
      console.log('Searching for:', searchTerm);
      
      // Get all users first, then filter in JavaScript for more reliable search
      const { data: allUsers, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser?.id || '');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Found users:', allUsers?.length || 0);

      // Filter users based on search term
      const filteredUsers = (allUsers || []).filter(user => {
        // Search in name
        if (user.full_name?.toLowerCase().includes(searchTerm)) return true;
        
        // Search in activities
        if (user.activities?.some((activity: string) => 
          activity.toLowerCase().includes(searchTerm)
        )) return true;
        
        // Search in place types
        if (user.place_types?.some((place: string) => 
          place.toLowerCase().includes(searchTerm)
        )) return true;
        
        // Search in personality traits
        if (user.personality_traits?.some((trait: string) => 
          trait.toLowerCase().includes(searchTerm)
        )) return true;
        
        // Search in trip style
        if (user.trip_style?.toLowerCase().includes(searchTerm)) return true;
        
        // Search in budget level
        if (user.budget_level?.toLowerCase().includes(searchTerm)) return true;
        
        // Search in gender
        if (user.gender?.toLowerCase().includes(searchTerm)) return true;
        
        return false;
      });

      console.log('Filtered users:', filteredUsers.length);
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
      // Show user-friendly error message
      alert('Search failed. Please try again or contact support if the issue persists.');
    } finally {
      setSearchLoading(false);
    }
  };

  const getBudgetLabel = (level: string) => {
    const labels = {
      'low': 'Budget Explorer',
      'medium': 'Comfort Seeker', 
      'high': 'Luxury Traveler'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getTripStyleLabel = (style: string) => {
    const labels = {
      'planned': 'Detailed Planner',
      'mixed': 'Flexible Explorer',
      'spontaneous': 'Go with the Flow'
    };
    return labels[style as keyof typeof labels] || style;
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
        } catch (error) {
          console.error('Error loading connection status:', error);
        }
      };
      loadStatus();
    }, [user.id]);

    const handleConnect = async () => {
      setConnecting(true);
      try {
        console.log('handleConnect called for user:', user.id, 'isConnected:', isConnected);
        
        if (isConnected) {
          console.log('Attempting to disconnect...');
          const result = await disconnectFromUser(user.id);
          if (result.success) {
            setIsConnected(false);
            setMutualStatus(prev => ({ ...prev, iConnectedToThem: false, isMutual: false }));
          } else {
            console.error('Disconnect failed:', result.error);
            alert(result.error || 'Failed to disconnect');
          }
        } else {
          console.log('Attempting to connect...');
          const result = await connectToUser(user.id);
          console.log('Connect result:', result);
          if (result.success) {
            setIsConnected(true);
            setMutualStatus(prev => ({ ...prev, iConnectedToThem: true, isMutual: prev.theyConnectedToMe }));
          } else {
            console.error('Connect failed:', result.error);
            alert(result.error || 'Failed to connect');
          }
        }
      } catch (error) {
        console.error('Error handling connection:', error);
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
          <div className="flex flex-col items-end space-y-1">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
              {getBudgetLabel(user.budget_level)}
            </span>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
              {getTripStyleLabel(user.trip_style)}
            </span>
          </div>
        </div>

        {/* Activities */}
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loves to do:
          </h4>
          <div className="flex flex-wrap gap-1">
            {user.activities.slice(0, 3).map((activity) => (
              <span key={activity} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                {activity}
              </span>
            ))}
            {user.activities.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                +{user.activities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Personality Traits */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Travel personality:
          </h4>
          <div className="flex flex-wrap gap-1">
            {user.personality_traits.slice(0, 2).map((trait) => (
              <span key={trait} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                {trait}
              </span>
            ))}
            {user.personality_traits.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                +{user.personality_traits.length - 2} more
              </span>
            )}
          </div>
        </div>

        {/* Travel With */}
        {user.travel_with && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Usually travels: <span className="font-medium">{user.travel_with}</span>
          </p>
        )}

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

  if (loading) {
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
                placeholder="Search by name, activities, personality, travel style... (e.g., 'hiking', 'adventurous', 'planned')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={searchLoading}
              className="px-8"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Try searching for:</span>
            {['hiking', 'adventurous', 'budget', 'spontaneous', 'planned', 'museums', 'beaches', 'foodie'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  // Auto-search when clicking suggestion
                  setTimeout(() => handleSearch(), 100);
                }}
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
