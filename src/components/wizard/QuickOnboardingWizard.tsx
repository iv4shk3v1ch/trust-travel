'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

// Import the individual steps from the profile form
import { BasicInfoStep } from '@/components/forms/BasicInfoStep';
import { PersonalityStep } from '@/components/forms/PersonalityStep';
import { BudgetStep } from '@/components/forms/BudgetStep';

import { DatabaseProfile, saveNewProfile } from '@/lib/newDatabase';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Simplified profile data - only essential fields for onboarding
  const [profileData, setProfileData] = useState<Partial<DatabaseProfile>>({
    full_name: '',
    age: undefined,
    gender: undefined,
    budget_level: undefined,
    trip_style: undefined,
    personality_traits: [],
    // Set empty arrays for fields not covered in onboarding
    activities: [],
    place_types: [],
    food_preferences: [],
    food_restrictions: []
  });

  const updateField = (field: keyof DatabaseProfile, value: string | string[] | number) => {
    setProfileData((prev: Partial<DatabaseProfile>) => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!profileData.full_name || !profileData.age || !profileData.gender || 
          !profileData.budget_level || !profileData.trip_style) {
        throw new Error('Please fill in all required fields');
      }

      // Save the basic profile to database
      await saveNewProfile({
        full_name: profileData.full_name,
        age: profileData.age,
        gender: profileData.gender,
        budget_level: profileData.budget_level,
        trip_style: profileData.trip_style,
        personality_traits: profileData.personality_traits || [],
        activities: [],
        place_types: [],
        food_preferences: [],
        food_restrictions: []
      } as DatabaseProfile);

      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      alert('Failed to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return profileData.full_name && profileData.age && profileData.gender;
      case 2:
        return profileData.budget_level && profileData.trip_style;
      case 3:
        return true; // Personality is optional
      default:
        return false;
    }
  };

  const steps = [
    { number: 1, title: 'Basic Info', icon: '👤' },
    { number: 2, title: 'Travel Style', icon: '✈️' },
    { number: 3, title: 'Personality', icon: '🌟' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to TrustTravel! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Let&apos;s get you started with a quick setup. You can complete your full profile later.
          </p>
          
          {/* Progress Steps */}
          <div className="flex justify-center items-center space-x-4 mb-6">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${step.number === currentStep
                    ? 'bg-indigo-600 text-white'
                    : step.number < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }
                `}>
                  {step.number < currentStep ? '✓' : step.icon}
                </div>
                <span className={`ml-2 text-sm ${
                  step.number === currentStep
                    ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                    : step.number < currentStep
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.title}
                </span>
                {step.number < steps.length && (
                  <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 ml-4" />
                )}
              </div>
            ))}
          </div>

          <ProgressBar progress={(currentStep / 3) * 100} 
            className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
            fillClassName="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          />
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {currentStep === 1 && (
            <BasicInfoStep
              data={profileData}
              onChange={updateField}
            />
          )}

          {currentStep === 2 && (
            <BudgetStep
              data={profileData}
              onChange={updateField}
            />
          )}

          {currentStep === 3 && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  What&apos;s Your Travel Personality? 🌟
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  This helps us understand your travel style (optional - you can skip this)
                </p>
              </div>
              <PersonalityStep
                data={profileData}
                onChange={updateField}
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            ← Previous
          </Button>

          <div className="flex space-x-4">
            {currentStep === 3 && (
              <Button
                variant="outline"
                onClick={handleComplete}
                disabled={loading}
              >
                Skip & Continue →
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Next →
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'Complete Setup ✨'}
              </Button>
            )}
          </div>
        </div>

        {/* Skip Option */}
        {currentStep < 3 && (
          <div className="text-center mt-4">
            <button
              onClick={handleComplete}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              disabled={!profileData.full_name || !profileData.age || !profileData.gender}
            >
              I&apos;ll complete this later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
