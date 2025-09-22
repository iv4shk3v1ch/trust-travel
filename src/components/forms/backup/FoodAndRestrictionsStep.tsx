'use client';

import React, { useState } from 'react';
import { FormStepProps, FoodAndRestrictions } from '@/types/preferences';
import { Button } from '@/components/ui/Button';

const FOOD_EXCITEMENT = [
  { emoji: '🍜', label: 'Street food' },
  { emoji: '🦐', label: 'Seafood' },
  { emoji: '🌱', label: 'Vegan/Plant-based' },
  { emoji: '🏮', label: 'Local specialties' },
  { emoji: '🍽️', label: 'Fine dining' },
  { emoji: '☕', label: 'Coffee culture' },
  { emoji: '🍷', label: 'Wine & spirits' },
  { emoji: '🧀', label: 'Cheese & dairy' },
  { emoji: '🌶️', label: 'Spicy food' },
  { emoji: '🍰', label: 'Desserts & sweets' },
  { emoji: '🥘', label: 'Traditional cooking' },
  { emoji: '🍕', label: 'Comfort food' }
];

const COMMON_RESTRICTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut allergies',
  'Shellfish allergy', 'Kosher', 'Halal', 'No pork', 'No beef',
  'Diabetic-friendly', 'Low sodium', 'Keto diet', 'Paleo diet'
];

interface ChipSelectorProps {
  label: string;
  description?: string;
  options: Array<{ emoji?: string; label: string }>;
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
            {option.emoji && <span className="text-lg">{option.emoji}</span>}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface TagInputProps {
  label: string;
  description?: string;
  placeholder: string;
  value: string[];
  onChange: (value: string[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({
  label,
  description,
  placeholder,
  value,
  onChange
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
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
      <div className="space-y-3">
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 hover:text-red-600 dark:hover:text-red-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          />
          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => {
                if (inputValue.trim() && !value.includes(inputValue.trim())) {
                  onChange([...value, inputValue.trim()]);
                  setInputValue('');
                }
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition-colors"
            >
              Add
            </button>
          )}
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Enter</kbd>
            <span className="ml-1">to add</span>
          </div>
          <div className="flex items-center">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Backspace</kbd>
            <span className="ml-1">to remove last</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FoodAndRestrictionsStep: React.FC<FormStepProps<FoodAndRestrictions>> = ({
  data,
  updateData,
  onNext,
  onPrevious,
  isLast
}) => {
  const [formData, setFormData] = useState<FoodAndRestrictions>(data);

  const handleFoodExcitementChange = (foodExcitement: string[]) => {
    const newData = { ...formData, foodExcitement };
    setFormData(newData);
  };

  const handleRestrictionsChange = (restrictions: string[]) => {
    const newData = { ...formData, restrictions };
    setFormData(newData);
  };

  const handlePlacesToAvoidChange = (placesToAvoid: string[]) => {
    const newData = { ...formData, placesToAvoid };
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
          Any foodies here? 🍽️
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Let&apos;s talk about what makes your taste buds happy
        </p>
      </div>

      <ChipSelector
        label="What foods excite you while traveling?"
        description="Select all the culinary adventures that call to you"
        options={FOOD_EXCITEMENT}
        selected={formData.foodExcitement}
        onChange={handleFoodExcitementChange}
      />

      <ChipSelector
        label="Any food restrictions or allergies?"
        description="Help us keep you safe and comfortable (select all that apply)"
        options={COMMON_RESTRICTIONS.map(r => ({ label: r }))}
        selected={formData.restrictions}
        onChange={handleRestrictionsChange}
      />

      <TagInput
        label="Any places you avoid?"
        description="Tell us about environments or situations you&apos;d rather skip"
        placeholder="Type here, then press Enter to add (e.g., crowded areas, nightlife)"
        value={formData.placesToAvoid}
        onChange={handlePlacesToAvoidChange}
      />

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handlePrevious}>
          ← Back
        </Button>
        <Button onClick={handleNext} size="lg" className="px-8">
          {isLast ? 'Complete Setup' : 'Next: Your Travel Soul →'}
        </Button>
      </div>
    </div>
  );
};
