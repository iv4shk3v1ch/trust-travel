'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  PLACE_CATEGORIES,
  FOOD_PRICE_RANGES,
  EXPERIENCE_TAGS,
  getReviewFlowConfig,
  getRatingCategoryDisplayName,
  getTagDisplayName,
  getCategoryDisplayName,
  type PlaceCategory,
  type ExperienceTag,
  type FoodPriceRange,
  type ReviewCategory
} from '@/lib/dataStandards';

// Mock places data - in real app this would come from API/database
const MOCK_PLACES = [
  { id: '1', name: 'Pizzeria Corallo', category: PLACE_CATEGORIES.RESTAURANT },
  { id: '2', name: 'Blue Note Jazz Club', category: PLACE_CATEGORIES.MUSIC_VENUE },
  { id: '3', name: 'Central Park', category: PLACE_CATEGORIES.PARK },
  { id: '4', name: 'Starbucks Coffee', category: PLACE_CATEGORIES.COFFEE_SHOP },
  { id: '5', name: 'Metropolitan Museum', category: PLACE_CATEGORIES.MUSEUM },
  { id: '6', name: 'The Ritz Hotel', category: PLACE_CATEGORIES.HOTEL },
  { id: '7', name: 'Beach Bar Sunset', category: PLACE_CATEGORIES.BAR },
  { id: '8', name: 'St. Peter\'s Basilica', category: PLACE_CATEGORIES.RELIGIOUS_SITE },
];

interface PlaceSearchProps {
  onPlaceSelect: (place: { id: string; name: string; category: PlaceCategory }) => void;
  selectedPlace: { id: string; name: string; category: PlaceCategory } | null;
}

const PlaceSearch: React.FC<PlaceSearchProps> = ({ onPlaceSelect, selectedPlace }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredPlaces = MOCK_PLACES.filter(place =>
    place.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlaceSelect = (place: typeof MOCK_PLACES[0]) => {
    onPlaceSelect(place);
    setSearchQuery(place.name);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <label htmlFor="placeSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Search for a place to review
      </label>
      <Input
        id="placeSearch"
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setShowResults(e.target.value.length > 0);
        }}
        onFocus={() => setShowResults(searchQuery.length > 0)}
        placeholder="Start typing place name..."
        className="w-full"
      />
      
      {showResults && filteredPlaces.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
          {filteredPlaces.map((place) => (
            <button
              key={place.id}
              onClick={() => handlePlaceSelect(place)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
            >
              <div className="font-medium text-gray-900 dark:text-white">{place.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {getCategoryDisplayName(place.category)}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedPlace && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center">
            <div className="text-green-600 dark:text-green-400 mr-2">✓</div>
            <div>
              <div className="font-medium text-green-900 dark:text-green-100">{selectedPlace.name}</div>
              <div className="text-sm text-green-700 dark:text-green-300">
                {getCategoryDisplayName(selectedPlace.category)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface StarRatingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl transition-colors ${
              star <= value 
                ? 'text-yellow-400 hover:text-yellow-500' 
                : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'
            }`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          {value}/5
        </span>
      </div>
    </div>
  );
};

interface ReviewFormData {
  placeId: string;
  placeName: string;
  placeCategory: PlaceCategory;
  ratings: Partial<Record<ReviewCategory, number>>;
  experienceTags: ExperienceTag[];
  foodPriceRange?: FoodPriceRange;
  comment: string;
  photoFile?: File;
  visitDate: string;
}

interface EnhancedReviewFormProps {
  onSubmit: (review: ReviewFormData) => void;
  onCancel?: () => void;
}

export const EnhancedReviewForm: React.FC<EnhancedReviewFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const [selectedPlace, setSelectedPlace] = useState<{ id: string; name: string; category: PlaceCategory } | null>(null);
  const [formData, setFormData] = useState<Partial<ReviewFormData>>({
    ratings: {},
    experienceTags: [],
    comment: '',
    visitDate: new Date().toISOString().split('T')[0]
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewConfig = selectedPlace ? getReviewFlowConfig(selectedPlace.category) : null;

  const handlePlaceSelect = (place: { id: string; name: string; category: PlaceCategory }) => {
    setSelectedPlace(place);
    setFormData(prev => ({
      ...prev,
      placeId: place.id,
      placeName: place.name,
      placeCategory: place.category,
      ratings: {},
      experienceTags: [],
      foodPriceRange: undefined
    }));
  };

  const handleRatingChange = (category: ReviewCategory, rating: number) => {
    setFormData(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [category]: rating }
    }));
  };

  const handleTagToggle = (tag: ExperienceTag) => {
    setFormData(prev => ({
      ...prev,
      experienceTags: prev.experienceTags?.includes(tag)
        ? prev.experienceTags.filter(t => t !== tag)
        : [...(prev.experienceTags || []), tag]
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photoFile: file }));
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlace || !reviewConfig) return;

    // Validate required ratings and tags
    const missingRatings = reviewConfig.ratingCategories.filter(
      category => !formData.ratings?.[category]
    );
    
    if (missingRatings.length > 0) {
      alert('Please provide all required ratings');
      return;
    }

    if (!formData.experienceTags || formData.experienceTags.length === 0) {
      alert('Please select at least one experience tag');
      return;
    }

    setIsSubmitting(true);

    try {
      onSubmit({
        placeId: selectedPlace.id,
        placeName: selectedPlace.name,
        placeCategory: selectedPlace.category,
        ratings: formData.ratings as Partial<Record<ReviewCategory, number>>,
        experienceTags: formData.experienceTags || [],
        foodPriceRange: formData.foodPriceRange,
        comment: formData.comment || '',
        photoFile: formData.photoFile,
        visitDate: formData.visitDate || new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Leave a Review
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Share your experience to help other travelers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Place Search */}
        <PlaceSearch
          onPlaceSelect={handlePlaceSelect}
          selectedPlace={selectedPlace}
        />

        {selectedPlace && reviewConfig && (
          <>
            {/* Ratings Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Rate Your Experience
              </h3>
              {reviewConfig.ratingCategories.map((category) => (
                <StarRating
                  key={category}
                  label={getRatingCategoryDisplayName(category)}
                  value={formData.ratings?.[category] || 0}
                  onChange={(rating) => handleRatingChange(category, rating)}
                />
              ))}
            </div>

            {/* Experience Tags - Mandatory */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                What describes your experience? <span className="text-red-500">*</span>
              </h3>
              
              {/* Social Context */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    EXPERIENCE_TAGS.ROMANTIC,
                    EXPERIENCE_TAGS.FAMILY_FRIENDLY,
                    EXPERIENCE_TAGS.FRIENDS_GROUP,
                    EXPERIENCE_TAGS.SOLO_FRIENDLY
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                        ${formData.experienceTags?.includes(tag)
                          ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-2 border-pink-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border-2 border-transparent'
                        }
                      `}
                    >
                      {getTagDisplayName(tag)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value Proposition */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    EXPERIENCE_TAGS.UNIQUE_ARCHITECTURE,
                    EXPERIENCE_TAGS.EXCEPTIONAL_FOOD,
                    EXPERIENCE_TAGS.CULTURAL_IMMERSION,
                    EXPERIENCE_TAGS.SCENIC_BEAUTY,
                    EXPERIENCE_TAGS.HISTORICAL_SIGNIFICANCE
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                        ${formData.experienceTags?.includes(tag)
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-2 border-blue-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border-2 border-transparent'
                        }
                      `}
                    >
                      {getTagDisplayName(tag)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Atmosphere & Experience */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    EXPERIENCE_TAGS.RELAXING,
                    EXPERIENCE_TAGS.ENERGETIC,
                    EXPERIENCE_TAGS.INTIMATE,
                    EXPERIENCE_TAGS.AUTHENTIC_LOCAL
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                        ${formData.experienceTags?.includes(tag)
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-2 border-purple-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border-2 border-transparent'
                        }
                      `}
                    >
                      {getTagDisplayName(tag)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Practical Considerations */}
              <div className="mb-2">
                <div className="flex flex-wrap gap-2">
                  {[
                    EXPERIENCE_TAGS.BUDGET_FRIENDLY,
                    EXPERIENCE_TAGS.LUXURY,
                    EXPERIENCE_TAGS.CROWD_LEVEL_LOW,
                    EXPERIENCE_TAGS.CROWD_LEVEL_HIGH,
                    EXPERIENCE_TAGS.QUICK_VISIT,
                    EXPERIENCE_TAGS.EXTENDED_STAY
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                        ${formData.experienceTags?.includes(tag)
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-2 border-green-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border-2 border-transparent'
                        }
                      `}
                    >
                      {getTagDisplayName(tag)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Range for Food Places */}
            {reviewConfig.requiresPrice && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  {reviewConfig.priceLabel}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {Object.values(FOOD_PRICE_RANGES).map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, foodPriceRange: range }))}
                      className={`
                        px-2 py-2 rounded-lg text-xs font-medium transition-colors text-center
                        ${formData.foodPriceRange === range
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-2 border-green-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border-2 border-transparent'
                        }
                      `}
                    >
                      €{range.replace('RANGE_', '').replace('_PLUS', '+')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Add a Photo (Optional)
              </h3>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                {photoPreview ? (
                  <div className="text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="mx-auto max-h-48 rounded-lg mb-3"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setFormData(prev => ({ ...prev, photoFile: undefined }));
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      📷 Choose Photo
                    </label>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                      Share a photo of your experience
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Tell us more (Optional)
              </h3>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share details about your experience..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-pink-500 focus:border-transparent
                         placeholder-gray-500 dark:placeholder-gray-400
                         resize-none min-h-[100px]"
              />
            </div>

            {/* Visit Date */}
            <div>
              <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                When did you visit?
              </label>
              <Input
                id="visitDate"
                type="date"
                value={formData.visitDate}
                onChange={(e) => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1 bg-pink-600 hover:bg-pink-700"
            disabled={isSubmitting || !selectedPlace || !reviewConfig}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedReviewForm;
