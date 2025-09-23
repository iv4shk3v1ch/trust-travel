-- DIAGNOSTIC SCRIPT: Check current places table structure
-- Run this FIRST to see what columns you currently have

-- Check current table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'places'
ORDER BY ordinal_position;

-- Check if the table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'places') 
        THEN 'Table "places" exists'
        ELSE 'Table "places" does not exist'
    END as table_status;

-- Check current row count
SELECT COUNT(*) as current_place_count FROM places;

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'places';

-- Check existing policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'places';
