'use client';

import React, { useState } from 'react';
import { FormStepProps, TravelPreferences } from '@/types/preferences';
import { Button } from '@/components/ui/Button';

const ACTIVITIES = [
  { emoji: '🗺️', label: 'Exploring cities' },
  { emoji: '🏞️', label: 'Nature' },
  { emoji: '🏖️', label: 'Beaches' },
  { emoji: '🎭', label: 'Art & Museums' },
  { emoji: '🥾', label: 'Hiking' },
  { emoji: '🍷', label: 'Wine tasting' },
  { emoji: '🍽️', label: 'Foodie experiences' },
  { emoji: '🏛️', label: 'Historical sites' },
  { emoji: '🎵', label: 'Music & Nightlife' },
  { emoji: '📸', label: 'Photography' },
  { emoji: '🛍️', label: 'Shopping' },
  { emoji: '🧘', label: 'Wellness & Spa' }
];

const PLACE_TYPES = [
  {
    title: 'Big cities buzzing with life',
    description: 'Urban energy, skylines, and endless possibilities',
    emoji: '🏙️'
  },
  {
    title: 'Calm countryside',
    description: 'Rolling hills, peaceful villages, and slow living',
    emoji: '🌾'
  },
  {
    title: 'Remote off-grid escapes',
    description: 'Untouched wilderness and digital detox',
    emoji: '🏕️'
  },
  {
    title: 'Coastal & beach towns',
    description: 'Ocean breeze, sandy shores, and seaside charm',
    emoji: '🏖️'
  },
  {
    title: 'Mountain retreats',
    description: 'Fresh air, stunning views, and alpine adventures',
    emoji: '🏔️'
  },
  {
    title: 'Cultural heritage sites',
    description: 'Ancient history, traditions, and timeless stories',
    emoji: '🏺'
  }
];

interface ChipSelectorProps {
  label: string;
  description?: string;
  options: Array<{ emoji: string; label: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
}

const ChipSelector: React.FC<ChipSelectorProps> = ({
  label,
  description,
  options,
  selected,
  onChange
}) => {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
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
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleToggle(option.label)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-full border-2 transition-all text-sm font-medium ${
              selected.includes(option.label)
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <span className="text-lg">{option.emoji}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface CardSelectorProps {
  label: string;
  description?: string;
  options: Array<{ title: string; description: string; emoji: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
}

const CardSelector: React.FC<CardSelectorProps> = ({
  label,
  description,
  options,
  selected,
  onChange
}) => {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map((option) => (
          <button
            key={option.title}
            type="button"
            onClick={() => handleToggle(option.title)}
            className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
              selected.includes(option.title)
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{option.emoji}</span>
              <div>
                <h4 className={`font-medium text-sm ${
                  selected.includes(option.title)
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {option.title}
                </h4>
                <p className={`text-xs mt-1 ${
                  selected.includes(option.title)
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

export const PreferencesStep: React.FC<FormStepProps<TravelPreferences>> = ({
  data,
  updateData,
  onNext,
  onPrevious,
  isLast
}) => {
  const [formData, setFormData] = useState<TravelPreferences>(data);

  const handleActivitiesChange = (activities: string[]) => {
    const newData = { ...formData, activities };
    setFormData(newData);
  };

  const handlePlaceTypesChange = (placeTypes: string[]) => {
    const newData = { ...formData, placeTypes };
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
          Let&apos;s find your vibe ✨
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Tell us what makes your heart race when you travel
        </p>
      </div>

      <ChipSelector
        label="What activities do you love on a trip?"
        description="Select all that spark joy (you can choose multiple!)"
        options={ACTIVITIES}
        selected={formData.activities}
        onChange={handleActivitiesChange}
      />

      <CardSelector
        label="What kind of places make you feel alive?"
        description="Choose the environments that call to your soul"
        options={PLACE_TYPES}
        selected={formData.placeTypes}
        onChange={handlePlaceTypesChange}
      />

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handlePrevious}>
          ← Back
        </Button>
        <Button onClick={handleNext} size="lg" className="px-8">
          {isLast ? 'Complete Setup' : 'Next: Food Talk →'}
        </Button>
      </div>
    </div>
  );
};
