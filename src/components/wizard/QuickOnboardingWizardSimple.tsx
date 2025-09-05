'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { saveProfile } from '@/lib/database';
import { UserPreferences } from '@/types/preferences';

interface QuickOnboardingWizardProps {
  onComplete: () => void;
}

// Transform wizard data to UserPreferences format that the database expects
function transformWizardDataToUserPreferences(data: { ageGroup: string; personalityTraits: string[]; tripStyle: string }): UserPreferences {
  // Convert trip style to planning style
  const tripStyleMap: Record<string, string> = {
    'Planned': 'I plan everything',
    'Mixed': 'I like some structure', 
    'Spontaneous': 'I go with the flow'
  };

  return {
    basicInfo: {
      firstName: '', // Will be filled from auth
      lastName: '',  // Will be filled from auth
      gender: 'Prefer not to say',
      ageGroup: data.ageGroup
    },
    personalityAndStyle: {
      travelPersonality: data.personalityTraits, // Correct field name
      planningStyle: tripStyleMap[data.tripStyle] || 'I like some structure'
    },
    preferences: {
      activities: [],
      placeTypes: []
    },
    foodAndRestrictions: {
      foodExcitement: [], // Correct field name
      restrictions: [],
      placesToAvoid: []
    },
    budget: {
      spendingStyle: 'Value-for-money', // Correct location
      travelWith: ''
    },
    completedSteps: [1, 2, 3], // Mark basic steps as complete
    isComplete: true
  };
}

function QuickOnboardingWizard({ onComplete }: QuickOnboardingWizardProps) {
  const { user } = useAuth();
  
  // Debug logging
  console.log('QuickOnboardingWizard render - user:', user);
  console.log('User exists:', !!user);
  if (user) {
    console.log('User details:', { id: user.id, name: user.name, email: user.email });
  }
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    ageGroup: '',
    personalityTraits: [] as string[],
    tripStyle: ''
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    console.log('handleComplete called');
    console.log('Current user:', user);
    console.log('User type:', typeof user);
    console.log('User object keys:', user ? Object.keys(user) : 'no user');
    
    if (!user) {
      console.error('No user found');
      console.error('Auth hook returned null user - possible auth state issue');
      
      // Try to get user from localStorage or session as fallback
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Found user in localStorage:', parsedUser);
          if (parsedUser?.id) {
            console.log('Using localStorage user for save');
            setSaving(true);
            try {
              const userPreferences = transformWizardDataToUserPreferences(formData);
              await saveProfile(userPreferences);
              console.log('Profile saved with localStorage user, completing');
              onComplete();
            } catch (error) {
              console.error('Failed to save with localStorage user:', error);
              onComplete();
            } finally {
              setSaving(false);
            }
            return;
          }
        }
      } catch (e) {
        console.error('Failed to get user from localStorage:', e);
      }
      
      // If no fallback user found, still complete the wizard but log the issue
      console.warn('No user available, completing wizard without saving profile');
      onComplete();
      return;
    }

    console.log('User found, proceeding with save. User ID:', user.id);
    setSaving(true);
    try {
      // Transform wizard data to UserPreferences format
      const userPreferences = transformWizardDataToUserPreferences(formData);
      console.log('Transformed user preferences:', userPreferences);
      
      // Use the existing saveProfile function that handles authentication and RLS
      await saveProfile(userPreferences);
      console.log('Profile saved successfully!');
      
      // Small delay to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Wizard completed successfully, calling onComplete');
      onComplete();
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Still complete the wizard even if save fails
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const togglePersonalityTrait = (trait: string) => {
    const current = formData.personalityTraits;
    if (current.includes(trait)) {
      handleInputChange('personalityTraits', current.filter(t => t !== trait));
    } else if (current.length < 3) { // Limit to 3 traits
      handleInputChange('personalityTraits', [...current, trait]);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">What&apos;s your age group?</h3>
            <div className="space-y-2 mb-4">
              {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map((age) => (
                <button
                  key={age}
                  onClick={() => handleInputChange('ageGroup', age)}
                  className={`w-full p-3 text-left rounded-lg border text-gray-900 dark:text-gray-100 ${
                    formData.ageGroup === age
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
            <Button onClick={handleNext} className="w-full mt-4" disabled={!formData.ageGroup}>
              Next
            </Button>
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">What describes you? (Pick up to 3)</h3>
            <div className="space-y-2 mb-4">
              {[
                { emoji: '🧭', label: 'Adventurous' },
                { emoji: '🧘', label: 'Relaxed' },
                { emoji: '🎨', label: 'Artsy' },
                { emoji: '🕵️', label: 'Curious' },
                { emoji: '🎉', label: 'Social' },
                { emoji: '🤫', label: 'Introverted' }
              ].map((trait) => (
                <button
                  key={trait.label}
                  onClick={() => togglePersonalityTrait(trait.label)}
                  className={`w-full p-3 text-left rounded-lg border flex items-center text-gray-900 dark:text-gray-100 ${
                    formData.personalityTraits.includes(trait.label)
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="mr-3">{trait.emoji}</span>
                  {trait.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Selected: {formData.personalityTraits.length}/3
            </p>
            <Button onClick={handleNext} className="w-full" disabled={formData.personalityTraits.length === 0}>
              Next
            </Button>
          </div>
        );
      case 3:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">How do you prefer to travel?</h3>
            <div className="space-y-2 mb-4">
              {[
                { value: 'Planned', emoji: '📋', desc: 'I plan everything in advance' },
                { value: 'Mixed', emoji: '⚖️', desc: 'Some planning, some spontaneity' },
                { value: 'Spontaneous', emoji: '🌊', desc: 'I go with the flow' }
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => handleInputChange('tripStyle', style.value)}
                  className={`w-full p-4 text-left rounded-lg border ${
                    formData.tripStyle === style.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <span className="mr-3 text-xl">{style.emoji}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{style.value}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{style.desc}</p>
                </button>
              ))}
            </div>
            <Button 
              onClick={handleComplete} 
              className="w-full" 
              disabled={!formData.tripStyle || saving}
            >
              {saving ? 'Saving...' : 'Complete Setup'}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user?.name}! 👋
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Step {step} of 3 - Quick setup to get you started
          </p>
        </div>

        {renderStep()}

        <div className="mt-6 flex space-x-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i <= step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default QuickOnboardingWizard;
