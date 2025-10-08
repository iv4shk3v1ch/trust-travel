import { supabase } from '@/core/database/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const { error: connectionError } = await supabase
      .from('_raw')
      .select('1')
      .eq('1', '1') // This is just to test the connection
      .limit(1);

    if (connectionError) {
      console.error('Database connection error:', connectionError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Since we can't run DDL directly through supabase-js, return the SQL
    return NextResponse.json({ 
      message: 'Please run this SQL in your Supabase SQL editor',
      sql: `
-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    visit_date DATE NOT NULL,
    tags TEXT[] DEFAULT '{}',
    review_text TEXT,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quick_reviews table  
CREATE TABLE IF NOT EXISTS public.quick_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
    place_name TEXT NOT NULL,
    satisfaction INTEGER NOT NULL CHECK (satisfaction >= 1 AND satisfaction <= 5),
    value INTEGER NOT NULL CHECK (value >= 1 AND value <= 5),
    context_tags TEXT[] DEFAULT '{}',
    comment TEXT,
    visit_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_place_name ON public.reviews(place_name);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_tags ON public.reviews USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_quick_reviews_user_id ON public.quick_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_reviews_place_id ON public.quick_reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_quick_reviews_place_name ON public.quick_reviews(place_name);
CREATE INDEX IF NOT EXISTS idx_quick_reviews_created_at ON public.quick_reviews(created_at);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reviews
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

-- Create RLS policies for quick_reviews
CREATE POLICY "Users can view all quick reviews"
    ON public.quick_reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own quick reviews"
    ON public.quick_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quick reviews"
    ON public.quick_reviews FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick reviews"
    ON public.quick_reviews FOR DELETE
    USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON public.reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    }, { status: 200 });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed', details: error }, { status: 500 });
  }
}
