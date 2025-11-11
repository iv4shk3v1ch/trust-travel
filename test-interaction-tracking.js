#!/usr/bin/env node

/**
 * Test script for user interaction tracking
 * Run this to verify the tracking system works
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables (you'll need to set these)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInteractionTracking() {
  console.log('🔍 Testing User Interaction Tracking System\n');

  try {
    // Test 1: Check if user_interactions table exists
    console.log('1. Checking user_interactions table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_interactions')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      console.error('❌ user_interactions table not accessible:', tableError.message);
      return;
    }
    console.log('✅ user_interactions table exists');

    // Test 2: Insert a test interaction
    console.log('\n2. Testing interaction insertion...');
    const testInteraction = {
      user_id: null, // Anonymous test
      place_id: null, // General interaction
      action_type: 'view',
      session_id: 'test-session-' + Date.now(),
      metadata: {
        page: 'test',
        source: 'test_script',
        test: true,
        timestamp: new Date().toISOString()
      }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('user_interactions')
      .insert(testInteraction)
      .select();

    if (insertError) {
      console.error('❌ Failed to insert test interaction:', insertError.message);
      return;
    }
    console.log('✅ Test interaction inserted successfully');

    // Test 3: Query recent interactions
    console.log('\n3. Querying recent interactions...');
    const { data: recentData, error: queryError } = await supabase
      .from('user_interactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (queryError) {
      console.error('❌ Failed to query interactions:', queryError.message);
      return;
    }

    console.log('✅ Recent interactions:');
    recentData.forEach((interaction, index) => {
      console.log(`   ${index + 1}. ${interaction.action_type} - ${interaction.metadata?.source || 'unknown'} (${new Date(interaction.created_at).toLocaleString()})`);
    });

    // Test 4: Check metadata structure
    console.log('\n4. Analyzing metadata structure...');
    const metadataFields = new Set();
    recentData.forEach(interaction => {
      if (interaction.metadata) {
        Object.keys(interaction.metadata).forEach(key => {
          metadataFields.add(key);
        });
      }
    });

    console.log('✅ Metadata fields found:', Array.from(metadataFields).join(', '));

    // Test 5: Clean up test data
    console.log('\n5. Cleaning up test data...');
    const { error: cleanupError } = await supabase
      .from('user_interactions')
      .delete()
      .eq('session_id', testInteraction.session_id);

    if (cleanupError) {
      console.warn('⚠️  Could not clean up test data:', cleanupError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 All tests passed! Your interaction tracking system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testInteractionTracking();
}

module.exports = { testInteractionTracking };