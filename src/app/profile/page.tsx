'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NewProfileForm from '@/components/forms/NewProfileForm';
import { loadExistingProfile, DatabaseProfile, saveNewProfile } from '@/lib/newDatabase';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<DatabaseProfile | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        // Load profile using new database function
        const profile = await loadExistingProfile();
        setCurrentProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
      
      setLoading(false);
    };

    loadUserData();
  }, [router]);

  const handleUpdateComplete = async () => {
    try {
      // Reload the profile after successful update
      const updatedProfile = await loadExistingProfile();
      setCurrentProfile(updatedProfile);
      setEditing(false);
    } catch (error) {
      console.error('Error reloading profile:', error);
      // Still close editing mode even if reload fails
      setEditing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Quick update function for individual fields
  const quickUpdateField = async (fieldName: keyof Omit<DatabaseProfile, 'id' | 'updated_at'>, newValue: string | number | string[]) => {
    if (!currentProfile) return;
    
    try {
      console.log(`🔄 Quick updating ${fieldName}:`, newValue);
      
      // Create updated profile
      const updatedProfile = {
        ...currentProfile,
        [fieldName]: newValue
      };
      
      // Save to database
      await saveNewProfile({
        full_name: updatedProfile.full_name,
        age: updatedProfile.age,
        gender: updatedProfile.gender,
        budget_level: updatedProfile.budget_level,
        activities: updatedProfile.activities,
        place_types: updatedProfile.place_types,
        food_preferences: updatedProfile.food_preferences,
        food_restrictions: updatedProfile.food_restrictions,
        personality_traits: updatedProfile.personality_traits,
        trip_style: updatedProfile.trip_style
      });
      
      // Update local state
      setCurrentProfile(updatedProfile);
      
      console.log(`✅ ${fieldName} updated successfully`);
    } catch (error) {
      console.error(`❌ Failed to update ${fieldName}:`, error);
      alert(`Failed to update ${fieldName}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setEditing(false)}
              className="mb-4"
            >
              ← Back to Profile
            </Button>
          </div>
          <NewProfileForm 
            onComplete={handleUpdateComplete}
            initialData={currentProfile}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Travel Profile</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your travel preferences and personal information
            </p>
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>

        {!currentProfile ? (
          /* No profile yet */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Complete Your Profile
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Set up your travel preferences to get personalized recommendations
              </p>
              <Button onClick={() => setEditing(true)}>
                Set Up Profile
              </Button>
            </div>
          </div>
        ) : (
          /* Show current profile */
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Profile Status
                  </h2>
                  <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                    ✓ Profile completed
                  </p>
                </div>
                <Button onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Basic Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Name:</span> {currentProfile.full_name}</p>
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Age:</span> {currentProfile.age}</p>
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Gender:</span> {currentProfile.gender}</p>
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Budget Level:</span> {currentProfile.budget_level}</p>
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Trip Style:</span> {currentProfile.trip_style}</p>
                </div>
              </div>

              {/* Travel Activities */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Favorite Activities
                  </h3>
                  {currentProfile.activities.length > 0 && (
                    <button
                      onClick={() => quickUpdateField('activities', [])}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Clear all activities"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {currentProfile.activities.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {currentProfile.activities.slice(0, 5).map((activity: string) => (
                        <span 
                          key={activity} 
                          className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full relative group cursor-pointer"
                          onClick={() => {
                            const newActivities = currentProfile.activities.filter(a => a !== activity);
                            quickUpdateField('activities', newActivities);
                          }}
                          title="Click to remove"
                        >
                          {activity}
                          <span className="ml-1 opacity-0 group-hover:opacity-100 text-red-500">×</span>
                        </span>
                      ))}
                      {currentProfile.activities.length > 5 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                          +{currentProfile.activities.length - 5} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No activities selected</p>
                  )}
                </div>
              </div>

              {/* Place Types */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Preferred Places
                  </h3>
                  {currentProfile.place_types.length > 0 && (
                    <button
                      onClick={() => quickUpdateField('place_types', [])}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Clear all place preferences"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {currentProfile.place_types.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {currentProfile.place_types.slice(0, 4).map((place: string) => (
                        <span 
                          key={place} 
                          className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full relative group cursor-pointer"
                          onClick={() => {
                            const newPlaceTypes = currentProfile.place_types.filter(p => p !== place);
                            quickUpdateField('place_types', newPlaceTypes);
                          }}
                          title="Click to remove"
                        >
                          {place}
                          <span className="ml-1 opacity-0 group-hover:opacity-100 text-red-500">×</span>
                        </span>
                      ))}
                      {currentProfile.place_types.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                          +{currentProfile.place_types.length - 4} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No place preferences selected</p>
                  )}
                </div>
              </div>

              {/* Food Preferences */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Food & Dining
                  </h3>
                  {(currentProfile.food_preferences.length > 0 || currentProfile.food_restrictions.length > 0) && (
                    <button
                      onClick={() => {
                        quickUpdateField('food_preferences', []);
                        quickUpdateField('food_restrictions', []);
                      }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Clear all food preferences and restrictions"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">Preferences:</span></p>
                  {currentProfile.food_preferences.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {currentProfile.food_preferences.map((food: string) => (
                        <span 
                          key={food} 
                          className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full relative group cursor-pointer"
                          onClick={() => {
                            const newFoodPrefs = currentProfile.food_preferences.filter(f => f !== food);
                            quickUpdateField('food_preferences', newFoodPrefs);
                          }}
                          title="Click to remove"
                        >
                          {food}
                          <span className="ml-1 opacity-0 group-hover:opacity-100 text-red-500">×</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No food preferences selected</p>
                  )}
                  
                  {currentProfile.food_restrictions.length > 0 && (
                    <>
                      <p className="text-gray-700 dark:text-gray-300 mt-2"><span className="font-medium text-gray-900 dark:text-white">Restrictions:</span></p>
                      <div className="flex flex-wrap gap-1">
                        {currentProfile.food_restrictions.map((restriction: string) => (
                          <span 
                            key={restriction} 
                            className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full relative group cursor-pointer"
                            onClick={() => {
                              const newRestrictions = currentProfile.food_restrictions.filter(r => r !== restriction);
                              quickUpdateField('food_restrictions', newRestrictions);
                            }}
                            title="Click to remove"
                          >
                            {restriction}
                            <span className="ml-1 opacity-0 group-hover:opacity-100 text-red-500">×</span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Personality Traits */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Travel Personality
                  </h3>
                  {currentProfile.personality_traits.length > 0 && (
                    <button
                      onClick={() => quickUpdateField('personality_traits', [])}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Clear all personality traits"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {currentProfile.personality_traits.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {currentProfile.personality_traits.map((trait: string) => (
                        <span 
                          key={trait} 
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full relative group cursor-pointer"
                          onClick={() => {
                            const newTraits = currentProfile.personality_traits.filter(t => t !== trait);
                            quickUpdateField('personality_traits', newTraits);
                          }}
                          title="Click to remove"
                        >
                          {trait}
                          <span className="ml-1 opacity-0 group-hover:opacity-100 text-red-500">×</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No personality traits selected</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
