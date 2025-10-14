-- =====================================================
-- VERIFICATION SCRIPT: Check coordinates migration
-- =====================================================
-- Run this after the coordinates migration to verify everything worked
-- =====================================================

-- Check if coordinate columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'places' 
    AND column_name IN ('latitude', 'longitude')
ORDER BY column_name;

-- Show all places with their coordinates
SELECT 
    name,
    category,
    city,
    latitude,
    longitude,
    CASE 
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
        THEN '✅ Has coordinates' 
        ELSE '❌ Missing coordinates' 
    END as coordinate_status,
    created_at
FROM places 
WHERE city = 'Trento'
ORDER BY name;

-- Count places with and without coordinates
SELECT 
    CASE 
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
        THEN 'With coordinates' 
        ELSE 'Without coordinates' 
    END as status,
    COUNT(*) as count
FROM places 
WHERE city = 'Trento'
GROUP BY 
    CASE 
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
        THEN 'With coordinates' 
        ELSE 'Without coordinates' 
    END;

-- Test the distance calculation function (if created)
-- This will show distances from Trento city center
SELECT 
    name,
    category,
    ROUND(calculate_distance_km(46.0678, 11.1211, latitude, longitude)::numeric, 2) as distance_km
FROM places 
WHERE city = 'Trento' 
    AND latitude IS NOT NULL 
    AND longitude IS NOT NULL
ORDER BY distance_km;

-- Show coordinate bounds (to verify they're reasonable for Trento area)
SELECT 
    'Latitude' as coordinate_type,
    MIN(latitude) as min_value,
    MAX(latitude) as max_value,
    AVG(latitude) as avg_value
FROM places 
WHERE city = 'Trento' AND latitude IS NOT NULL
UNION ALL
SELECT 
    'Longitude' as coordinate_type,
    MIN(longitude) as min_value,
    MAX(longitude) as max_value,
    AVG(longitude) as avg_value
FROM places 
WHERE city = 'Trento' AND longitude IS NOT NULL;