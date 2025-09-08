import { useState, useEffect } from 'react';
import { UserPreferences } from '@/types/preferences';
import { loadProfile } from '@/lib/database';

export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get profile from localStorage first (for development/offline mode)
        const localProfile = localStorage.getItem(`profile_${userId}`);
        if (localProfile) {
          setProfile(JSON.parse(localProfile));
          setLoading(false);
          return;
        }

        // Try to load from actual database
        console.log('🔍 useUserProfile: Attempting to load profile from database...');
        const databaseProfile = await loadProfile();
        
        if (databaseProfile) {
          console.log('✅ useUserProfile: Profile loaded from database:', databaseProfile);
          setProfile(databaseProfile);
          setLoading(false);
          return;
        }

        console.log('ℹ️ useUserProfile: No profile found in database, using mock data');
        
        // Fallback to mock profile for testing if no real profile exists
        // Check if we want a complete profile for testing
        const useCompleteProfile = localStorage.getItem('useCompleteProfile') === 'true';
        
        const mockProfile: UserPreferences = useCompleteProfile ? {
          // Complete profile for testing 100% functionality
          basicInfo: {
            firstName: 'John',
            lastName: 'Doe',
            gender: 'male',
            ageGroup: '25-34'
          },
          preferences: {
            activities: ['hiking', 'photography'],
            placeTypes: ['mountains', 'cities'] // Has 2+ items
          },
          foodAndRestrictions: {
            foodExcitement: ['italian'],
            restrictions: [],
            placesToAvoid: []
          },
          personalityAndStyle: {
            travelPersonality: ['adventurous'], // Has 1+ items
            planningStyle: 'flexible' // Non-empty
          },
          budget: {
            spendingStyle: 'mid-range', // Non-empty
            travelWith: 'solo' // Non-empty
          },
          completedSteps: [1, 2, 3, 4, 5, 6],
          isComplete: true
        } : {
          // Incomplete profile for testing 63% scenario
          basicInfo: {
            firstName: 'John',
            lastName: 'Doe',
            gender: 'male',
            ageGroup: '25-34'
          },
          preferences: {
            activities: ['hiking', 'photography'],
            placeTypes: ['mountains'] // Only 1 item, needs 2+
          },
          foodAndRestrictions: {
            foodExcitement: ['italian'],
            restrictions: [],
            placesToAvoid: []
          },
          personalityAndStyle: {
            travelPersonality: [], // Empty, needs 1+
            planningStyle: '' // Empty
          },
          budget: {
            spendingStyle: '', // Empty
            travelWith: '' // Empty
          },
          completedSteps: [1, 2, 3],
          isComplete: false
        };

        setProfile(mockProfile);
      } catch (err) {
        console.error('🔧 useUserProfile: Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading, error };
}
