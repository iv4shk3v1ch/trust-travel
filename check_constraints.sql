-- DIAGNOSTIC: Check current database constraints and allowed values
-- Run this first to see what's causing the constraint violation

-- 1. Check what check constraints exist on the places table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'places'::regclass 
AND contype = 'c';

-- 2. Check current category values in the table (if any)
SELECT DISTINCT category FROM places;

-- 3. Check the table structure to see column definitions
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'places'
ORDER BY ordinal_position;

-- 4. Show any enum types that might be defined for categories
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%category%' OR t.typname LIKE '%place%'
ORDER BY t.typname, e.enumsortorder;
