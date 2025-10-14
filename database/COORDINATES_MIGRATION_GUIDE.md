# Database Coordinates Migration

This guide explains how to add precise coordinates to your places table for accurate map positioning.

## Migration Files

### 1. `add_coordinates_to_places.sql`
The main migration script that:
- Adds `latitude` and `longitude` columns to the places table
- Populates existing Trento places with accurate coordinates
- Adds validation constraints and database indexes
- Includes a distance calculation helper function

### 2. `verify_coordinates_migration.sql`
A verification script to check that the migration worked correctly.

## How to Run the Migration

### Step 1: Apply the Migration
1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `add_coordinates_to_places.sql`
4. Click "Run" to execute the migration

### Step 2: Verify the Migration
1. In the same SQL Editor, run the contents of `verify_coordinates_migration.sql`
2. Check that all places now have coordinates
3. Verify the coordinates are reasonable for Trento, Italy

## Coordinate Details

The migration adds precise coordinates for these Trento places:

### Food & Dining
- **Osteria del Borgo**: 46.0675, 11.1210 (Historic center)
- **Caffè Centrale**: 46.0677, 11.1218 (Piazza Duomo)
- **Birreria Pedavena**: 46.0665, 11.1205 (Santa Croce area)
- **Gelateria Zanella**: 46.0672, 11.1215 (Via Manci)

### Cultural Places
- **Castello del Buonconsiglio**: 46.0693, 11.1237 (Historic castle)
- **Teatro Sociale**: 46.0669, 11.1211 (City center)

### Nature & Outdoor
- **Monte Bondone**: 46.0089, 11.0461 (Mountain plateau)
- **Lago di Toblino**: 45.9989, 10.9656 (Scenic lake)

### Shopping & Services
- **Centro Commerciale Trento**: 46.0745, 11.1189 (Via Brennero)
- **Hotel America**: 46.0671, 11.1208 (Historic center)

## Map Integration

After running the migration, your interactive map will automatically use the precise database coordinates instead of mock coordinates. The `InteractiveMap` component prioritizes database coordinates (`place.latitude`, `place.longitude`) over fallback positioning.

### Features Added
- **Precise positioning**: Real GPS coordinates for all places
- **Distance calculations**: Helper function to calculate distances between places
- **Validation**: Constraints ensure coordinates are within valid ranges
- **Performance**: Database indexes for fast coordinate queries

## Testing

After migration, test the map by:
1. Starting your Next.js application: `npm run dev`
2. Navigate to `/chatbot`
3. Ask for recommendations (e.g., "I want to try local restaurants")
4. Verify that places appear at their correct locations on the map

## Troubleshooting

### If coordinates don't appear:
1. Check the verification script output
2. Ensure the migration ran without errors
3. Verify your Supabase connection

### If map shows incorrect positions:
1. Check that the recommender service includes coordinate fields in queries
2. Verify the InteractiveMap component is using `place.latitude` and `place.longitude`
3. Clear browser cache and reload

## Future Enhancements

- Add coordinates for places in other cities
- Implement geocoding for automatically finding coordinates
- Add coordinate validation when users add new places
- Implement radius-based place filtering

## Notes

- Coordinates are stored as DECIMAL(10,8) for latitude and DECIMAL(11,8) for longitude
- This provides precision to approximately 1 meter
- The distance calculation function uses the Haversine formula for accurate results
- All coordinates are in the WGS84 coordinate system (standard GPS coordinates)