'use client';

import React, { useState } from 'react';
import { FormStepProps, BasicInfo } from '@/types/preferences';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const AGE_GROUPS = [
  '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
];

interface RadioCardProps {
  label: string;
  options: string[];
  selected: string;
  onChange: (selected: string) => void;
  description?: string;
}

const RadioCard: React.FC<RadioCardProps> = ({
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
              selected === option
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export const BasicInfoStep: React.FC<FormStepProps<BasicInfo>> = ({
  data,
  updateData,
  onNext,
  isLast
}) => {
  const [formData, setFormData] = useState<BasicInfo>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof BasicInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.gender) newErrors.gender = 'Please select your gender';
    if (!formData.ageGroup) newErrors.ageGroup = 'Please select your age group';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      updateData(formData);
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Let&apos;s get to know you! 👋
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Just a few basics to personalize your travel experience
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={errors.firstName}
            placeholder="Enter your first name"
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            error={errors.lastName}
            placeholder="Enter your last name"
            required
          />
        </div>

        <RadioCard
          label="Gender"
          options={GENDERS}
          selected={formData.gender}
          onChange={(value) => handleChange('gender', value)}
        />
        {errors.gender && <p className="text-sm text-red-600 -mt-2">{errors.gender}</p>}

        <RadioCard
          label="Age Group"
          options={AGE_GROUPS}
          selected={formData.ageGroup}
          onChange={(value) => handleChange('ageGroup', value)}
        />
        {errors.ageGroup && <p className="text-sm text-red-600 -mt-2">{errors.ageGroup}</p>}
      </div>

      <div className="flex justify-center pt-6">
        <Button onClick={handleNext} size="lg" className="px-8">
          {isLast ? 'Complete Setup' : 'Next: Find Your Vibe →'}
        </Button>
      </div>
    </div>
  );
};
