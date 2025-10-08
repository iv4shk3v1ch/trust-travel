-- FIX: Update category constraints to match our data standards
-- This script will remove the old constraint and add a new one with our categories

-- Step 1: Drop the existing category check constraint
-- (Replace 'places_category_check' with the actual constraint name from the diagnostic query)
ALTER TABLE places DROP CONSTRAINT IF EXISTS places_category_check;
ALTER TABLE places DROP CONSTRAINT IF EXISTS category_check;
ALTER TABLE places DROP CONSTRAINT IF EXISTS places_category_constraint;

-- Step 2: Add new check constraint with our standardized categories
ALTER TABLE places ADD CONSTRAINT places_category_check 
CHECK (category IN (
    'restaurant',
    'bar', 
    'coffee-shop',
    'fast-food',
    'hotel',
    'hostel',
    'vacation-rental',
    'club',
    'theater',
    'music-venue',
    'museum',
    'historical-site',
    'religious-site',
    'park',
    'beach',
    'hiking-trail',
    'viewpoint',
    'adventure-activity',
    'water-activity',
    'sports-facility',
    'shopping',
    'spa-wellness',
    'transport-hub',
    'attraction',
    'event-venue'
));

-- Step 3: Test if we can now insert a sample row
-- (This should work now)
-- INSERT INTO places (name, category, city, created_by) 
-- VALUES ('Test Restaurant', 'restaurant', 'Test City', auth.uid());

-- Step 4: Clean up test data (uncomment if you inserted test data)
-- DELETE FROM places WHERE name = 'Test Restaurant';

SELECT 'Category constraint updated successfully!' as status;
