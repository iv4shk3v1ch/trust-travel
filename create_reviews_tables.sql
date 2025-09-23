-- =====================================================
-- REVIEWS TABLE MIGRATION FOR TRUST TRAVEL APP
-- =====================================================
-- This migration creates a single comprehensive reviews table
-- that matches the enhanced review form flow exactly.
-- 
-- Run this in your Supabase SQL Editor to create the table.
-- =====================================================

-- Drop table if it exists (for clean recreation)
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Create the comprehensive reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Place information (connected to places table)
    place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
    place_name TEXT NOT NULL, -- Denormalized for performance
    place_category TEXT NOT NULL, -- Denormalized for performance
    
    -- Rating system (flexible JSON to handle different rating types)
    -- For food places: {overall: 5, food_quality: 4, service: 5, atmosphere: 4}
    -- For service places: {overall: 5, service: 4}
    -- For experience places: {overall: 5}
    ratings JSONB NOT NULL DEFAULT '{}',
    
    -- Experience tags (array of strings)
    experience_tags TEXT[] DEFAULT '{}',
    
    -- Food price range (only for food places)
    food_price_range TEXT,
    
    -- Review content
    comment TEXT,
    photos TEXT[] DEFAULT '{}',
    
    -- Visit information
    visit_date DATE NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_place_category CHECK (
        place_category IN (
            'restaurant', 'bar', 'coffee-shop', 'fast-food',
            'hotel', 'hostel', 'vacation-rental',
            'museum', 'attraction', 'historical-site', 'religious-site',
            'park', 'beach', 'hiking-trail', 'viewpoint',
            'shopping', 'club', 'theater', 'music-venue',
            'spa-wellness', 'adventure-activity', 'water-activity', 'sports-facility',
            'transport-hub', 'event-venue'
        )
    ),
    CONSTRAINT valid_food_price_range CHECK (
        food_price_range IS NULL OR food_price_range IN (
            '0-10', '10-20', '20-35', '35-50', '50-75', '75-100', '100+'
        )
    ),
    CONSTRAINT valid_ratings CHECK (
        jsonb_typeof(ratings) = 'object'
    )
);

-- Create indexes for optimal performance
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_place_id ON public.reviews(place_id);
CREATE INDEX idx_reviews_place_name ON public.reviews(place_name);
CREATE INDEX idx_reviews_place_category ON public.reviews(place_category);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_visit_date ON public.reviews(visit_date DESC);
CREATE INDEX idx_reviews_experience_tags ON public.reviews USING GIN(experience_tags);
CREATE INDEX idx_reviews_ratings ON public.reviews USING GIN(ratings);
CREATE INDEX idx_reviews_food_price_range ON public.reviews(food_price_range);

-- Create composite indexes for common queries
CREATE INDEX idx_reviews_place_rating ON public.reviews(place_id, ((ratings->>'overall')::numeric));
CREATE INDEX idx_reviews_user_place ON public.reviews(user_id, place_id);
CREATE INDEX idx_reviews_category_date ON public.reviews(place_category, visit_date DESC);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all reviews"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON public.reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;

-- Create helpful views for analytics
CREATE VIEW public.place_review_stats AS
SELECT 
    p.id as place_id,
    p.name as place_name,
    p.category as place_category,
    COUNT(r.id) as review_count,
    ROUND(AVG((r.ratings->>'overall')::numeric), 2) as avg_overall_rating,
    ROUND(AVG((r.ratings->>'service')::numeric), 2) as avg_service_rating,
    ROUND(AVG((r.ratings->>'food_quality')::numeric), 2) as avg_food_rating,
    ROUND(AVG((r.ratings->>'atmosphere')::numeric), 2) as avg_atmosphere_rating,
    MIN(r.created_at) as first_review_date,
    MAX(r.created_at) as latest_review_date
FROM public.places p
LEFT JOIN public.reviews r ON p.id = r.place_id
GROUP BY p.id, p.name, p.category;

-- Grant permissions on the view
GRANT SELECT ON public.place_review_stats TO authenticated, anon;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This table supports the complete review flow:
-- 1. Place selection (place_id, place_name, place_category)
-- 2. Dynamic ratings based on place type (ratings JSONB)
-- 3. Experience tags selection (experience_tags array)
-- 4. Food price range for restaurants (food_price_range)
-- 5. Optional photo upload (photos array)
-- 6. Optional text comment (comment)
-- 7. Visit date (visit_date, defaults to today)
-- 8. Automatic timestamps and user tracking
-- =====================================================
