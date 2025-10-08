'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { saveNewProfile, DatabaseProfile } from '@/core/database/newDatabase';

// Types matching the exact database schema
interface ProfileData {
  full_name: string;
  age: number;
  gender: 'male' | 'female';
  budget_level: 'low' | 'medium' | 'high';
  activities: string[];
  place_types: string[];
  food_preferences: string[];
  food_restrictions: string[];
  personality_traits: string[];
  trip_style: 'planned' | 'mixed' | 'spontaneous';
}

// Step 1: Basic Information
const BasicInfoStep: React.FC<{
  data: Partial<ProfileData>;
  updateData: (data: Partial<ProfileData>) => void;
  onNext: () => void;
}> = ({ data, updateData, onNext }) => {
  const [firstName, setFirstName] = useState(data.full_name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(data.full_name?.split(' ').slice(1).join(' ') || '');

  const genderOptions = [
    { value: 'male', label: 'Male', icon: '👨', description: 'He/Him' },
    { value: 'female', label: 'Female', icon: '👩', description: 'She/Her' }
  ];

  const ageGroups = [
    { min: 18, max: 24, label: '18-24', icon: '🎓', avg: 21 },
    { min: 25, max: 34, label: '25-34', icon: '💼', avg: 29 },
    { min: 35, max: 44, label: '35-44', icon: '🏡', avg: 39 },
    { min: 45, max: 54, label: '45-54', icon: '🌟', avg: 49 },
    { min: 55, max: 64, label: '55-64', icon: '🎯', avg: 59 },
    { min: 65, max: 100, label: '65+', icon: '🧓', avg: 70 }
  ];

  const handleNext = () => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    updateData({ full_name: fullName });
    onNext();
  };

  const isValid = firstName.trim() && lastName.trim() && data.gender && data.age;
  const isEditing = !!(data.full_name || data.age || data.gender); // Check if we have existing data

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEditing ? "Fill the form with your info 📝" : "Let's get to know you! 👋"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isEditing 
            ? "Update fields below"
            : "Tell us about yourself to personalize your travel experience"
          }
        </p>
      </div>

      {/* Name Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">What&apos;s your name?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your last name"
            />
          </div>
        </div>
      </div>

      {/* Gender Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">How do you identify?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {genderOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => updateData({ gender: option.value as 'male' | 'female' })}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                data.gender === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="text-center space-y-2">
                <div className="text-3xl">{option.icon}</div>
                <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Age Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">What&apos;s your age group?</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ageGroups.map((group) => (
            <div
              key={group.label}
              onClick={() => updateData({ age: group.avg })}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                data.age === group.avg
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="text-center space-y-2">
                <div className="text-2xl">{group.icon}</div>
                <div className="font-medium text-gray-900 dark:text-white">{group.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6">
        <Button
          onClick={handleNext}
          disabled={!isValid}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
};

// Step 2: Budget & Travel Style
const BudgetStep: React.FC<{
  data: Partial<ProfileData>;
  updateData: (data: Partial<ProfileData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}> = ({ data, updateData, onNext, onPrevious }) => {
  const budgetOptions = [
    {
      value: 'low',
      label: 'Budget Explorer',
      icon: '💸',
      description: 'Smart spending, great value',
      range: 'Under €50/day'
    },
    {
      value: 'medium',
      label: 'Comfort Seeker',
      icon: '💳',
      description: 'Balance of comfort and value',
      range: '€50-200/day'
    },
    {
      value: 'high',
      label: 'Luxury Traveler',
      icon: '💎',
      description: 'Premium experiences',
      range: '€200+/day'
    }
  ];

  const tripStyleOptions = [
    {
      value: 'planned',
      label: 'Well-Planned',
      icon: '📋',
      description: 'Every detail organized in advance'
    },
    {
      value: 'mixed',
      label: 'Flexible',
      icon: '🎯',
      description: 'Some planning, some spontaneity'
    },
    {
      value: 'spontaneous',
      label: 'Spontaneous',
      icon: '🎲',
      description: 'Go with the flow and see what happens'
    }
  ];

  const isValid = data.budget_level && data.trip_style;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Travel Style 🎨</h2>
        <p className="text-gray-600 dark:text-gray-400">How do you like to travel and spend?</p>
      </div>

      {/* Budget Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">What&apos;s your budget style?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {budgetOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => updateData({ budget_level: option.value as 'low' | 'medium' | 'high' })}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                data.budget_level === option.value
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="text-center space-y-3">
                <div className="text-4xl">{option.icon}</div>
                <div className="font-bold text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
                <div className="text-xs font-medium text-green-600 dark:text-green-400">{option.range}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trip Style Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">How do you plan trips?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tripStyleOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => updateData({ trip_style: option.value as 'planned' | 'mixed' | 'spontaneous' })}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                data.trip_style === option.value
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="text-center space-y-3">
                <div className="text-4xl">{option.icon}</div>
                <div className="font-bold text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button
          onClick={onPrevious}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
        >
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
};

// Step 3: Activities
const ActivitiesStep: React.FC<{
  data: Partial<ProfileData>;
  updateData: (data: Partial<ProfileData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}> = ({ data, updateData, onNext, onPrevious }) => {
  const activityOptions = [
    { value: 'hiking', label: 'Hiking', icon: '🥾', category: 'Adventure' },
    { value: 'photography', label: 'Photography', icon: '📸', category: 'Creative' },
    { value: 'Nature', label: 'Nature Walks', icon: '🌲', category: 'Relaxed' },
    { value: 'Foodie experiences', label: 'Food Tours', icon: '🍽️', category: 'Culinary' },
    { value: 'museums', label: 'Museums', icon: '🏛️', category: 'Cultural' },
    { value: 'nightlife', label: 'Nightlife', icon: '🌃', category: 'Social' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️', category: 'Leisure' },
    { value: 'beaches', label: 'Beach Time', icon: '🏖️', category: 'Relaxed' },
    { value: 'adventure sports', label: 'Adventure Sports', icon: '🪂', category: 'Thrill' },
    { value: 'local culture', label: 'Local Culture', icon: '🎭', category: 'Cultural' },
    { value: 'wellness', label: 'Wellness/Spa', icon: '🧘', category: 'Relaxed' },
    { value: 'festivals', label: 'Events & Festivals', icon: '🎪', category: 'Social' }
  ];

  const toggleActivity = (activity: string) => {
    const current = data.activities || [];
    const updated = current.includes(activity)
      ? current.filter(a => a !== activity)
      : [...current, activity];
    updateData({ activities: updated });
  };

  const isValid = (data.activities || []).length >= 2;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">What activities excite you? 🎯</h2>
        <p className="text-gray-600 dark:text-gray-400">Choose at least 2 activities you enjoy while traveling</p>
        <div className="text-sm text-blue-600 dark:text-blue-400">
          Selected: {(data.activities || []).length} activities
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {activityOptions.map((activity) => {
          const isSelected = (data.activities || []).includes(activity.value);
          return (
            <div
              key={activity.value}
              onClick={() => toggleActivity(activity.value)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 transform scale-105'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="text-center space-y-2">
                <div className="text-3xl">{activity.icon}</div>
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                  {activity.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.category}
                </div>
                {isSelected && (
                  <div className="text-blue-500 text-xl">✓</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-6">
        <Button
          onClick={onPrevious}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
        >
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
};

// Step 4: Place Types
const PlaceTypesStep: React.FC<{
  data: Partial<ProfileData>;
  updateData: (data: Partial<ProfileData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}> = ({ data, updateData, onNext, onPrevious }) => {
  const placeOptions = [
    { value: 'mountains', label: 'Mountains', icon: '⛰️', description: 'Fresh air and scenic views' },
    { value: 'cities', label: 'Historic Cities', icon: '🏰', description: 'Rich culture and architecture' },
    { value: 'Big cities buzzing with life', label: 'Modern Metropolis', icon: '🌆', description: 'Urban energy and excitement' },
    { value: 'Coastal & beach towns', label: 'Beach Towns', icon: '🏖️', description: 'Sun, sand, and relaxation' },
    { value: 'countryside', label: 'Countryside', icon: '🌾', description: 'Peaceful rural landscapes' },
    { value: 'islands', label: 'Tropical Islands', icon: '🏝️', description: 'Paradise getaways' },
    { value: 'deserts', label: 'Desert Landscapes', icon: '🏜️', description: 'Unique and mystical' },
    { value: 'forests', label: 'Forest Retreats', icon: '🌲', description: 'Nature and wildlife' }
  ];

  const togglePlace = (place: string) => {
    const current = data.place_types || [];
    const updated = current.includes(place)
      ? current.filter(p => p !== place)
      : [...current, place];
    updateData({ place_types: updated });
  };

  const isValid = (data.place_types || []).length >= 1;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Where do you love to go? 🗺️</h2>
        <p className="text-gray-600 dark:text-gray-400">Select the types of places that appeal to you</p>
        <div className="text-sm text-green-600 dark:text-green-400">
          Selected: {(data.place_types || []).length} destinations
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {placeOptions.map((place) => {
          const isSelected = (data.place_types || []).includes(place.value);
          return (
            <div
              key={place.value}
              onClick={() => togglePlace(place.value)}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                isSelected
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 transform scale-105'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="text-center space-y-3">
                <div className="text-4xl">{place.icon}</div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {place.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {place.description}
                </div>
                {isSelected && (
                  <div className="text-green-500 text-2xl">✓</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-6">
        <Button
          onClick={onPrevious}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
        >
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
};

// Step 5: Food Preferences
const FoodStep: React.FC<{
  data: Partial<ProfileData>;
  updateData: (data: Partial<ProfileData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}> = ({ data, updateData, onNext, onPrevious }) => {
  const foodOptions = [
    { value: 'italian', label: 'Italian', icon: '🍝', type: 'cuisine' },
    { value: 'Fine dining', label: 'Fine Dining', icon: '🍷', type: 'experience' },
    { value: 'Desserts & sweets', label: 'Desserts', icon: '🍰', type: 'treat' },
    { value: 'asian', label: 'Asian', icon: '🍜', type: 'cuisine' },
    { value: 'local street food', label: 'Street Food', icon: '🌮', type: 'experience' },
    { value: 'seafood', label: 'Seafood', icon: '🦞', type: 'cuisine' },
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥗', type: 'diet' },
    { value: 'bbq', label: 'BBQ & Grills', icon: '🍖', type: 'cuisine' },
    { value: 'coffee culture', label: 'Coffee Culture', icon: '☕', type: 'experience' },
    { value: 'wine tasting', label: 'Wine Tasting', icon: '🍇', type: 'experience' },
    { value: 'bakeries', label: 'Bakeries', icon: '🥐', type: 'treat' },
    { value: 'fusion', label: 'Fusion Cuisine', icon: '🍛', type: 'cuisine' }
  ];

  const restrictionOptions = [
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
    { value: 'vegan', label: 'Vegan', icon: '🌱' },
    { value: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
    { value: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
    { value: 'halal', label: 'Halal', icon: '☪️' },
    { value: 'kosher', label: 'Kosher', icon: '✡️' },
    { value: 'no shellfish', label: 'No Shellfish', icon: '🦐' },
    { value: 'no nuts', label: 'Nut Allergy', icon: '🥜' }
  ];

  const toggleFood = (food: string) => {
    const current = data.food_preferences || [];
    const updated = current.includes(food)
      ? current.filter(f => f !== food)
      : [...current, food];
    updateData({ food_preferences: updated });
  };

  const toggleRestriction = (restriction: string) => {
    const current = data.food_restrictions || [];
    const updated = current.includes(restriction)
      ? current.filter(r => r !== restriction)
      : [...current, restriction];
    updateData({ food_restrictions: updated });
  };

  const isValid = (data.food_preferences || []).length >= 1;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Let&apos;s talk food! 🍽️</h2>
        <p className="text-gray-600 dark:text-gray-400">What flavors and dining experiences do you love?</p>
      </div>

      {/* Food Preferences */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Food You Love</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {foodOptions.map((food) => {
            const isSelected = (data.food_preferences || []).includes(food.value);
            return (
              <div
                key={food.value}
                onClick={() => toggleFood(food.value)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="text-center space-y-2">
                  <div className="text-3xl">{food.icon}</div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {food.label}
                  </div>
                  {isSelected && (
                    <div className="text-orange-500 text-xl">✓</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Food Restrictions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Dietary Restrictions (Optional)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {restrictionOptions.map((restriction) => {
            const isSelected = (data.food_restrictions || []).includes(restriction.value);
            return (
              <div
                key={restriction.value}
                onClick={() => toggleRestriction(restriction.value)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="text-center space-y-2">
                  <div className="text-2xl">{restriction.icon}</div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {restriction.label}
                  </div>
                  {isSelected && (
                    <div className="text-red-500 text-xl">✓</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button
          onClick={onPrevious}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
        >
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
};

// Step 6: Personality Traits
const PersonalityStep: React.FC<{
  data: Partial<ProfileData>;
  updateData: (data: Partial<ProfileData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete?: () => void;
  isEditing?: boolean;
}> = ({ data, updateData, onPrevious, onComplete, isEditing = false }) => {
  const personalityOptions = [
    { value: 'adventurous', label: 'Adventurous', icon: '🌟', description: 'Love trying new things' },
    { value: 'Relaxed', label: 'Relaxed', icon: '😌', description: 'Prefer laid-back experiences' },
    { value: 'Sporty', label: 'Sporty', icon: '🏃', description: 'Active and energetic' },
    { value: 'cultural', label: 'Cultural Explorer', icon: '🎭', description: 'Fascinated by local customs' },
    { value: 'social', label: 'Social Butterfly', icon: '🦋', description: 'Love meeting new people' },
    { value: 'photographer', label: 'Visual Storyteller', icon: '📸', description: 'Capture every moment' },
    { value: 'foodie', label: 'Food Explorer', icon: '👨‍🍳', description: 'Travel for the flavors' },
    { value: 'budget-conscious', label: 'Budget Savvy', icon: '💰', description: 'Smart with spending' },
    { value: 'luxury-seeker', label: 'Comfort Lover', icon: '✨', description: 'Appreciate finer things' },
    { value: 'nature-lover', label: 'Nature Lover', icon: '🌿', description: 'Find peace in nature' },
    { value: 'history-buff', label: 'History Enthusiast', icon: '📚', description: 'Love learning about the past' },
    { value: 'night-owl', label: 'Night Explorer', icon: '🌙', description: 'City comes alive at night' }
  ];

  const togglePersonality = (trait: string) => {
    const current = data.personality_traits || [];
    const updated = current.includes(trait)
      ? current.filter(p => p !== trait)
      : [...current, trait];
    updateData({ personality_traits: updated });
  };

  const isValid = (data.personality_traits || []).length >= 2;

  const handleFinish = async () => {
    try {
      console.log('Final profile data:', data);
      
      // Validate required fields
      if (!data.full_name || !data.age || !data.gender || !data.budget_level || !data.trip_style) {
        throw new Error('Missing required fields');
      }

      // Save to database using the new save function
      await saveNewProfile({
        full_name: data.full_name,
        age: data.age,
        gender: data.gender,
        budget_level: data.budget_level,
        activities: data.activities || [],
        place_types: data.place_types || [],
        food_preferences: data.food_preferences || [],
        food_restrictions: data.food_restrictions || [],
        personality_traits: data.personality_traits || [],
        trip_style: data.trip_style
      });

      alert(isEditing ? '✅ Profile updated successfully!' : '✅ Profile created successfully!');
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
      
    } catch (error) {
      console.error('❌ Failed to save profile:', error);
      alert(`❌ Error saving profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">What describes you best? ✨</h2>
        <p className="text-gray-600 dark:text-gray-400">Choose at least 2 traits that match your travel personality</p>
        <div className="text-sm text-purple-600 dark:text-purple-400">
          Selected: {(data.personality_traits || []).length} traits
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {personalityOptions.map((trait) => {
          const isSelected = (data.personality_traits || []).includes(trait.value);
          return (
            <div
              key={trait.value}
              onClick={() => togglePersonality(trait.value)}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 transform scale-105'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="text-center space-y-3">
                <div className="text-4xl">{trait.icon}</div>
                <div className="font-bold text-gray-900 dark:text-white text-sm">
                  {trait.label}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {trait.description}
                </div>
                {isSelected && (
                  <div className="text-purple-500 text-2xl">✓</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-6">
        <Button
          onClick={onPrevious}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
        >
          ← Back
        </Button>
        <Button
          onClick={handleFinish}
          disabled={!isValid}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isEditing ? "Update Profile ✏️" : "Complete Profile ✨"}
        </Button>
      </div>
    </div>
  );
};
interface NewProfileFormProps {
  onComplete?: () => void;
  initialData?: DatabaseProfile | null;
}

const NewProfileForm: React.FC<NewProfileFormProps> = ({ onComplete, initialData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Initialize with existing data if provided, otherwise use defaults
  const [profileData, setProfileData] = useState<Partial<ProfileData>>(() => {
    if (initialData) {
      return {
        full_name: initialData.full_name,
        age: initialData.age,
        gender: initialData.gender,
        budget_level: initialData.budget_level,
        activities: initialData.activities || [],
        place_types: initialData.place_types || [],
        food_preferences: initialData.food_preferences || [],
        food_restrictions: initialData.food_restrictions || [],
        personality_traits: initialData.personality_traits || [],
        trip_style: initialData.trip_style
      };
    }
    
    // Default values for new profile
    return {
      activities: [],
      place_types: [],
      food_preferences: [],
      food_restrictions: [],
      personality_traits: []
    };
  });

  const updateData = (newData: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...newData }));
  };

  const steps = [
    {
      component: BasicInfoStep,
      title: "Basic Info",
      icon: "👤"
    },
    {
      component: BudgetStep,
      title: "Travel Style",
      icon: "🎨"
    },
    {
      component: ActivitiesStep,
      title: "Activities",
      icon: "🎯"
    },
    {
      component: PlaceTypesStep,
      title: "Destinations",
      icon: "🗺️"
    },
    {
      component: FoodStep,
      title: "Food & Dining",
      icon: "🍽️"
    },
    {
      component: PersonalityStep,
      title: "Personality",
      icon: "✨"
    }
  ];

  const CurrentStepComponent = steps[currentStep]?.component;
  const isEditMode = !!initialData; // Check if we're editing existing profile

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? "Edit Profile" : "Complete Your Profile"}
              </h1>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Step */}
      <div className="py-8">
        {CurrentStepComponent && (
          <CurrentStepComponent
            data={profileData}
            updateData={updateData}
            onNext={() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))}
            onPrevious={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
            onComplete={currentStep === steps.length - 1 ? onComplete : undefined}
            isEditing={currentStep === steps.length - 1 ? isEditMode : undefined}
          />
        )}
      </div>

      {/* Debug Info */}
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-sm text-xs">
        <div className="font-bold mb-2">Debug Data:</div>
        <pre className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
          {JSON.stringify(profileData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default NewProfileForm;
