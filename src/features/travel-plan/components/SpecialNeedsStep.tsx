'use client';

import React from 'react';
import { SPECIAL_NEEDS } from '@/shared/types/travel-plan';

interface SpecialNeedsStepProps {
  selectedNeeds: string[];
  onNeedsChange: (needs: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SpecialNeedsStep: React.FC<SpecialNeedsStepProps> = ({
  selectedNeeds,
  onNeedsChange,
  onNext,
  onBack
}) => {
  const toggleNeed = (needId: string) => {
    if (selectedNeeds.includes(needId)) {
      onNeedsChange(selectedNeeds.filter(n => n !== needId));
    } else {
      onNeedsChange([...selectedNeeds, needId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Anything special to keep in mind?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select any special considerations for your trip (optional)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SPECIAL_NEEDS.map((need) => {
          const isSelected = selectedNeeds.includes(need.id);
          
          return (
            <button
              key={need.id}
              onClick={() => toggleNeed(need.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{need.icon}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {need.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Optional: Add a text input for custom needs */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Other special considerations (optional)
        </label>
        <textarea
          placeholder="Anything else we should know to make your trip perfect?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          rows={3}
        />
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
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Review & Finish
        </button>
      </div>
    </div>
  );
};
