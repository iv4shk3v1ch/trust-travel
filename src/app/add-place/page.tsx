'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddPlaceForm from '@/components/forms/AddPlaceForm';
import { Button } from '@/components/ui/Button';

export default function AddPlacePage() {
  const router = useRouter();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [addedPlaceId, setAddedPlaceId] = useState<string | null>(null);

  const handleSuccess = (placeId: string) => {
    setAddedPlaceId(placeId);
    setShowSuccessMessage(true);
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  if (showSuccessMessage && addedPlaceId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Place Added Successfully! 🎉
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for contributing to our community! Your place has been added and will be reviewed by our team.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowSuccessMessage(false);
                  setAddedPlaceId(null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Another Place
              </Button>
              
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="w-full"
              >
                Back to Dashboard
              </Button>
              
              <Button
                onClick={() => router.push('/reviews')}
                variant="outline"
                className="w-full"
              >
                Leave a Review
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Add a New Place
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Share amazing places with the travel community
          </p>
        </div>

        {/* Add Place Form */}
        <AddPlaceForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
        
        {/* Info Card */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Contribution Guidelines
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Please ensure the place exists and provide accurate information. All submissions will be reviewed before being made public.
                You can add up to 2 photos to help other travelers discover this place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
