import { supabase } from './supabase';
import { type PlaceCategory, isValidPlaceCategory } from './dataStandards';

/**
 * Database interface for places table
 * This structure matches what we need for the add place form
 */
export interface DatabasePlace {
  id: string;
  name: string;
  category: PlaceCategory;
  city: string;
  country?: string;
  address?: string;
  working_hours?: string;
  website?: string;
  phone?: string;
  photo_urls?: string[]; // Array of photo URLs
  created_by: string; // User ID who added the place
  created_at: string;
  updated_at: string;
  verified?: boolean; // Whether place has been verified by admin
  description?: string;
}

/**
 * Form data interface for adding a new place
 */
export interface AddPlaceFormData {
  name: string;
  category: PlaceCategory;
  city: string;
  country?: string;
  address?: string;
  workingHours?: string;
  website?: string;
  phone?: string;
  photos?: File[]; // Files to upload
  description?: string;
}

/**
 * Create the places table (run this once to set up the database)
 * This is the SQL that should be run in Supabase
 */
export const CREATE_PLACES_TABLE_SQL = `
-- Create places table
CREATE TABLE IF NOT EXISTS places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  city VARCHAR(255) NOT NULL,
  country VARCHAR(255),
  address TEXT,
  working_hours TEXT,
  website VARCHAR(500),
  phone VARCHAR(50),
  photo_urls TEXT[],
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  description TEXT
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_places_city ON places(city);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_created_by ON places(created_by);

-- Enable RLS
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read places
CREATE POLICY "Places are viewable by everyone" ON places
  FOR SELECT USING (true);

-- Authenticated users can insert places
CREATE POLICY "Users can insert places" ON places
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own places
CREATE POLICY "Users can update own places" ON places
  FOR UPDATE USING (auth.uid() = created_by);
`;

/**
 * Upload photos to Supabase storage
 */
export async function uploadPlacePhotos(placeId: string, photos: File[]): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const fileExt = photo.name.split('.').pop();
    const fileName = `${placeId}_${i + 1}.${fileExt}`;
    const filePath = `places/${fileName}`;

    const { error } = await supabase.storage
      .from('place-photos')
      .upload(filePath, photo);

    if (error) {
      console.error('Error uploading photo:', error);
      throw new Error(`Failed to upload photo ${i + 1}: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('place-photos')
      .getPublicUrl(filePath);

    uploadedUrls.push(publicUrl);
  }

  return uploadedUrls;
}

/**
 * Save a new place to the database
 */
export async function saveNewPlace(formData: AddPlaceFormData): Promise<string> {
  console.log('🏢 PLACE SAVE - Starting save operation');
  console.log('📋 Place data to save:', JSON.stringify(formData, null, 2));

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('❌ Authentication error:', authError);
    throw new Error('User not authenticated');
  }

  console.log('✅ User authenticated:', user.id);

  // Validate category against our standards
  if (!isValidPlaceCategory(formData.category)) {
    console.error('❌ Invalid category:', formData.category);
    throw new Error(`Invalid category: ${formData.category}`);
  }

  // First, insert the place without photos
  const placeData: Omit<DatabasePlace, 'id' | 'created_at' | 'updated_at' | 'photo_urls'> = {
    name: formData.name.trim(),
    category: formData.category,
    city: formData.city.trim(),
    country: formData.country?.trim() || undefined,
    address: formData.address?.trim() || undefined,
    working_hours: formData.workingHours?.trim() || undefined,
    website: formData.website?.trim() || undefined,
    phone: formData.phone?.trim() || undefined,
    created_by: user.id,
    verified: false,
    description: formData.description?.trim() || undefined,
  };

  console.log('💾 Inserting place data:', JSON.stringify(placeData, null, 2));

  const { data: newPlace, error: insertError } = await supabase
    .from('places')
    .insert(placeData)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error inserting place:', insertError);
    console.error('❌ Error details:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
    throw new Error(`Failed to save place: ${insertError.message}`);
  }

  console.log('✅ Place saved successfully:', newPlace.id);

  // Upload photos if provided
  let photoUrls: string[] = [];
  if (formData.photos && formData.photos.length > 0) {
    try {
      console.log('📸 Uploading photos...');
      photoUrls = await uploadPlacePhotos(newPlace.id, formData.photos);
      console.log('✅ Photos uploaded:', photoUrls);

      // Update place with photo URLs
      const { error: updateError } = await supabase
        .from('places')
        .update({ photo_urls: photoUrls })
        .eq('id', newPlace.id);

      if (updateError) {
        console.error('⚠️ Error updating place with photo URLs:', updateError);
        // Don't throw error here, place is saved, just photos missing
      }
    } catch (photoError) {
      console.error('⚠️ Error uploading photos:', photoError);
      // Don't throw error here, place is saved, just photos missing
    }
  }

  return newPlace.id;
}

/**
 * Search for places by name and city
 */
export async function searchPlaces(query: string, city?: string): Promise<DatabasePlace[]> {
  let queryBuilder = supabase
    .from('places')
    .select('*')
    .ilike('name', `%${query}%`);

  if (city) {
    queryBuilder = queryBuilder.ilike('city', `%${city}%`);
  }

  const { data, error } = await queryBuilder
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error searching places:', error);
    throw new Error(`Failed to search places: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all places (for reviews dropdown, etc.)
 */
export async function getAllPlaces(): Promise<DatabasePlace[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching places:', error);
    throw new Error(`Failed to fetch places: ${error.message}`);
  }

  return data || [];
}

/**
 * Get places by category
 */
export async function getPlacesByCategory(category: PlaceCategory): Promise<DatabasePlace[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('category', category)
    .order('name');

  if (error) {
    console.error('Error fetching places by category:', error);
    throw new Error(`Failed to fetch places: ${error.message}`);
  }

  return data || [];
}
