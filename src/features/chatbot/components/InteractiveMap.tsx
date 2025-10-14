'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RecommendedPlace } from '@/core/services/recommender';

// Fix for default markers in react-leaflet
import L from 'leaflet';

// Fix for default marker icons in production
// @ts-expect-error - Leaflet internal property modification
delete L.Icon.Default.prototype._getIconUrl;

// Custom dark-themed marker icons
const createCustomIcon = (category: string) => {
  const iconMap: Record<string, string> = {
    restaurant: '🍽️',
    bar: '🍸',
    'coffee-shop': '☕',
    museum: '🏛️',
    'hiking-trail': '🥾',
    park: '🌳',
    viewpoint: '🏔️',
    hotel: '🏨',
    attraction: '🎯',
    'historical-site': '🏰',
    'religious-site': '⛪',
    default: '📍'
  };

  const emoji = iconMap[category] || iconMap.default;
  
  return L.divIcon({
    html: `
      <div class="custom-marker">
        <div class="marker-pin"></div>
        <div class="marker-emoji">${emoji}</div>
      </div>
    `,
    className: 'custom-marker-container',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// Mock coordinates for known places in Trento
const TRENTO_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Trento City Center
  'Osteria del Borgo': { lat: 46.0679, lng: 11.1211 },
  'Caffè Centrale': { lat: 46.0678, lng: 11.1246 },
  'Birreria Pedavena': { lat: 46.0665, lng: 11.1201 },
  'Gelateria Zanella': { lat: 46.0689, lng: 11.1234 },
  'Castello del Buonconsiglio': { lat: 46.0678, lng: 11.1246 },
  'Teatro Sociale': { lat: 46.0672, lng: 11.1238 },
  'Centro Commerciale Trento': { lat: 46.0834, lng: 11.1167 },
  'Hotel America': { lat: 46.0681, lng: 11.1223 },
  
  // Nature spots around Trento
  'Monte Bondone': { lat: 46.0156, lng: 11.0464 },
  'Lago di Toblino': { lat: 45.9694, lng: 10.9567 },
  'Lago di Braies': { lat: 46.6944, lng: 12.0847 },
  'Castel Roncolo': { lat: 46.5164, lng: 11.3394 },
  
  // Default coordinates for different categories
  restaurant: { lat: 46.0678, lng: 11.1246 },
  bar: { lat: 46.0670, lng: 11.1240 },
  'coffee-shop': { lat: 46.0685, lng: 11.1250 },
  museum: { lat: 46.0675, lng: 11.1235 },
  'hiking-trail': { lat: 46.0156, lng: 11.0464 },
  park: { lat: 46.0750, lng: 11.1300 },
  viewpoint: { lat: 46.0800, lng: 11.1400 },
  hotel: { lat: 46.0680, lng: 11.1220 },
};

// Helper function to get coordinates for a place
function getPlaceCoordinates(place: RecommendedPlace): { lat: number; lng: number } | null {
  // If place has coordinates from database, use them (ensure they're numbers)
  if (place.latitude != null && place.longitude != null) {
    const lat = typeof place.latitude === 'string' ? parseFloat(place.latitude) : place.latitude;
    const lng = typeof place.longitude === 'string' ? parseFloat(place.longitude) : place.longitude;
    
    // Validate the parsed coordinates
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      console.log(`📍 Using database coordinates for ${place.name}:`, { lat, lng });
      return { lat, lng };
    }
  }
  
  // Try to find by exact name match in fallback coordinates
  if (TRENTO_COORDINATES[place.name]) {
    console.log(`📍 Using fallback coordinates for ${place.name}:`, TRENTO_COORDINATES[place.name]);
    return TRENTO_COORDINATES[place.name];
  }
  
  // Fall back to category-based coordinates with slight randomization
  const categoryCoords = TRENTO_COORDINATES[place.category];
  if (categoryCoords) {
    const randomCoords = {
      lat: categoryCoords.lat + (Math.random() - 0.5) * 0.01, // Add small random offset
      lng: categoryCoords.lng + (Math.random() - 0.5) * 0.01
    };
    console.log(`📍 Using random category coordinates for ${place.name}:`, randomCoords);
    return randomCoords;
  }
  
  // Default to Trento center with random offset
  const defaultCoords = {
    lat: 46.0678 + (Math.random() - 0.5) * 0.02,
    lng: 11.1246 + (Math.random() - 0.5) * 0.02
  };
  console.log(`📍 Using default random coordinates for ${place.name}:`, defaultCoords);
  return defaultCoords;
}

interface InteractiveMapProps {
  recommendations: RecommendedPlace[];
  className?: string;
}

// Component to fit map bounds to recommendations
const MapBoundsFitter: React.FC<{ recommendations: RecommendedPlace[] }> = ({ recommendations }) => {
  const map = useMap();

  useEffect(() => {
    if (recommendations.length > 0) {
      const placesWithCoords = recommendations.map(place => getPlaceCoordinates(place)).filter(Boolean);

      if (placesWithCoords.length > 0) {
        if (placesWithCoords.length === 1) {
          // Center on single location
          const coords = placesWithCoords[0]!;
          map.setView([coords.lat, coords.lng], 14);
        } else {
          // Fit bounds to all locations
          const bounds = new LatLngBounds(
            placesWithCoords.map(coords => [coords!.lat, coords!.lng])
          );
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      }
    }
  }, [recommendations, map]);

  return null;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  recommendations, 
  className = "" 
}) => {
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side (Next.js SSR compatibility)
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">Loading map...</div>
      </div>
    );
  }

  // Default center on Trento, Italy
  const trentoCenter: [number, number] = [46.0678, 11.1246];

  return (
    <div className={`relative ${className}`}>
      {/* Custom dark theme styles for map */}
      <style jsx global>{`
        /* Custom marker styles */
        .custom-marker-container {
          background: transparent;
          border: none;
        }
        
        .custom-marker {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .marker-pin {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .marker-emoji {
          position: absolute;
          font-size: 14px;
          z-index: 10;
          transform: rotate(45deg);
          margin-top: -2px;
          margin-left: -1px;
        }
        
        /* Dark theme for map controls - improved readability */
        .leaflet-control-zoom a {
          background-color: rgba(55, 65, 81, 0.9) !important;
          color: #f9fafb !important;
          border: 1px solid rgba(75, 85, 99, 0.8) !important;
          backdrop-filter: blur(8px);
        }
        
        .leaflet-control-zoom a:hover {
          background-color: rgba(75, 85, 99, 0.9) !important;
        }
        
        /* Enhanced dark theme for popups with better contrast */
        .leaflet-popup-content-wrapper {
          background-color: rgba(31, 41, 55, 0.95) !important;
          color: #f9fafb !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(75, 85, 99, 0.5) !important;
          backdrop-filter: blur(10px);
        }
        
        .leaflet-popup-tip {
          background-color: rgba(31, 41, 55, 0.95) !important;
          border: 1px solid rgba(75, 85, 99, 0.5) !important;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        
        /* Improved attribution with transparency */
        .leaflet-control-attribution {
          background-color: rgba(31, 41, 55, 0.7) !important;
          color: #d1d5db !important;
          backdrop-filter: blur(4px);
        }
        
        .leaflet-control-attribution a {
          color: #93c5fd !important;
        }
      `}</style>
      
      <MapContainer
        center={trentoCenter}
        zoom={13}
        className="w-full h-full rounded-lg z-0"
        zoomControl={true}
        scrollWheelZoom={true}
        style={{ 
          filter: 'brightness(0.85) contrast(1.1)',
          background: '#1f2937'
        }}
      >
        {/* Readable Dark Theme Map - Better Geographical Contrast */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
          opacity={0.8}
        />
        <TileLayer
          attribution=''
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
        />
        
        {/* Render markers for all recommendations */}
        {recommendations.map((place) => {
          const coords = getPlaceCoordinates(place);
          if (!coords) return null;
          
          return (
            <Marker
              key={place.id}
              position={[coords.lat, coords.lng]}
              icon={createCustomIcon(place.category)}
            >
              <Popup className="custom-popup">
                <div className="p-4 min-w-[240px]">
                  <h3 className="font-semibold text-white text-lg mb-2">
                    {place.name}
                  </h3>
                  <p className="text-sm text-gray-300 mb-3">
                    {place.category.replace('-', ' ')} • {place.city}
                  </p>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center">
                      <span className="text-yellow-400 text-sm">⭐</span>
                      <span className="text-sm text-gray-300 ml-1">
                        {place.average_rating.toFixed(1)} ({place.review_count} reviews)
                      </span>
                    </div>
                  </div>
                  {place.description && (
                    <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                      {place.description.length > 120 
                        ? `${place.description.substring(0, 120)}...`
                        : place.description
                      }
                    </p>
                  )}
                  {place.matching_tags.length > 0 && (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1">
                        {place.matching_tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-indigo-600 text-indigo-100 text-xs rounded-full"
                          >
                            {tag.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {place.address && (
                    <p className="text-xs text-gray-500 mt-2">
                      📍 {place.address}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Auto-fit bounds when recommendations change */}
        <MapBoundsFitter recommendations={recommendations} />
      </MapContainer>
    </div>
  );
};