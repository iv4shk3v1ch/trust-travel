-- MIGRATION SCRIPT: Update existing places table structure
-- Run this in your Supabase SQL editor to modify your existing places table

-- First, let's check what columns currently exist (run this to see your current structure)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'places';

-- Add missing columns to existing places table
-- Note: We'll add columns one by one with proper error handling

-- Add created_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'created_by') THEN
        ALTER TABLE places ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'name') THEN
        ALTER TABLE places ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'Unknown Place';
    END IF;
END $$;

-- Add category column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'category') THEN
        ALTER TABLE places ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'attraction';
    END IF;
END $$;

-- Add city column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'city') THEN
        ALTER TABLE places ADD COLUMN city VARCHAR(255) NOT NULL DEFAULT 'Unknown City';
    END IF;
END $$;

-- Add country column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'country') THEN
        ALTER TABLE places ADD COLUMN country VARCHAR(255);
    END IF;
END $$;

-- Add address column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'address') THEN
        ALTER TABLE places ADD COLUMN address TEXT;
    END IF;
END $$;

-- Add working_hours column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'working_hours') THEN
        ALTER TABLE places ADD COLUMN working_hours TEXT;
    END IF;
END $$;

-- Add website column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'website') THEN
        ALTER TABLE places ADD COLUMN website VARCHAR(500);
    END IF;
END $$;

-- Add phone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'phone') THEN
        ALTER TABLE places ADD COLUMN phone VARCHAR(50);
    END IF;
END $$;

-- Add photo_urls column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'photo_urls') THEN
        ALTER TABLE places ADD COLUMN photo_urls TEXT[];
    END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'created_at') THEN
        ALTER TABLE places ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'updated_at') THEN
        ALTER TABLE places ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add verified column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'verified') THEN
        ALTER TABLE places ADD COLUMN verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add description column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'places' AND column_name = 'description') THEN
        ALTER TABLE places ADD COLUMN description TEXT;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_places_city ON places(city);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_created_by ON places(created_by);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'places' AND rowsecurity = true
    ) THEN
        ALTER TABLE places ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Places are viewable by everyone" ON places;
DROP POLICY IF EXISTS "Users can insert places" ON places;
DROP POLICY IF EXISTS "Users can update own places" ON places;

-- Create RLS Policies
CREATE POLICY "Places are viewable by everyone" ON places
  FOR SELECT USING (true);

CREATE POLICY "Users can insert places" ON places
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own places" ON places
  FOR UPDATE USING (auth.uid() = created_by);

-- Create storage bucket for place photos (ignore error if exists)
DO $$ 
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('place-photos', 'place-photos', true);
EXCEPTION WHEN unique_violation THEN
    -- Bucket already exists, do nothing
    NULL;
END $$;

-- Drop existing storage policies if they exist and recreate them
DROP POLICY IF EXISTS "Place photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload place photos" ON storage.objects;

-- Storage policies
CREATE POLICY "Place photos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'place-photos');

CREATE POLICY "Users can upload place photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'place-photos' AND auth.role() = 'authenticated');

-- Success message
SELECT 'Places table migration completed successfully!' as status;
