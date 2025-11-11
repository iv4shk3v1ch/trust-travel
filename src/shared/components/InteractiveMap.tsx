import React, { useState, useCallback } from 'react';
import { useInteractionTracker } from '@/core/services/interactionTracker';
import type { PlaceWithType } from '@/shared/types/place';

interface MapProps {
  places: PlaceWithType[];
  center?: { lat: number; lng: number };
  onPlaceSelect?: (place: PlaceWithType) => void;
}

export function InteractiveMap({ places, onPlaceSelect }: MapProps) {
  const { viewPlace, clickPlace } = useInteractionTracker();
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithType | null>(null);

  // Track place marker interactions
  const handleMarkerClick = useCallback((place: PlaceWithType, index: number) => {
    clickPlace(place.id, index, 'map', {
      map_zoom: 10, // Would get from actual map instance
      places_visible: places.length,
      click_area: 'marker'
    });
    
    setSelectedPlace(place);
    onPlaceSelect?.(place);
  }, [places.length, clickPlace, onPlaceSelect]);

  const handleMarkerView = useCallback((place: PlaceWithType, index: number) => {
    viewPlace(place.id, {
      position: index,
      source: 'map',
      page: 'map_view',
      map_zoom: 10, // Would get from actual map instance
      places_visible: places.length
    });
  }, [places.length, viewPlace]);

  return (
    <div className="w-full h-96 relative">
      {/* Map component would go here - using placeholder for demo */}
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-gray-600">
          Interactive Map Component
          <br />
          <small>Places: {places.length}</small>
          {selectedPlace && (
            <div className="mt-2 p-2 bg-white rounded shadow">
              <strong>{selectedPlace.name}</strong>
              <br />
              <small>{selectedPlace.place_type?.name || 'Unknown'}</small>
            </div>
          )}
        </div>
      </div>
      
      {/* Place markers would be rendered here */}
      {places.map((place, index) => (
        <div
          key={place.id}
          className="absolute w-4 h-4 bg-red-500 rounded-full cursor-pointer"
          style={{
            // This would be calculated based on actual map projection
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`
          }}
          onClick={() => handleMarkerClick(place, index)}
          onMouseEnter={() => handleMarkerView(place, index)}
          title={place.name}
        />
      ))}
    </div>
  );
}