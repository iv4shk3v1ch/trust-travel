'use client';

import React, { useState } from 'react';
import { FormStepProps, Restrictions } from '@/types/preferences';
import { Button } from '@/components/ui/Button';

const DIETARY_RESTRICTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free',
  'Kosher', 'Halal', 'Low-Sodium', 'Diabetic', 'Keto', 'None'
];

const MEDICAL_CONDITIONS = [
  'Heart Condition', 'Diabetes', 'Asthma', 'High Blood Pressure',
  'Arthritis', 'Back Problems', 'Anxiety/Panic Disorders',
  'Motion Sickness', 'Altitude Sensitivity', 'None'
];

const MOBILITY_REQUIREMENTS = [
  'Wheelchair Accessible', 'Walking Aid Required', 'Limited Walking Distance',
  'Elevator Required', 'Ground Floor Preferred', 'Accessible Bathroom',
  'Visual Impairment Support', 'Hearing Impairment Support', 'None'
];

const RELIGIOUS_CONSIDERATIONS = [
  'Prayer Time Requirements', 'Dietary Laws', 'Modest Dress Requirements',
  'Religious Holiday Observance', 'Place of Worship Access',
  'Gender-Specific Accommodations', 'None'
];

const COMMON_ALLERGIES = [
  'Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Eggs', 'Milk',
  'Soy', 'Wheat', 'Sesame', 'Bee Stings', 'Latex',
  'Pet Dander', 'Pollen', 'Dust Mites', 'Medications', 'None'
];

interface CheckboxGroupProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  description?: string;
  allowNone?: boolean;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  options,
  selected,
  onChange,
  description,
  allowNone = true
}) => {
  const handleChange = (option: string) => {
    if (allowNone && option === 'None') {
      // If "None" is selected, clear all other selections
      if (selected.includes('None')) {
        onChange([]);
      } else {
        onChange(['None']);
      }
    } else {
      // If any other option is selected, remove "None"
      let newSelected = selected.filter(item => item !== 'None');
      
      if (newSelected.includes(option)) {
        newSelected = newSelected.filter(item => item !== option);
      } else {
        newSelected = [...newSelected, option];
      }
      
      onChange(newSelected);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => handleChange(option)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className={`text-sm ${option === 'None' && selected.includes('None') ? 'font-medium text-indigo-600' : 'text-gray-700 dark:text-gray-300'}`}>
              {option}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const RestrictionsStep: React.FC<FormStepProps<Restrictions>> = ({
  data,
  updateData,
  onNext,
  onPrevious,
  isLast
}) => {
  const [formData, setFormData] = useState<Restrictions>(data);

  const handleCheckboxChange = (field: keyof Restrictions, selected: string[]) => {
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Restrictions & Requirements</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Help us ensure your safety and comfort by sharing any restrictions or special requirements.
          This information will be kept confidential and used only to provide better recommendations.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Privacy Note:</strong> All medical and personal information is encrypted and will never be shared with third parties.
              This information helps us recommend suitable destinations and accommodations.
            </p>
          </div>
        </div>
      </div>

      <CheckboxGroup
        label="Dietary Restrictions"
        description="Do you have any dietary restrictions or preferences?"
        options={DIETARY_RESTRICTIONS}
        selected={formData.dietaryRestrictions}
        onChange={(selected) => handleCheckboxChange('dietaryRestrictions', selected)}
      />

      <CheckboxGroup
        label="Medical Conditions"
        description="Do you have any medical conditions that might affect travel planning?"
        options={MEDICAL_CONDITIONS}
        selected={formData.medicalConditions}
        onChange={(selected) => handleCheckboxChange('medicalConditions', selected)}
      />

      <CheckboxGroup
        label="Mobility Requirements"
        description="Do you have any mobility or accessibility requirements?"
        options={MOBILITY_REQUIREMENTS}
        selected={formData.mobilityRequirements}
        onChange={(selected) => handleCheckboxChange('mobilityRequirements', selected)}
      />

      <CheckboxGroup
        label="Religious Considerations"
        description="Do you have any religious requirements or considerations for travel?"
        options={RELIGIOUS_CONSIDERATIONS}
        selected={formData.religiousConsiderations}
        onChange={(selected) => handleCheckboxChange('religiousConsiderations', selected)}
      />

      <CheckboxGroup
        label="Allergies"
        description="Do you have any allergies we should be aware of?"
        options={COMMON_ALLERGIES}
        selected={formData.allergies}
        onChange={(selected) => handleCheckboxChange('allergies', selected)}
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
