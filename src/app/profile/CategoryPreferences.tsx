'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/core/database/supabase';

const CATEGORY_GROUPS = [
  {
    name: 'Food & Dining',
    description: 'Restaurants, cafes, and culinary experiences',
    color: 'from-orange-500 to-red-500',
    icon: '🍽️',
    categories: ['Restaurant', 'Local Trattoria', 'Pizzeria', 'Street Food', 'Cafe', 'Specialty Coffee Bar', 'Food Market', 'Co Working Café']
  },
  {
    name: 'Bars & Nightlife',
    description: 'Evening entertainment and social venues',
    color: 'from-purple-500 to-pink-500',
    icon: '🍸',
    categories: ['Aperetivo Bar', 'Craft Beer Pub', 'Rooftop Bar', 'Dessert Bar', 'Karaoke Bar', 'Student Pub', 'Underground Club', 'Commercial Nightclub']
  },
  {
    name: 'Culture & Arts',
    description: 'Museums, galleries, and cultural venues',
    color: 'from-blue-500 to-indigo-500',
    icon: '🎨',
    categories: ['Museum', 'Art Gallery', 'Contemporary Art Space', 'Street Art Area', 'Theatre', 'Cinema', 'Comedy Club', 'Cultural Event Venue', 'Exhibition Hall', 'Cultural Center', 'Library']
  },
  {
    name: 'Historic & Landmarks',
    description: 'Historical sites and monuments',
    color: 'from-amber-500 to-orange-600',
    icon: '🏛️',
    categories: ['Historical Landmark', 'Castle', 'Church', 'Tower', 'Bridge', 'Old Town', 'City Square', 'Historic Street']
  },
  {
    name: 'Nature & Outdoors',
    description: 'Parks, trails, and natural attractions',
    color: 'from-green-500 to-emerald-500',
    icon: '🌲',
    categories: ['Park', 'Botanical Garden', 'Viewpoint', 'Lake', 'River Walk', 'Hiking Trail', 'Mountain Peak', 'Waterfall', 'Forest Walk', 'Beach', 'Adventure Park', 'Picnic Area']
  },
  {
    name: 'Shopping',
    description: 'Retail and market experiences',
    color: 'from-pink-500 to-rose-500',
    icon: '🛍️',
    categories: ['Vintage Store', 'Local Market', 'Concept Store', 'Artisanal Shop', 'Wine Shop', 'Bookstore', 'Shopping Centre']
  },
  {
    name: 'Wellness & Leisure',
    description: 'Relaxation and wellness activities',
    color: 'from-cyan-500 to-blue-500',
    icon: '🧘',
    categories: ['Spa', 'Thermal Bath', 'Yoga Studio', 'Live Music Venue']
  }
];

interface CategoryPreferencesProps {
  userId: string;
  onComplete?: () => void;
}

type GroupLevel = 'not-interested' | 'some-types' | 'love-all';
type InterestLevel = 'not-interested' | 'somewhat' | 'very-interested';

export const CategoryPreferences: React.FC<CategoryPreferencesProps> = ({ userId, onComplete }) => {
  const [step, setStep] = useState<'overview' | 'detail'>('overview');
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [groupRatings, setGroupRatings] = useState<Map<number, GroupLevel>>(new Map());
  const [detailedRatings, setDetailedRatings] = useState<Map<string, InterestLevel>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentGroup = CATEGORY_GROUPS[currentGroupIndex];
  const isLastGroup = currentGroupIndex === CATEGORY_GROUPS.length - 1;
  const progress = ((currentGroupIndex + 1) / CATEGORY_GROUPS.length) * 100;

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const { data: preferences, error } = await supabase
          .from('user_place_preferences')
          .select('preference_strength, place_types(name)')
          .eq('user_id', userId);

        if (error) {
          console.error('Error loading preferences:', error);
        } else if (preferences && preferences.length > 0) {
          const loadedRatings = new Map<string, InterestLevel>();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          preferences.forEach((p: any) => {
            const strength = p.preference_strength;
            const name = p.place_types?.name;
            if (name) {
              let level: InterestLevel = 'somewhat';
              if (strength >= 0.8) level = 'very-interested';
              else if (strength <= 0.3) level = 'not-interested';
              loadedRatings.set(name, level);
            }
          });
          setDetailedRatings(loadedRatings);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, [userId]);

  const handleGroupRating = (level: GroupLevel) => {
    setGroupRatings(prev => new Map(prev).set(currentGroupIndex, level));
  };

  const handleDetailedRating = (category: string, level: InterestLevel) => {
    setDetailedRatings(prev => new Map(prev).set(category, level));
  };

  const handleNext = async () => {
    const groupLevel = groupRatings.get(currentGroupIndex);
    
    if (step === 'overview' && groupLevel === 'some-types') {
      setStep('detail');
      return;
    }

    if (step === 'overview' && groupLevel && groupLevel !== 'some-types') {
      const strength: InterestLevel = groupLevel === 'love-all' ? 'very-interested' : 'not-interested';
      currentGroup.categories.forEach(cat => {
        setDetailedRatings(prev => new Map(prev).set(cat, strength));
      });
    }

    if (isLastGroup) {
      await savePreferences();
    } else {
      setCurrentGroupIndex(prev => prev + 1);
      setStep('overview');
    }
  };

  const handlePrevious = () => {
    if (step === 'detail') {
      setStep('overview');
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      const prevLevel = groupRatings.get(currentGroupIndex - 1);
      if (prevLevel === 'some-types') {
        setStep('detail');
      }
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const interestedCategories = Array.from(detailedRatings.entries())
        .filter(([, level]) => level !== 'not-interested');

      if (interestedCategories.length === 0) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onComplete?.();
        }, 2000);
        return;
      }

      const categoryNames = interestedCategories.map(([name]) => name);
      console.log('Saving preferences for categories:', categoryNames);
      
      const { data: placeTypes, error: fetchError } = await supabase
        .from('place_types')
        .select('id, name')
        .in('name', categoryNames);

      if (fetchError) {
        console.error('Fetch error:', JSON.stringify(fetchError, null, 2));
        alert(`Database error: ${fetchError.message}. Please check the console.`);
        throw fetchError;
      }

      if (!placeTypes || placeTypes.length === 0) {
        console.error('No place types found for:', categoryNames);
        alert('Could not find matching place types. Please contact support.');
        throw new Error('No matching place types found');
      }

      console.log('Found place types:', placeTypes);

      const { error: deleteError } = await supabase
        .from('user_place_preferences')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Delete error:', JSON.stringify(deleteError, null, 2));
        alert(`Error clearing preferences: ${deleteError.message}`);
        throw deleteError;
      }

      const preferences = placeTypes.map(pt => ({
        user_id: userId,
        place_type_id: pt.id,
        preference_strength: detailedRatings.get(pt.name) === 'very-interested' ? 1.0 : 0.5
      }));

      console.log('Inserting preferences:', preferences);

      const { data: insertedData, error: insertError } = await supabase
        .from('user_place_preferences')
        .insert(preferences)
        .select();

      if (insertError) {
        console.error('Insert error:', JSON.stringify(insertError, null, 2));
        alert(`Error saving: ${insertError.message}. Details in console.`);
        throw insertError;
      }

      console.log('Successfully saved:', insertedData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onComplete?.();
      }, 2000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const getInterestCount = () => {
    return Array.from(detailedRatings.values()).filter(v => v !== 'not-interested').length;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  const currentGroupLevel = groupRatings.get(currentGroupIndex);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className={`bg-gradient-to-r ${currentGroup.color} text-white p-6`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{currentGroup.icon}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{currentGroup.name}</h2>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                {currentGroupIndex + 1} of {CATEGORY_GROUPS.length}
              </span>
            </div>
            <p className="text-white/90 text-sm">{currentGroup.description}</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
          <div className="bg-white h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="p-6">
        {step === 'overview' ? (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                How do you feel about {currentGroup.name.toLowerCase()}?
              </h3>
              <p className="text-gray-600 text-sm">Choose the option that best describes your interest</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleGroupRating('not-interested')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  currentGroupLevel === 'not-interested'
                    ? 'border-gray-400 bg-gray-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Not interested</div>
                    <div className="text-sm text-gray-600">I don&apos;t usually enjoy these places</div>
                  </div>
                  {currentGroupLevel === 'not-interested' && (
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleGroupRating('some-types')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  currentGroupLevel === 'some-types'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">It depends</div>
                    <div className="text-sm text-gray-600">I like some types but not all</div>
                  </div>
                  {currentGroupLevel === 'some-types' && (
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleGroupRating('love-all')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  currentGroupLevel === 'love-all'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Love them all!</div>
                    <div className="text-sm text-gray-600">I enjoy all types of {currentGroup.name.toLowerCase()}</div>
                  </div>
                  {currentGroupLevel === 'love-all' && (
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>You&apos;ve marked <strong>{getInterestCount()}</strong> place types as interesting so far.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Rate specific types</h3>
              <p className="text-sm text-gray-600">Tell us which specific types you enjoy</p>
            </div>
            {currentGroup.categories.map((category) => {
              const rating = detailedRatings.get(category);
              return (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900 font-medium">{category}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDetailedRating(category, 'not-interested')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        rating === 'not-interested'
                          ? 'bg-gray-300 text-gray-800'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => handleDetailedRating(category, 'somewhat')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        rating === 'somewhat'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Like
                    </button>
                    <button
                      onClick={() => handleDetailedRating(category, 'very-interested')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        rating === 'very-interested'
                          ? 'bg-green-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Love
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentGroupIndex === 0 && step === 'overview'}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={saving || (step === 'overview' && !currentGroupLevel)}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : isLastGroup && step === 'overview' && currentGroupLevel !== 'some-types' ? (
              <>
                Save Preferences
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </>
            ) : (
              <>
                {step === 'detail' || (step === 'overview' && currentGroupLevel === 'some-types') ? 'Continue' : 'Next'}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Preferences saved successfully!
        </div>
      )}
    </div>
  );
};
