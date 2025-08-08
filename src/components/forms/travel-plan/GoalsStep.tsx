'use client';

import React from 'react';
import { TRAVEL_GOALS } from '@/types/travel-plan';

interface GoalsStepProps {
  selectedGoals: string[];
  onGoalsChange: (goals: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const GoalsStep: React.FC<GoalsStepProps> = ({
  selectedGoals,
  onGoalsChange,
  onNext,
  onBack
}) => {
  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      onGoalsChange(selectedGoals.filter(g => g !== goalId));
    } else if (selectedGoals.length < 3) {
      onGoalsChange([...selectedGoals, goalId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          What&apos;s the vibe you&apos;re going for this trip?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Pick 1-3 moods that capture what you want from this experience
        </p>
        <div className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
          {selectedGoals.length}/3 selected
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {TRAVEL_GOALS.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          const isDisabled = !isSelected && selectedGoals.length >= 3;
          
          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              disabled={isDisabled}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : isDisabled
                  ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">{goal.icon}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {goal.label}
              </div>
            </button>
          );
        })}
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
          disabled={selectedGoals.length === 0}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next: Special Needs
        </button>
      </div>
    </div>
  );
};
