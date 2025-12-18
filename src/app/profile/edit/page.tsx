'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext } from '@/features/auth/AuthContext';
import { DatabaseProfile, saveNewProfile } from '@/core/database/newDatabase';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Header } from '@/shared/components/Header';
import { Footer } from '@/shared/components/Footer';
import { CategoryPreferences } from '../CategoryPreferences';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, profile: existingProfile, loading: authLoading, refreshProfile } = useAuthContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '' as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | '',
    budget: 'medium' as 'low' | 'medium' | 'high',
    env_preference: '' as 'nature' | 'mostly-nature' | 'balanced' | 'mostly-city' | 'city' | '',
    activity_style: '' as 'relaxing' | 'mostly-relaxing' | 'balanced' | 'mostly-active' | 'active' | '',
    food_restrictions: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Load profile data when available
  useEffect(() => {
    if (existingProfile) {
      setFormData({
        full_name: existingProfile.full_name || '',
        age: existingProfile.age?.toString() || '',
        gender: existingProfile.gender || '',
        budget: existingProfile.budget || 'medium',
        env_preference: existingProfile.env_preference || '',
        activity_style: existingProfile.activity_style || '',
        food_restrictions: existingProfile.food_restrictions || ''
      });
    }
  }, [existingProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.full_name || !formData.age || !formData.gender) {
        setError('Please fill in all required fields (Name, Age, Gender)');
        setSaving(false);
        return;
      }

      const profileData: Omit<DatabaseProfile, 'id' | 'updated_at'> = {
        full_name: formData.full_name,
        age: parseInt(formData.age),
        gender: formData.gender as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say',
        budget: formData.budget as 'low' | 'medium' | 'high',
        env_preference: formData.env_preference || null,
        activity_style: formData.activity_style || null,
        food_restrictions: formData.food_restrictions || ''
      };

      await saveNewProfile(profileData);
      
      // Refresh profile in AuthContext
      await refreshProfile();
      
      router.push('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to save profile');
      setSaving(false);
    }
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
        <div className="max-w-2xl mx-auto px-4">
          
          {/* Back Navigation */}
          <button 
            onClick={() => router.push('/profile')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-6"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Edit Profile
            </h1>
            <p className="text-gray-600">
              Update your travel preferences and personal information
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Basic Information
              </h3>
              
              <div className="space-y-3">
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
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | '' })}
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
              </div>
            </div>

            {/* Travel Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Travel Preferences
              </h3>
              
              <div className="space-y-6">
                {/* Budget Slider (3 states) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Budget <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="1"
                      value={formData.budget === 'low' ? 1 : formData.budget === 'medium' ? 2 : 3}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        const budgetMap: { [key: number]: 'low' | 'medium' | 'high' } = {
                          1: 'low',
                          2: 'medium',
                          3: 'high'
                        };
                        setFormData({ ...formData, budget: budgetMap[value] });
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      required
                    />
                    <div className="flex justify-between px-1">
                      <div className={`flex flex-col items-center transition-all ${formData.budget === 'low' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">💰</span>
                        <span className="text-xs font-medium text-gray-700 text-center">Budget</span>
                      </div>
                      <div className={`flex flex-col items-center transition-all ${formData.budget === 'medium' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">💵</span>
                        <span className="text-xs font-medium text-gray-700 text-center">Moderate</span>
                      </div>
                      <div className={`flex flex-col items-center transition-all ${formData.budget === 'high' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">💎</span>
                        <span className="text-xs font-medium text-gray-700 text-center">Luxury</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Environment Slider (5 states) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Environment Preference
                  </label>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={
                        formData.env_preference === 'nature' ? 1 :
                        formData.env_preference === 'mostly-nature' ? 2 :
                        formData.env_preference === 'balanced' ? 3 :
                        formData.env_preference === 'mostly-city' ? 4 :
                        formData.env_preference === 'city' ? 5 : 3
                      }
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        const envMap: { [key: number]: 'nature' | 'mostly-nature' | 'balanced' | 'mostly-city' | 'city' } = {
                          1: 'nature',
                          2: 'mostly-nature',
                          3: 'balanced',
                          4: 'mostly-city',
                          5: 'city'
                        };
                        setFormData({ ...formData, env_preference: envMap[value] });
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                    <div className="flex justify-between px-1">
                      <div className={`flex flex-col items-center transition-all ${formData.env_preference === 'nature' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">🌲</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">Nature</span>
                      </div>
                      <div className={`flex flex-col items-center transition-all ${formData.env_preference === 'mostly-nature' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">🌳</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">Mostly<br/>Nature</span>
                      </div>
                      <div className={`flex flex-col items-center transition-all ${formData.env_preference === 'balanced' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">⚖️</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">Balanced</span>
                      </div>
                      <div className={`flex flex-col items-center transition-all ${formData.env_preference === 'mostly-city' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">🌆</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">Mostly<br/>City</span>
                      </div>
                      <div className={`flex flex-col items-center transition-all ${formData.env_preference === 'city' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">🏙️</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">City</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Style Slider (5 states) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Activity Style
                  </label>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={
                        formData.activity_style === 'relaxing' ? 1 :
                        formData.activity_style === 'mostly-relaxing' ? 2 :
                        formData.activity_style === 'balanced' ? 3 :
                        formData.activity_style === 'mostly-active' ? 4 :
                        formData.activity_style === 'active' ? 5 : 3
                      }
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        const activityMap: { [key: number]: 'relaxing' | 'mostly-relaxing' | 'balanced' | 'mostly-active' | 'active' } = {
                          1: 'relaxing',
                          2: 'mostly-relaxing',
                          3: 'balanced',
                          4: 'mostly-active',
                          5: 'active'
                        };
                        setFormData({ ...formData, activity_style: activityMap[value] });
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                    <div className="flex justify-between px-1">
                      <div className={`flex flex-col items-center transition-all ${formData.activity_style === 'relaxing' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">🧘</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">Relaxed</span>
                      </div>
                      <div className={`flex flex-col items-center transition-all ${formData.activity_style === 'mostly-relaxing' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">😌</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">Mostly<br/>Relaxed</span>
                      </div>
                      <div className={`flex flex-col items-center transition-all ${formData.activity_style === 'balanced' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">⚖️</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">Balanced</span>
                      </div>
                      <div className={`flex flex-col items-center transition-all ${formData.activity_style === 'mostly-active' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">🚶</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">Mostly<br/>Active</span>
                      </div>
                      <div className={`flex flex-col items-center transition-all ${formData.activity_style === 'active' ? 'scale-110' : 'opacity-60'}`}>
                        <span className="text-3xl mb-1">⚡</span>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dietary Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Dietary Restrictions
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'halal', label: 'Halal', icon: '☪️' },
                  { value: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
                  { value: 'vegan', label: 'Vegan', icon: '🌱' },
                  { value: 'gluten-free', label: 'Gluten-Free', icon: '🌾' }
                ].map((restriction) => {
                  const restrictions = formData.food_restrictions 
                    ? formData.food_restrictions.split(',').map(r => r.trim()).filter(Boolean)
                    : [];
                  const isSelected = restrictions.includes(restriction.value);
                  
                  return (
                    <div
                      key={restriction.value}
                      onClick={() => {
                        const current = formData.food_restrictions 
                          ? formData.food_restrictions.split(',').map(r => r.trim()).filter(Boolean)
                          : [];
                        const updated = current.includes(restriction.value)
                          ? current.filter(r => r !== restriction.value)
                          : [...current, restriction.value];
                        setFormData({ ...formData, food_restrictions: updated.join(', ') });
                      }}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center space-y-1">
                        <div className="text-2xl">{restriction.icon}</div>
                        <div className="font-medium text-gray-900 text-sm">
                          {restriction.label}
                        </div>
                        {isSelected && (
                          <div className="text-blue-600 text-xl">✓</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <button
                type="button"
                onClick={() => router.push('/profile')}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Category Preferences Section */}
          {user && (
            <div className="mt-8">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Place Preferences
                </h2>
                <p className="text-gray-600 text-sm">
                  Help us understand what types of places you enjoy visiting
                </p>
              </div>
              <CategoryPreferences 
                userId={user.id}
                onComplete={() => {
                  // Navigate back to profile after completion
                  router.push('/profile');
                }}
              />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
