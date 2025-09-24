'use client';

import React, { useState } from 'react';
import { TravelPlan } from '@/types/travel-plan';
import { DestinationStep } from './DestinationStep';
import { DatesStep } from './DatesStep';
import { TravelTypeStep } from './TravelTypeStep';
import { GoalsStep } from './GoalsStep';
import { SpecialNeedsStep } from './SpecialNeedsStep';
import { ConfirmationStep } from './ConfirmationStep';

interface TravelPlanFormProps {
  onComplete: (travelPlan: TravelPlan) => void;
  initialData?: Partial<TravelPlan>;
}

export const TravelPlanForm: React.FC<TravelPlanFormProps> = ({
  onComplete,
  initialData
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [travelPlan, setTravelPlan] = useState<TravelPlan>({
    destination: {
      area: initialData?.destination?.area || '',
      region: 'trento'
    },
    dates: {
      type: initialData?.dates?.type || 'now',
      startDate: initialData?.dates?.startDate,
      endDate: initialData?.dates?.endDate,
      isFlexible: initialData?.dates?.isFlexible || false
    },
    travelType: (initialData?.travelType as 'solo' | 'date' | 'family' | 'friends' | 'business') || 'solo',
    experienceTags: initialData?.experienceTags || [],
    specialNeeds: initialData?.specialNeeds || [],
    completedSteps: initialData?.completedSteps || [],
    isComplete: false
  });

  const updateTravelPlan = (updates: Partial<TravelPlan>) => {
    setTravelPlan(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    const newCompletedSteps = [...travelPlan.completedSteps];
    if (!newCompletedSteps.includes(currentStep)) {
      newCompletedSteps.push(currentStep);
    }
    
    updateTravelPlan({ completedSteps: newCompletedSteps });
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleComplete = () => {
    const finalPlan = {
      ...travelPlan,
      completedSteps: [1, 2, 3, 4, 5, 6],
      isComplete: true
    };
    onComplete(finalPlan);
  };

  const totalSteps = 6;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const stepTitles = [
    'Destination',
    'Dates',
    'Travel Type',
    'Experience Tags',
    'Special Needs',
    'Confirmation'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Plan Your Trento Adventure
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {stepTitles.map((title, index) => (
            <div 
              key={index}
              className={`text-xs text-center flex-1 ${
                index + 1 <= currentStep 
                  ? 'text-indigo-600 dark:text-indigo-400 font-medium' 
                  : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              {title}
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {currentStep === 1 && (
          <DestinationStep
            selectedArea={travelPlan.destination.area}
            onAreaChange={(area) => updateTravelPlan({ 
              destination: { ...travelPlan.destination, area } 
            })}
            onNext={nextStep}
          />
        )}

        {currentStep === 2 && (
          <DatesStep
            dateType={travelPlan.dates.type}
            startDate={travelPlan.dates.startDate}
            endDate={travelPlan.dates.endDate}
            isFlexible={travelPlan.dates.isFlexible}
            onDateTypeChange={(type) => updateTravelPlan({ 
              dates: { ...travelPlan.dates, type } 
            })}
            onStartDateChange={(startDate) => updateTravelPlan({ 
              dates: { ...travelPlan.dates, startDate } 
            })}
            onEndDateChange={(endDate) => updateTravelPlan({ 
              dates: { ...travelPlan.dates, endDate } 
            })}
            onFlexibleChange={(isFlexible) => updateTravelPlan({ 
              dates: { ...travelPlan.dates, isFlexible } 
            })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {currentStep === 3 && (
          <TravelTypeStep
            selectedType={travelPlan.travelType}
            onTypeChange={(travelType) => updateTravelPlan({ travelType: travelType as 'solo' | 'date' | 'family' | 'friends' | 'business' })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {currentStep === 4 && (
          <GoalsStep
            selectedGoals={travelPlan.experienceTags}
            onGoalsChange={(experienceTags) => updateTravelPlan({ experienceTags })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {currentStep === 5 && (
          <SpecialNeedsStep
            selectedNeeds={travelPlan.specialNeeds}
            onNeedsChange={(specialNeeds) => updateTravelPlan({ specialNeeds })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {currentStep === 6 && (
          <ConfirmationStep
            travelPlan={travelPlan}
            onConfirm={handleComplete}
            onBack={prevStep}
          />
        )}
      </div>
    </div>
  );
};
