import { NextRequest, NextResponse } from 'next/server';
import { 
  generatePlaceEmbedding,
  generateReviewEmbedding,
  generateProfileEmbedding,
  batchGeneratePlaceEmbeddings,
  batchGenerateReviewEmbeddings,
  batchGenerateProfileEmbeddings
} from '@/core/services/freeEmbeddingService';

/**
 * POST /api/embeddings/generate
 * Generate or batch-generate embeddings for places, reviews, or profiles
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, batch, limit } = body;

    // Validate input
    if (!type || !['place', 'review', 'profile'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be: place, review, or profile' },
        { status: 400 }
      );
    }

    // Batch generation
    if (batch === true) {
      console.log(`📦 Batch generating ${type} embeddings...`);
      
      let result;
      if (type === 'place') {
        result = await batchGeneratePlaceEmbeddings(limit || 50);
      } else if (type === 'review') {
        result = await batchGenerateReviewEmbeddings(limit || 50);
      } else {
        result = await batchGenerateProfileEmbeddings(limit || 50);
      }

      return NextResponse.json({
        success: true,
        message: `Batch generation complete for ${type}s`,
        ...result
      });
    }

    // Single generation
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id for single generation' },
        { status: 400 }
      );
    }

    console.log(`🔧 Generating embedding for ${type} ${id}...`);

    try {
      if (type === 'place') {
        await generatePlaceEmbedding(id);
      } else if (type === 'review') {
        await generateReviewEmbedding(id);
      } else {
        await generateProfileEmbedding(id);
      }

      return NextResponse.json({
        success: true,
        message: `Embedding generated for ${type} ${id}`
      });
    } catch (genError) {
      return NextResponse.json(
        { success: false, error: `Failed to generate embedding for ${type} ${id}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in embeddings API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/embeddings/status
 * Get embedding generation status (how many items have embeddings)
 */
export async function GET() {
  try {
    const { supabase } = await import('@/core/database/supabase');

    // Count places with/without embeddings
    const { count: placesTotal } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true });

    const { count: placesWithEmbeddings } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .not('content_embedding', 'is', null);

    // Count reviews with/without embeddings
    const { count: reviewsTotal } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });

    const { count: reviewsWithEmbeddings } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .not('review_embedding', 'is', null);

    // Count profiles with/without embeddings
    const { count: profilesTotal } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: profilesWithEmbeddings } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('preference_embedding', 'is', null);

    return NextResponse.json({
      success: true,
      status: {
        places: {
          total: placesTotal || 0,
          withEmbeddings: placesWithEmbeddings || 0,
          pending: (placesTotal || 0) - (placesWithEmbeddings || 0)
        },
        reviews: {
          total: reviewsTotal || 0,
          withEmbeddings: reviewsWithEmbeddings || 0,
          pending: (reviewsTotal || 0) - (reviewsWithEmbeddings || 0)
        },
        profiles: {
          total: profilesTotal || 0,
          withEmbeddings: profilesWithEmbeddings || 0,
          pending: (profilesTotal || 0) - (profilesWithEmbeddings || 0)
        }
      }
    });

  } catch (error) {
    console.error('Error getting embedding status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
