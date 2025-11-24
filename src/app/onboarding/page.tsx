'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingWizard } from '@/shared/components/OnboardingWizard';
import { useAuth as useAuthContext } from '@/features/auth/AuthContext';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuthContext(); // ✅ Use AuthContext

  // Redirect logic
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated -> redirect to login
        router.push('/login');
      } else if (profile) {
        // Already has profile -> redirect to dashboard
        router.push('/dashboard');
      }
      // Else: user exists but no profile -> show onboarding
    }
  }, [loading, user, profile, router]);

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

  return <OnboardingWizard />;
}
