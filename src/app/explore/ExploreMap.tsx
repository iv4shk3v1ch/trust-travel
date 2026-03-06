/**
 * ExploreMap - Interactive map for Explore page
 * Shows places with markers and handles selection
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RecommendedPlace } from '@/core/services/recommender';

// Fix Leaflet default icon issue with Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ExploreMapProps {
  city: string;
  places: RecommendedPlace[];
  selectedPlace: RecommendedPlace | null;
  onPlaceClick: (place: RecommendedPlace) => void;
}

const CITY_MAP_CONFIG: Record<string, { center: [number, number]; zoom: number }> = {
  Trento: { center: [46.0664, 11.1257], zoom: 13 },
  Milan: { center: [45.4642, 9.19], zoom: 12 },
  Rome: { center: [41.9028, 12.4964], zoom: 12 },
  Florence: { center: [43.7696, 11.2558], zoom: 13 }
};

export default function ExploreMap({ city, places, selectedPlace, onPlaceClick }: ExploreMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);
  const initialBoundsRef = useRef<L.LatLngBounds | null>(null);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;

    const initialConfig = CITY_MAP_CONFIG[city] || CITY_MAP_CONFIG.Trento;
    const map = L.map('explore-map').setView(initialConfig.center, initialConfig.zoom);
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
  }, [city]);

  useEffect(() => {
    if (!mapRef.current || places.length > 0) return;
    const config = CITY_MAP_CONFIG[city] || CITY_MAP_CONFIG.Trento;
    mapRef.current.setView(config.center, config.zoom, { animate: true });
    initialBoundsRef.current = null;
  }, [city, places.length]);

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

    // Group places by coordinates to detect duplicates
    const coordGroups = new Map<string, RecommendedPlace[]>();
    places.forEach(place => {
      if (!place.latitude || !place.longitude) return;
      const coordKey = `${place.latitude.toFixed(6)},${place.longitude.toFixed(6)}`;
      if (!coordGroups.has(coordKey)) {
        coordGroups.set(coordKey, []);
      }
      coordGroups.get(coordKey)!.push(place);
    });

    // Create markers with offset for duplicates
    places.forEach(place => {
      if (!place.latitude || !place.longitude) return;

      const coordKey = `${place.latitude.toFixed(6)},${place.longitude.toFixed(6)}`;
      const group = coordGroups.get(coordKey)!;
      const indexInGroup = group.findIndex(p => p.id === place.id);
      
      let lat = place.latitude;
      let lng = place.longitude;

      // If multiple places share coordinates, offset them in a circle pattern
      if (group.length > 1) {
        const offsetDistance = 0.0003; // ~30 meters
        const angle = (indexInGroup / group.length) * 2 * Math.PI;
        lat += offsetDistance * Math.cos(angle);
        lng += offsetDistance * Math.sin(angle);
      }

      const latLng: L.LatLngTuple = [lat, lng];
      bounds.push(latLng);

      // Create marker with default icon (will be updated by selection effect)
      const iconHtml = getCategoryIcon(place.category, place.final_score, false);
      const icon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker(latLng, { icon })
        .addTo(map)
        .on('click', () => onPlaceClick(place));

      markers.set(place.id, marker);
    });

    // Only fit map to show all markers if no place is selected (initial load or filter change)
    if (bounds.length > 0 && !selectedPlace) {
      const latLngBounds = L.latLngBounds(bounds);
      initialBoundsRef.current = latLngBounds;
      map.fitBounds(latLngBounds, { padding: [50, 50] });
    } else if (bounds.length > 0 && !initialBoundsRef.current) {
      // Store initial bounds even if a place is selected
      const latLngBounds = L.latLngBounds(bounds);
      initialBoundsRef.current = latLngBounds;
    }
  }, [places, mapReady, onPlaceClick, selectedPlace]);

  // Update marker icons when selection changes (without recreating markers)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const markers = markersRef.current;

    places.forEach(place => {
      const marker = markers.get(place.id);
      if (!marker) return;

      const isSelected = selectedPlace?.id === place.id;
      
      // Update icon
      const iconHtml = getCategoryIcon(place.category, place.final_score, isSelected);
      const icon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
      
      marker.setIcon(icon);
    });
  }, [places, mapReady, selectedPlace]);

  // Highlight selected place
  useEffect(() => {
    if (!mapRef.current || !selectedPlace) return;

    const marker = markersRef.current.get(selectedPlace.id);
    if (marker && selectedPlace.latitude && selectedPlace.longitude) {
      const map = mapRef.current;
      const currentZoom = map.getZoom();
      const targetLatLng: L.LatLngTuple = [selectedPlace.latitude, selectedPlace.longitude];
      
      // Check if the selected place is already visible in the current view
      const bounds = map.getBounds();
      const placeLatLng = L.latLng(targetLatLng);
      
      if (bounds.contains(placeLatLng) && currentZoom >= 13) {
        // Place is already visible and zoom is reasonable - just pan smoothly without changing zoom
        map.panTo(targetLatLng, {
          animate: true,
          duration: 0.5,
        });
      } else {
        // Place is not visible or zoom is too far out - zoom in to see it
        map.setView(targetLatLng, Math.max(currentZoom, 15), {
          animate: true,
        });
      }
    }
  }, [selectedPlace]);

  return (
    <div className="relative w-full h-full">
      <div id="explore-map" className="w-full h-full" />
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

  // Determine colors based on match score or selection
  let backgroundColor = 'white';
  let borderColor = '#2563eb'; // Default blue
  let zIndex = '1';
  
  if (isSelected) {
    backgroundColor = '#ef4444'; // RED background for selected place
    borderColor = '#dc2626'; // Darker red border
    zIndex = '1000'; // Bring to front above all other markers
  } else if (finalScore !== undefined) {
    if (finalScore >= 0.8) borderColor = '#10b981'; // Green for excellent match
    else if (finalScore >= 0.65) borderColor = '#8b5cf6'; // Purple for great match
    else if (finalScore >= 0.5) borderColor = '#f59e0b'; // Orange for good match
    else borderColor = '#6b7280'; // Gray for okay match
  }

  const size = 32; // Fixed size - no longer changes
  const borderWidth = isSelected ? 4 : 2.5;
  const shadow = isSelected ? '0 6px 24px rgba(239,68,68,0.8), 0 0 0 3px rgba(239,68,68,0.3)' : '0 2px 6px rgba(0,0,0,0.2)';
  const fontSize = 18; // Fixed font size

  return `
    <div style="
      background: ${backgroundColor};
      border: ${borderWidth}px solid ${borderColor};
      border-radius: 50% 50% 50% 0;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${fontSize}px;
      box-shadow: ${shadow};
      transform: rotate(-45deg);
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      z-index: ${zIndex};
    ">
      <span style="transform: rotate(45deg);">
        ${iconMap[category] || '📍'}
      </span>
    </div>
  `;
}
