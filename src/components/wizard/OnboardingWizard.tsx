'use client';

import React, { useState } from 'react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import ProfileBasicsStep from './ProfileBasicsStep';
import CurrentTripStep from './CurrentTripStep';
import AIPreviewStep from './AIPreviewStep';
import CompletionStep from './CompletionStep';
import type { TravelPlan } from '@/types/travel-plan';

export interface UserProfile {
  name: string;
  age: string;
  interests: string[];
  travelStyle: string;
  budget: string;
}

interface TripSuggestions {
  itinerary: {
    title: string;
    description: string;
    activities: Array<{
      time: string;
      activity: string;
      location: string;
      reason: string;
    }>;
  };
  personalizedTips: string[];
  estimatedBudget: {
    category: string;
    range: string;
  };
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    age: '',
    interests: [],
    travelStyle: '',
    budget: ''
  });
  const [travelPlan, setTravelPlan] = useState<Partial<TravelPlan>>({});
  const [aiSuggestions, setAiSuggestions] = useState<TripSuggestions | null>(null);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleProfileUpdate = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentStep(2);
  };

  const handleTripUpdate = (trip: Partial<TravelPlan>) => {
    setTravelPlan(trip);
    setCurrentStep(3);
  };

  const handleAIPreview = (suggestions: TripSuggestions) => {
    setAiSuggestions(suggestions);
    setCurrentStep(4);
  };

  const handleWizardComplete = () => {
    // Save user data to database
    console.log('Onboarding complete:', { userProfile, travelPlan, aiSuggestions });
    onComplete();
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const stepTitles = [
    'Tell us about yourself',
    'Your current trip',
    'AI suggestions preview',
    'You\'re all set!'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Welcome to TrustTravel
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <ProgressBar 
            progress={progress} 
            className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            fillClassName="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {stepTitles[currentStep - 1]}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-6">
          {/* Step Content Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {currentStep === 1 && (
              <ProfileBasicsStep
                profile={userProfile}
                onNext={handleProfileUpdate}
              />
            )}

            {currentStep === 2 && (
              <CurrentTripStep
                trip={travelPlan}
                profile={userProfile}
                onNext={handleTripUpdate}
                onBack={goBack}
              />
            )}

            {currentStep === 3 && (
              <AIPreviewStep
                profile={userProfile}
                trip={travelPlan}
                onNext={handleAIPreview}
                onBack={goBack}
              />
            )}

            {currentStep === 4 && aiSuggestions && (
              <CompletionStep
                profile={userProfile}
                trip={travelPlan}
                suggestions={aiSuggestions}
                onComplete={handleWizardComplete}
                onBack={goBack}
              />
            )}
          </div>

          {/* Skip Option */}
          {currentStep < 4 && (
            <div className="text-center mt-6">
              <button
                onClick={onComplete}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
