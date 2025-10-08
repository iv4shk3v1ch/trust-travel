'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { useAuth } from '@/features/auth/AuthContext';

interface OnboardingData {
  fullName: string;
  age: string;
  gender: string;
  budgetLevel: 'low' | 'medium' | 'high';
  activities: string[];
  placeTypes: string[];
  foodPreferences: string[];
  tripStyle: string;
}

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    age: '',
    gender: '',
    budgetLevel: 'medium',
    activities: [],
    placeTypes: [],
    foodPreferences: [],
    tripStyle: ''
  });
  
  const { user, updateProfile } = useAuth();
  const router = useRouter();

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateProfile({
        full_name: data.fullName,
        age: data.age,
        gender: data.gender,
        budget_level: data.budgetLevel,
        activities: data.activities,
        place_types: data.placeTypes,
        food_preferences: data.foodPreferences,
        trip_style: data.tripStyle
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome! Let&apos;s set up your profile
            </h2>
            <Input
              label="Full Name"
              placeholder="Your full name"
              value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
            />
            <Input
              label="Age"
              placeholder="Your age"
              value={data.age}
              onChange={(e) => setData({ ...data, age: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gender
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={data.gender}
                onChange={(e) => setData({ ...data, gender: e.target.value })}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tell us about your travel preferences
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget Level
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={data.budgetLevel}
                onChange={(e) => setData({ ...data, budgetLevel: e.target.value as 'low' | 'medium' | 'high' })}
              >
                <option value="low">Budget Traveler</option>
                <option value="medium">Mid-range</option>
                <option value="high">Luxury</option>
              </select>
            </div>
            <Input
              label="Trip Style"
              placeholder="e.g., Adventure, Cultural, Relaxation"
              value={data.tripStyle}
              onChange={(e) => setData({ ...data, tripStyle: e.target.value })}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          {/* Progress Bar */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex space-x-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-20 rounded ${
                    i <= step ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              Step {step} of 2
            </span>
          </div>

          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </Button>
            
            {step < 2 ? (
              <Button
                onClick={handleNext}
                disabled={!data.fullName || !data.age || !data.gender}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!data.tripStyle || loading}
              >
                {loading ? 'Completing...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
