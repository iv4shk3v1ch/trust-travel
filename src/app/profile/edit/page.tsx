'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NewProfileForm from '@/features/profile/components/NewProfileForm';
import { loadExistingProfile, DatabaseProfile } from '@/core/database/newDatabase';
import { supabase } from '@/core/database/supabase';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<DatabaseProfile | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        // Load profile for editing
        const profile = await loadExistingProfile();
        setCurrentProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
        // If no profile exists, redirect to create one
        router.push('/profile');
      }
      
      setLoading(false);
    };

    loadUserData();
  }, [router]);

  const handleUpdateComplete = () => {
    // Redirect back to profile view after successful update
    router.push('/profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Navigation */}
        <div className="mb-6">
          <button 
            onClick={() => router.push('/profile')}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <span className="mr-2">←</span>
            Back to Profile
          </button>
        </div>
        
        {/* Edit Form */}
        <NewProfileForm 
          initialData={currentProfile}
          onComplete={handleUpdateComplete}
        />
      </div>
    </div>
  );
}
