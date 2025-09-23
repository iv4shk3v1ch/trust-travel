import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing database connection and reviews table...')
    
    // Test 1: Basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('reviews')
      .select('count')
      .limit(1)

    if (connectionError) {
      console.error('Connection/table error:', connectionError)
      return NextResponse.json({
        success: false,
        error: 'Database connection or table error',
        details: connectionError.message,
        hint: connectionError.hint,
        code: connectionError.code
      }, { status: 500 })
    }

    // Test 2: Check table structure
    const { data: structureTest } = await supabase
      .from('reviews')
      .select('*')
      .limit(1)

    console.log('Database tests passed')
    return NextResponse.json({
      success: true,
      message: 'Reviews table exists and is accessible',
      connectionTest,
      structureTest
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Test inserting a sample review (will be rolled back)
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      place_id: '00000000-0000-0000-0000-000000000001', // dummy UUID
      place_name: 'Test Place',
      place_category: 'restaurant',
      ratings: { overall: 5 },
      experience_tags: ['test'],
      comment: 'Test review',
      photos: [],
      visit_date: new Date().toISOString().split('T')[0]
    }

    console.log('Testing review insert with data:', testData)

    const { data, error } = await supabase
      .from('reviews')
      .insert([testData])
      .select('id')

    if (error) {
      console.error('Insert test error:', error)
      return NextResponse.json({
        success: false,
        error: 'Insert test failed',
        details: error.message,
        hint: error.hint,
        code: error.code,
        testData
      }, { status: 500 })
    }

    // Clean up test data
    if (data && data.length > 0) {
      await supabase
        .from('reviews')
        .delete()
        .eq('id', data[0].id)
    }

    return NextResponse.json({
      success: true,
      message: 'Insert test passed',
      testId: data?.[0]?.id
    })

  } catch (error) {
    console.error('Insert test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Insert test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
