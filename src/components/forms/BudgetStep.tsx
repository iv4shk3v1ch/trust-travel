'use client';

import React, { useState } from 'react';
import { FormStepProps, Budget } from '@/types/preferences';
import { Button } from '@/components/ui/Button';

const SPENDING_STYLES = [
  {
    value: 'Budget-focused',
    title: 'Budget Explorer',
    description: 'I love finding great value and saving money',
    emoji: '💸',
    color: 'green'
  },
  {
    value: 'Value-for-money',
    title: 'Smart Spender',
    description: 'I want quality experiences at fair prices',
    emoji: '💰',
    color: 'blue'
  },
  {
    value: 'I don\'t mind splurging',
    title: 'Comfort Seeker',
    description: 'I invest in comfort and premium experiences',
    emoji: '🤑',
    color: 'purple'
  }
];

const TRAVEL_COMPANIONS = [
  { value: 'Solo', emoji: '🧳', description: 'Just me, myself, and I' },
  { value: 'With friends/family', emoji: '👥', description: 'Sharing costs and memories' },
  { value: 'Depends on trip', emoji: '🤷', description: 'It varies by destination' }
];

interface SpendingStyleSelectorProps {
  label: string;
  description?: string;
  options: Array<{ 
    value: string; 
    title: string; 
    description: string; 
    emoji: string; 
    color: string; 
  }>;
  selected: string;
  onChange: (selected: string) => void;
}

const SpendingStyleSelector: React.FC<SpendingStyleSelectorProps> = ({
  label,
  description,
  options,
  selected,
  onChange
}) => {
  const getColorClasses = (color: string, isSelected: boolean) => {
    const baseClasses = 'p-6 rounded-xl border-2 text-center transition-all hover:shadow-lg cursor-pointer';
    
    if (isSelected) {
      switch (color) {
        case 'green':
          return `${baseClasses} border-green-500 bg-green-50 dark:bg-green-900/30`;
        case 'blue':
          return `${baseClasses} border-blue-500 bg-blue-50 dark:bg-blue-900/30`;
        case 'purple':
          return `${baseClasses} border-purple-500 bg-purple-50 dark:bg-purple-900/30`;
        default:
          return `${baseClasses} border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30`;
      }
    }
    
    return `${baseClasses} border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800`;
  };

  const getTextColorClasses = (color: string, isSelected: boolean) => {
    if (isSelected) {
      switch (color) {
        case 'green':
          return 'text-green-700 dark:text-green-300';
        case 'blue':
          return 'text-blue-700 dark:text-blue-300';
        case 'purple':
          return 'text-purple-700 dark:text-purple-300';
        default:
          return 'text-indigo-700 dark:text-indigo-300';
      }
    }
    return 'text-gray-900 dark:text-white';
  };

  const getSubTextColorClasses = (color: string, isSelected: boolean) => {
    if (isSelected) {
      switch (color) {
        case 'green':
          return 'text-green-600 dark:text-green-400';
        case 'blue':
          return 'text-blue-600 dark:text-blue-400';
        case 'purple':
          return 'text-purple-600 dark:text-purple-400';
        default:
          return 'text-indigo-600 dark:text-indigo-400';
      }
    }
    return 'text-gray-500 dark:text-gray-400';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {label}
        </h3>
        {description && (
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={getColorClasses(option.color, isSelected)}
            >
              <div className="space-y-3">
                <span className="text-4xl">{option.emoji}</span>
                <div>
                  <h4 className={`font-semibold text-base ${getTextColorClasses(option.color, isSelected)}`}>
                    {option.title}
                  </h4>
                  <p className={`text-sm mt-1 ${getSubTextColorClasses(option.color, isSelected)}`}>
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface CompanionSelectorProps {
  label: string;
  description?: string;
  options: Array<{ value: string; emoji: string; description: string }>;
  selected: string;
  onChange: (selected: string) => void;
}

const CompanionSelector: React.FC<CompanionSelectorProps> = ({
  label,
  description,
  options,
  selected,
  onChange
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {label}
        </h3>
        {description && (
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md ${
              selected === option.value
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="space-y-2">
              <span className="text-2xl">{option.emoji}</span>
              <div>
                <h4 className={`font-medium text-sm ${
                  selected === option.value
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {option.value}
                </h4>
                <p className={`text-xs mt-1 ${
                  selected === option.value
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const BudgetStep: React.FC<FormStepProps<Budget>> = ({
  data,
  updateData,
  onNext,
  onPrevious,
  isLast
}) => {
  const [formData, setFormData] = useState<Budget>(data);

  const handleSpendingStyleChange = (spendingStyle: string) => {
    const newData = { ...formData, spendingStyle };
    setFormData(newData);
  };

  const handleTravelWithChange = (travelWith: string) => {
    const newData = { ...formData, travelWith };
    setFormData(newData);
  };

  const handleNext = () => {
    updateData(formData);
    onNext();
  };

  const handlePrevious = () => {
    updateData(formData);
    if (onPrevious) onPrevious();
  };

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Let&apos;s talk budget 💰
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Help us understand your spending style
        </p>
      </div>

      <SpendingStyleSelector
        label="How do you usually spend when traveling?"
        description="Choose the approach that best fits your travel style"
        options={SPENDING_STYLES}
        selected={formData.spendingStyle}
        onChange={handleSpendingStyleChange}
      />

      <CompanionSelector
        label="Do you usually plan solo, or split costs with others?"
        description="This helps us tailor budget recommendations"
        options={TRAVEL_COMPANIONS}
        selected={formData.travelWith}
        onChange={handleTravelWithChange}
      />

      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              Why we ask about budget
            </h4>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Your spending style helps us recommend destinations, activities, and accommodations 
              that match your comfort zone. We&apos;ll never judge your budget - everyone travels differently!
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handlePrevious}>
          ← Back
        </Button>
        <Button onClick={handleNext} size="lg" className="px-8">
          {isLast ? '🎉 Complete My Profile' : 'Next Step →'}
        </Button>
      </div>
    </div>
  );
};
