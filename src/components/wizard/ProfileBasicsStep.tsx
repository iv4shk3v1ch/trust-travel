'use client';

import React, { useState } from 'react';
import type { UserProfile } from './OnboardingWizard';

interface ProfileBasicsStepProps {
  profile: UserProfile;
  onNext: (profile: UserProfile) => void;
}

const INTERESTS = [
  { id: 'food-wine', label: 'Food & Wine', icon: '🍷' },
  { id: 'nature', label: 'Nature & Outdoors', icon: '🏞️' },
  { id: 'culture', label: 'Culture & History', icon: '🎭' },
  { id: 'adventure', label: 'Adventure Sports', icon: '🧗' },
  { id: 'photography', label: 'Photography', icon: '📸' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { id: 'wellness', label: 'Wellness & Spa', icon: '🧘' }
];

const TRAVEL_STYLES = [
  { id: 'budget', label: 'Budget Conscious', icon: '💰', description: 'Great experiences without breaking the bank' },
  { id: 'comfort', label: 'Comfortable', icon: '🏨', description: 'Good balance of comfort and value' },
  { id: 'luxury', label: 'Luxury', icon: '✨', description: 'Premium experiences and accommodations' },
  { id: 'adventure', label: 'Adventurous', icon: '🎒', description: 'Off the beaten path experiences' }
];

const AGE_RANGES = [
  { id: '18-25', label: '18-25' },
  { id: '26-35', label: '26-35' },
  { id: '36-45', label: '36-45' },
  { id: '46-55', label: '46-55' },
  { id: '56+', label: '56+' }
];

export default function ProfileBasicsStep({ profile, onNext }: ProfileBasicsStepProps) {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInterestToggle = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.age) {
      newErrors.age = 'Age range is required';
    }
    if (formData.interests.length === 0) {
      newErrors.interests = 'Select at least one interest';
    }
    if (!formData.travelStyle) {
      newErrors.travelStyle = 'Travel style is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👋</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Tell us about yourself
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Just the basics so we can give you great recommendations right away
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What should we call you?
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Your name"
            />
            {errors.name && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Age range
            </label>
            <div className="grid grid-cols-3 gap-3">
              {AGE_RANGES.map((age) => (
                <button
                  key={age.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, age: age.id }))}
                  className={`p-3 border rounded-lg text-center transition-all ${
                    formData.age === age.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {age.label}
                </button>
              ))}
            </div>
            {errors.age && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.age}</p>}
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What interests you? (Select any that apply)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {INTERESTS.map((interest) => (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => handleInterestToggle(interest.id)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    formData.interests.includes(interest.id)
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{interest.icon}</span>
                    <span className="font-medium">{interest.label}</span>
                  </div>
                </button>
              ))}
            </div>
            {errors.interests && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.interests}</p>}
          </div>

          {/* Travel Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What&apos;s your travel style?
            </label>
            <div className="space-y-3">
              {TRAVEL_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, travelStyle: style.id }))}
                  className={`w-full p-4 border rounded-lg text-left transition-all ${
                    formData.travelStyle === style.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{style.icon}</span>
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{style.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {errors.travelStyle && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.travelStyle}</p>}
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-lg font-medium transition-all transform hover:scale-[1.02] focus:ring-4 focus:ring-indigo-200"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
