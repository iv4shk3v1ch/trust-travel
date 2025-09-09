'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getMyConnections, getUsersWhoTrustMe, disconnectFromUser } from '@/lib/connections';
import type { UserConnection, UserWhoTrustsMe } from '@/lib/connections';
import { Button } from '@/components/ui/Button';
import { TrustGraph } from '@/components/social/TrustGraph';
import type { TrustNode, TrustLink } from '@/components/social/TrustGraph';

export default function ConnectionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myConnections, setMyConnections] = useState<UserConnection[]>([]);
  const [whoTrustsMe, setWhoTrustsMe] = useState<UserWhoTrustsMe[]>([]);
  const [activeTab, setActiveTab] = useState<'connections' | 'trustees' | 'graph'>('connections');

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const [connections, trustees] = await Promise.all([
        getMyConnections(),
        getUsersWhoTrustMe()
      ]);
      setMyConnections(connections);
      setWhoTrustsMe(trustees);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for graph data
  const getGraphNodes = (): TrustNode[] => {
    const nodes: TrustNode[] = [];
    
    // Add current user as center node
    if (user) {
      nodes.push({
        id: user.id,
        name: user.name || 'You',
        avatar: '/default-avatar.png', // No avatar in current user schema
        reviews: 0, // Could fetch from reviews count
        isCurrentUser: true
      });
    }

    // Add connections as nodes
    myConnections.forEach(connection => {
      nodes.push({
        id: connection.target_user,
        name: connection.profiles.full_name,
        avatar: '/default-avatar.png', // No avatar in current schema
        reviews: Math.floor(Math.random() * 50) + 1, // Mock data
        isCurrentUser: false
      });
    });

    // Add trustees as nodes (if not already in connections)
    whoTrustsMe.forEach(trustee => {
      if (!nodes.find(n => n.id === trustee.source_user)) {
        nodes.push({
          id: trustee.source_user,
          name: trustee.profiles.full_name,
          avatar: '/default-avatar.png', // No avatar in current schema
          reviews: Math.floor(Math.random() * 30) + 1, // Mock data
          isCurrentUser: false
        });
      }
    });

    return nodes;
  };

  const getGraphLinks = (): TrustLink[] => {
    const links: TrustLink[] = [];
    
    if (!user) return links;

    // Add links from current user to connections (outgoing trust)
    myConnections.forEach(connection => {
      links.push({
        source: user.id,
        target: connection.target_user,
        strength: Math.random() * 0.5 + 0.5, // Random strength 0.5-1.0
      });
    });

    // Add links from trustees to current user (incoming trust)
    whoTrustsMe.forEach(trustee => {
      links.push({
        source: trustee.source_user,
        target: user.id,
        strength: Math.random() * 0.5 + 0.5, // Random strength 0.5-1.0
      });
    });

    // Add some mutual connections (mock data)
    for (let i = 0; i < Math.min(myConnections.length, 3); i++) {
      for (let j = i + 1; j < Math.min(myConnections.length, i + 3); j++) {
        if (Math.random() > 0.7) { // 30% chance of mutual connection
          links.push({
            source: myConnections[i].target_user,
            target: myConnections[j].target_user,
            strength: Math.random() * 0.3 + 0.2, // Weaker mutual connections
          });
        }
      }
    }

    return links;
  };

  const handleDisconnect = async (userId: string) => {
    if (!confirm('Are you sure you want to disconnect from this user?')) return;

    try {
      const result = await disconnectFromUser(userId);
      if (result.success) {
        // Refresh connections
        await loadConnections();
      } else {
        alert(result.error || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('An unexpected error occurred');
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

  const ConnectionCard = ({ connection, showDisconnect = false }: { 
    connection: UserConnection | UserWhoTrustsMe; 
    showDisconnect?: boolean;
  }) => {
    const profile = connection.profiles;
    const userId = 'target_user' in connection ? connection.target_user : connection.source_user;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {profile.full_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {profile.age} years • {profile.gender}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Connected {new Date(connection.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
              {getBudgetLabel(profile.budget_level)}
            </span>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
              {getTripStyleLabel(profile.trip_style)}
            </span>
          </div>
        </div>

        {/* Activities */}
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Activities:
          </h4>
          <div className="flex flex-wrap gap-1">
            {profile.activities.slice(0, 4).map((activity) => (
              <span key={activity} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                {activity}
              </span>
            ))}
            {profile.activities.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                +{profile.activities.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Personality Traits */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Personality:
          </h4>
          <div className="flex flex-wrap gap-1">
            {profile.personality_traits.slice(0, 3).map((trait) => (
              <span key={trait} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                {trait}
              </span>
            ))}
            {profile.personality_traits.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                +{profile.personality_traits.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            Message
          </Button>
          {showDisconnect && (
            <Button 
              variant="ghost" 
              onClick={() => handleDisconnect(userId)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Disconnect
            </Button>
          )}
        </div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Travel Connections</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your trusted travel companions and connections
            </p>
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/search')}
            >
              Find More Travelers
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
            >
              ← Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1 mb-8">
          <button
            onClick={() => setActiveTab('connections')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'connections'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            My Connections ({myConnections.length})
          </button>
          <button
            onClick={() => setActiveTab('trustees')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'trustees'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Who Trusts Me ({whoTrustsMe.length})
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'graph'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Trust Graph
          </button>
        </div>

        {/* Content */}
        {activeTab === 'connections' ? (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                People I Trust
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                These are travelers you&apos;ve chosen to connect with and trust.
              </p>
            </div>

            {myConnections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myConnections.map((connection) => (
                  <ConnectionCard 
                    key={connection.id} 
                    connection={connection} 
                    showDisconnect={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No connections yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start building your travel network by connecting with like-minded travelers.
                  </p>
                  <Button onClick={() => router.push('/search')}>
                    Find Travel Companions
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'trustees' ? (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                People Who Trust Me
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                These travelers have chosen to connect with and trust you.
              </p>
            </div>

            {whoTrustsMe.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {whoTrustsMe.map((connection) => (
                  <ConnectionCard 
                    key={connection.id} 
                    connection={connection} 
                    showDisconnect={false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No one has connected with you yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Complete your profile and engage with the travel community to build trust.
                  </p>
                  <Button onClick={() => router.push('/profile')}>
                    Complete Profile
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Trust Network Visualization
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Interactive graph showing your trust network and mutual connections.
              </p>
            </div>

            <TrustGraph
              nodes={getGraphNodes()}
              links={getGraphLinks()}
              width={800}
              height={500}
              className="mb-6"
            />
          </div>
        )}
      </div>
    </div>
  );
}
