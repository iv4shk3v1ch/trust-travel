import { supabase } from './supabase'

// Enhanced review form data interface (matches the form exactly)
interface EnhancedReviewFormData {
  placeId: string; // UUID from places table
  placeName: string;
  placeCategory: string;
  ratings: Record<string, number>;
  experienceTags: string[];
  foodPriceRange?: string;
  comment: string;
  photoFile?: File;
  visitDate: string;
}

// Save a review to the database (accepts enhanced form data directly)
export async function saveReview(formData: EnhancedReviewFormData, userId: string): Promise<{ success: boolean; error?: string; reviewId?: string }> {
  try {
    console.log('=== saveReview DEBUG START ===');
    console.log('Input formData:', JSON.stringify(formData, null, 2));
    console.log('Input userId:', userId);
    
    // Validate required fields
    if (!formData.placeId) {
      throw new Error('Place ID is required');
    }
    if (!formData.placeName) {
      throw new Error('Place name is required');
    }
    if (!formData.placeCategory) {
      throw new Error('Place category is required');
    }
    if (!formData.visitDate) {
      throw new Error('Visit date is required');
    }
    
    console.log('Validation passed');
    
    // First, upload photo if provided
    const photoUrls: string[] = []
    if (formData.photoFile) {
      console.log('Uploading photo:', formData.photoFile.name);
      const fileName = `reviews/${userId}/${Date.now()}_${formData.photoFile.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('place-photos')
        .upload(fileName, formData.photoFile)

      if (uploadError) {
        console.error('Error uploading photo:', uploadError)
        throw new Error(`Failed to upload photo: ${uploadError.message}`)
      }

      // Get the public URL for the uploaded photo
      const { data: { publicUrl } } = supabase.storage
        .from('place-photos')
        .getPublicUrl(fileName)
      
      photoUrls.push(publicUrl)
      console.log('Photo uploaded successfully:', publicUrl);
    } else {
      console.log('No photo to upload');
    }

    // Prepare review data for database
    const reviewData = {
      user_id: userId,
      place_id: formData.placeId,
      place_name: formData.placeName,
      place_category: formData.placeCategory,
      ratings: formData.ratings,
      experience_tags: formData.experienceTags,
      food_price_range: formData.foodPriceRange || null,
      comment: formData.comment,
      photos: photoUrls,
      visit_date: formData.visitDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Prepared reviewData for database:', JSON.stringify(reviewData, null, 2));

    // Insert the review into the database
    console.log('Attempting to insert into reviews table...');
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select('id')
      .single()

    console.log('Database insert result:', { data, error });

    if (error) {
      console.error('Database error details:', error)
      throw new Error(`Failed to save review: ${error.message}`)
    }

    console.log('Review saved successfully:', data)
    console.log('=== saveReview DEBUG END ===');
    return { 
      success: true, 
      reviewId: data.id 
    }

  } catch (error) {
    console.error('=== saveReview ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
