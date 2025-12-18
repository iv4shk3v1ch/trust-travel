/**
 * PlaceCard - Individual place card for Explore page
 * Shows place info with Like/Skip/Details/Add to Itinerary actions
 */

'use client';

import Image from 'next/image';
import type { RecommendedPlace } from '@/core/services/recommendationEngineV2';

interface PlaceCardProps {
  place: RecommendedPlace;
  isSaved: boolean;
  onLike: () => void;
  onViewDetails: () => void;
  onAddToItinerary?: () => void;
  onWriteReview?: () => void;
  onClick?: () => void;
  hideActions?: boolean; // Hide all action buttons (for favorites view)
}

export default function PlaceCard({ 
  place, 
  isSaved, 
  onLike, 
  onViewDetails, 
  onAddToItinerary, 
  onWriteReview,
  onClick,
  hideActions = false
}: PlaceCardProps) {
  const photoUrl = place.photo_urls?.[0] || '/placeholder-place.svg';
  
  // Get match badge color based on score
  const getMatchBadgeColor = (score: number): string => {
    if (score >= 0.8) return 'from-green-500 to-emerald-600'; // Excellent match
    if (score >= 0.65) return 'from-blue-500 to-purple-600'; // Great match
    if (score >= 0.5) return 'from-orange-400 to-amber-500'; // Good match
    return 'from-gray-400 to-gray-500'; // Okay match
  };
  
  // Generate reason label based on scores
  const generateReasonLabel = (): string => {
    if (place.preference_similarity && place.preference_similarity > 0.7) {
      return '✨ Matches your taste perfectly';
    }
    if (place.social_trust && place.social_trust > 0.5) {
      return '👥 Trusted by people you follow';
    }
    if (place.novelty_score && place.novelty_score > 0.7) {
      return '🆕 Recently added';
    }
    if (place.popularity_score && place.popularity_score > 0.7) {
      return '🔥 Popular spot';
    }
    if (place.average_rating >= 4.5) {
      return '⭐ Highly rated';
    }
    return '📍 Recommended for you';
  };

  const reasonLabel = generateReasonLabel();

  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
      onClick={(e) => {
        // Only trigger onClick if not clicking on action buttons
        const target = e.target as HTMLElement;
        if (!target.closest('button')) {
          onClick?.();
        }
      }}
    >
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        <Image
          src={photoUrl}
          alt={place.name}
          fill
          className="object-cover"
          onError={(e) => {
            // Fallback to placeholder on error
            (e.target as HTMLImageElement).src = '/placeholder-place.svg';
          }}
        />
        
        {/* Match % Badge */}
        {place.final_score && (
          <div className="absolute top-3 right-3">
            <div 
              className={`relative bg-gradient-to-br ${getMatchBadgeColor(place.final_score)} text-white text-center px-3 py-2 rounded-xl shadow-lg font-bold cursor-help`}
              title={`Match Score: ${(place.final_score * 100).toFixed(0)}%\nPreference: ${((place.preference_similarity || 0) * 100).toFixed(0)}%\nQuality: ${((place.quality_score || 0) * 100).toFixed(0)}%\nSocial Trust: ${((place.social_trust || 0) * 100).toFixed(0)}%`}
            >
              <div className="text-2xl leading-none">{(place.final_score * 100).toFixed(0)}%</div>
              <div className="text-[10px] uppercase tracking-wide opacity-90">Match</div>
            </div>
          </div>
        )}
        
        {/* Verified badge */}
        {place.verified && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            ✓ Verified
          </div>
        )}

        {/* Reason label */}
        <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full font-medium backdrop-blur-sm">
          {reasonLabel}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title & Category */}
        <div className="mb-3">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {place.name}
          </h3>
          <p className="text-sm text-gray-500 capitalize">
            {place.category.replace(/-/g, ' ')}
          </p>
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500 text-lg">⭐</span>
            <span className="font-semibold text-gray-900">
              {place.average_rating.toFixed(1)}
            </span>
            <span className="text-gray-400 text-sm">
              ({place.review_count})
            </span>
          </div>

          {place.price_level && (
            <div className="text-gray-600 text-sm">
              {'€'.repeat(place.price_level === 'low' ? 1 : place.price_level === 'medium' ? 2 : 3)}
            </div>
          )}

          {place.indoor_outdoor && (
            <div className="text-gray-600 text-sm capitalize">
              {place.indoor_outdoor === 'outdoor' ? '🌳' : place.indoor_outdoor === 'indoor' ? '🏠' : '🏠🌳'}
            </div>
          )}
        </div>

        {/* Description */}
        {place.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {place.description}
          </p>
        )}

        {/* Tags */}
        {place.matching_tags && place.matching_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {place.matching_tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
              >
                {tag.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons - Only show if not hidden */}
        {!hideActions && (
          <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={onViewDetails}
            className="flex-1 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition flex items-center justify-center gap-2"
            title="View full details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">Details</span>
          </button>

          {onWriteReview && (
            <button
              onClick={onWriteReview}
              className="flex-1 py-2.5 px-3 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-lg transition flex items-center justify-center gap-2"
              title="Write a review"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="hidden sm:inline">Review</span>
            </button>
          )}

          {onAddToItinerary && (
            <button
              onClick={onAddToItinerary}
              className="flex-1 py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-lg transition flex items-center justify-center gap-2"
              title="Add to itinerary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="hidden sm:inline">Add</span>
            </button>
          )}
          
          <button
            onClick={onLike}
            className={`flex-1 py-2.5 px-3 font-medium rounded-lg transition flex items-center justify-center gap-2 ${
              isSaved
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
            title={isSaved ? 'Remove from favorites' : 'Save to favorites'}
          >
            <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
