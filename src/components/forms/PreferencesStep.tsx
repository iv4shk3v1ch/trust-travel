'use client';

import React, { useState } from 'react';
import { FormStepProps, TravelPreferences } from '@/types/preferences';
import { Button } from '@/components/ui/Button';

const TRAVEL_STYLES = [
  'Adventure', 'Luxury', 'Budget', 'Cultural', 'Nature', 'City Break', 
  'Beach', 'Mountain', 'Historical', 'Food & Wine', 'Photography', 'Wellness'
];

const ACCOMMODATION_TYPES = [
  'Hotels', 'Hostels', 'Airbnb', 'Resorts', 'Camping', 'Bed & Breakfast',
  'Boutique Hotels', 'Vacation Rentals', 'Guesthouses'
];

const TRANSPORT_PREFERENCES = [
  'Flight', 'Train', 'Bus', 'Car Rental', 'Motorcycle', 'Bicycle',
  'Walking', 'Public Transport', 'Taxi/Rideshare'
];

const GROUP_SIZES = [
  'Solo', 'Couple', 'Small Group (3-5)', 'Medium Group (6-10)', 'Large Group (10+)'
];

const PLANNING_STYLES = [
  'Highly Planned', 'Somewhat Planned', 'Flexible', 'Spontaneous'
];

const ACTIVITY_LEVELS = [
  'Low (Relaxed pace)', 'Moderate (Balanced)', 'High (Active)', 'Very High (Intense)'
];

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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

interface RadioGroupProps {
  label: string;
  options: string[];
  selected: string;
  onChange: (selected: string) => void;
  description?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  options,
  selected,
  onChange,
  description
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
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={label}
              value={option}
              checked={selected === option}
              onChange={() => onChange(option)}
              className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
          </label>
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

  const handleCheckboxChange = (field: keyof TravelPreferences, selected: string[]) => {
    const newData = { ...formData, [field]: selected };
    setFormData(newData);
  };

  const handleRadioChange = (field: keyof TravelPreferences, selected: string) => {
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Travel Preferences</h2>
        <p className="text-gray-600 dark:text-gray-400">Tell us about your travel style and preferences.</p>
      </div>

      <CheckboxGroup
        label="Travel Styles"
        description="What types of travel experiences appeal to you? (Select all that apply)"
        options={TRAVEL_STYLES}
        selected={formData.travelStyle}
        onChange={(selected) => handleCheckboxChange('travelStyle', selected)}
      />

      <CheckboxGroup
        label="Accommodation Preferences"
        description="What types of accommodations do you prefer?"
        options={ACCOMMODATION_TYPES}
        selected={formData.accommodationType}
        onChange={(selected) => handleCheckboxChange('accommodationType', selected)}
      />

      <CheckboxGroup
        label="Transportation Preferences"
        description="How do you prefer to travel?"
        options={TRANSPORT_PREFERENCES}
        selected={formData.transportPreference}
        onChange={(selected) => handleCheckboxChange('transportPreference', selected)}
      />

      <RadioGroup
        label="Preferred Group Size"
        description="How do you usually travel?"
        options={GROUP_SIZES}
        selected={formData.groupSize}
        onChange={(selected) => handleRadioChange('groupSize', selected)}
      />

      <RadioGroup
        label="Planning Style"
        description="How do you prefer to plan your trips?"
        options={PLANNING_STYLES}
        selected={formData.planningStyle}
        onChange={(selected) => handleRadioChange('planningStyle', selected)}
      />

      <RadioGroup
        label="Activity Level"
        description="What level of activity do you prefer during travel?"
        options={ACTIVITY_LEVELS}
        selected={formData.activityLevel}
        onChange={(selected) => handleRadioChange('activityLevel', selected)}
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
