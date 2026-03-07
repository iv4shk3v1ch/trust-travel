'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import type { ReviewFormData, ExperienceTag } from '@/shared/types/review';
import type { PlaceWithType } from '@/shared/types/place';
import { PRICE_RANGES } from '@/shared/types/review';
import { getExperienceTags } from '@/core/database/reviewsDatabase';
import { getPlaceById, searchPlaces } from '@/core/database/placesDatabase';
import { 
  TAG_GROUP_LABELS,
  TAG_GROUPS,
  EXPERIENCE_TAG_LABELS,
  getRecommendedTags,
  isFoodCategory,
  type PlaceCategory
} from '@/shared/utils/dataStandards';

interface ReviewFormProps {
  onSubmit: (review: ReviewFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ReviewFormData>;
}

const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_LIMIT = 50;

export function ReviewForm({ onSubmit, onCancel, initialData }: ReviewFormProps) {
  const [searchResults, setSearchResults] = useState<PlaceWithType[]>([]);
  const [experienceTags, setExperienceTags] = useState<ExperienceTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [prefilledPlaceMissing, setPrefilledPlaceMissing] = useState(false);
  const searchRequestVersion = useRef(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  const [formData, setFormData] = useState<ReviewFormData>({
    place_id: initialData?.place_id || '',
    overall_rating: initialData?.overall_rating || 3,
    visit_date: initialData?.visit_date || new Date().toISOString().split('T')[0],
    experience_tag_ids: initialData?.experience_tag_ids || [],
    price_range: initialData?.price_range || undefined,
    comment: initialData?.comment || ''
  });

  const [selectedPlace, setSelectedPlace] = useState<PlaceWithType | null>(null);
  const [showRecommended, setShowRecommended] = useState(false);

  // Quick preset configurations
  const quickPresets = [
    {
      name: '💑 Date Night',
      tags: ['date', 'romantic', 'evening'],
      description: 'Perfect for couples'
    },
    {
      name: '👨‍👩‍👧‍👦 Family Fun',
      tags: ['family', 'afternoon', 'calm'],
      description: 'Great for families'
    },
    {
      name: '⚡ Quick Bite',
      tags: ['quick_stop', 'food', 'solo'],
      description: 'Fast and easy'
    },
    {
      name: '🎉 Night Out',
      tags: ['friends', 'lively', 'late_night', 'drinks'],
      description: 'Party with friends'
    },
    {
      name: '💰 Budget Explorer',
      tags: ['budget_friendly', 'authentic_local', 'solo'],
      description: 'Affordable adventures'
    },
    {
      name: '📸 Tourist Must-See',
      tags: ['scenic_view', 'morning', 'quick_stop'],
      description: 'Photo opportunities'
    }
  ];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch experience tags
      const tags = await getExperienceTags();
      setExperienceTags(tags);

      // If place_id is pre-selected, load the place directly.
      if (initialData?.place_id) {
        const place = await getPlaceById(initialData.place_id);
        if (place) {
          setSelectedPlace(place);
          setSearchTerm(place.name);
        } else {
          setPrefilledPlaceMissing(true);
          setFormData(prev => ({ ...prev, place_id: '' }));
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserTyping) {
      return;
    }

    const normalizedQuery = searchTerm.trim();
    if (normalizedQuery.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    const requestVersion = ++searchRequestVersion.current;
    setSearchLoading(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaces(normalizedQuery, undefined, SEARCH_LIMIT);
        if (requestVersion !== searchRequestVersion.current) {
          return;
        }
        setSearchResults(results);
      } catch (error) {
        if (requestVersion !== searchRequestVersion.current) {
          return;
        }
        console.error('Error searching places:', error);
        setSearchError('Failed to search places. Please try again.');
      } finally {
        if (requestVersion === searchRequestVersion.current) {
          setSearchLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [isUserTyping, searchTerm]);

  const handlePlaceChange = (place: PlaceWithType) => {
    setSelectedPlace(place);
    setFormData(prev => ({ ...prev, place_id: place.id }));
    setSearchTerm(place.name);
    setIsUserTyping(false);
    setSearchError(null);
    setSearchResults([]);
    setPrefilledPlaceMissing(false);
    setShowPlaceDropdown(false);
  };

  const clearSelectedPlace = (keepQuery: boolean) => {
    const currentName = selectedPlace?.name || '';
    setSelectedPlace(null);
    setFormData(prev => ({ ...prev, place_id: '' }));
    setSearchTerm(keepQuery ? currentName : '');
    setIsUserTyping(true);
    setShowPlaceDropdown(true);
    setPrefilledPlaceMissing(false);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const handleTagToggle = (tagId: string) => {
    const currentTags = formData.experience_tag_ids;
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    
    setFormData({ ...formData, experience_tag_ids: newTags });
  };

  // Apply a quick preset
  const applyPreset = (presetTags: string[]) => {
    // Find tag IDs that match the preset slugs
    const tagIds = experienceTags
      .filter(tag => presetTags.includes(tag.slug))
      .map(tag => tag.id);
    
    setFormData({ ...formData, experience_tag_ids: tagIds });
  };

  // Get recommended tags based on place category
  const getRecommendedTagIds = (): string[] => {
    if (!selectedPlace?.place_type?.name) return [];
    
    const recommendedTagValues = getRecommendedTags(selectedPlace.place_type.name as PlaceCategory);
    const recommendedSet = new Set<string>(recommendedTagValues);
    return experienceTags
      .filter(tag => recommendedSet.has(tag.slug))
      .map(tag => tag.id);
  };

  // Check if should show price range (only for food/drink places)
  const shouldShowPriceRange = (): boolean => {
    if (!selectedPlace?.place_type?.name) return true;
    return isFoodCategory(selectedPlace.place_type.name as PlaceCategory);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      {/* Place Selection */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Place <span className="text-red-500">*</span>
            </label>
            
            {/* Searchable dropdown */}
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  setShowPlaceDropdown(true);
                  setIsUserTyping(true);
                  setSearchError(null);

                  if (selectedPlace) {
                    setSelectedPlace(null);
                    setFormData(prev => ({ ...prev, place_id: '' }));
                  }
                  if (!value.trim()) {
                    setSearchResults([]);
                  }
                }}
                onFocus={() => setShowPlaceDropdown(true)}
                placeholder="Search for a place..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                required
              />

              {/* Dropdown list */}
              {showPlaceDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                  {isUserTyping && searchTerm.trim().length < MIN_SEARCH_LENGTH && (
                    <div className="px-4 py-3 text-sm text-gray-600">
                      Type at least {MIN_SEARCH_LENGTH} characters to search.
                    </div>
                  )}

                  {searchLoading && (
                    <div className="px-4 py-3 text-sm text-gray-600">
                      Searching places...
                    </div>
                  )}

                  {!searchLoading && searchError && (
                    <div className="px-4 py-3 text-sm text-red-600">
                      {searchError}
                    </div>
                  )}

                  {!searchLoading && !searchError && searchResults.length > 0 && searchResults.map(place => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handlePlaceChange(place)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-900 ${
                        formData.place_id === place.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium">{place.name}</div>
                      <div className="text-xs text-gray-600">
                        {place.place_type?.icon} {place.place_type?.name || 'Unknown type'} - {place.city || 'Unknown city'}
                      </div>
                      {place.address && (
                        <div className="text-xs text-gray-500 truncate">
                          {place.address}
                        </div>
                      )}
                    </button>
                  ))}

                  {!searchLoading && !searchError && isUserTyping && searchTerm.trim().length >= MIN_SEARCH_LENGTH && searchResults.length === 0 && (
                    <div className="px-4 py-3 text-sm text-yellow-700">
                      <div>No places found for this query.</div>
                      <a
                        href={`/add-place?returnTo=${encodeURIComponent('/reviews')}&prefillName=${encodeURIComponent(searchTerm.trim())}`}
                        className="inline-flex mt-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Add this place
                      </a>
                    </div>
                  )}
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
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1">
                  Selected: {selectedPlace.name} ({selectedPlace.city || 'Unknown city'})
                </span>
                <button
                  type="button"
                  onClick={() => clearSelectedPlace(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => clearSelectedPlace(false)}
                  className="text-gray-600 hover:text-gray-700 font-medium"
                >
                  Clear
                </button>
              </div>
            )}

            {prefilledPlaceMissing && (
              <p className="mt-1 text-xs text-yellow-700">
                The pre-selected place was not found. Please search and select a place.
              </p>
            )}

          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
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
                  : 'text-gray-300'
              }`}
            >
              ★
            </button>
          ))}
          <span className="ml-4 text-lg font-medium text-gray-700">
            {formData.overall_rating}/5
          </span>
        </div>
      </div>

      {/* Price Range - Only show for food/drink places */}
      {shouldShowPriceRange() && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Price Range <span className="text-gray-400">(per person)</span>
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            How much did you spend per person approximately?
          </p>
          
          <select
            value={formData.price_range || ''}
            onChange={(e) => setFormData({ ...formData, price_range: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          >
            <option value="">Select price range...</option>
            {PRICE_RANGES.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Experience Tags - Improved UX */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Experience Tags
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              What made this place special?
            </p>
          </div>
          {selectedPlace && (
            <button
              type="button"
              onClick={() => setShowRecommended(!showRecommended)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showRecommended ? '✨ Hide' : '✨ Suggest'} 
            </button>
          )}
        </div>

        {/* Quick Presets */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Quick Presets
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickPresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset.tags)}
                className="group p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="font-medium text-sm text-gray-900 group-hover:text-blue-600">
                  {preset.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recommended Tags */}
        {showRecommended && selectedPlace && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-2">
              ✨ Recommended for {selectedPlace.place_type?.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {getRecommendedTagIds().map(tagId => {
                const tag = experienceTags.find(t => t.id === tagId);
                if (!tag) return null;
                
                const isSelected = formData.experience_tag_ids.includes(tagId);
                return (
                  <button
                    key={tagId}
                    type="button"
                    onClick={() => handleTagToggle(tagId)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    {tag.icon && <span className="mr-1">{tag.icon}</span>}
                    {EXPERIENCE_TAG_LABELS[tag.slug] || tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Grouped Tags */}
        <div className="space-y-4">
          {Object.entries(TAG_GROUPS).map(([groupKey, groupTags]) => {
            // Filter to only show tags that exist in database
            const availableTags = experienceTags.filter(tag => 
              (groupTags as readonly string[]).includes(tag.slug)
            );
            
            if (availableTags.length === 0) return null;

            return (
              <div key={groupKey}>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {TAG_GROUP_LABELS[groupKey as keyof typeof TAG_GROUP_LABELS]}
                  </h4>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => {
                    const isSelected = formData.experience_tag_ids.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                        title={tag.description || ''}
                      >
                        {tag.icon && <span className="mr-1.5">{tag.icon}</span>}
                        {EXPERIENCE_TAG_LABELS[tag.slug] || tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Count */}
        {formData.experience_tag_ids.length > 0 && (
          <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ {formData.experience_tag_ids.length} tag{formData.experience_tag_ids.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>

      {/* Comment */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Your Review (optional)
        </h3>
        
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          placeholder="Share your thoughts about this place..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 resize-none"
        />
        <p className="mt-2 text-sm text-gray-500">
          {formData.comment?.length || 0} characters
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1">
          Submit Review
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
