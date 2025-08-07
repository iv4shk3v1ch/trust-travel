'use client';

import React, { useState } from 'react';
import { FormStepProps, Personality } from '@/types/preferences';
import { Button } from '@/components/ui/Button';

const INTERESTS = [
  'Art & Museums', 'Architecture', 'History', 'Food & Cuisine', 'Wine Tasting',
  'Shopping', 'Nightlife', 'Music & Concerts', 'Sports', 'Outdoor Activities',
  'Wildlife', 'Photography', 'Local Culture', 'Festivals', 'Beaches',
  'Mountains', 'Cities', 'Villages', 'Technology', 'Science'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
  'Dutch', 'Swedish', 'Norwegian', 'Other'
];

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  description?: string;
  labels?: string[];
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min = 1,
  max = 5,
  description,
  labels = []
}) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          {labels.length > 0 ? (
            labels.map((label, index) => (
              <span key={index} className={index === value - 1 ? 'text-indigo-600 font-medium' : ''}>
                {label}
              </span>
            ))
          ) : (
            Array.from({ length: max - min + 1 }, (_, i) => (
              <span key={i} className={i === value - 1 ? 'text-indigo-600 font-medium' : ''}>
                {i + min}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface CheckboxGroupProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  description?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  options,
  selected,
  onChange,
  description
}) => {
  const handleChange = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => handleChange(option)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const PersonalityStep: React.FC<FormStepProps<Personality>> = ({
  data,
  updateData,
  onNext,
  onPrevious,
  isLast
}) => {
  const [formData, setFormData] = useState<Personality>(data);

  const handleSliderChange = (field: keyof Personality, value: number) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
  };

  const handleCheckboxChange = (field: keyof Personality, selected: string[]) => {
    const newData = { ...formData, [field]: selected };
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Personality & Interests</h2>
        <p className="text-gray-600 dark:text-gray-400">Help us understand your travel personality and interests.</p>
      </div>

      <div className="space-y-6">
        <Slider
          label="Adventurousness"
          description="How adventurous are you when traveling?"
          value={formData.adventurousness}
          onChange={(value) => handleSliderChange('adventurousness', value)}
          labels={['Very Safe', 'Somewhat Safe', 'Balanced', 'Adventurous', 'Very Adventurous']}
        />

        <Slider
          label="Social Level"
          description="How much do you enjoy meeting new people while traveling?"
          value={formData.socialness}
          onChange={(value) => handleSliderChange('socialness', value)}
          labels={['Very Private', 'Somewhat Private', 'Balanced', 'Social', 'Very Social']}
        />

        <Slider
          label="Comfort Level"
          description="What level of comfort do you prefer during travel?"
          value={formData.comfortLevel}
          onChange={(value) => handleSliderChange('comfortLevel', value)}
          labels={['Basic', 'Simple', 'Moderate', 'Comfortable', 'Luxury']}
        />

        <Slider
          label="Flexibility"
          description="How flexible are you with changes to your travel plans?"
          value={formData.flexibilityLevel}
          onChange={(value) => handleSliderChange('flexibilityLevel', value)}
          labels={['Very Rigid', 'Somewhat Rigid', 'Balanced', 'Flexible', 'Very Flexible']}
        />
      </div>

      <CheckboxGroup
        label="Interests"
        description="What are you most interested in when traveling? (Select all that apply)"
        options={INTERESTS}
        selected={formData.interests}
        onChange={(selected) => handleCheckboxChange('interests', selected)}
      />

      <CheckboxGroup
        label="Languages"
        description="What languages do you speak? (This helps with destination recommendations)"
        options={LANGUAGES}
        selected={formData.languages}
        onChange={(selected) => handleCheckboxChange('languages', selected)}
      />

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handlePrevious}>
          Previous
        </Button>
        <Button onClick={handleNext}>
          {isLast ? 'Complete' : 'Next Step'}
        </Button>
      </div>
    </div>
  );
};
