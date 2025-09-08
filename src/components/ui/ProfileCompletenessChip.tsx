'use client';

import React, { useState, useEffect } from 'react';
import { getProfileScore } from '@/services/profileScore';
import { UserPreferences } from '@/types/preferences';

interface ProfileCompletenessChipProps {
  profile: UserPreferences | null | undefined;
  className?: string;
}

interface MissingItem {
  field: string;
  section: string;
  priority: number;
  weight: number;
  reason: string;
  deepLink?: string;
}

export const ProfileCompletenessChip: React.FC<ProfileCompletenessChipProps> = ({
  profile,
  className = ''
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);

  useEffect(() => {
    const getFieldWeight = (field: string): number => {
      // Use the same weights as in profileScore service
      const weights: Record<string, number> = {
        firstName: 8, lastName: 8, gender: 7, ageGroup: 7,
        activities: 13, placeTypes: 12,
        foodExcitement: 8, restrictions: 6, placesToAvoid: 6,
        travelPersonality: 8, planningStyle: 7,
        spendingStyle: 5, travelWith: 5
      };
      return weights[field] || 1;
    };

    const getSectionForField = (field: string): string => {
      if (['firstName', 'lastName', 'gender', 'ageGroup'].includes(field)) {
        return 'Basic Info';
      }
      if (['activities', 'placeTypes'].includes(field)) {
        return 'Preferences';
      }
      if (['foodExcitement', 'restrictions', 'placesToAvoid'].includes(field)) {
        return 'Food & Restrictions';
      }
      if (['travelPersonality', 'planningStyle'].includes(field)) {
        return 'Personality & Style';
      }
      if (['spendingStyle', 'travelWith'].includes(field)) {
        return 'Budget';
      }
      return 'Other';
    };

    const getFieldPriority = (field: string): number => {
      // Higher priority for higher-weight fields and basic info
      const basePriority = getFieldWeight(field);
      const sectionPriorities: Record<string, number> = {
        'Basic Info': 100,
        'Preferences': 80,
        'Food & Restrictions': 60,
        'Personality & Style': 40,
        'Budget': 20
      };
      const section = getSectionForField(field);
      return basePriority + (sectionPriorities[section] || 0);
    };

    const getFieldDisplayName = (field: string): string => {
      const displayNames: Record<string, string> = {
        firstName: 'first name',
        lastName: 'last name',
        gender: 'gender',
        ageGroup: 'age group',
        activities: 'preferred activities',
        placeTypes: 'place types',
        foodExcitement: 'food preferences',
        restrictions: 'dietary restrictions',
        placesToAvoid: 'places to avoid',
        travelPersonality: 'travel personality',
        planningStyle: 'planning style',
        spendingStyle: 'spending style',
        travelWith: 'travel companions'
      };
      return displayNames[field] || field;
    };

    const getDeepLinkForField = (field: string): string => {
      // Map fields to their respective form sections/steps
      const fieldToStep: Record<string, number> = {
        firstName: 1,
        lastName: 1,
        gender: 1,
        ageGroup: 1,
        activities: 2,
        placeTypes: 2,
        foodExcitement: 3,
        restrictions: 4,
        placesToAvoid: 4,
        travelPersonality: 5,
        planningStyle: 5,
        spendingStyle: 6,
        travelWith: 6
      };

      const step = fieldToStep[field] || 1;
      return `/profile?step=${step}#${field}`;
    };

    const scoreResult = getProfileScore(profile);
    setScore(Math.round(scoreResult.totalScore));

    // Get all missing items with suggestions
    const items: MissingItem[] = [];
    const missingFields = scoreResult.missingFields;
    
    // Create items for all missing fields
    missingFields.forEach(fieldName => {
      items.push({
        field: fieldName,
        section: getSectionForField(fieldName),
        priority: getFieldPriority(fieldName),
        weight: getFieldWeight(fieldName),
        reason: `Complete your ${getFieldDisplayName(fieldName)}`,
        deepLink: getDeepLinkForField(fieldName)
      });
    });

    // Sort by priority (highest first), then by weight
    items.sort((a, b) => b.priority - a.priority || b.weight - a.weight);
    setMissingItems(items);
  }, [profile]);

  // Simple display name function for rendering
  const getFieldDisplayName = (field: string): string => {
    const displayNames: Record<string, string> = {
      firstName: 'first name',
      lastName: 'last name',
      gender: 'gender',
      ageGroup: 'age group',
      activities: 'preferred activities',
      placeTypes: 'place types',
      foodExcitement: 'food preferences',
      restrictions: 'dietary restrictions',
      placesToAvoid: 'places to avoid',
      travelPersonality: 'travel personality',
      planningStyle: 'planning style',
      spendingStyle: 'spending style',
      travelWith: 'travel companions'
    };
    return displayNames[field] || field;
  };

  const progressColor = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
  const ringColor = score >= 80 ? 'stroke-green-600' : score >= 50 ? 'stroke-yellow-600' : 'stroke-red-600';

  return (
    <>
      {/* Chip Button */}
      <button
        onClick={() => setIsSheetOpen(true)}
        className={`flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-2 hover:shadow-md transition-all duration-200 ${className}`}
      >
        {/* Progress Ring */}
        <div className="relative w-6 h-6">
          <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
            {/* Background circle */}
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-200 dark:text-gray-600"
            />
            {/* Progress circle */}
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              className={ringColor}
              style={{
                strokeDasharray: `${2 * Math.PI * 10}`,
                strokeDashoffset: `${2 * Math.PI * 10 * (1 - score / 100)}`
              }}
            />
          </svg>
        </div>
        
        {/* Score Text */}
        <span className={`text-sm font-medium ${progressColor}`}>
          {score}%
        </span>
      </button>

      {/* Bottom Sheet */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => setIsSheetOpen(false)}
          />
          
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl max-h-[80vh] overflow-hidden transform transition-transform duration-300 ease-out">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Your profile is {score}% smart
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Add these to boost accuracy
                  </p>
                </div>
                <button
                  onClick={() => setIsSheetOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Missing Items List */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {missingItems.length > 0 ? (
                  missingItems.map((item, index) => (
                    <div
                      key={`${item.field}-${index}`}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {getFieldDisplayName(item.field)}
                          </h4>
                          <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                            +{item.weight} pts
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.section} • {item.reason}
                        </p>
                      </div>
                      
                      {/* CTA Button */}
                      <a
                        href={item.deepLink}
                        onClick={() => setIsSheetOpen(false)}
                        className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Complete
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Profile Complete!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your profile is fully optimized for the best recommendations
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {missingItems.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex space-x-3">
                    <a
                      href="/profile"
                      onClick={() => setIsSheetOpen(false)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-center px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      Complete Profile
                    </a>
                    <button
                      onClick={() => setIsSheetOpen(false)}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Later
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
