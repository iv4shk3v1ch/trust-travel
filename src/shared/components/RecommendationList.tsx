import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useInteractionTracker } from '@/core/services/interactionTracker';
import type { PlaceWithType } from '@/shared/types/place';

interface RecommendationListProps {
  places: PlaceWithType[];
  algorithm: string;
  source: 'personalized' | 'trending' | 'similar' | 'collaborative';
  title: string;
}

export function RecommendationList({ places, algorithm, source, title }: RecommendationListProps) {
  const { viewPlace, track } = useInteractionTracker();
  const [viewedItems, setViewedItems] = useState<Set<string>>(new Set());

  // Track when user scrolls through recommendations
  useEffect(() => {
    const handleScroll = () => {
      track('scroll_past', undefined, {
        list_type: source,
        algorithm,
        total_items: places.length,
        viewed_items: viewedItems.size
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [source, algorithm, places.length, viewedItems.size, track]);

  // Track intersection for each recommendation item
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    places.forEach((place, index) => {
      const element = document.getElementById(`place-${place.id}`);
      if (!element || viewedItems.has(place.id)) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !viewedItems.has(place.id)) {
              // Track recommendation view
              viewPlace(place.id, {
                position: index,
                source: 'recommendation',
                algorithm,
                list_type: source,
                page: 'recommendations'
              });
              
              setViewedItems(prev => new Set([...prev, place.id]));
            }
          });
        },
        { threshold: 0.6 } // Track when 60% visible
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [places, viewedItems, source, algorithm, viewPlace]);

  return (
    <div className="recommendation-section mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
        {title}
        <span className="text-sm text-gray-500 font-normal">
          {algorithm} • {places.length} places
        </span>
      </h2>
      
      <div className="space-y-4">
        {places.map((place, index) => (
          <div
            key={place.id}
            id={`place-${place.id}`}
            className="recommendation-item border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {place.photo_urls && place.photo_urls.length > 0 && (
                <Image 
                  src={place.photo_urls[0]} 
                  alt={place.name}
                  width={64}
                  height={64}
                  className="object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{place.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{place.place_type?.name || 'Unknown'}</p>
                {place.description && (
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {place.description}
                  </p>
                )}
              </div>
              <div className="text-xs text-gray-400 flex flex-col">
                <span>#{index + 1}</span>
                <span className={viewedItems.has(place.id) ? 'text-green-600' : ''}>
                  {viewedItems.has(place.id) ? '👁️' : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}