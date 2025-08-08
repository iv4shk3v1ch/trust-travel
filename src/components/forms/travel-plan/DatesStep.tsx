'use client';

import React from 'react';

interface DatesStepProps {
  dateType: 'this-weekend' | 'next-week' | 'custom';
  startDate?: string;
  endDate?: string;
  isFlexible: boolean;
  onDateTypeChange: (type: 'this-weekend' | 'next-week' | 'custom') => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onFlexibleChange: (flexible: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export const DatesStep: React.FC<DatesStepProps> = ({
  dateType,
  startDate,
  endDate,
  isFlexible,
  onDateTypeChange,
  onStartDateChange,
  onEndDateChange,
  onFlexibleChange,
  onNext,
  onBack
}) => {
  const canProceed = () => {
    if (dateType === 'custom') {
      return startDate && endDate;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          When will you be in Trento?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose your travel dates
        </p>
      </div>

      {/* Quick Pick Options */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onDateTypeChange('this-weekend')}
            className={`p-4 rounded-lg border-2 transition-all ${
              dateType === 'this-weekend'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🗓️</div>
              <div className="font-medium text-gray-900 dark:text-white">This Weekend</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Quick getaway</div>
            </div>
          </button>

          <button
            onClick={() => onDateTypeChange('next-week')}
            className={`p-4 rounded-lg border-2 transition-all ${
              dateType === 'next-week'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <div className="font-medium text-gray-900 dark:text-white">Next Week</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Plan ahead</div>
            </div>
          </button>

          <button
            onClick={() => onDateTypeChange('custom')}
            className={`p-4 rounded-lg border-2 transition-all ${
              dateType === 'custom'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📆</div>
              <div className="font-medium text-gray-900 dark:text-white">Pick Dates</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Custom range</div>
            </div>
          </button>
        </div>

        {/* Custom Date Picker */}
        {dateType === 'custom' && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate || ''}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate || ''}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Flexible Toggle */}
        <div className="flex items-center justify-center">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFlexible}
              onChange={(e) => onFlexibleChange(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I&apos;m flexible with dates (allows seasonal activity suggestions)
            </span>
          </label>
        </div>
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
          disabled={!canProceed()}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next: Travel Type
        </button>
      </div>
    </div>
  );
};
