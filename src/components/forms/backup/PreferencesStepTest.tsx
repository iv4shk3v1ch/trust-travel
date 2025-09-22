'use client';

import React from 'react';
import { FormStepProps, TravelPreferences } from '@/types/preferences';

export const PreferencesStepTest: React.FC<FormStepProps<TravelPreferences>> = ({
  data,
  updateData,
  onNext,
  onPrevious,
  isLast
}) => {
  return (
    <div className="space-y-10">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Test Preferences Step
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          This is a simple test component
        </p>
      </div>

      <div className="flex justify-between pt-6">
        <button onClick={onPrevious}>← Back</button>
        <button onClick={onNext}>Next →</button>
      </div>
    </div>
  );
};
