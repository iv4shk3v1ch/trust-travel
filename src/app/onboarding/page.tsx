'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import QuickOnboardingWizard from '@/components/wizard/QuickOnboardingWizardSimple';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, clearOnboardingError } = useAuth();

  // Debug logging
  console.log('OnboardingPage render - user:', user);
  console.log('OnboardingPage render - loading:', loading);
  console.log('User exists in onboarding:', !!user);

  const handleComplete = () => {
    console.log('OnboardingPage handleComplete called');
    console.log('User at completion:', user);
    
    // Clear the onboarding error state
    clearOnboardingError();
    
    // Force a delay before redirect to ensure database changes are propagated
    setTimeout(() => {
      console.log('Redirecting to dashboard...');
      router.push('/dashboard');
    }, 1000); // 1 second delay
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

  if (!user) {
    router.push('/login');
    return null;
  }

  return <QuickOnboardingWizard onComplete={handleComplete} />;
}
