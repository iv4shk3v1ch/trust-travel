/**
 * Generate synthetic but realistic reviews and experience tags for Trento places
 * Uses Groq API to create human-like reviews based on place type
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local FIRST
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
);

// Create Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Place data interface
interface PlaceData {
  id: string;
  name: string;
  place_type: string;
  price_level?: string;
  indoor_outdoor?: string;
}

// Persona interface
interface Persona {
  age: number;
  style: string;
  budget: string;
  tone: string;
}

// Sample reviewer personas for variety
const PERSONAS: Persona[] = [
  { age: 25, style: 'student', budget: 'low', tone: 'casual' },
  { age: 35, style: 'professional', budget: 'medium', tone: 'detailed' },
  { age: 45, style: 'family', budget: 'medium', tone: 'practical' },
  { age: 28, style: 'foodie', budget: 'high', tone: 'enthusiastic' },
  { age: 60, style: 'tourist', budget: 'medium', tone: 'appreciative' },
  { age: 22, style: 'backpacker', budget: 'low', tone: 'adventurous' },
];

async function generateReviewForPlace(place: PlaceData, persona: Persona) {
  const prompt = `You are a ${persona.age}-year-old ${persona.style} visiting Trento, Italy.
Write a SHORT (2-3 sentences) authentic review for: ${place.name} (${place.place_type})

Place details:
- Type: ${place.place_type}
- Price level: ${place.price_level || 'medium'}
- Indoor/Outdoor: ${place.indoor_outdoor || 'mixed'}

Your persona:
- Budget: ${persona.budget}
- Style: ${persona.style}
- Tone: ${persona.tone}

Write a realistic review that mentions specific aspects (food quality, ambiance, service, value, etc.).
Be honest - give 3-5 stars based on quality. Not everything is perfect.
Make it feel REAL, not generic.

Return ONLY the review text, no quotes or extra formatting.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8, // Higher for variety
      max_tokens: 150,
    });

    const reviewText = completion.choices[0]?.message?.content?.trim() || '';
    
    // Generate rating based on review sentiment (simple heuristic)
    const positive = ['great', 'amazing', 'excellent', 'loved', 'perfect', 'best'].some(w => 
      reviewText.toLowerCase().includes(w)
    );
    const negative = ['bad', 'terrible', 'worst', 'avoid', 'disappointed'].some(w => 
      reviewText.toLowerCase().includes(w)
    );
    
    let rating = 4.0; // Default
    if (positive && !negative) rating = 4.5;
    if (positive && reviewText.includes('perfect')) rating = 5.0;
    if (negative) rating = 2.5;
    
    return { text: reviewText, rating };
  } catch (error) {
    console.error('Error generating review:', error);
    return null;
  }
}

async function assignExperienceTags(place: PlaceData, reviewText: string) {
  const prompt = `Based on this review of a ${place.place_type} in Trento:
"${reviewText}"

Select 2-4 MOST RELEVANT experience tags from this list (return ONLY the slugs, comma-separated):

BUDGET: luxury, budget-friendly
FOOD/DRINK: halal, vegeterian, gluten-free, great-drinks, great-food, vegan
OCCASION: date-spot, great-for-daytime, best-at-night, rainy-day-spot
SERVICE: quick-service, friendly-staff
SOCIAL: local-favorite, dj, family-friendly, pet-friendly, touristy, solo-friendly, perfect-for-couples, student-crowd, great-for-friends
VIBE: cozy, elegant, simple, romantic, live-music, scenic-view, trendy, authentic-local, peaceful, lively, hidden-gem, artsy

Rules:
- Pick tags that match the review content
- Don't add tags not mentioned in review
- Be selective (2-4 max)

Return format: slug1,slug2,slug3`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3, // Lower for consistency
      max_tokens: 50,
    });

    const tags = completion.choices[0]?.message?.content?.trim().split(',').map(t => t.trim()) || [];
    return tags;
  } catch (error) {
    console.error('Error assigning tags:', error);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting synthetic data generation for Trento places...\n');

  // 0. Get your user ID to use for reviews
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError || !authUsers || authUsers.users.length === 0) {
    console.error('❌ No users found. Please create at least one user account first.');
    return;
  }

  const userId = authUsers.users[0].id;
  console.log(`👤 Using user ID: ${userId}\n`);

  // 1. Get all places without reviews or with few reviews
  const { data: places, error } = await supabase
    .from('places')
    .select(`
      id,
      name,
      place_types!inner(name, slug),
      price_level,
      indoor_outdoor,
      reviews(count)
    `)
    .limit(50); // Process in batches

  if (error) {
    console.error('Error fetching places:', error);
    return;
  }

  console.log(`📍 Found ${places?.length || 0} places\n`);

  // 2. Get experience tags mapping
  const { data: allTags } = await supabase
    .from('experience_tags')
    .select('id, slug');

  const tagMap = new Map(allTags?.map(t => [t.slug, t.id]) || []);

  // 3. Generate reviews for each place
  let reviewsCreated = 0;
  let tagsAdded = 0;

  for (const place of places || []) {
    const placeData = {
      id: place.id,
      name: place.name,
      place_type: Array.isArray(place.place_types) ? place.place_types[0]?.name : 'Unknown',
      price_level: place.price_level,
      indoor_outdoor: place.indoor_outdoor,
    };

    // Generate 2-5 reviews per place
    const numReviews = Math.floor(Math.random() * 4) + 2;
    
    console.log(`\n📝 Generating ${numReviews} reviews for: ${placeData.name}`);

    for (let i = 0; i < numReviews; i++) {
      const persona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
      const reviewData = await generateReviewForPlace(placeData, persona);

      if (!reviewData) continue;

      // Insert review using your user ID
      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          user_id: userId, // Use real user ID
          place_id: place.id,
          comment: reviewData.text,
          overall_rating: reviewData.rating,
          visit_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date last year
        })
        .select()
        .single();

      if (reviewError) {
        console.error('  ❌ Error creating review:', reviewError);
        continue;
      }

      reviewsCreated++;
      console.log(`  ✅ Review ${i + 1}: ${reviewData.rating}⭐ "${reviewData.text.substring(0, 60)}..."`);

      // Assign experience tags
      const tagSlugs = await assignExperienceTags(placeData, reviewData.text);
      
      for (const slug of tagSlugs) {
        const tagId = tagMap.get(slug);
        if (tagId) {
          await supabase
            .from('review_experience_tags')
            .insert({
              review_id: review.id,
              experience_tag_id: tagId,
            });
          tagsAdded++;
        }
      }

      console.log(`  🏷️  Tags: ${tagSlugs.join(', ')}`);

      // Rate limit: wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n\n✨ GENERATION COMPLETE!');
  console.log(`📊 Stats:`);
  console.log(`   - Reviews created: ${reviewsCreated}`);
  console.log(`   - Experience tags added: ${tagsAdded}`);
  console.log(`   - Places processed: ${places?.length || 0}`);
}

main().catch(console.error);
