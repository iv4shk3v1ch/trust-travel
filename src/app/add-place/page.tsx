'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AddPlaceForm } from '@/features/places/components/AddPlaceForm';
import { Button } from '@/shared/components/Button';
import { Header } from '@/shared/components/Header';
import { Footer } from '@/shared/components/Footer';

export default function AddPlacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [addedPlaceId, setAddedPlaceId] = useState<string | null>(null);

  const rawReturnTo = searchParams.get('returnTo');
  const returnTo = rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
    ? rawReturnTo
    : null;
  const prefillName = (searchParams.get('prefillName') || '').trim();

  const handleSuccess = (placeId: string) => {
    setAddedPlaceId(placeId);
    setShowSuccessMessage(true);
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
  };

  const handleCancel = () => {
    router.push(returnTo || '/explore');
  };

  if (showSuccessMessage && addedPlaceId) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-6">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Place Added Successfully! 🎉
              </h2>
              
              <p className="text-gray-600 mb-6">
                Thank you for contributing! Your place will be reviewed by our team.
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
                  onClick={() => router.push('/explore')}
                  variant="outline"
                  className="w-full"
                >
                  Back to Explore
                </Button>

                {returnTo && (
                  <Button
                    onClick={() => router.push(returnTo)}
                    variant="outline"
                    className="w-full"
                  >
                    {returnTo === '/reviews' ? 'Back to Reviews' : 'Back'}
                  </Button>
                )}

                {!returnTo && (
                  <Button
                    onClick={() => router.push('/reviews')}
                    variant="outline"
                    className="w-full"
                  >
                    Leave a Review
                  </Button>
                )}
              </div>
            </div>
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
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Add a New Place
            </h1>
            <p className="text-gray-600">
              Share amazing places with the travel community
            </p>
          </div>

          {/* Add Place Form */}
          <AddPlaceForm 
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            initialName={prefillName}
          />
          
          {/* Info Card */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Contribution Guidelines
                </h3>
                <p className="text-sm text-blue-700">
                  Please ensure the place exists and provide accurate information. All submissions will be reviewed before being made public.
                  You can add up to 2 photos to help other travelers discover this place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
