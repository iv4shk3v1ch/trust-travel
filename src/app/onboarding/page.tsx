'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MultiStepForm } from '@/components/forms/MultiStepForm';
import { UserPreferences } from '@/types/preferences';
import { supabase } from '@/lib/supabase';

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
      
      // Check if user already has preferences set up
      if (session.user.user_metadata?.preferences?.isComplete) {
        router.push('/dashboard');
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleComplete = async (preferences: UserPreferences) => {
    try {
      // Update user metadata with completed preferences
      await supabase.auth.updateUser({
        data: { 
          preferences,
          onboarding_completed: true 
        }
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
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
      <MultiStepForm
        onComplete={handleComplete}
        isNewUser={true}
      />
    </div>
  );
}
