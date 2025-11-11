// Place type definitions matching the database schema

export interface PlaceType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Place {
  id: string;
  name: string;
  place_type_id: string;
  city: string | null;
  country: string | null; // Default: 'Italy'
  address: string | null;
  latitude: number | null; // numeric(10,8)
  longitude: number | null; // numeric(11,8)
  phone: string | null;
  website: string | null;
  working_hours: string | null;
  description: string | null;
  photo_urls: string[] | null;
  price_level: 'low' | 'medium' | 'high' | null;
  indoor_outdoor: 'indoor' | 'outdoor' | 'mixed' | null; // Default: 'mixed'
  avg_rating: number | null; // numeric(2,1), default 0.0
  review_count: number | null; // default 0
  verified: boolean | null; // default false
  created_by: string | null;
  created_at: string;
  updated_at: string;
  content_embedding?: number[]; // vector field
  embedding_model?: string | null;
  embedding_updated_at?: string | null;
}

// Place with joined place_type data
export interface PlaceWithType extends Place {
  place_type?: PlaceType;
}

// Form data for adding/editing a place
export interface PlaceFormData {
  name: string;
  place_type_id: string;
  city?: string;
  country?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  working_hours?: string;
  description?: string;
  photos?: File[];
  price_level?: 'low' | 'medium' | 'high';
  indoor_outdoor?: 'indoor' | 'outdoor' | 'mixed';
}

// Price level options
export const PRICE_LEVELS = [
  { value: 'low', label: 'Low ($)', description: 'Budget-friendly' },
  { value: 'medium', label: 'Medium ($$)', description: 'Moderate pricing' },
  { value: 'high', label: 'High ($$$)', description: 'Premium/Luxury' }
] as const;

// Indoor/Outdoor options
export const LOCATION_TYPES = [
  { value: 'indoor', label: 'Indoor', icon: '🏠' },
  { value: 'outdoor', label: 'Outdoor', icon: '🌳' },
  { value: 'mixed', label: 'Mixed', icon: '🏛️' }
] as const;
