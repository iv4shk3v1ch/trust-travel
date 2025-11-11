import React, { useRef, useEffect } from 'react';
import { useInteractionTracker } from '@/core/services/interactionTracker';
import type { PlaceWithType } from '@/shared/types/place';

interface PlaceCardProps {
  place: PlaceWithType;
  position: number; // Position in the list (for analytics)
  source: string;   // 'recommendation', 'search', 'trending', etc.
  algorithm?: string; // Which recommendation algorithm
  score?: number;     // Recommendation score
}

export function PlaceCard({ place, position, source, algorithm, score }: PlaceCardProps) {
  const { clickPlace, viewPlace, savePlace, likePlace, dislikePlace, hidePlace } = useInteractionTracker();
  const cardRef = useRef<HTMLDivElement>(null);
  const viewTracked = useRef(false);

  // Track when card comes into view
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !viewTracked.current) {
            // Card is visible - track view
            viewPlace(place.id, {
              position,
              source,
              algorithm,
              recommendation_score: score,
              page: 'place-list'
            });
            viewTracked.current = true;
          }
        });
      },
      { threshold: 0.5 } // Track when 50% visible
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [place.id, position, source, algorithm, score, viewPlace]);

  const handleClick = () => {
    clickPlace(place.id, position, source, {
      algorithm,
      recommendation_score: score,
      card_area: 'main'
    });
    // Navigate to place detail
    window.location.href = `/places/${place.id}`;
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    savePlace(place.id, {
      position,
      source,
      algorithm,
      click_area: 'save_button'
    });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    likePlace(place.id, {
      position,
      source,
      algorithm,
      explicit_feedback: true
    });
  };

  const handleDislike = (e: React.MouseEvent) => {
    e.stopPropagation();
    dislikePlace(place.id, {
      position,
      source,
      algorithm,
      explicit_feedback: true
    });
  };

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    hidePlace(place.id, 'user_choice', {
      position,
      source,
      algorithm
    });
  };

  return (
    <div 
      ref={cardRef}
      className="place-card border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{place.name}</h3>
        <div className="flex gap-2">
          <button 
            onClick={handleLike}
            className="text-green-600 hover:text-green-800"
            title="Like this place"
          >
            👍
          </button>
          <button 
            onClick={handleDislike}
            className="text-red-600 hover:text-red-800"
            title="Don't like this place"
          >
            👎
          </button>
          <button 
            onClick={handleSave}
            className="text-blue-600 hover:text-blue-800"
            title="Save for later"
          >
            💾
          </button>
          <button 
            onClick={handleHide}
            className="text-gray-600 hover:text-gray-800"
            title="Don't show again"
          >
            ✕
          </button>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-2">{place.place_type?.name || 'Unknown'}</p>
      {place.description && (
        <p className="text-sm text-gray-700">{place.description}</p>
      )}
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400">
          Pos: {position} | Source: {source} | Score: {score?.toFixed(2)}
        </div>
      )}
    </div>
  );
}