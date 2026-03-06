'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext } from '@/features/auth/AuthContext';
import { DatabaseProfile, saveNewProfile } from '@/core/database/newDatabase';
import { loadUserSeedRatings, saveUserSeedRatings } from '@/core/database/onboardingSeeds';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Header } from '@/shared/components/Header';
import { Footer } from '@/shared/components/Footer';
import { AnchorSeedSelector } from '@/features/profile/components/AnchorSeedSelector';
import { getAnchorPlacesForCity, type SeedRatingValue, type SupportedCity } from '@/shared/config/anchorPlaces';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, profile: existingProfile, loading: authLoading, refreshProfile } = useAuthContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [seedRatings, setSeedRatings] = useState<Record<string, SeedRatingValue>>({});

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '' as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | '',
    budget: 'medium' as 'low' | 'medium' | 'high',
    home_city: '' as SupportedCity | '',
    food_restrictions: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!existingProfile) return;

    setFormData({
      full_name: existingProfile.full_name || '',
      age: existingProfile.age?.toString() || '',
      gender: existingProfile.gender || '',
      budget: existingProfile.budget || 'medium',
      home_city: (existingProfile.home_city as SupportedCity | null) || '',
      food_restrictions: existingProfile.food_restrictions || ''
    });
  }, [existingProfile]);

  useEffect(() => {
    const loadSeeds = async () => {
      if (!user || !formData.home_city) {
        setSeedRatings({});
        return;
      }

      try {
        const rows = await loadUserSeedRatings(user.id, formData.home_city);
        setSeedRatings(rows);
      } catch (loadError) {
        console.error('Error loading seed ratings:', loadError);
      }
    };

    loadSeeds();
  }, [user, formData.home_city]);

  const anchors = useMemo(
    () => (formData.home_city ? getAnchorPlacesForCity(formData.home_city) : []),
    [formData.home_city]
  );

  const answeredCount = anchors.filter(anchor => seedRatings[anchor.id] != null).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!formData.full_name || !formData.age || !formData.gender || !formData.home_city) {
        throw new Error('Name, age, gender, and home city are required.');
      }

      if (answeredCount < 8) {
        throw new Error('Rate at least 8 anchor places so the onboarding signal is strong enough.');
      }

      const profileData: Omit<DatabaseProfile, 'id' | 'updated_at'> = {
        full_name: formData.full_name,
        age: parseInt(formData.age, 10),
        gender: formData.gender as DatabaseProfile['gender'],
        budget: formData.budget,
        home_city: formData.home_city,
        food_restrictions: formData.food_restrictions || '',
        onboarding_completed_at: new Date().toISOString()
      };

      await saveNewProfile(profileData);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const seedRows = anchors
        .filter(anchor => seedRatings[anchor.id] != null)
        .map(anchor => ({
          user_id: user.id,
          city: formData.home_city as SupportedCity,
          anchor_key: anchor.id,
          anchor_name: anchor.title,
          concept_key: anchor.concept,
          place_category: anchor.category,
          main_category: anchor.mainCategory,
          experience_tags: [...anchor.experienceTags],
          rating: seedRatings[anchor.id] as number
        }));

      await saveUserSeedRatings(user.id, formData.home_city as SupportedCity, seedRows);
      await refreshProfile();
      router.push('/profile');
    } catch (saveError) {
      console.error('Error saving profile:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Failed to save profile');
      setSaving(false);
      return;
    }

    setSaving(false);
  };

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-6"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Profile</h1>
            <p className="text-gray-600">
              Set your home city and seed your taste profile for cross-city recommendations.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Enter your age"
                    min="18"
                    max="120"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as typeof formData.gender })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <select
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value as typeof formData.budget })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="low">Budget</option>
                    <option value="medium">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Restrictions</label>
                  <textarea
                    value={formData.food_restrictions}
                    onChange={(e) => setFormData({ ...formData, food_restrictions: e.target.value })}
                    placeholder="Optional dietary notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <AnchorSeedSelector
                city={formData.home_city}
                onCityChange={(city) => {
                  setFormData({ ...formData, home_city: city });
                  setSeedRatings({});
                }}
                ratings={seedRatings}
                onRatingChange={(anchorId, rating) => setSeedRatings(prev => ({ ...prev, [anchorId]: rating }))}
              />
            </div>

            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Anchor places rated</p>
                <p className="text-xs text-gray-500">{answeredCount} / {anchors.length || 10} answered</p>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile & Taste Seed'}
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
