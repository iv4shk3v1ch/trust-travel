'use client';

import React from 'react';
import { RecommendedPlace } from '@/core/services/recommender';
import { TravelPlan } from '@/shared/types/travel-plan';

interface RecommendationsDisplayProps {
  recommendations: RecommendedPlace[];
  travelPlan: TravelPlan;
  onBackToForm: () => void;
}

export const RecommendationsDisplay: React.FC<RecommendationsDisplayProps> = ({
  recommendations,
  travelPlan,
  onBackToForm
}) => {
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'restaurant': '🍽️',
      'bar': '🍺',
      'coffee-shop': '☕',
      'fast-food': '🍕',
      'hotel': '🏨',
      'museum': '🏛️',
      'theater': '🎭',
      'historical-site': '🏰',
      'park': '🌳',
      'viewpoint': '📸',
      'hiking-trail': '🥾',
      'shopping': '🛍️',
      'attraction': '🎪'
    };
    return icons[category] || '📍';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.7) return 'Perfect match';
    if (confidence >= 0.4) return 'Good match';
    return 'Might interest you';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your Trento Recommendations 🎯
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Based on your travel plan, here are {recommendations.length} places we think you&apos;ll love
              {recommendations.some(r => r.trusted_reviewers_count > 0) && (
                <span className="block mt-1 text-sm text-blue-600 dark:text-blue-400">
                  ✨ Some places are boosted by reviews from people you trust
                </span>
              )}
            </p>
          </div>
          <button 
            onClick={onBackToForm}
            className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            ← Modify Plan
          </button>
        </div>

        {/* Travel Plan Summary */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
              📍 {travelPlan.destination.area.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
              👥 {travelPlan.travelType.charAt(0).toUpperCase() + travelPlan.travelType.slice(1)}
            </span>
            <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
              📅 {travelPlan.dates.type === 'now' ? 'Right Now' : 'Custom Dates'}
            </span>
            <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
              🎯 {travelPlan.experienceTags.length > 0 
                ? `${travelPlan.experienceTags.length} experience preferences`
                : 'Open to all experiences'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      {recommendations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No recommendations found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your travel preferences or check back later as we add more places.
          </p>
          <button 
            onClick={onBackToForm}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Modify Travel Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((place) => (
            <div 
              key={place.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Place Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getCategoryIcon(place.category)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {place.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {place.category.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                  {place.verified && (
                    <span className="text-blue-500 dark:text-blue-400" title="Verified">
                      ✓
                    </span>
                  )}
                </div>

                {/* Match Confidence */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Match Confidence
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-semibold ${getConfidenceColor(place.tag_confidence)}`}>
                        {getConfidenceText(place.tag_confidence)}
                      </span>
                      {place.social_trust_boost > 0 && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                          +{Math.round(place.social_trust_boost * 100)}% trust
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${place.tag_confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Rating and Reviews */}
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {place.average_rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {place.review_count} review{place.review_count !== 1 ? 's' : ''}
                  </span>
                  {place.trusted_reviewers_count > 0 && (
                    <div className="flex items-center space-x-1">
                      <span className="text-blue-500 dark:text-blue-400">👥</span>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {place.trusted_reviewers_count} trusted
                      </span>
                    </div>
                  )}
                </div>

                {/* Matching Tags */}
                {place.matching_tags.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Matches your preferences:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {place.matching_tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag}
                          className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full"
                        >
                          {tag.replace('-', ' ')}
                        </span>
                      ))}
                      {place.matching_tags.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{place.matching_tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {place.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {place.description}
                  </p>
                )}

                {/* Address */}
                {place.address && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    📍 {place.address}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {place.website && (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Visit Website
                    </a>
                  )}
                  <button 
                    onClick={() => {
                      // TODO: Navigate to place details page
                      console.log('View details for:', place.name);
                    }}
                    className="flex-1 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
