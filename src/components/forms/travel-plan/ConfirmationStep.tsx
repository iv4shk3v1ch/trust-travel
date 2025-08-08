'use client';

import React from 'react';
import { TravelPlan, DESTINATION_AREAS, TRAVEL_TYPES, TRAVEL_GOALS, SPECIAL_NEEDS } from '@/types/travel-plan';

interface ConfirmationStepProps {
  travelPlan: TravelPlan;
  onConfirm: () => void;
  onBack: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  travelPlan,
  onConfirm,
  onBack
}) => {
  const getAreaLabel = (areaId: string) => {
    return DESTINATION_AREAS.find(a => a.id === areaId)?.label || areaId;
  };

  const getTravelTypeLabel = (typeId: string) => {
    return TRAVEL_TYPES.find(t => t.id === typeId)?.label || typeId;
  };

  const getGoalLabels = (goalIds: string[]) => {
    return goalIds.map(id => TRAVEL_GOALS.find(g => g.id === id)?.label || id);
  };

  const getNeedLabels = (needIds: string[]) => {
    return needIds.map(id => SPECIAL_NEEDS.find(n => n.id === id)?.label || id);
  };

  const getDateString = () => {
    if (travelPlan.dates.type === 'this-weekend') return 'This Weekend';
    if (travelPlan.dates.type === 'next-week') return 'Next Week';
    if (travelPlan.dates.startDate && travelPlan.dates.endDate) {
      return `${new Date(travelPlan.dates.startDate).toLocaleDateString()} - ${new Date(travelPlan.dates.endDate).toLocaleDateString()}`;
    }
    return 'Custom dates';
  };

  const travelTypeLabel = getTravelTypeLabel(travelPlan.travelType);
  const goalLabels = getGoalLabels(travelPlan.goals);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Perfect! Your Trento adventure awaits
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Here&apos;s what we&apos;ve planned for you
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-indigo-200 dark:border-indigo-700">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            We&apos;ll craft your Trento experience for:
          </h3>
        </div>

        <div className="space-y-4 text-center">
          <div>
            <span className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
              📅 {getDateString()}
            </span>
            {travelPlan.dates.isFlexible && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(flexible)</span>
            )}
          </div>

          <div>
            <span className="text-lg font-medium text-purple-600 dark:text-purple-400">
              👥 Traveling {travelTypeLabel.toLowerCase()}
            </span>
          </div>

          <div>
            <span className="text-lg font-medium text-green-600 dark:text-green-400">
              🎯 In a mood for: {goalLabels.join(', ')}
            </span>
          </div>

          <div>
            <span className="text-lg font-medium text-orange-600 dark:text-orange-400">
              📍 Exploring {getAreaLabel(travelPlan.destination.area)}
            </span>
          </div>

          {travelPlan.specialNeeds.length > 0 && (
            <div>
              <span className="text-lg font-medium text-red-600 dark:text-red-400">
                ⚠️ Special considerations: {getNeedLabels(travelPlan.specialNeeds).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Message */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Ready to explore? 🚀
        </h4>
        <p className="text-gray-600 dark:text-gray-400">
          We&apos;ll use this information to connect you with the perfect local guides, 
          activities, and travel companions in Trento!
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Back to Edit
        </button>
        <button
          onClick={onConfirm}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          Let&apos;s Explore Trento! 🎊
        </button>
      </div>
    </div>
  );
};
