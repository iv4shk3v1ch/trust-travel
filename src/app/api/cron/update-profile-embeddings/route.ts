import { NextRequest, NextResponse } from 'next/server'
import { batchGenerateProfileEmbeddings } from '@/core/services/freeEmbeddingService'

/**
 * Weekly cron job to regenerate profile embeddings
 * Runs every Sunday at 2 AM
 * Configured in vercel.json
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting weekly profile embeddings update...')
    
    // Regenerate all profile embeddings (batch of 1000)
    const result = await batchGenerateProfileEmbeddings(1000)

    console.log('Profile embeddings update complete:', result)

    return NextResponse.json({
      success: true,
      message: 'Profile embeddings updated successfully',
      stats: result
    })

  } catch (error) {
    console.error('Error updating profile embeddings:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update profile embeddings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
