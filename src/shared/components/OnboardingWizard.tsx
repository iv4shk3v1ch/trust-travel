'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { useAuth } from '@/features/auth/AuthContext';
import { AnchorSeedSelector } from '@/features/profile/components/AnchorSeedSelector';
import { getAnchorPlacesForCity, type SeedRatingValue, type SupportedCity } from '@/shared/config/anchorPlaces';
import { saveUserSeedRatings } from '@/core/database/onboardingSeeds';

interface OnboardingData {
  fullName: string;
  age: string;
  gender: '' | 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  budget: 'low' | 'medium' | 'high';
  homeCity: SupportedCity | '';
  foodRestrictions: string;
}

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    age: '',
    gender: '',
    budget: 'medium',
    homeCity: '',
    foodRestrictions: ''
  });
  const [seedRatings, setSeedRatings] = useState<Record<string, SeedRatingValue>>({});

  const { user, updateProfile, signOut } = useAuth();
  const router = useRouter();

  const anchors = useMemo(
    () => (data.homeCity ? getAnchorPlacesForCity(data.homeCity) : []),
    [data.homeCity]
  );

  const answeredCount = anchors.filter(anchor => seedRatings[anchor.id] != null).length;

  const saveAll = async () => {
    if (!user) return;

    await updateProfile({
      full_name: data.fullName || user.email?.split('@')[0] || 'User',
      age: data.age ? parseInt(data.age, 10) : null,
      gender: data.gender || 'prefer-not-to-say',
      budget: data.budget,
      home_city: data.homeCity || null,
      food_restrictions: data.foodRestrictions || null,
      onboarding_completed_at: new Date().toISOString()
    });

    if (data.homeCity) {
      const rows = anchors
        .filter(anchor => seedRatings[anchor.id] != null)
        .map(anchor => ({
          user_id: user.id,
          city: data.homeCity as SupportedCity,
          anchor_key: anchor.id,
          anchor_name: anchor.title,
          concept_key: anchor.concept,
          place_category: anchor.category,
          main_category: anchor.mainCategory,
          experience_tags: [...anchor.experienceTags],
          rating: seedRatings[anchor.id] as number
        }));

      await saveUserSeedRatings(user.id, data.homeCity as SupportedCity, rows);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    if (!data.fullName || !data.age || !data.gender || !data.homeCity) {
      setError('Fill in your profile and choose a home city before continuing.');
      return;
    }

    if (answeredCount < 8) {
      setError('Rate at least 8 anchor places so the system has enough signal to start.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await saveAll();
      router.push('/explore');
    } catch (saveError) {
      console.error('Error completing onboarding:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Failed to save onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    try {
      await updateProfile({
        full_name: data.fullName || user.email?.split('@')[0] || 'User',
        age: data.age ? parseInt(data.age, 10) : 25,
        gender: data.gender || 'prefer-not-to-say',
        budget: data.budget,
        home_city: data.homeCity || null,
        food_restrictions: data.foodRestrictions || null
      });
      router.push('/explore');
    } catch (saveError) {
      console.error('Error skipping onboarding:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Failed to save defaults');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Set the source city for your taste
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            We use your home city and a small set of anchor places to start cross-city recommendations before you have enough real reviews.
          </p>
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
              onChange={(e) => setData({ ...data, gender: e.target.value as OnboardingData['gender'] })}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Budget
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={data.budget}
              onChange={(e) => setData({ ...data, budget: e.target.value as OnboardingData['budget'] })}
            >
              <option value="low">Budget</option>
              <option value="medium">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dietary Restrictions
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Optional dietary notes"
              value={data.foodRestrictions}
              onChange={(e) => setData({ ...data, foodRestrictions: e.target.value })}
              rows={3}
            />
          </div>
          <AnchorSeedSelector
            city={data.homeCity}
            onCityChange={(city) => {
              setData({ ...data, homeCity: city });
              setSeedRatings({});
            }}
            ratings={seedRatings}
            onRatingChange={(anchorId, rating) => setSeedRatings(prev => ({ ...prev, [anchorId]: rating }))}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex space-x-2">
              <div className="h-2 w-24 rounded bg-indigo-600" />
            </div>
            <span className="text-sm text-gray-500">Cold-start onboarding</span>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {renderStep()}

          <div className="flex justify-end pt-6">
            <Button onClick={handleComplete} disabled={loading}>
              {loading ? 'Saving...' : 'Complete Setup'}
            </Button>
          </div>

          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={loading}
              className="text-sm"
            >
              Skip for now
            </Button>
            <Button
              variant="ghost"
              onClick={signOut}
              disabled={loading}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
