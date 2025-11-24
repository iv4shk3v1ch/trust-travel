import { supabase } from './supabase'
import type { ReviewFormData, ReviewWithTags, ExperienceTag } from '@/shared/types/review'
import { generateReviewEmbedding } from '@/core/services/freeEmbeddingService'

// Fetch all experience tags
export async function getExperienceTags(): Promise<ExperienceTag[]> {
  const { data, error } = await supabase
    .from('experience_tags')
    .select('*')
    .order('category, name')

  if (error) {
    console.error('Error fetching experience tags:', error)
    throw new Error(`Failed to fetch experience tags: ${error.message}`)
  }

  return data || []
}

// Fetch experience tags by category
export async function getExperienceTagsByCategory(category: string): Promise<ExperienceTag[]> {
  const { data, error } = await supabase
    .from('experience_tags')
    .select('*')
    .eq('category', category)
    .order('name')

  if (error) {
    console.error('Error fetching experience tags by category:', error)
    throw new Error(`Failed to fetch experience tags: ${error.message}`)
  }

  return data || []
}

// Save a review to the database
export async function saveReview(
  formData: ReviewFormData, 
  userId: string
): Promise<{ success: boolean; error?: string; reviewId?: string }> {
  try {
    console.log('=== saveReview START ===')
    console.log('formData:', formData)
    console.log('userId:', userId)
    
    // Validate required fields
    if (!formData.place_id) {
      throw new Error('Place ID is required')
    }
    if (!formData.overall_rating) {
      throw new Error('Rating is required')
    }
    if (!formData.visit_date) {
      throw new Error('Visit date is required')
    }
    
    // Prepare review data
    const reviewData = {
      user_id: userId,
      place_id: formData.place_id,
      overall_rating: formData.overall_rating,
      price_range: formData.price_range || null,
      comment: formData.comment || null,
      visit_date: formData.visit_date
    }

    console.log('Inserting review:', reviewData)

    // Insert the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select('id')
      .single()

    if (reviewError) {
      console.error('Review insert error:', reviewError)
      throw new Error(`Failed to save review: ${reviewError.message}`)
    }

    console.log('Review saved:', review)

    // If experience tags were selected, create the associations
    if (formData.experience_tag_ids && formData.experience_tag_ids.length > 0) {
      console.log('Experience tag IDs from form:', formData.experience_tag_ids);
      
      const tagAssociations = formData.experience_tag_ids.map(tagId => ({
        review_id: review.id,
        experience_tag_id: tagId,
        sentiment_score: 0.5 // Default neutral sentiment
      }))

      console.log('Inserting tag associations:', tagAssociations)

      const { data: insertedTags, error: tagsError } = await supabase
        .from('review_experience_tags')
        .insert(tagAssociations)
        .select('*')

      if (tagsError) {
        console.error('Tags insert error:', tagsError)
        console.error('Tags error details:', JSON.stringify(tagsError, null, 2))
        // Don't fail the whole operation if tags fail, but log it prominently
        console.warn('⚠️ Failed to save experience tags, but review was saved')
      } else {
        console.log('✅ Successfully inserted tags:', insertedTags)
      }
    } else {
      console.log('⚠️ No experience_tag_ids in formData. Tags will not be saved.')
      console.log('formData keys:', Object.keys(formData))
    }

    console.log('=== saveReview SUCCESS ===')
    
    // Generate embedding for the review (non-blocking)
    generateReviewEmbedding(review.id).catch(error => {
      console.error('Failed to generate review embedding:', error)
    })
    
    return { 
      success: true, 
      reviewId: review.id 
    }

  } catch (error) {
    console.error('=== saveReview ERROR ===', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Get reviews for a specific place with experience tags
export async function getPlaceReviews(placeId: string): Promise<ReviewWithTags[]> {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        review_experience_tags (
          sentiment_score,
          experience_tag_id,
          experience_tags (*)
        )
      `)
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching place reviews:', error)
      throw error
    }

    // Transform the data to flatten experience tags
    return reviews?.map(review => ({
      ...review,
      experience_tags: review.review_experience_tags?.map((ret: { experience_tags: ExperienceTag }) => ret.experience_tags) || []
    })) || []

  } catch (error) {
    console.error('Error in getPlaceReviews:', error)
    throw error
  }
}

// Get reviews by a specific user with experience tags
export async function getUserReviews(userId: string): Promise<ReviewWithTags[]> {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        places (
          name,
          category
        ),
        review_experience_tags (
          sentiment_score,
          experience_tags (*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user reviews:', error)
      throw error
    }

    // Transform the data
    return reviews?.map(review => ({
      ...review,
      place: review.places,
      experience_tags: review.review_experience_tags?.map((ret: { experience_tags: ExperienceTag }) => ret.experience_tags) || []
    })) || []

  } catch (error) {
    console.error('Error in getUserReviews:', error)
    throw error
  }
}

// Update a review
export async function updateReview(
  reviewId: string,
  updates: Partial<ReviewFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Partial<{
      overall_rating: number;
      price_range: string | null;
      comment: string | null;
      visit_date: string;
    }> = {}
    
    if (updates.overall_rating !== undefined) updateData.overall_rating = updates.overall_rating
    if (updates.price_range !== undefined) updateData.price_range = updates.price_range || null
    if (updates.comment !== undefined) updateData.comment = updates.comment || null
    if (updates.visit_date !== undefined) updateData.visit_date = updates.visit_date

    const { error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)

    if (error) {
      throw new Error(`Failed to update review: ${error.message}`)
    }

    // If experience tags were provided, update them
    if (updates.experience_tag_ids !== undefined) {
      // Delete existing tags
      await supabase
        .from('review_experience_tags')
        .delete()
        .eq('review_id', reviewId)

      // Insert new tags
      if (updates.experience_tag_ids.length > 0) {
        const tagAssociations = updates.experience_tag_ids.map(tagId => ({
          review_id: reviewId,
          experience_tag_id: tagId,
          sentiment_score: 0.5
        }))

        await supabase
          .from('review_experience_tags')
          .insert(tagAssociations)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating review:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Cascading delete will automatically remove review_experience_tags
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      throw new Error(`Failed to delete review: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting review:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
