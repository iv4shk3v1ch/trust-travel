'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { saveProfile } from '@/lib/database';
import { UserPreferences } from '@/types/preferences';

interface QuickProfile {
  age: number;
  interests: string[];
  travelStyle: string;
  budget: string;
}

interface QuickOnboardingWizardProps {
  onComplete: () => void;
}

function QuickOnboardingWizard({ onComplete }: QuickOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const [profile, setProfile] = useState<QuickProfile>({
    age: 25,
    interests: [],
    travelStyle: '',
    budget: ''
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Minimal Wizard - Step {currentStep}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Testing basic functionality.
        </p>
        <Button onClick={onComplete} className="w-full">
          Complete
        </Button>
      </div>
    </div>
  );
}

export default QuickOnboardingWizard;
