'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadExistingProfile, DatabaseProfile, saveNewProfile } from '@/core/database/newDatabase';
import { supabase } from '@/core/database/supabase';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '' as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | '',
    budget: 'medium' as 'low' | 'medium' | 'high',
    env_preference: '' as 'city' | 'nature' | 'balanced' | '',
    activity_style: '' as 'active' | 'relaxing' | 'balanced' | '',
    food_restrictions: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        const profile = await loadExistingProfile();
        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            age: profile.age?.toString() || '',
            gender: profile.gender || '',
            budget: profile.budget || 'medium',
            env_preference: profile.env_preference || '',
            activity_style: profile.activity_style || '',
            food_restrictions: profile.food_restrictions || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      }
      
      setLoading(false);
    };

    loadUserData();
  }, [router]);

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
        budget: formData.budget,
        env_preference: formData.env_preference || null,
        activity_style: formData.activity_style || null,
        food_restrictions: formData.food_restrictions || null
      };

      await saveNewProfile(profileData);
      router.push('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to save profile');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Navigation */}
        <div className="mb-6">
          <button 
            onClick={() => router.push('/profile')}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <span className="mr-2">←</span>
            Back to Profile
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Edit Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your travel preferences and personal information
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | '' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Travel Preferences
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="low">Low (Budget-friendly)</option>
                  <option value="medium">Medium (Moderate spending)</option>
                  <option value="high">High (Luxury)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Environment Preference
                </label>
                <select
                  value={formData.env_preference}
                  onChange={(e) => setFormData({ ...formData, env_preference: e.target.value as 'city' | 'nature' | 'balanced' | '' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select preference</option>
                  <option value="city">City (Urban environments)</option>
                  <option value="nature">Nature (Outdoor settings)</option>
                  <option value="balanced">Balanced (Mix of both)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activity Style
                </label>
                <select
                  value={formData.activity_style}
                  onChange={(e) => setFormData({ ...formData, activity_style: e.target.value as 'active' | 'relaxing' | 'balanced' | '' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select style</option>
                  <option value="active">Active (Adventure & sports)</option>
                  <option value="relaxing">Relaxing (Leisure & rest)</option>
                  <option value="balanced">Balanced (Mix of both)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dietary Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dietary Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Food Restrictions
              </label>
              <textarea
                value={formData.food_restrictions}
                onChange={(e) => setFormData({ ...formData, food_restrictions: e.target.value })}
                placeholder="e.g., Vegetarian, Gluten-free, Allergies..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                List any dietary restrictions or allergies
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
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
              className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
