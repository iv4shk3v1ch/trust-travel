'use client';

import React, { useState } from 'react';
import { UserPreferences, BasicInfo, TravelPreferences, FoodAndRestrictions, PersonalityAndStyle, Budget } from '@/types/preferences';
import { BasicInfoStep } from './BasicInfoStep';
import { PreferencesStep } from './PreferencesStep';
import { FoodAndRestrictionsStep } from './FoodAndRestrictionsStep';
import { PersonalityStep } from './PersonalityStep';
import { BudgetStep } from './BudgetStep';
import { saveProfile } from '@/lib/database';
import { useProfileUpdateToasts } from '@/hooks/useProfileUpdateToasts';

interface MultiStepFormProps {
  onComplete: (data: UserPreferences) => void;
  initialData?: Partial<UserPreferences>;
  isNewUser?: boolean;
}

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Name, gender, and age' },
  { id: 2, title: 'Your Vibe', description: 'Activities and places you love' },
  { id: 3, title: 'Food Talk', description: 'Food preferences and restrictions' },
  { id: 4, title: 'Travel Soul', description: 'Personality and planning style' },
  { id: 5, title: 'Budget', description: 'Spending style and travel companions' }
];

const defaultUserPreferences: UserPreferences = {
  basicInfo: {
    firstName: '',
    lastName: '',
    gender: '',
    ageGroup: ''
  },
  preferences: {
    activities: [],
    placeTypes: []
  },
  foodAndRestrictions: {
    foodExcitement: [],
    restrictions: [],
    placesToAvoid: []
  },
  personalityAndStyle: {
    travelPersonality: [],
    planningStyle: ''
  },
  budget: {
    spendingStyle: '',
    travelWith: ''
  },
  completedSteps: [],
  isComplete: false
};

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  onComplete,
  initialData,
  isNewUser = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<UserPreferences>({
    ...defaultUserPreferences,
    ...initialData
  });
  const [isLoading, setIsLoading] = useState(false);
  const { saveProfileWithToasts } = useProfileUpdateToasts();

  // Auto-save progress for existing users
  const saveProgress = async (data: UserPreferences) => {
    if (!isNewUser) {
      try {
        console.log('MultiStepForm: Auto-saving progress...');
        await saveProfile(data);
        console.log('MultiStepForm: Auto-save completed');
      } catch (error) {
        console.error('MultiStepForm: Error saving progress:', error);
        // Don't show alert for auto-save failures, just log them
      }
    }
  };

  const updateStepData = (stepData: Partial<UserPreferences>) => {
    const newFormData = { ...formData, ...stepData };
    setFormData(newFormData);
    
    // Mark current step as completed
    if (!newFormData.completedSteps.includes(currentStep)) {
      newFormData.completedSteps = [...newFormData.completedSteps, currentStep];
      setFormData(newFormData);
    }

    // Auto-save for existing users
    if (!isNewUser) {
      // Use toast-enabled save for step updates
      saveProfileWithToasts(newFormData).catch(error => {
        console.error('MultiStepForm: Error saving progress with toasts:', error);
        // Fallback to regular save if toast save fails
        saveProgress(newFormData);
      });
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    console.log('🚀 MultiStepForm: handleComplete called');
    setIsLoading(true);
    
    try {
      const finalData = {
        ...formData,
        isComplete: true,
        completedSteps: STEPS.map(step => step.id)
      };
      
      console.log('🚀 MultiStepForm: Final data prepared:', finalData);
      console.log('🚀 MultiStepForm: Starting save with toasts...');
      
      // Use toast-enabled save for final completion
      const result = await saveProfileWithToasts(finalData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save profile');
      }
      
      console.log('🚀 MultiStepForm: Database save completed successfully', result);
      
      console.log('🚀 MultiStepForm: Calling onComplete callback...');
      onComplete(finalData);
      console.log('🚀 MultiStepForm: onComplete callback finished');
    } catch (error) {
      console.error('🚀 MultiStepForm: Error completing form:', error);
      alert(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('🚀 MultiStepForm: Setting loading to false');
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    const commonProps = {
      onNext: handleNext,
      onPrevious: currentStep > 1 ? handlePrevious : undefined,
      isFirst: currentStep === 1,
      isLast: currentStep === STEPS.length
    };

    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={formData.basicInfo}
            updateData={(data) => updateStepData({ basicInfo: data as BasicInfo })}
            {...commonProps}
          />
        );
      case 2:
        return (
          <PreferencesStep
            data={formData.preferences}
            updateData={(data) => updateStepData({ preferences: data as TravelPreferences })}
            {...commonProps}
          />
        );
      case 3:
        return (
          <FoodAndRestrictionsStep
            data={formData.foodAndRestrictions}
            updateData={(data) => updateStepData({ foodAndRestrictions: data as FoodAndRestrictions })}
            {...commonProps}
          />
        );
      case 4:
        return (
          <PersonalityStep
            data={formData.personalityAndStyle}
            updateData={(data) => updateStepData({ personalityAndStyle: data as PersonalityAndStyle })}
            {...commonProps}
          />
        );
      case 5:
        return (
          <BudgetStep
            data={formData.budget}
            updateData={(data) => updateStepData({ budget: data as Budget })}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isNewUser ? 'Welcome! Set Up Your Travel Profile' : 'Update Your Travel Profile'}
          </h1>
          <span className="text-sm text-gray-500">
            Step {currentStep} of {STEPS.length}
          </span>
        </div>
        
        {/* Step Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
        
        {/* Step Indicators */}
        <div className="flex justify-between">
          {STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id < currentStep
                    ? 'bg-green-500 text-white'
                    : step.id === currentStep
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step.id < currentStep ? '✓' : step.id}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-xs font-medium ${
                  step.id <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 hidden md:block">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Saving your preferences...</span>
          </div>
        ) : (
          renderCurrentStep()
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isNewUser 
            ? 'This information helps us provide personalized travel recommendations. You can always update these preferences later.'
            : 'Your progress is automatically saved. You can complete this form at your own pace.'
          }
        </p>
      </div>
    </div>
  );
};
