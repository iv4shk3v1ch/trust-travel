'use client';

import React, { useState } from 'react';
import { FormStepProps, PersonalityAndStyle } from '@/types/preferences';
import { Button } from '@/components/ui/Button';

const PERSONALITY_TRAITS = [
  { emoji: '🧭', label: 'Adventurous', description: 'I love trying new and exciting things' },
  { emoji: '🧘', label: 'Relaxed', description: 'I prefer a slow, peaceful pace' },
  { emoji: '🏃', label: 'Sporty', description: 'I enjoy active and physical activities' },
  { emoji: '🎨', label: 'Artsy', description: 'I&apos;m drawn to creative and cultural experiences' },
  { emoji: '🕵️', label: 'Curious', description: 'I love exploring and learning new things' },
  { emoji: '🎉', label: 'Social', description: 'I enjoy meeting people and group activities' },
  { emoji: '📚', label: 'Intellectual', description: 'I prefer thought-provoking experiences' },
  { emoji: '🤫', label: 'Introverted', description: 'I value quiet time and personal space' },
  { emoji: '🐾', label: 'Animal lover', description: 'I enjoy wildlife and nature experiences' },
  { emoji: '🏛️', label: 'History buff', description: 'I&apos;m fascinated by historical sites' },
  { emoji: '🌅', label: 'Early bird', description: 'I love sunrise activities and morning adventures' },
  { emoji: '🌙', label: 'Night owl', description: 'I enjoy nightlife and evening experiences' }
];

const PLANNING_STYLES = [
  {
    value: 'I plan everything',
    title: 'Master Planner',
    description: 'Every detail mapped out, itinerary ready',
    emoji: '📋'
  },
  {
    value: 'I like some structure',
    title: 'Balanced Explorer',
    description: 'Key things planned, room for spontaneity',
    emoji: '⚖️'
  },
  {
    value: 'I go with the flow',
    title: 'Free Spirit',
    description: 'Wing it and see what happens',
    emoji: '🌊'
  }
];

interface TraitSelectorProps {
  label: string;
  description?: string;
  options: Array<{ emoji: string; label: string; description: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelection?: number;
}

const TraitSelector: React.FC<TraitSelectorProps> = ({
  label,
  description,
  options,
  selected,
  onChange,
  maxSelection = 3
}) => {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else if (selected.length < maxSelection) {
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
        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
          Select up to {maxSelection} that best describe you ({selected.length}/{maxSelection})
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleToggle(option.label)}
            disabled={!selected.includes(option.label) && selected.length >= maxSelection}
            className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
              selected.includes(option.label)
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{option.emoji}</span>
              <div>
                <h4 className={`font-medium text-sm ${
                  selected.includes(option.label)
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {option.label}
                </h4>
                <p className={`text-xs mt-1 ${
                  selected.includes(option.label)
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

interface PlanningStyleSelectorProps {
  label: string;
  description?: string;
  options: Array<{ value: string; title: string; description: string; emoji: string }>;
  selected: string;
  onChange: (selected: string) => void;
}

const PlanningStyleSelector: React.FC<PlanningStyleSelectorProps> = ({
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
            className={`p-6 rounded-xl border-2 text-center transition-all hover:shadow-md ${
              selected === option.value
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="space-y-3">
              <span className="text-3xl">{option.emoji}</span>
              <div>
                <h4 className={`font-semibold text-sm ${
                  selected === option.value
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {option.title}
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

export const PersonalityStep: React.FC<FormStepProps<PersonalityAndStyle>> = ({
  data,
  updateData,
  onNext,
  onPrevious,
  isLast
}) => {
  const [formData, setFormData] = useState<PersonalityAndStyle>(data);

  const handlePersonalityChange = (travelPersonality: string[]) => {
    const newData = { ...formData, travelPersonality };
    setFormData(newData);
  };

  const handlePlanningStyleChange = (planningStyle: string) => {
    const newData = { ...formData, planningStyle };
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
          Tell us about your travel soul ✨
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          What&apos;s your travel personality like?
        </p>
      </div>

      <TraitSelector
        label="Which describes you best when traveling?"
        description="Choose the traits that resonate with your travel style"
        options={PERSONALITY_TRAITS}
        selected={formData.travelPersonality}
        onChange={handlePersonalityChange}
        maxSelection={3}
      />

      <PlanningStyleSelector
        label="How structured do you like your trips?"
        description="Tell us about your planning approach"
        options={PLANNING_STYLES}
        selected={formData.planningStyle}
        onChange={handlePlanningStyleChange}
      />

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handlePrevious}>
          ← Back
        </Button>
        <Button onClick={handleNext} size="lg" className="px-8">
          {isLast ? 'Complete Setup' : 'Next: Budget Talk →'}
        </Button>
      </div>
    </div>
  );
};
