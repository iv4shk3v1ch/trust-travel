import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   SCHEMA OPTIMIZATION MIGRATION                        ║');
  console.log('║   61 categories → 14 | 22 tags → 24 | Dynamic fields  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('🚀 Executing migration...\n');
  console.log('⚠️  This will:');
  console.log('   1. Backup current data (place_types_backup, experience_tags_backup)');
  console.log('   2. Create new 14-category system');
  console.log('   3. Migrate all places to new categories');
  console.log('   4. Update experience tags (24 tags)');
  console.log('   5. Make avg_rating & review_count dynamic');
  console.log('   6. Add price_range fields\n');

  // Ask for confirmation (in real scenario - for now just execute)
  try {
    // Note: Supabase client doesn't support raw SQL execution directly
    // You need to run this via Supabase dashboard SQL editor or CLI
    console.log('⚠️  IMPORTANT: This script needs to be run via Supabase SQL editor');
    console.log('');
    console.log('📋 Steps to run migration:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Create new query');
    console.log('   3. Copy contents from: supabase/migrations/20260120_schema_optimization.sql');
    console.log('   4. Run the query');
    console.log('   5. Come back here and run: npm run verify-migration\n');

    // Alternatively, we can test if migration was already run
    const { data: categories, error: catError } = await supabase
      .from('place_types')
      .select('*');

    if (catError) {
      console.error('❌ Error checking categories:', catError.message);
      return;
    }

    console.log(`\n📊 Current state: ${categories?.length || 0} categories`);

    if (categories && categories.length === 14) {
      console.log('✅ Migration appears to be complete! (14 categories found)');
      await verifyMigration();
    } else if (categories && categories.length > 20) {
      console.log('⏳ Migration not run yet (old system with many categories)');
      console.log('   Run the SQL file via Supabase dashboard');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function verifyMigration() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   VERIFYING MIGRATION                  ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Check categories
  const { data: categories } = await supabase.from('place_types').select('*');
  console.log(`✅ Categories: ${categories?.length || 0}`);
  if (categories && categories.length > 0) {
    console.log('   Categories:', categories.map(c => c.name).join(', '));
  }

  // Check experience tags
  const { data: tags } = await supabase.from('experience_tags').select('*');
  console.log(`\n✅ Experience Tags: ${tags?.length || 0}`);
  if (tags && tags.length > 0) {
    interface TagGroup {
      [category: string]: string[];
    }
    const grouped = tags.reduce((acc: TagGroup, tag: { category: string; name: string }) => {
      if (!acc[tag.category]) acc[tag.category] = [];
      acc[tag.category].push(tag.name);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([category, tagNames]) => {
      console.log(`   ${category}:`, (tagNames as string[]).join(', '));
    });
  }

  // Check places migrated
  const { count: placeCount } = await supabase
    .from('places')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Places: ${placeCount || 0} migrated`);

  // Check places_with_stats view exists
  const { data: statsTest, error: statsError } = await supabase
    .from('places_with_stats')
    .select('id, name, avg_rating, review_count')
    .limit(5);

  if (statsError) {
    console.log('\n⚠️  places_with_stats view not accessible');
    console.log('   Error:', statsError.message);
  } else {
    console.log('\n✅ places_with_stats view working');
    console.log('   Sample:');
    statsTest?.forEach(p => {
      console.log(`   - ${p.name}: ${p.avg_rating}⭐ (${p.review_count} reviews)`);
    });
  }

  // Check price fields
  const { data: priceCheck } = await supabase
    .from('places')
    .select('name, price_level, price_category, price_range_min, price_range_max')
    .not('price_category', 'is', null)
    .limit(5);

  console.log('\n✅ Price fields check:');
  if (priceCheck && priceCheck.length > 0) {
    priceCheck.forEach(p => {
      console.log(
        `   - ${p.name}: ${p.price_category} ` +
        `(${p.price_range_min || '?'}€ - ${p.price_range_max || '?'}€)`
      );
    });
  } else {
    console.log('   No places with price_category set yet');
  }

  // Test category distribution
  // Note: get_category_distribution RPC doesn't exist yet
  
  // Do it with regular query
  const { data: categoryDist } = await supabase
    .from('places')
    .select('place_type_id, place_types(name)')
    .limit(1000);

  if (categoryDist) {
    interface DistRecord {
      [catName: string]: number;
    }
    const dist = categoryDist.reduce((acc: DistRecord, p: { place_types?: { name: string } | null }) => {
      const catName = p.place_types?.name || 'Unknown';
      acc[catName] = (acc[catName] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Category Distribution (sample):');
    Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count}`);
      });
  }

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   VERIFICATION COMPLETE                ║');
  console.log('╚════════════════════════════════════════╝\n');
}

// Main execution
if (require.main === module) {
  runMigration().catch(console.error);
}

export { runMigration, verifyMigration };
