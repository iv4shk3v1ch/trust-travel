'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/components/wizard/OnboardingWizard';
import { supabase } from '@/lib/supabase';
import { loadExistingProfile } from '@/lib/newDatabase';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      // Check if user already has a profile in the database
      try {
        const existingProfile = await loadExistingProfile();
        if (existingProfile) {
          // User already has a profile, redirect to dashboard
          router.push('/dashboard');
          return;
        }
      } catch {
        // If error loading profile, assume it doesn't exist yet
        console.log('No existing profile found, showing onboarding');
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleComplete = () => {
    // After completing onboarding, redirect to dashboard
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  return <OnboardingWizard onComplete={handleComplete} />;
}
