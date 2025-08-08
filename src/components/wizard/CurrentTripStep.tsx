'use client';

import React, { useState } from 'react';
import type { TravelPlan } from '@/types/travel-plan';
import { DESTINATION_AREAS, TRAVEL_TYPES } from '@/types/travel-plan';
import type { UserProfile } from './OnboardingWizard';

interface CurrentTripStepProps {
  trip: Partial<TravelPlan>;
  profile: UserProfile;
  onNext: (trip: Partial<TravelPlan>) => void;
  onBack: () => void;
}

const TIME_OPTIONS = [
  { id: 'this-weekend', label: 'This Weekend', icon: '📅', description: 'January 11-12' },
  { id: 'next-week', label: 'Next Week', icon: '🗓️', description: 'January 13-19' },
  { id: 'custom', label: 'Custom Dates', icon: '📆', description: 'Choose your own dates' }
];

export default function CurrentTripStep({ trip, profile, onNext, onBack }: CurrentTripStepProps) {
  const [formData, setFormData] = useState<Partial<TravelPlan>>({
    destination: trip.destination || { area: '', region: 'trento' },
    dates: trip.dates || { type: 'this-weekend', isFlexible: false },
    travelType: trip.travelType || 'solo',
    ...trip
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.destination?.area) {
      newErrors.destination = 'Please select a destination area';
    }
    if (!formData.dates?.type) {
      newErrors.dates = 'Please select when you want to travel';
    }
    if (!formData.travelType) {
      newErrors.travelType = 'Please select your travel type';
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
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🗺️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Hi {profile.name}! Tell us about your trip
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Let&apos;s plan something amazing in Trento for you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Destination Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Where in Trento would you like to explore?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DESTINATION_AREAS.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    destination: { ...prev.destination!, area: area.id, region: 'trento' }
                  }))}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    formData.destination?.area === area.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{area.icon}</span>
                    <span className="font-medium">{area.label}</span>
                  </div>
                </button>
              ))}
            </div>
            {errors.destination && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.destination}</p>}
          </div>

          {/* When */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              When are you planning to visit?
            </label>
            <div className="space-y-3">
              {TIME_OPTIONS.map((time) => (
                <button
                  key={time.id}
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    dates: { ...prev.dates!, type: time.id as 'this-weekend' | 'next-week' | 'custom' }
                  }))}
                  className={`w-full p-4 border rounded-lg text-left transition-all ${
                    formData.dates?.type === time.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{time.icon}</span>
                      <div>
                        <div className="font-medium">{time.label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{time.description}</div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {errors.dates && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.dates}</p>}

            {/* Custom Dates */}
            {formData.dates?.type === 'custom' && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        dates: { ...prev.dates!, startDate: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        dates: { ...prev.dates!, endDate: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    checked={formData.dates?.isFlexible || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dates: { ...prev.dates!, isFlexible: e.target.checked }
                    }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">My dates are flexible</span>
                </label>
              </div>
            )}
          </div>

          {/* Travel Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              How are you traveling?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TRAVEL_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, travelType: type.id as 'solo' | 'date' | 'family' | 'friends' | 'business' }))}
                  className={`p-4 border rounded-lg text-center transition-all ${
                    formData.travelType === type.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="text-xl mb-2">{type.icon}</div>
                  <div className="font-medium text-sm">{type.label}</div>
                </button>
              ))}
            </div>
            {errors.travelType && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.travelType}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-4 px-6 rounded-lg font-medium transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-6 rounded-lg font-medium transition-all transform hover:scale-[1.02] focus:ring-4 focus:ring-purple-200"
            >
              Get AI Suggestions
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
