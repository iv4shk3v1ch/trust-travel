'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  PLACE_CATEGORIES,
  getCategoryDisplayName,
  type PlaceCategory 
} from '@/lib/dataStandards';
import { saveNewPlace, type AddPlaceFormData } from '@/lib/placesDatabase';

interface AddPlaceFormProps {
  onSuccess?: (placeId: string) => void;
  onCancel?: () => void;
}

export const AddPlaceForm: React.FC<AddPlaceFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<AddPlaceFormData>({
    name: '',
    category: PLACE_CATEGORIES.RESTAURANT, // Default to restaurant
    city: '',
    country: '',
    address: '',
    workingHours: '',
    website: '',
    phone: '',
    photos: [],
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);

  const handleInputChange = (field: keyof AddPlaceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (category: PlaceCategory) => {
    setFormData(prev => ({ ...prev, category }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 2) {
      alert('You can upload maximum 2 photos');
      return;
    }

    setFormData(prev => ({ ...prev, photos: files }));

    // Generate previews
    const previews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push(e.target?.result as string);
        if (previews.length === files.length) {
          setPhotoPreview(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos?.filter((_, i) => i !== index) || [];
    const newPreviews = photoPreview.filter((_, i) => i !== index);
    
    setFormData(prev => ({ ...prev, photos: newPhotos }));
    setPhotoPreview(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('Place name is required');
      return;
    }
    
    if (!formData.city.trim()) {
      alert('City is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const placeId = await saveNewPlace(formData);
      console.log('✅ Place saved successfully:', placeId);
      
      // Reset form
      setFormData({
        name: '',
        category: PLACE_CATEGORIES.RESTAURANT,
        city: '',
        country: '',
        address: '',
        workingHours: '',
        website: '',
        phone: '',
        photos: [],
        description: '',
      });
      setPhotoPreview([]);
      
      onSuccess?.(placeId);
    } catch (error) {
      console.error('Error saving place:', error);
      alert('Failed to save place. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Add a New Place
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Help the community discover amazing places by adding a new location
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Place Name */}
        <div>
          <label htmlFor="placeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Place Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="placeName"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter the name of the place"
            required
            className="w-full"
          />
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(PLACE_CATEGORIES).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryChange(category)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center
                  ${formData.category === category
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border-2 border-transparent'
                  }
                `}
              >
                {getCategoryDisplayName(category)}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <Input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="City name"
              required
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Country
            </label>
            <Input
              id="country"
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="Country name"
              className="w-full"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Address
          </label>
          <Input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Full address (optional)"
            className="w-full"
          />
        </div>

        {/* Optional Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="workingHours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Working Hours
            </label>
            <Input
              id="workingHours"
              type="text"
              value={formData.workingHours}
              onChange={(e) => handleInputChange('workingHours', e.target.value)}
              placeholder="e.g., 9:00-18:00"
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://..."
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1234567890"
              className="w-full"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief description of the place (optional)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Photos (Optional - Maximum 2)
          </label>
          
          {photoPreview.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <label htmlFor="photos" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Click to upload photos
                    </span>
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG up to 10MB each
                    </span>
                  </label>
                  <input
                    id="photos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {photoPreview.map((preview, index) => (
                  <div key={index} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={preview} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              {photoPreview.length < 2 && (
                <div className="text-center">
                  <label htmlFor="morePhotos" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Another Photo
                  </label>
                  <input
                    id="morePhotos"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="sr-only"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? 'Adding Place...' : 'Add Place'}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddPlaceForm;
