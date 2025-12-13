'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { useAuth } from '@/features/auth/AuthContext';

interface OnboardingData {
  fullName: string;
  age: string;
  gender: '' | 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  budget: 'low' | 'medium' | 'high';
  envPreference: '' | 'city' | 'nature' | 'balanced';
  activityStyle: '' | 'active' | 'relaxing' | 'balanced';
  foodRestrictions: string;
}

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    age: '',
    gender: '',
    budget: 'medium',
    envPreference: '',
    activityStyle: '',
    foodRestrictions: ''
  });
  
  const { user, updateProfile, signOut } = useAuth();
  const router = useRouter();

  const handleSkip = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateProfile({
        full_name: data.fullName || user.email?.split('@')[0] || 'User',
        age: data.age ? parseInt(data.age) : 25,
        gender: data.gender || 'prefer-not-to-say',
        budget: data.budget,
        env_preference: data.envPreference || null,
        activity_style: data.activityStyle || null,
        food_restrictions: data.foodRestrictions || null
      });
      
      router.push('/explore');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      alert('Error creating profile. You can try logging out and back in.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

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
        age: parseInt(data.age),
        gender: data.gender || 'prefer-not-to-say',
        budget: data.budget,
        env_preference: data.envPreference || null,
        activity_style: data.activityStyle || null,
        food_restrictions: data.foodRestrictions || null
      });
      
      router.push('/explore');
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
              type="number"
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
                onChange={(e) => setData({ ...data, gender: e.target.value as typeof data.gender })}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
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
                value={data.budget}
                onChange={(e) => setData({ ...data, budget: e.target.value as 'low' | 'medium' | 'high' })}
              >
                <option value="low">Budget Traveler</option>
                <option value="medium">Mid-range</option>
                <option value="high">Luxury</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Environment Preference
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={data.envPreference}
                onChange={(e) => setData({ ...data, envPreference: e.target.value as typeof data.envPreference })}
              >
                <option value="">Select preference (optional)</option>
                <option value="city">City</option>
                <option value="nature">Nature</option>
                <option value="balanced">Balanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Activity Style
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={data.activityStyle}
                onChange={(e) => setData({ ...data, activityStyle: e.target.value as typeof data.activityStyle })}
              >
                <option value="">Select style (optional)</option>
                <option value="active">Active</option>
                <option value="relaxing">Relaxing</option>
                <option value="balanced">Balanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dietary Restrictions (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., Vegetarian, Gluten-free..."
                value={data.foodRestrictions}
                onChange={(e) => setData({ ...data, foodRestrictions: e.target.value })}
                rows={3}
              />
            </div>
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
                disabled={loading}
              >
                {loading ? 'Completing...' : 'Complete Setup'}
              </Button>
            )}
          </div>

          {/* Emergency Options */}
          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={loading}
              className="text-sm"
            >
              Skip with Defaults
            </Button>
            <Button
              variant="ghost" 
              onClick={handleLogout}
              disabled={loading}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Logout & Restart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

