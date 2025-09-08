/**
 * Example usage of the Profile Score Service
 * Demonstrates how to integrate profile completeness scoring into components
 */

import React from 'react';
import { getProfileScore, getNextSuggestedField } from '@/services/profileScore';
import type { UserPreferences } from '@/types/preferences';

interface ProfileCompletenessProps {
  profile: UserPreferences | null;
  onNavigateToSection?: (section: string) => void;
}

export function ProfileCompletenessIndicator({ profile, onNavigateToSection }: ProfileCompletenessProps) {
  const scoreResult = getProfileScore(profile);
  const nextSuggestion = getNextSuggestedField(profile);

  const getCompletionColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Profile Completeness
        </h3>
        <span className={`text-2xl font-bold ${getCompletionColor(scoreResult.totalScore)}`}>
          {scoreResult.totalScore}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(scoreResult.totalScore)}`}
          style={{ width: `${scoreResult.totalScore}%` }}
        />
      </div>

      {/* Section Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Basic Info:</span>
          <span className="font-medium">{scoreResult.sectionScores.basicInfo}/30</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Preferences:</span>
          <span className="font-medium">{scoreResult.sectionScores.preferences}/25</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Food & Diet:</span>
          <span className="font-medium">{scoreResult.sectionScores.foodAndRestrictions}/20</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Personality:</span>
          <span className="font-medium">{scoreResult.sectionScores.personalityAndStyle}/15</span>
        </div>
      </div>

      {/* Next Suggestion */}
      {nextSuggestion && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            🎯 Next Recommendation
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            Complete your <span className="font-semibold">{nextSuggestion.field}</span> for{' '}
            <span className="font-semibold">+{nextSuggestion.weight} points</span>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mb-3">
            {nextSuggestion.reason}
          </p>
          {onNavigateToSection && (
            <button
              onClick={() => onNavigateToSection(nextSuggestion.section)}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Complete Now
            </button>
          )}
        </div>
      )}

      {/* Completion Status */}
      {scoreResult.totalScore === 100 ? (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <span className="text-green-800 dark:text-green-200 text-sm font-medium">
            🎉 Profile Complete! You&apos;ll get the best recommendations.
          </span>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {scoreResult.missingFields.length} fields remaining
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for profile completeness data
 */
export function useProfileCompleteness(profile: UserPreferences | null) {
  const scoreResult = React.useMemo(() => getProfileScore(profile), [profile]);
  const nextSuggestion = React.useMemo(() => getNextSuggestedField(profile), [profile]);

  return {
    score: scoreResult.totalScore,
    sectionScores: scoreResult.sectionScores,
    completedFields: scoreResult.completedFields,
    missingFields: scoreResult.missingFields,
    nextSuggestion,
    isComplete: scoreResult.totalScore === 100,
    completionLevel: scoreResult.totalScore >= 80 ? 'high' : 
                    scoreResult.totalScore >= 60 ? 'medium' :
                    scoreResult.totalScore >= 40 ? 'low' : 'very-low',
  };
}

/**
 * Simple progress indicator for forms
 */
export function ProfileProgressBar({ profile }: { profile: UserPreferences | null }) {
  const { score, completionLevel } = useProfileCompleteness(profile);

  const colorClass = {
    'very-low': 'bg-red-500',
    'low': 'bg-orange-500', 
    'medium': 'bg-yellow-500',
    'high': 'bg-green-500',
  }[completionLevel];

  return (
    <div className="flex items-center space-x-3">
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3rem]">
        {score}%
      </span>
    </div>
  );
}
