import { supabase } from './supabase';
import type { Place, PlaceType, PlaceWithType, PlaceFormData } from '@/shared/types/place';

// Fetch all place types
export async function getPlaceTypes(): Promise<PlaceType[]> {
  console.log('🔍 Fetching place types from database...');
  
  const { data, error } = await supabase
    .from('place_types')
    .select('*')
    .order('name');

  console.log('📊 Place types response:', { data, error });

  if (error) {
    console.error('❌ Error fetching place types:', error);
    throw new Error(`Failed to fetch place types: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.warn('⚠️ No place types found in database');
  } else {
    console.log(`✅ Successfully fetched ${data.length} place types`);
  }

  return data || [];
}

// Get a single place type by ID
export async function getPlaceTypeById(id: string): Promise<PlaceType | null> {
  const { data, error } = await supabase
    .from('place_types')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching place type:', error);
    return null;
  }

  return data;
}

// Upload photos to Supabase storage
export async function uploadPlacePhotos(placeId: string, photos: File[]): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const fileExt = photo.name.split('.').pop();
    const fileName = `${placeId}_${Date.now()}_${i + 1}.${fileExt}`;
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

// Save a new place to the database
export async function saveNewPlace(formData: PlaceFormData): Promise<string> {
  console.log('🏢 PLACE SAVE - Starting save operation');
  console.log('📋 Place data:', formData);

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('❌ Authentication error:', authError);
    throw new Error('User not authenticated');
  }

  console.log('✅ User authenticated:', user.id);

  // Validate required fields
  if (!formData.name || !formData.place_type_id) {
    throw new Error('Name and place type are required');
  }

  // Prepare place data
  const placeData: Partial<Place> = {
    name: formData.name.trim(),
    place_type_id: formData.place_type_id,
    city: formData.city?.trim() || null,
    country: formData.country?.trim() || 'Italy',
    address: formData.address?.trim() || null,
    latitude: formData.latitude || null,
    longitude: formData.longitude || null,
    phone: formData.phone?.trim() || null,
    website: formData.website?.trim() || null,
    working_hours: formData.working_hours?.trim() || null,
    description: formData.description?.trim() || null,
    price_level: formData.price_level || null,
    indoor_outdoor: formData.indoor_outdoor || 'mixed',
    verified: false,
    created_by: user.id
  };

  console.log('💾 Inserting place:', placeData);

  // Insert the place
  const { data: newPlace, error: insertError } = await supabase
    .from('places')
    .insert([placeData])
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error inserting place:', insertError);
    console.error('❌ Error details:', JSON.stringify(insertError, null, 2));
    console.error('❌ Error message:', insertError.message);
    console.error('❌ Error code:', insertError.code);
    console.error('❌ Error hint:', insertError.hint);
    throw new Error(`Failed to save place: ${insertError.message || JSON.stringify(insertError)}`);
  }

  console.log('✅ Place saved:', newPlace.id);

  // Upload photos if provided
  if (formData.photos && formData.photos.length > 0) {
    try {
      console.log('📸 Uploading photos...');
      const photoUrls = await uploadPlacePhotos(newPlace.id, formData.photos);
      console.log('✅ Photos uploaded:', photoUrls);

      // Update place with photo URLs
      const { error: updateError } = await supabase
        .from('places')
        .update({ photo_urls: photoUrls })
        .eq('id', newPlace.id);

      if (updateError) {
        console.error('⚠️ Error updating place with photos:', updateError);
      }
    } catch (photoError) {
      console.error('⚠️ Error uploading photos:', photoError);
      // Don't fail the whole operation
    }
  }

  return newPlace.id;
}

// Update an existing place
export async function updatePlace(
  placeId: string,
  updates: Partial<PlaceFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Partial<Place> = {};

    if (updates.name) updateData.name = updates.name.trim();
    if (updates.place_type_id) updateData.place_type_id = updates.place_type_id;
    if (updates.city !== undefined) updateData.city = updates.city?.trim() || null;
    if (updates.country !== undefined) updateData.country = updates.country?.trim() || null;
    if (updates.address !== undefined) updateData.address = updates.address?.trim() || null;
    if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
    if (updates.phone !== undefined) updateData.phone = updates.phone?.trim() || null;
    if (updates.website !== undefined) updateData.website = updates.website?.trim() || null;
    if (updates.working_hours !== undefined) updateData.working_hours = updates.working_hours?.trim() || null;
    if (updates.description !== undefined) updateData.description = updates.description?.trim() || null;
    if (updates.price_level !== undefined) updateData.price_level = updates.price_level || null;
    if (updates.indoor_outdoor !== undefined) updateData.indoor_outdoor = updates.indoor_outdoor || 'mixed';

    const { error } = await supabase
      .from('places')
      .update(updateData)
      .eq('id', placeId);

    if (error) {
      throw new Error(`Failed to update place: ${error.message}`);
    }

    // Handle photo updates separately if provided
    if (updates.photos && updates.photos.length > 0) {
      const photoUrls = await uploadPlacePhotos(placeId, updates.photos);
      
      await supabase
        .from('places')
        .update({ photo_urls: photoUrls })
        .eq('id', placeId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating place:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Search for places by name and city
export async function searchPlaces(query: string, city?: string, limit: number = 50): Promise<PlaceWithType[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    return [];
  }

  // PostgREST `or` uses commas as separators, so we strip commas from user input.
  const safeQuery = normalizedQuery.replace(/,/g, ' ');

  let queryBuilder = supabase
    .from('places')
    .select(`
      *,
      place_type:place_types (*)
    `)
    .or(
      `name.ilike.%${safeQuery}%,city.ilike.%${safeQuery}%,address.ilike.%${safeQuery}%`
    );

  const normalizedCity = city?.trim();
  if (normalizedCity) {
    queryBuilder = queryBuilder.ilike('city', `%${normalizedCity}%`);
  }

  const { data, error } = await queryBuilder
    .order('name', { ascending: true })
    .order('city', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error searching places:', error);
    throw new Error(`Failed to search places: ${error.message}`);
  }

  return data || [];
}

// Get all places with their types
export async function getAllPlaces(): Promise<PlaceWithType[]> {
  const { data, error } = await supabase
    .from('places')
    .select(`
      *,
      place_type:place_types (*)
    `)
    .order('name');

  if (error) {
    console.error('Error fetching places:', error);
    throw new Error(`Failed to fetch places: ${error.message}`);
  }

  return data || [];
}

// Get places by place type
export async function getPlacesByType(placeTypeId: string): Promise<PlaceWithType[]> {
  const { data, error } = await supabase
    .from('places')
    .select(`
      *,
      place_type:place_types (*)
    `)
    .eq('place_type_id', placeTypeId)
    .order('name');

  if (error) {
    console.error('Error fetching places by type:', error);
    throw new Error(`Failed to fetch places: ${error.message}`);
  }

  return data || [];
}

// Get places by city
export async function getPlacesByCity(city: string): Promise<PlaceWithType[]> {
  const { data, error } = await supabase
    .from('places')
    .select(`
      *,
      place_type:place_types (*)
    `)
    .ilike('city', city)
    .order('name');

  if (error) {
    console.error('Error fetching places by city:', error);
    throw new Error(`Failed to fetch places: ${error.message}`);
  }

  return data || [];
}

// Get a single place by ID
export async function getPlaceById(placeId: string): Promise<PlaceWithType | null> {
  const { data, error } = await supabase
    .from('places')
    .select(`
      *,
      place_type:place_types (*)
    `)
    .eq('id', placeId)
    .single();

  if (error) {
    console.error('Error fetching place:', error);
    return null;
  }

  return data;
}

// Delete a place (only if user is creator)
export async function deletePlace(placeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', placeId);

    if (error) {
      throw new Error(`Failed to delete place: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting place:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
