'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NewProfileForm from '@/components/forms/NewProfileForm';
import { loadExistingProfile, DatabaseProfile } from '@/lib/newDatabase';
import { supabase } from '@/lib/supabase';

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
        {/* Edit Form */}
        <NewProfileForm 
          initialData={currentProfile}
          onComplete={handleUpdateComplete}
        />
      </div>
    </div>
  );
}
