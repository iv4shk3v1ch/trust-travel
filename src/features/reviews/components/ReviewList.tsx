'use client';

import React from 'react';
import type { ReviewWithTags } from '@/shared/types/review';

interface ReviewListProps {
  reviews: ReviewWithTags[];
  showPlaceName?: boolean;
}

export function ReviewList({ reviews, showPlaceName = false }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              {showPlaceName && review.place && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {review.place.name}
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({review.place.category})
                  </span>
                </h3>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {new Date(review.visit_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                {review.price_range && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                    ${review.price_range}
                  </span>
                )}
              </div>
            </div>

            {/* Rating */}
            {review.overall_rating && (
              <div className="flex items-center gap-1">
                <span className="text-2xl text-yellow-400">★</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {review.overall_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Experience Tags */}
          {review.experience_tags && review.experience_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {review.experience_tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                  title={tag.description || ''}
                >
                  {tag.icon && <span className="mr-1">{tag.icon}</span>}
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Comment */}
          {review.comment && (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {review.comment}
            </p>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Reviewed on {new Date(review.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
