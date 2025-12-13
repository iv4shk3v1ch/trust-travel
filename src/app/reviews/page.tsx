'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { saveReview } from '@/core/database/reviewsDatabase';
import { supabase } from '@/core/database/supabase';
import type { ReviewFormData } from '@/shared/types/review';
import Link from 'next/link';

export default function ReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Get pre-selected place from URL params
  const preSelectedPlaceId = searchParams.get('placeId');
  const preSelectedPlaceName = searchParams.get('placeName');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleReviewSubmit = async (review: ReviewFormData) => {
    setSubmitting(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        alert('Please log in to submit a review');
        return;
      }

      const result = await saveReview(review, user.id);

      if (result.success) {
        alert('Review submitted successfully! 🎉');
        window.location.href = '/explore';
      } else {
        alert(`Failed to submit review: ${result.error}`);
      }

    } catch (error) {
      console.error('Error submitting review:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header - Sticky Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link 
            href="/explore" 
            className="text-gray-600 hover:text-blue-600 transition"
            title="Back to Explore"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {preSelectedPlaceName || 'Write a Review'}
          </h1>
        </div>
      </div>

      {/* Compact Form Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {submitting ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Submitting your review...</p>
          </div>
        ) : (
          <ReviewForm
            onSubmit={handleReviewSubmit}
            onCancel={() => window.history.back()}
            initialData={preSelectedPlaceId ? { place_id: preSelectedPlaceId } : undefined}
          />
        )}
      </div>
    </div>
  );
}
