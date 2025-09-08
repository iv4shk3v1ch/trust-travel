'use client';

import React, { useState } from 'react';
import { getProfileScore } from '@/services/profileScore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { UserPreferences } from '@/types/preferences';

export default function ProfileDebugPage() {
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.id);
  const [debugProfile, setDebugProfile] = useState<UserPreferences | null>(null);

  React.useEffect(() => {
    if (profile) {
      setDebugProfile(profile);
    }
  }, [profile]);

  if (!debugProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const scoreResult = getProfileScore(debugProfile);

  const fieldAnalysis = [
    {
      section: 'Basic Info (30 points total)',
      fields: [
        { name: 'firstName', value: debugProfile.basicInfo.firstName, weight: 8, hasValue: !!debugProfile.basicInfo.firstName },
        { name: 'lastName', value: debugProfile.basicInfo.lastName, weight: 8, hasValue: !!debugProfile.basicInfo.lastName },
        { name: 'gender', value: debugProfile.basicInfo.gender, weight: 7, hasValue: !!debugProfile.basicInfo.gender },
        { name: 'ageGroup', value: debugProfile.basicInfo.ageGroup, weight: 7, hasValue: !!debugProfile.basicInfo.ageGroup },
      ]
    },
    {
      section: 'Preferences (25 points total)',
      fields: [
        { 
          name: 'activities', 
          value: debugProfile.preferences.activities, 
          weight: 13, 
          hasValue: debugProfile.preferences.activities.length >= 2,
          requirement: 'Needs 2+ items'
        },
        { 
          name: 'placeTypes', 
          value: debugProfile.preferences.placeTypes, 
          weight: 12, 
          hasValue: debugProfile.preferences.placeTypes.length >= 2,
          requirement: 'Needs 2+ items'
        },
      ]
    },
    {
      section: 'Food & Restrictions (20 points total)',
      fields: [
        { 
          name: 'foodExcitement', 
          value: debugProfile.foodAndRestrictions.foodExcitement, 
          weight: 8, 
          hasValue: debugProfile.foodAndRestrictions.foodExcitement.length >= 1,
          requirement: 'Needs 1+ items'
        },
        { 
          name: 'restrictions', 
          value: debugProfile.foodAndRestrictions.restrictions, 
          weight: 6, 
          hasValue: true, // Can be empty
          requirement: 'Can be empty'
        },
        { 
          name: 'placesToAvoid', 
          value: debugProfile.foodAndRestrictions.placesToAvoid, 
          weight: 6, 
          hasValue: true, // Can be empty
          requirement: 'Can be empty'
        },
      ]
    },
    {
      section: 'Personality & Style (15 points total)',
      fields: [
        { 
          name: 'travelPersonality', 
          value: debugProfile.personalityAndStyle.travelPersonality, 
          weight: 8, 
          hasValue: debugProfile.personalityAndStyle.travelPersonality.length >= 1,
          requirement: 'Needs 1+ items'
        },
        { 
          name: 'planningStyle', 
          value: debugProfile.personalityAndStyle.planningStyle, 
          weight: 7, 
          hasValue: !!debugProfile.personalityAndStyle.planningStyle 
        },
      ]
    },
    {
      section: 'Budget (10 points total)',
      fields: [
        { name: 'spendingStyle', value: debugProfile.budget.spendingStyle, weight: 5, hasValue: !!debugProfile.budget.spendingStyle },
        { name: 'travelWith', value: debugProfile.budget.travelWith, weight: 5, hasValue: !!debugProfile.budget.travelWith },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Profile Completeness Debug
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed breakdown of profile scoring to understand what&apos;s missing
          </p>
        </div>

        {/* Score Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Score Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {Math.round(scoreResult.totalScore)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Overall Completeness
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Basic Info:</span>
                <span className="font-medium">{scoreResult.sectionScores.basicInfo}%</span>
              </div>
              <div className="flex justify-between">
                <span>Preferences:</span>
                <span className="font-medium">{scoreResult.sectionScores.preferences}%</span>
              </div>
              <div className="flex justify-between">
                <span>Food & Restrictions:</span>
                <span className="font-medium">{scoreResult.sectionScores.foodAndRestrictions}%</span>
              </div>
              <div className="flex justify-between">
                <span>Personality & Style:</span>
                <span className="font-medium">{scoreResult.sectionScores.personalityAndStyle}%</span>
              </div>
              <div className="flex justify-between">
                <span>Budget:</span>
                <span className="font-medium">{scoreResult.sectionScores.budget}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Field Analysis */}
        <div className="space-y-6">
          {fieldAnalysis.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                {section.section}
              </h3>
              <div className="space-y-3">
                {section.fields.map((field, fieldIndex) => (
                  <div
                    key={fieldIndex}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      field.hasValue 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${field.hasValue ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                          {field.name}
                        </span>
                        <span className={`text-sm ${field.hasValue ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {field.hasValue ? '✅' : '❌'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Value: {Array.isArray(field.value) ? `[${field.value.join(', ')}]` : `"${field.value}"`}
                        {field.requirement && (
                          <span className="ml-2 text-xs">({field.requirement})</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${field.hasValue ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                        {field.hasValue ? field.weight : 0} / {field.weight}
                      </div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Missing Fields Summary */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-yellow-800 dark:text-yellow-200">
            What&apos;s Missing? ({37 - Math.round(scoreResult.totalScore)} points to reach 100%)
          </h3>
          <ul className="space-y-1 text-yellow-700 dark:text-yellow-300 text-sm">
            {scoreResult.missingFields.map((field, index) => (
              <li key={index}>• {field} - Check requirements above</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
