'use client';

import React from 'react';
import { DESTINATION_AREAS } from '@/shared/types/travel-plan';

interface DestinationStepProps {
  selectedArea: string;
  onAreaChange: (area: string) => void;
  onNext: () => void;
}

export const DestinationStep: React.FC<DestinationStepProps> = ({
  selectedArea,
  onAreaChange,
  onNext
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Where will this adventure take place?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Currently focused on the beautiful Trento region
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DESTINATION_AREAS.map((area) => (
          <button
            key={area.id}
            onClick={() => onAreaChange(area.id)}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              selectedArea === area.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{area.icon}</span>
              <div>
                <div className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  {area.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {area.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          disabled={!selectedArea}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next: Dates & Timing
        </button>
      </div>
    </div>
  );
};
