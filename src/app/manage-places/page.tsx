'use client';

/**
 * Place Management Dashboard
 * Admin interface to review, edit, and delete places
 * Optimized for fast bulk review
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/core/database/supabase';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface Place {
  id: string;
  name: string;
  place_type_id: string;
  city: string;
  country: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  price_level: string | null;
  indoor_outdoor: string | null;
  created_at: string;
  place_types?: { name: string; slug: string };
}

interface PlaceType {
  id: string;
  name: string;
  slug: string;
}

const DEFAULT_MAP_CENTER: [number, number] = [42.8, 12.6];
const CITY_CENTERS: Record<string, [number, number]> = {
  Trento: [46.0664, 11.1257],
  Milan: [45.4642, 9.19],
  Rome: [41.9028, 12.4964],
  Florence: [43.7696, 11.2558],
  Prague: [50.0755, 14.4378],
};

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isSuspiciousCoordinate(place: Place): boolean {
  if (place.latitude == null || place.longitude == null) return false;

  // Rough Italy bounding box
  if (place.latitude < 35 || place.latitude > 48 || place.longitude < 6 || place.longitude > 19) {
    return true;
  }

  const center = place.city ? CITY_CENTERS[place.city] : null;
  if (!center) return false;

  return haversineKm(place.latitude, place.longitude, center[0], center[1]) > 120;
}

export default function PlaceManagementPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [mapPlaces, setMapPlaces] = useState<Place[]>([]);
  const [placeTypes, setPlaceTypes] = useState<PlaceType[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Place>>({});
  
  // Filters
  const [filterCity, setFilterCity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWithoutCoords, setShowWithoutCoords] = useState(false);
  const [showOnlySuspiciousCoords, setShowOnlySuspiciousCoords] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 50;
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    withoutCoords: 0,
    withoutDescription: 0,
    suspiciousCoords: 0,
    duplicates: 0,
  });

  // Load place types
  useEffect(() => {
    loadPlaceTypes();
    loadCityOptions();
  }, []);

  // Load places when filters change
  useEffect(() => {
    loadPlaces();
    loadMapPlaces();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterCity, filterType, searchQuery, showWithoutCoords]);

  useEffect(() => {
    setCurrentPage(0);
  }, [filterCity, filterType, searchQuery, showWithoutCoords]);

  const visibleMapPlaces = useMemo(() => {
    const withCoords = mapPlaces.filter(place => place.latitude != null && place.longitude != null);
    return showOnlySuspiciousCoords ? withCoords.filter(isSuspiciousCoordinate) : withCoords;
  }, [mapPlaces, showOnlySuspiciousCoords]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (filterCity !== 'all' && CITY_CENTERS[filterCity]) {
      return CITY_CENTERS[filterCity];
    }
    if (!visibleMapPlaces.length) return DEFAULT_MAP_CENTER;
    const sum = visibleMapPlaces.reduce(
      (acc, place) => {
        acc.lat += place.latitude || 0;
        acc.lng += place.longitude || 0;
        return acc;
      },
      { lat: 0, lng: 0 }
    );
    return [sum.lat / visibleMapPlaces.length, sum.lng / visibleMapPlaces.length];
  }, [filterCity, visibleMapPlaces]);

  async function loadPlaceTypes() {
    const { data } = await supabase
      .from('place_types')
      .select('id, name, slug')
      .order('name');
    
    if (data) setPlaceTypes(data);
  }

  async function loadCityOptions() {
    const { data } = await supabase
      .from('places')
      .select('city')
      .not('city', 'is', null)
      .limit(10000);

    if (!data) return;
    const uniqueCities = Array.from(
      new Set(
        data
          .map((row) => row.city)
          .filter((city): city is string => Boolean(city))
      )
    ).sort((a, b) => a.localeCompare(b));

    setCityOptions(uniqueCities);
  }

  async function loadPlaces() {
    let query = supabase
      .from('places')
      .select('*, place_types!inner(name, slug)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

    if (filterCity !== 'all') {
      query = query.eq('city', filterCity);
    }

    if (filterType !== 'all') {
      query = query.eq('place_type_id', filterType);
    }

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    if (showWithoutCoords) {
      query = query.or('latitude.is.null,longitude.is.null');
    }

    const { data, count } = await query;

    if (data) setPlaces(data);
    if (count !== null) setTotalCount(count);
  }

  async function loadMapPlaces() {
    let query = supabase
      .from('places')
      .select('id, name, city, country, address, latitude, longitude, place_type_id, price_level, indoor_outdoor, description, phone, website, created_at, place_types(name, slug)')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (filterCity !== 'all') {
      query = query.eq('city', filterCity);
    }

    if (filterType !== 'all') {
      query = query.eq('place_type_id', filterType);
    }

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    if (showWithoutCoords) {
      query = query.or('latitude.is.null,longitude.is.null');
    }

    const { data } = await query;
    if (data) setMapPlaces(data as Place[]);
  }

  async function loadStats() {
    const { count: total } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true });

    const { count: withoutCoords } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .or('latitude.is.null,longitude.is.null');

    const { count: withoutDescription } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .is('description', null);

    const { data: coordRows } = await supabase
      .from('places')
      .select('id, city, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(10000);

    const suspiciousCoords = (coordRows || []).filter((row) =>
      isSuspiciousCoordinate({
        id: row.id as string,
        city: (row.city as string) || '',
        latitude: row.latitude as number,
        longitude: row.longitude as number,
        name: '',
        place_type_id: '',
        country: '',
        address: null,
        phone: null,
        website: null,
        description: null,
        price_level: null,
        indoor_outdoor: null,
        created_at: '',
      })
    ).length;

    setStats({
      total: total || 0,
      withoutCoords: withoutCoords || 0,
      withoutDescription: withoutDescription || 0,
      suspiciousCoords,
      duplicates: 0, // Can implement duplicate detection
    });
  }

  async function handleSave() {
    if (!selectedPlace) return;

    // Remove joined fields that aren't actual columns in the places table
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { place_types, ...updateData } = editForm;

    const { error } = await supabase
      .from('places')
      .update(updateData)
      .eq('id', selectedPlace.id);

    if (!error) {
      alert('✅ Place updated successfully!');
      setIsEditing(false);
      setSelectedPlace(null);
      loadPlaces();
    } else {
      alert('❌ Error: ' + error.message);
    }
  }

  async function handleDelete(placeId: string, placeName: string) {
    if (!confirm(`Delete "${placeName}"? This cannot be undone.`)) return;

    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', placeId);

    if (!error) {
      alert('✅ Place deleted');
      loadPlaces();
      if (selectedPlace?.id === placeId) {
        setSelectedPlace(null);
      }
    } else {
      alert('❌ Error: ' + error.message);
    }
  }

  function handleNext() {
    const currentIndex = places.findIndex(p => p.id === selectedPlace?.id);
    if (currentIndex < places.length - 1) {
      setSelectedPlace(places[currentIndex + 1]);
      setEditForm(places[currentIndex + 1]);
      setIsEditing(false);
    } else if (currentPage < Math.ceil(totalCount / ITEMS_PER_PAGE) - 1) {
      setCurrentPage(currentPage + 1);
    }
  }

  function handlePrevious() {
    const currentIndex = places.findIndex(p => p.id === selectedPlace?.id);
    if (currentIndex > 0) {
      setSelectedPlace(places[currentIndex - 1]);
      setEditForm(places[currentIndex - 1]);
      setIsEditing(false);
    } else if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Place Management</h1>
          <p className="text-sm text-gray-600">Review and manage all places</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="ml-2 font-semibold text-gray-900">{stats.total}</span>
            </div>
            <div>
              <span className="text-gray-600">Without coords:</span>
              <span className="ml-2 font-semibold text-orange-600">{stats.withoutCoords}</span>
            </div>
            <div>
              <span className="text-gray-600">Without description:</span>
              <span className="ml-2 font-semibold text-yellow-600">{stats.withoutDescription}</span>
            </div>
            <div>
              <span className="text-gray-600">Suspicious coords:</span>
              <span className="ml-2 font-semibold text-red-600">{stats.suspiciousCoords}</span>
            </div>
            <div>
              <span className="text-gray-600">Showing:</span>
              <span className="ml-2 font-semibold text-blue-600">{totalCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-3 items-center flex-wrap">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Cities</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              {placeTypes.map(pt => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showWithoutCoords}
                onChange={(e) => setShowWithoutCoords(e.target.checked)}
                className="rounded"
              />
              Missing coordinates
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showOnlySuspiciousCoords}
                onChange={(e) => setShowOnlySuspiciousCoords(e.target.checked)}
                className="rounded"
              />
              Suspicious coords only (map)
            </label>

            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCity('all');
                setFilterType('all');
                setShowWithoutCoords(false);
                setShowOnlySuspiciousCoords(false);
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Filtered Places Map</h2>
            <p className="text-sm text-gray-600">
              Showing {Math.min(visibleMapPlaces.length, 2000)} of {visibleMapPlaces.length} mapped places
            </p>
          </div>
          <div className="p-4">
            <div className="h-96 rounded-lg overflow-hidden border">
              {typeof window !== 'undefined' ? (
                <MapContainer
                  center={mapCenter}
                  zoom={filterCity === 'all' ? 6 : 11}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {visibleMapPlaces.slice(0, 2000).map((place) => {
                    if (place.latitude == null || place.longitude == null) return null;
                    const suspicious = isSuspiciousCoordinate(place);
                    return (
                      <CircleMarker
                        key={place.id}
                        center={[place.latitude, place.longitude]}
                        radius={4}
                        pathOptions={{ color: suspicious ? '#dc2626' : '#2563eb', fillOpacity: 0.85 }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <strong>{place.name}</strong>
                            <div>{place.city || 'Unknown city'}</div>
                            <div>{place.address || 'No address'}</div>
                            <div className="mt-1 text-xs text-gray-600">
                              {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
                            </div>
                            {suspicious && (
                              <div className="mt-1 text-xs font-semibold text-red-600">Suspicious coordinate</div>
                            )}
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Tip: red markers indicate likely wrong coordinates (outside Italy bounds or too far from the selected city center).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Place List */}
          <div className="col-span-5 bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">
                Places {currentPage * ITEMS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCount)} of {totalCount}
              </h2>
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {places.map((place) => (
                <div
                  key={place.id}
                  onClick={() => {
                    setSelectedPlace(place);
                    setEditForm(place);
                    setIsEditing(false);
                  }}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                    selectedPlace?.id === place.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{place.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {place.place_types?.name || 'Unknown type'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {place.address || 'No address'} · {place.city}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {!place.latitude && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          No coords
                        </span>
                      )}
                      {!place.description && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          No desc
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Right: Place Details */}
          <div className="col-span-7">
            {selectedPlace ? (
              <div className="bg-white rounded-lg shadow">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-semibold">{selectedPlace.name}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevious}
                      className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                  {!isEditing ? (
                    // View Mode
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <InfoField label="Category" value={selectedPlace.place_types?.name} />
                        <InfoField label="City" value={selectedPlace.city} />
                        <InfoField label="Address" value={selectedPlace.address} />
                        <InfoField label="Phone" value={selectedPlace.phone} />
                        <InfoField label="Website" value={selectedPlace.website} link />
                        <InfoField label="Price Level" value={selectedPlace.price_level} />
                        <InfoField label="Indoor/Outdoor" value={selectedPlace.indoor_outdoor} />
                        <InfoField label="Coordinates" value={
                          selectedPlace.latitude && selectedPlace.longitude
                            ? `${selectedPlace.latitude.toFixed(6)}, ${selectedPlace.longitude.toFixed(6)}`
                            : 'Missing'
                        } />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <p className="mt-1 text-gray-900">
                          {selectedPlace.description || <em className="text-gray-400">No description</em>}
                        </p>
                      </div>

                      {/* Map */}
                      {selectedPlace.latitude && selectedPlace.longitude && typeof window !== 'undefined' && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
                          <div className="h-64 rounded-lg overflow-hidden border">
                            <MapContainer
                              center={[selectedPlace.latitude, selectedPlace.longitude]}
                              zoom={15}
                              style={{ height: '100%', width: '100%' }}
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors'
                              />
                              <Marker position={[selectedPlace.latitude, selectedPlace.longitude]}>
                                <Popup>{selectedPlace.name}</Popup>
                              </Marker>
                            </MapContainer>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Edit Mode
                    <>
                      <EditField
                        label="Name"
                        value={editForm.name || ''}
                        onChange={(value) => setEditForm({ ...editForm, name: value })}
                      />

                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Category</label>
                        <select
                          value={editForm.place_type_id}
                          onChange={(e) => setEditForm({ ...editForm, place_type_id: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          {placeTypes.map(pt => (
                            <option key={pt.id} value={pt.id}>{pt.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <EditField
                          label="City"
                          value={editForm.city || ''}
                          onChange={(value) => setEditForm({ ...editForm, city: value })}
                        />
                        <EditField
                          label="Country"
                          value={editForm.country || ''}
                          onChange={(value) => setEditForm({ ...editForm, country: value })}
                        />
                      </div>

                      <EditField
                        label="Address"
                        value={editForm.address || ''}
                        onChange={(value) => setEditForm({ ...editForm, address: value })}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <EditField
                          label="Latitude"
                          type="number"
                          value={editForm.latitude?.toString() || ''}
                          onChange={(value) => setEditForm({ ...editForm, latitude: parseFloat(value) })}
                        />
                        <EditField
                          label="Longitude"
                          type="number"
                          value={editForm.longitude?.toString() || ''}
                          onChange={(value) => setEditForm({ ...editForm, longitude: parseFloat(value) })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <EditField
                          label="Phone"
                          value={editForm.phone || ''}
                          onChange={(value) => setEditForm({ ...editForm, phone: value })}
                        />
                        <EditField
                          label="Website"
                          value={editForm.website || ''}
                          onChange={(value) => setEditForm({ ...editForm, website: value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-2">Price Level</label>
                          <select
                            value={editForm.price_level || 'medium'}
                            onChange={(e) => setEditForm({ ...editForm, price_level: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-2">Indoor/Outdoor</label>
                          <select
                            value={editForm.indoor_outdoor || 'mixed'}
                            onChange={(e) => setEditForm({ ...editForm, indoor_outdoor: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            <option value="indoor">Indoor</option>
                            <option value="outdoor">Outdoor</option>
                            <option value="mixed">Mixed</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Description</label>
                        <textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t flex justify-between">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => handleDelete(selectedPlace.id, selectedPlace.name)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm(selectedPlace);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Save Changes
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                <p className="text-lg">Select a place from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, link }: { label: string; value?: string | null; link?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {link && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="block mt-1 text-blue-600 hover:underline">
          {value}
        </a>
      ) : (
        <p className="mt-1 text-gray-900">{value || <em className="text-gray-400">—</em>}</p>
      )}
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg"
      />
    </div>
  );
}
