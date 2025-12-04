/**
 * PlaceCard - Individual place card for Explore page
 * Shows place info with Like/Skip/Details actions
 */

'use client';

import Image from 'next/image';
import type { RecommendedPlace } from '@/core/services/recommendationEngineV2';

interface PlaceCardProps {
  place: RecommendedPlace;
  isSaved: boolean;
  onLike: () => void;
  onSkip: () => void;
  onViewDetails: () => void;
}

export default function PlaceCard({ place, isSaved, onLike, onSkip, onViewDetails }: PlaceCardProps) {
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
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
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

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            <span className="text-lg">✖️</span>
            Skip
          </button>
          
          <button
            onClick={onViewDetails}
            className="flex-1 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            <span className="text-lg">👁️</span>
            Details
          </button>
          
          <button
            onClick={onLike}
            className={`flex-1 py-2.5 px-4 font-medium rounded-lg transition flex items-center justify-center gap-2 ${
              isSaved
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            <span className="text-lg">{isSaved ? '❤️' : '🤍'}</span>
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
