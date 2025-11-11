'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import type { ReviewFormData, ExperienceTag } from '@/shared/types/review';
import type { PlaceWithType } from '@/shared/types/place';
import { PRICE_RANGES } from '@/shared/types/review';
import { getExperienceTags } from '@/core/database/reviewsDatabase';
import { getAllPlaces } from '@/core/database/placesDatabase';

interface ReviewFormProps {
  onSubmit: (review: ReviewFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ReviewFormData>;
}

export function ReviewForm({ onSubmit, onCancel, initialData }: ReviewFormProps) {
  const [places, setPlaces] = useState<PlaceWithType[]>([]);
  const [experienceTags, setExperienceTags] = useState<ExperienceTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  
  const [formData, setFormData] = useState<ReviewFormData>({
    place_id: initialData?.place_id || '',
    overall_rating: initialData?.overall_rating || 3,
    visit_date: initialData?.visit_date || new Date().toISOString().split('T')[0],
    experience_tag_ids: initialData?.experience_tag_ids || [],
    price_range: initialData?.price_range || undefined,
    comment: initialData?.comment || ''
  });

  const [selectedPlace, setSelectedPlace] = useState<PlaceWithType | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch places
      const placesData = await getAllPlaces();
      setPlaces(placesData);

      // Fetch experience tags
      const tags = await getExperienceTags();
      setExperienceTags(tags);

      // If place_id is pre-selected, find the place
      if (initialData?.place_id && placesData) {
        const place = placesData.find((p: PlaceWithType) => p.id === initialData.place_id);
        if (place) setSelectedPlace(place);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceChange = (placeId: string) => {
    const place = places.find((p: PlaceWithType) => p.id === placeId);
    setSelectedPlace(place || null);
    setFormData({ ...formData, place_id: placeId });
    setSearchTerm('');
    setShowPlaceDropdown(false);
  };

  // Filter places based on search
  const filteredPlaces = places.filter(place =>
    place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    place.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    place.place_type?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTagToggle = (tagId: string) => {
    const currentTags = formData.experience_tag_ids;
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    
    setFormData({ ...formData, experience_tag_ids: newTags });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.place_id) {
      alert('Please select a place');
      return;
    }
    if (!formData.overall_rating) {
      alert('Please provide a rating');
      return;
    }
    if (!formData.visit_date) {
      alert('Please select your visit date');
      return;
    }

    onSubmit(formData);
  };

  // Group experience tags by category
  const tagsByCategory = experienceTags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, ExperienceTag[]>);

  // Get category colors and icons - more vibrant and distinct
  const getCategoryStyle = (category: string) => {
    const styles: Record<string, { 
      bg: string; 
      selectedBg: string; 
      text: string; 
      selectedText: string;
      border: string;
      icon: string;
      gradient: string;
    }> = {
      'atmosphere': { 
        bg: 'bg-purple-50 dark:bg-purple-950/30', 
        selectedBg: 'bg-gradient-to-r from-purple-500 to-purple-600',
        text: 'text-purple-600 dark:text-purple-400',
        selectedText: 'text-white',
        border: 'border-purple-300 dark:border-purple-700',
        icon: '✨',
        gradient: 'bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-950/20'
      },
      'activity': { 
        bg: 'bg-blue-50 dark:bg-blue-950/30', 
        selectedBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        text: 'text-blue-600 dark:text-blue-400',
        selectedText: 'text-white',
        border: 'border-blue-300 dark:border-blue-700',
        icon: '🎯',
        gradient: 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-950/20'
      },
      'food': { 
        bg: 'bg-orange-50 dark:bg-orange-950/30', 
        selectedBg: 'bg-gradient-to-r from-orange-500 to-orange-600',
        text: 'text-orange-600 dark:text-orange-400',
        selectedText: 'text-white',
        border: 'border-orange-300 dark:border-orange-700',
        icon: '🍽️',
        gradient: 'bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-950/20'
      },
      'service': { 
        bg: 'bg-green-50 dark:bg-green-950/30', 
        selectedBg: 'bg-gradient-to-r from-green-500 to-green-600',
        text: 'text-green-600 dark:text-green-400',
        selectedText: 'text-white',
        border: 'border-green-300 dark:border-green-700',
        icon: '�',
        gradient: 'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-950/20'
      },
      'amenities': { 
        bg: 'bg-teal-50 dark:bg-teal-950/30', 
        selectedBg: 'bg-gradient-to-r from-teal-500 to-teal-600',
        text: 'text-teal-600 dark:text-teal-400',
        selectedText: 'text-white',
        border: 'border-teal-300 dark:border-teal-700',
        icon: '🏪',
        gradient: 'bg-gradient-to-r from-teal-100 to-teal-50 dark:from-teal-900/40 dark:to-teal-950/20'
      },
      'experience': { 
        bg: 'bg-pink-50 dark:bg-pink-950/30', 
        selectedBg: 'bg-gradient-to-r from-pink-500 to-pink-600',
        text: 'text-pink-600 dark:text-pink-400',
        selectedText: 'text-white',
        border: 'border-pink-300 dark:border-pink-700',
        icon: '💫',
        gradient: 'bg-gradient-to-r from-pink-100 to-pink-50 dark:from-pink-900/40 dark:to-pink-950/20'
      }
    };
    return styles[category.toLowerCase()] || { 
      bg: 'bg-gray-50 dark:bg-gray-900/30', 
      selectedBg: 'bg-gradient-to-r from-gray-500 to-gray-600',
      text: 'text-gray-600 dark:text-gray-400',
      selectedText: 'text-white',
      border: 'border-gray-300 dark:border-gray-700',
      icon: '🏷️',
      gradient: 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/40 dark:to-gray-900/20'
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Place Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Place Details
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Place <span className="text-red-500">*</span>
            </label>
            
            {/* Searchable dropdown */}
            <div className="relative">
              <input
                type="text"
                value={selectedPlace ? `${selectedPlace.name} (${selectedPlace.place_type?.name || 'Unknown'})` : searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowPlaceDropdown(true);
                  if (!e.target.value) {
                    setFormData({ ...formData, place_id: '' });
                    setSelectedPlace(null);
                  }
                }}
                onFocus={() => setShowPlaceDropdown(true)}
                placeholder="Search for a place by name, city, or type..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                required
              />
              
              {/* Dropdown list */}
              {showPlaceDropdown && filteredPlaces.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredPlaces.map(place => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handlePlaceChange(place.id)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        formData.place_id === place.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                      }`}
                    >
                      <div className="font-medium">{place.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {place.place_type?.icon} {place.place_type?.name} • {place.city || 'Unknown city'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Click outside to close */}
              {showPlaceDropdown && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowPlaceDropdown(false)}
                />
              )}
            </div>
            
            {selectedPlace && (
              <p className="mt-1 text-xs text-gray-500">
                Selected: {selectedPlace.name} in {selectedPlace.city}
              </p>
            )}
            {!selectedPlace && searchTerm && filteredPlaces.length === 0 && (
              <p className="mt-1 text-xs text-yellow-600">
                No places found. Try different keywords.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visit Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.visit_date}
              onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Overall Rating <span className="text-red-500">*</span>
        </h3>
        
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              type="button"
              onClick={() => setFormData({ ...formData, overall_rating: rating })}
              className={`text-3xl transition-all ${
                rating <= formData.overall_rating
                  ? 'text-yellow-400 scale-110'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            >
              ★
            </button>
          ))}
          <span className="ml-4 text-lg font-medium text-gray-700 dark:text-gray-300">
            {formData.overall_rating}/5
          </span>
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Price Range <span className="text-gray-400">(per person)</span>
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          How much did you spend per person approximately?
        </p>
        
        <select
          value={formData.price_range || ''}
          onChange={(e) => setFormData({ ...formData, price_range: e.target.value || undefined })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select price range...</option>
          {PRICE_RANGES.map(range => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      {/* Experience Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Experience Tags
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Select tags that describe your experience - each color represents a different aspect!
        </p>
        
        <div className="space-y-4">
          {Object.entries(tagsByCategory).map(([category, tags]) => {
            const style = getCategoryStyle(category);
            return (
              <div 
                key={category} 
                className={`${style.gradient} rounded-xl p-4 border-2 ${style.border} transition-all hover:shadow-md`}
              >
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">{style.icon}</span>
                  <h4 className={`text-base font-bold ${style.text} capitalize`}>
                    {category}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const isSelected = formData.experience_tag_ids.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 ${
                          isSelected
                            ? `${style.selectedBg} ${style.selectedText} shadow-lg scale-105`
                            : `${style.bg} ${style.text} hover:shadow-md border-2 ${style.border}`
                        }`}
                        title={tag.description || ''}
                      >
                        {tag.icon && <span className="mr-1.5 text-lg">{tag.icon}</span>}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comment */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Review (optional)
        </h3>
        
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          placeholder="Share your thoughts about this place..."
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {formData.comment?.length || 0} characters
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button type="submit" className="flex-1">
          Submit Review
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
