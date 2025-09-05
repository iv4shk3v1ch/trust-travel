'use client';

import React, { useState } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ReviewFormData, REVIEW_TAGS } from '@/types/review';

export default function ReviewsPage() {
  const { loading } = useAuthGuard();
  const [formData, setFormData] = useState<ReviewFormData>({
    placeName: '',
    rating: 0,
    visitDate: '',
    tags: [],
    reviewText: '',
    photos: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // TODO: Implement review submission to database
      console.log('Submitting review:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Review submitted successfully!');
      
      // Reset form
      setFormData({
        placeName: '',
        rating: 0,
        visitDate: '',
        tags: [],
        reviewText: '',
        photos: []
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-pink-600 hover:text-pink-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Leave a Review
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your experience to help other travelers discover amazing places in Trento
          </p>
        </div>

        {/* Review Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Place Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Place Name *
              </label>
              <input
                type="text"
                required
                value={formData.placeName}
                onChange={(e) => setFormData(prev => ({ ...prev, placeName: e.target.value }))}
                placeholder="e.g., Duomo di Trento, Castello del Buonconsiglio..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating *
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className={`text-3xl transition-colors ${
                      star <= formData.rating
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    } hover:text-yellow-400`}
                  >
                    ⭐
                  </button>
                ))}
                <span className="ml-3 text-gray-600 dark:text-gray-400 self-center">
                  {formData.rating === 0 ? 'Select a rating' : `${formData.rating} star${formData.rating !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Visit Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visit Date *
              </label>
              <input
                type="date"
                required
                value={formData.visitDate}
                onChange={(e) => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {REVIEW_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-900'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Review (Optional)
              </label>
              <textarea
                value={formData.reviewText}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewText: e.target.value }))}
                placeholder="Share details about your experience, what you liked, tips for other travelers..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-vertical"
              />
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Photos (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setFormData(prev => ({ ...prev, photos: Array.from(e.target.files || []) }))}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="text-gray-400 mb-2">📸</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Click to upload photos or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    PNG, JPG up to 10MB each
                  </p>
                </label>
                {formData.photos.length > 0 && (
                  <div className="mt-3 text-sm text-pink-600">
                    {formData.photos.length} photo{formData.photos.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={!formData.placeName || formData.rating === 0 || !formData.visitDate || isSubmitting}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>

          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-pink-50 dark:bg-pink-900/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-100 mb-2">
            Why Your Reviews Matter
          </h3>
          <ul className="text-pink-800 dark:text-pink-200 space-y-1 text-sm">
            <li>• Help other travelers discover the best spots in Trento</li>
            <li>• Improve our AI recommendations for personalized trip planning</li>
            <li>• Build a community of trusted travel insights</li>
            <li>• Share authentic experiences with fellow adventurers</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
