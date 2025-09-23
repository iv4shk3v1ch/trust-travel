'use client';

import React from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { EnhancedReviewForm } from '@/components/reviews/EnhancedReviewForm';
import Link from 'next/link';

interface ReviewFormData {
  placeId: string;
  placeName: string;
  placeCategory: string;
  ratings: Record<string, number>;
  experienceTags: string[];
  foodPriceRange?: string;
  comment: string;
  photoFile?: File;
  visitDate: string;
}

export default function ReviewsPage() {
  const { loading } = useAuthGuard();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  const handleReviewSubmit = (review: ReviewFormData) => {
    console.log('Review submitted:', review);
    // TODO: Implement review submission to database
    alert('Review submitted successfully! 🎉');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-pink-600 hover:text-pink-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Leave a Review
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your experience to help other travelers discover amazing places
          </p>
        </div>

        {/* Enhanced Review Form */}
        <EnhancedReviewForm
          onSubmit={handleReviewSubmit}
          onCancel={() => window.history.back()}
        />

        {/* Info Section */}
        <div className="mt-8 bg-pink-50 dark:bg-pink-900/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-100 mb-2">
            Why Your Reviews Matter
          </h3>
          <ul className="text-pink-800 dark:text-pink-200 space-y-1 text-sm">
            <li>• Help other travelers discover the best spots</li>
            <li>• Improve our AI recommendations for personalized trip planning</li>
            <li>• Build a community of trusted travel insights</li>
            <li>• Share authentic experiences with fellow adventurers</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
