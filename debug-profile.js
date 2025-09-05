const { createClient } = require('@supabase/supabase-js');

// Set up environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://jrrkgppccaavynjlpbnn.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpycmtncHBjY2FhdnluamxwYm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTUzNzMsImV4cCI6MjA3MDA3MTM3M30.ycDWdBqjDw2hbn7HToQFakLvypwNpLvfyMJrssDvvVg";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Test sample profile data
const testProfile = {
  id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
  full_name: 'Test User',
  age: 25,
  gender: 'male',
  budget_level: 'medium',
  activities: ['hiking', 'museums'],
  place_types: ['mountains', 'cities'],
  food_preferences: ['local cuisine'],
  food_restrictions: [],
  avoid_places: [],
  personality_traits: ['adventurous'],
  trip_style: 'planned'
};

async function testProfileSave() {
  try {
    console.log('Testing profile save with data:', testProfile);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(testProfile);
      
    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Insert successful:', data);
      
      // Verify it was saved
      const { data: retrieved, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testProfile.id);
        
      if (selectError) {
        console.error('Select error:', selectError);
      } else {
        console.log('Retrieved profile:', retrieved);
      }
      
      // Clean up
      await supabase.from('profiles').delete().eq('id', testProfile.id);
    }
  } catch (err) {
    console.error('Caught error:', err);
  }
}

testProfileSave();
