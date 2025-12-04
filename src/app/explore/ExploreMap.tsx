/**
 * ExploreMap - Interactive map for Explore page
 * Shows places with markers and handles selection
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RecommendedPlace } from '@/core/services/recommendationEngineV2';

// Fix Leaflet default icon issue with Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ExploreMapProps {
  places: RecommendedPlace[];
  selectedPlace: RecommendedPlace | null;
  onPlaceClick: (place: RecommendedPlace) => void;
}

export default function ExploreMap({ places, selectedPlace, onPlaceClick }: ExploreMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);
  const initialBoundsRef = useRef<L.LatLngBounds | null>(null);

  // Recenter map to show all places
  const handleRecenter = () => {
    if (!mapRef.current || !initialBoundsRef.current) return;
    mapRef.current.fitBounds(initialBoundsRef.current, { padding: [50, 50], animate: true });
  };

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;

    const map = L.map('explore-map').setView([46.0664, 11.1257], 13); // Trento center
    const markers = new Map<string, L.Marker>();
    markersRef.current = markers;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      markers.forEach(marker => marker.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when places change
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const map = mapRef.current;
    const markers = markersRef.current;

    // Clear old markers
    markers.forEach(marker => marker.remove());
    markers.clear();

    // Add new markers
    const bounds: L.LatLngTuple[] = [];

    places.forEach(place => {
      if (!place.latitude || !place.longitude) return;

      const latLng: L.LatLngTuple = [place.latitude, place.longitude];
      bounds.push(latLng);

      // Custom icon based on place category and match score
      const isSelected = selectedPlace?.id === place.id;
      const iconHtml = getCategoryIcon(place.category, place.final_score, isSelected);
      const icon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: isSelected ? [50, 50] : [40, 40],
        iconAnchor: isSelected ? [25, 50] : [20, 40],
        popupAnchor: [0, isSelected ? -50 : -40],
      });

      const marker = L.marker(latLng, { icon })
        .addTo(map)
        .on('click', () => onPlaceClick(place));

      // Enhanced popup with match score
      // Enhanced popup with compact design
      const matchBadge = place.final_score ? `
        <span class="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-1.5 py-0.5 rounded text-xs font-bold ml-auto">
          ${(place.final_score * 100).toFixed(0)}%
        </span>
      ` : '';

      marker.bindPopup(`
        <div class="p-1.5 max-w-[180px]">
          <div class="flex items-start justify-between gap-1 mb-1">
            <h3 class="font-semibold text-sm leading-tight">${place.name}</h3>
            ${matchBadge}
          </div>
          <p class="text-xs text-gray-500 mb-1.5 capitalize leading-tight">${place.category.replace(/-/g, ' ')}</p>
          <div class="flex items-center gap-1 text-xs">
            <span class="text-yellow-500">⭐</span>
            <span class="font-semibold">${place.average_rating.toFixed(1)}</span>
            <span class="text-gray-400">(${place.review_count})</span>
          </div>
        </div>
      `);

      markers.set(place.id, marker);
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      const latLngBounds = L.latLngBounds(bounds);
      initialBoundsRef.current = latLngBounds;
      map.fitBounds(latLngBounds, { padding: [50, 50] });
    }
  }, [places, mapReady, onPlaceClick, selectedPlace?.id]);

  // Highlight selected place
  useEffect(() => {
    if (!mapRef.current || !selectedPlace) return;

    const marker = markersRef.current.get(selectedPlace.id);
    if (marker) {
      marker.openPopup();
      if (selectedPlace.latitude && selectedPlace.longitude) {
        mapRef.current.setView([selectedPlace.latitude, selectedPlace.longitude], 15, {
          animate: true,
        });
      }
    }
  }, [selectedPlace]);

  return (
    <div className="relative w-full h-full">
      <div id="explore-map" className="w-full h-full" />
      
      {/* Map Controls - Recenter only (OpenStreetMap provides default zoom controls) */}
      <div className="absolute top-4 left-4 z-[1000]">
        <button
          onClick={handleRecenter}
          className="bg-white hover:bg-gray-100 rounded-lg shadow-lg p-2 transition"
          title="Recenter map"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000] max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Match Score Colors</h4>
        <div className="space-y-1.5 text-xs mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-green-500"></div>
            <span>80%+ Excellent Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-purple-600"></div>
            <span>65-79% Great Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-orange-500"></div>
            <span>50-64% Good Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-gray-500"></div>
            <span>&lt;50% Okay Match</span>
          </div>
        </div>
        <div className="border-t pt-2 text-xs text-gray-600">
          Click markers for details
        </div>
      </div>

      {/* Place count */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 z-[1000]">
        <p className="text-sm font-medium text-gray-700">
          📍 {places.length} {places.length === 1 ? 'place' : 'places'} on map
        </p>
      </div>
    </div>
  );
}

/**
 * Get emoji icon for place category with match score color
 */
function getCategoryIcon(category: string, finalScore?: number, isSelected?: boolean): string {
  const iconMap: Record<string, string> = {
    // Food & Dining
    'restaurant': '🍽️',
    'pizzeria': '🍕',
    'local-trattoria': '🍝',
    'street-food': '🌮',
    'cafe': '☕',
    'specialty-coffee-bar': '☕',
    'specialty-coffee': '☕',
    'food-market': '🍊',
    'co-working-café': '💻',
    'scenic-cafe': '☕',
    'bakery': '🥐',
    
    // Bars & Nightlife
    'aperetivo-bar': '🍸',
    'craft-beer-pub': '🍺',
    'rooftop-bar': '🍷',
    'dessert-bar': '🍰',
    'karaoke-bar': '🎤',
    'student-pub': '🍻',
    'underground-club': '🎵',
    'commercial-nightclub': '💃',
    
    // Culture & Arts
    'museum': '🏛️',
    'art-gallery': '🎨',
    'contemporary-art-space': '🖼️',
    'street-art-area': '🎨',
    'theatre': '🎭',
    'cinema': '🎬',
    'comedy-club': '😂',
    'cultural-event-venue': '🎪',
    'exhibition-hall': '🏢',
    'cultural-center': '🏛️',
    'library': '📚',
    
    // Historic & Landmarks
    'historical-landmark': '🏰',
    'castle': '🏰',
    'church': '⛪',
    'tower': '🗼',
    'bridge': '🌉',
    'old-town': '🏘️',
    'city-square': '�️',
    'street': '🛤️',
    
    // Nature & Outdoors
    'park': '🌲',
    'botanical-garden': '🌺',
    'viewpoint': '🏔️',
    'lake': '🏞️',
    'river-walk': '�',
    'hiking-trail': '🥾',
    'mountain-peak': '⛰️',
    'waterfall': '💦',
    'forest-walk': '�',
    'beach': '🏖️',
    'adventure-park': '🎢',
    'picnic-area': '🧺',
    
    // Shopping
    'vintage-store': '�',
    'local-market': '🏪',
    'concept-store': '🛍️',
    'artisanal-shop': '🎁',
    'wine-shop': '🍷',
    'bookstore': '📚',
    'shopping-centre': '🏬',
    
    // Wellness & Leisure
    'spa': '🧖',
    'thermal-bath': '♨️',
    'yoga-studio': '🧘',
    'live-music-venue': '🎵',
    'local-festival-area': '🎉',
  };

  // Determine border color based on match score
  let borderColor = '#2563eb'; // Default blue
  if (finalScore !== undefined) {
    if (finalScore >= 0.8) borderColor = '#10b981'; // Green for excellent match
    else if (finalScore >= 0.65) borderColor = '#8b5cf6'; // Purple for great match
    else if (finalScore >= 0.5) borderColor = '#f59e0b'; // Orange for good match
    else borderColor = '#6b7280'; // Gray for okay match
  }

  const size = isSelected ? 50 : 40;
  const borderWidth = isSelected ? 4 : 3;
  const shadow = isSelected ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)';

  return `
    <div style="
      background: white;
      border: ${borderWidth}px solid ${borderColor};
      border-radius: 50% 50% 50% 0;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${isSelected ? 24 : 20}px;
      box-shadow: ${shadow};
      transform: rotate(-45deg);
      transition: all 0.3s ease;
      cursor: pointer;
    ">
      <span style="transform: rotate(45deg);">
        ${iconMap[category] || '📍'}
      </span>
    </div>
  `;
}
