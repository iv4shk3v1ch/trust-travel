'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext'; // ✅ Use AuthContext
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { saveReview } from '@/core/database/reviewsDatabase';
import { supabase } from '@/core/database/supabase';
import type { ReviewFormData } from '@/shared/types/review';
import Link from 'next/link';

export default function ReviewsPage() {
  const router = useRouter();
  const { user, loading } = useAuth(); // ✅ Use AuthContext
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

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

  const handleReviewSubmit = async (review: ReviewFormData) => {
    setSubmitting(true);
    
    try {
      console.log('Starting review submission...');
      console.log('Review data:', review);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Authentication error:', userError);
        alert('Please log in to submit a review');
        return;
      }

      console.log('User authenticated:', user.id);

      // Save to database
      const result = await saveReview(review, user.id);
      console.log('saveReview result:', result);

      if (result.success) {
        console.log('Review saved successfully!');
        alert('Review submitted successfully! 🎉');
        window.location.href = '/dashboard';
      } else {
        console.error('Review save failed:', result.error);
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

        {/* Review Form */}
        {submitting ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Submitting your review...</p>
          </div>
        ) : (
          <ReviewForm
            onSubmit={handleReviewSubmit}
            onCancel={() => window.history.back()}
          />
        )}

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
