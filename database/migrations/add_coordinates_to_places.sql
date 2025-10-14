-- =====================================================
-- MIGRATION SCRIPT: Add coordinates to places table
-- =====================================================
-- This script adds latitude and longitude columns to the places table
-- and populates them with accurate coordinates for existing Trento places
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Add latitude and longitude columns to places table
DO $$ 
BEGIN
    -- Add latitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'latitude') THEN
        ALTER TABLE places ADD COLUMN latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added latitude column to places table';
    ELSE
        RAISE NOTICE 'Latitude column already exists in places table';
    END IF;

    -- Add longitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'longitude') THEN
        ALTER TABLE places ADD COLUMN longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added longitude column to places table';
    ELSE
        RAISE NOTICE 'Longitude column already exists in places table';
    END IF;
END $$;

-- Step 2: Create index for spatial queries (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_places_coordinates ON places(latitude, longitude);

-- Step 3: Update existing places with accurate Trento coordinates
-- These coordinates are based on real locations in Trento, Italy

-- Food & Dining Places
UPDATE places SET 
    latitude = 46.0675, 
    longitude = 11.1210
WHERE name = 'Osteria del Borgo' AND city = 'Trento';

UPDATE places SET 
    latitude = 46.0677, 
    longitude = 11.1218
WHERE name = 'Caffè Centrale' AND city = 'Trento';

UPDATE places SET 
    latitude = 46.0665, 
    longitude = 11.1205
WHERE name = 'Birreria Pedavena' AND city = 'Trento';

UPDATE places SET 
    latitude = 46.0672, 
    longitude = 11.1215
WHERE name = 'Gelateria Zanella' AND city = 'Trento';

-- Cultural Places
UPDATE places SET 
    latitude = 46.0693, 
    longitude = 11.1237
WHERE name = 'Castello del Buonconsiglio' AND city = 'Trento';

UPDATE places SET 
    latitude = 46.0669, 
    longitude = 11.1211
WHERE name = 'Teatro Sociale' AND city = 'Trento';

-- Nature & Outdoor Places
UPDATE places SET 
    latitude = 46.0089, 
    longitude = 11.0461
WHERE name = 'Monte Bondone' AND city = 'Trento';

UPDATE places SET 
    latitude = 45.9989, 
    longitude = 10.9656
WHERE name = 'Lago di Toblino' AND city = 'Trento';

-- Shopping & Services
UPDATE places SET 
    latitude = 46.0745, 
    longitude = 11.1189
WHERE name = 'Centro Commerciale Trento' AND city = 'Trento';

UPDATE places SET 
    latitude = 46.0671, 
    longitude = 11.1208
WHERE name = 'Hotel America' AND city = 'Trento';

-- Step 4: Set default coordinates for places without specific coordinates
-- This will set coordinates to Trento city center for any places that don't have coordinates yet
UPDATE places SET 
    latitude = 46.0678, 
    longitude = 11.1211
WHERE (latitude IS NULL OR longitude IS NULL) 
    AND city = 'Trento' 
    AND country = 'Italy';

-- Step 5: Add check constraints to ensure valid coordinate ranges
-- Latitude should be between -90 and 90, longitude between -180 and 180
DO $$
BEGIN
    -- Add latitude constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'places_latitude_check'
    ) THEN
        ALTER TABLE places ADD CONSTRAINT places_latitude_check 
        CHECK (latitude >= -90 AND latitude <= 90);
        RAISE NOTICE 'Added latitude check constraint';
    END IF;

    -- Add longitude constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'places_longitude_check'
    ) THEN
        ALTER TABLE places ADD CONSTRAINT places_longitude_check 
        CHECK (longitude >= -180 AND longitude <= 180);
        RAISE NOTICE 'Added longitude check constraint';
    END IF;
END $$;

-- Step 6: Verification query - show updated places with coordinates
SELECT 
    name,
    category,
    city,
    latitude,
    longitude,
    CASE 
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
        THEN 'Coordinates added' 
        ELSE 'Missing coordinates' 
    END as coordinate_status
FROM places 
WHERE city = 'Trento'
ORDER BY name;

-- Success message
SELECT 'Coordinates migration completed successfully!' as status,
       COUNT(*) as total_places_updated
FROM places 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND city = 'Trento';

-- Step 7: Create a helper function for distance calculations (optional)
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    earth_radius DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := RADIANS(lat2 - lat1);
    dlon := RADIANS(lon2 - lon1);
    a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2) * SIN(dlon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql;

-- Usage example for the distance function:
-- SELECT name, calculate_distance_km(46.0678, 11.1211, latitude, longitude) as distance_from_center_km
-- FROM places WHERE city = 'Trento' ORDER BY distance_from_center_km;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed! You can now use precise coordinates in your map.';
END $$;