'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import type { PlaceFormData, PlaceType } from '@/shared/types/place';
import { PRICE_LEVELS, LOCATION_TYPES } from '@/shared/types/place';
import { getPlaceTypes, saveNewPlace } from '@/core/database/placesDatabase';

interface AddPlaceFormProps {
  onSuccess?: (placeId: string) => void;
  onCancel?: () => void;
}

export function AddPlaceForm({ onSuccess, onCancel }: AddPlaceFormProps) {
  const [placeTypes, setPlaceTypes] = useState<PlaceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState<PlaceFormData>({
    name: '',
    place_type_id: '',
    city: '',
    country: 'Italy',
    address: '',
    latitude: undefined,
    longitude: undefined,
    phone: '',
    website: '',
    working_hours: '',
    description: '',
    photos: undefined,
    price_level: undefined,
    indoor_outdoor: 'mixed'
  });

  useEffect(() => {
    loadPlaceTypes();
  }, []);

  const loadPlaceTypes = async () => {
    try {
      const types = await getPlaceTypes();
      console.log('Loaded place types:', types);
      setPlaceTypes(types);
    } catch (error) {
      console.error('Error loading place types:', error);
      setError('Failed to load place types');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, photos: Array.from(e.target.files) });
    }
  };

  // Filter place types based on search
  const filteredPlaceTypes = placeTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected place type name
  const selectedPlaceType = placeTypes.find(t => t.id === formData.place_type_id);

  // Geocode address to get coordinates automatically
  const geocodeAddress = async (address: string, city: string, country: string) => {
    const fullAddress = [address, city, country]
      .filter(Boolean)
      .join(', ');

    if (!fullAddress.trim() || !city) {
      return; // Need at least a city
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
        {
          headers: {
            'User-Agent': 'TrustTravel/1.0' // Required by Nominatim
          }
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        }));
        console.log(`✅ Auto-geocoded: ${lat}, ${lon}`);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      // Silently fail - coordinates are optional
    }
  };

  // Auto-geocode when address changes (with debounce)
  useEffect(() => {
    if (!formData.city) return;
    
    const timeoutId = setTimeout(() => {
      geocodeAddress(formData.address || '', formData.city || '', formData.country || 'Italy');
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.address, formData.city, formData.country]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validation
      if (!formData.name || !formData.place_type_id) {
        throw new Error('Name and place type are required');
      }

      // Save place
      const placeId = await saveNewPlace(formData);
      
      if (onSuccess) {
        onSuccess(placeId);
      } else {
        alert('Place added successfully! 🎉');
        // Reset form
        setFormData({
          name: '',
          place_type_id: '',
          city: '',
          country: 'Italy',
          address: '',
          latitude: undefined,
          longitude: undefined,
          phone: '',
          website: '',
          working_hours: '',
          description: '',
          photos: undefined,
          price_level: undefined,
          indoor_outdoor: 'mixed'
        });
      }
    } catch (error) {
      console.error('Error saving place:', error);
      setError(error instanceof Error ? error.message : 'Failed to save place');
    } finally {
      setSubmitting(false);
    }
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
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Basic Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Place Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Trevi Fountain, Osteria Da Fortunata"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Place Type <span className="text-red-500">*</span>
            </label>
            
            {/* Custom searchable dropdown */}
            <div className="relative">
              <input
                type="text"
                value={selectedPlaceType ? `${selectedPlaceType.icon || ''} ${selectedPlaceType.name}`.trim() : searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) {
                    setFormData({ ...formData, place_type_id: '' });
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search for place type... (e.g., Restaurant, Museum, Park)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                required
              />
              
              {/* Dropdown list */}
              {showDropdown && filteredPlaceTypes.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredPlaceTypes.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, place_type_id: type.id });
                        setSearchTerm('');
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        formData.place_type_id === type.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                      }`}
                    >
                      <span className="font-medium">
                        {type.icon && `${type.icon} `}{type.name}
                      </span>
                      {type.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          - {type.description}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Click outside to close */}
              {showDropdown && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)}
                />
              )}
            </div>
            
            {placeTypes.length === 0 && !loading && (
              <p className="mt-1 text-sm text-red-600">No place types found. Please check your database.</p>
            )}
            {selectedPlaceType && (
              <p className="mt-1 text-xs text-gray-500">
                Selected: {selectedPlaceType.icon} {selectedPlaceType.name}
              </p>
            )}
            {!selectedPlaceType && searchTerm && filteredPlaceTypes.length === 0 && (
              <p className="mt-1 text-xs text-yellow-600">
                No matches found. Try different keywords.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about this place..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Location
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <Input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Rome"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <Input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., Italy"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full street address"
            />
            <p className="mt-1 text-xs text-gray-500">
              💡 Coordinates will be automatically detected from the address
            </p>
          </div>
        </div>
      </div>

      {/* Contact & Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Contact & Details
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+39 06 1234 5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Working Hours
            </label>
            <Input
              type="text"
              value={formData.working_hours}
              onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
              placeholder="e.g., Mon-Fri 9:00-18:00"
            />
          </div>
        </div>
      </div>

      {/* Attributes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Attributes
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price Level
            </label>
            <select
              value={formData.price_level || ''}
              onChange={(e) => setFormData({ ...formData, price_level: e.target.value as 'low' | 'medium' | 'high' | undefined })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Not specified</option>
              {PRICE_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label} - {level.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Indoor/Outdoor
            </label>
            <div className="flex gap-3">
              {LOCATION_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, indoor_outdoor: type.value })}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.indoor_outdoor === type.value
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Photos
        </h3>
        
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You can select multiple photos (JPG, PNG, WebP)
          </p>
          {formData.photos && formData.photos.length > 0 && (
            <p className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
              {formData.photos.length} photo(s) selected
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? 'Adding Place...' : 'Add Place'}
        </Button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
