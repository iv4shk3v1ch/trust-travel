'use client';

import React from 'react';
import { TRAVEL_TYPES } from '@/shared/types/travel-plan';

interface TravelTypeStepProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const TravelTypeStep: React.FC<TravelTypeStepProps> = ({
  selectedType,
  onTypeChange,
  onNext,
  onBack
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Who&apos;s coming with you?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This helps us suggest the right activities and experiences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {TRAVEL_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => onTypeChange(type.id)}
            className={`p-6 rounded-lg border-2 transition-all ${
              selectedType === type.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">{type.icon}</div>
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                {type.label}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selectedType}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next: Goals & Mood
        </button>
      </div>
    </div>
  );
};
