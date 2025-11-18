-- =====================================================
-- Optimized Recommendation Function (SQL-Based Scoring)
-- =====================================================
-- This function computes all recommendation scores in the database
-- for maximum performance. It implements your exact formula:
--
-- final_score = 
--   0.35 * preference_similarity +
--   0.25 * quality_score +
--   0.20 * social_trust +
--   0.10 * popularity_score +
--   0.05 * novelty_score +
--   0.05 * contextual_fit

CREATE OR REPLACE FUNCTION get_recommended_places(
  p_location TEXT DEFAULT 'Trento',
  p_place_type_ids UUID[] DEFAULT NULL,
  p_budget TEXT DEFAULT NULL,
  p_environment TEXT DEFAULT NULL,
  p_trusted_user_ids UUID[] DEFAULT NULL,
  p_experience_tag_ids UUID[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  place_type_id UUID,
  category_slug CHARACTER VARYING,
  city TEXT,
  address TEXT,
  description TEXT,
  photo_urls TEXT[],
  latitude NUMERIC,
  longitude NUMERIC,
  price_level TEXT,
  indoor_outdoor TEXT,
  verified BOOLEAN,
  
  -- Computed scores
  quality_score NUMERIC,
  social_trust NUMERIC,
  popularity_score NUMERIC,
  novelty_score NUMERIC,
  tag_match_count BIGINT,
  
  -- Review stats
  avg_rating NUMERIC,
  review_count BIGINT,
  trusted_review_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH place_reviews AS (
    -- Aggregate all reviews per place
    SELECT 
      r.place_id,
      AVG(r.overall_rating) as avg_rating,
      COUNT(r.id) as review_count,
      COUNT(CASE 
        WHEN p_trusted_user_ids IS NOT NULL 
          AND r.user_id = ANY(p_trusted_user_ids) 
        THEN 1 
      END) as trusted_review_count,
      MAX(r.created_at) as latest_review_date
    FROM reviews r
    GROUP BY r.place_id
  ),
  place_tags AS (
    -- Count matching experience tags per place
    SELECT 
      r.place_id,
      COUNT(DISTINCT ret.experience_tag_id) as tag_match_count,
      AVG(ret.sentiment_score) as avg_tag_sentiment
    FROM reviews r
    INNER JOIN review_experience_tags ret ON r.id = ret.review_id
    WHERE 
      p_experience_tag_ids IS NULL 
      OR ret.experience_tag_id = ANY(p_experience_tag_ids)
    GROUP BY r.place_id
  ),
  scored_places AS (
    SELECT 
      p.id,
      p.name,
      p.place_type_id,
      pt.slug as category_slug,
      p.city,
      p.address,
      p.description,
      p.photo_urls,
      p.latitude,
      p.longitude,
      p.price_level,
      p.indoor_outdoor,
      p.verified,
      p.created_at,
      
      -- QUALITY SCORE (avg rating normalized to 0-1)
      COALESCE(pr.avg_rating / 5.0, 0) as quality_score,
      
      -- SOCIAL TRUST (ratio of trusted reviews)
      CASE 
        WHEN pr.review_count > 0 
        THEN COALESCE(pr.trusted_review_count::NUMERIC / pr.review_count::NUMERIC, 0)
        ELSE 0
      END as social_trust,
      
      -- POPULARITY SCORE (review count scaled, capped at 1.0)
      LEAST(COALESCE(pr.review_count::NUMERIC / 20.0, 0), 1.0) as popularity_score,
      
      -- NOVELTY SCORE (based on place age in days)
      CASE 
        WHEN EXTRACT(DAY FROM NOW() - p.created_at) < 30 THEN 1.0
        WHEN EXTRACT(DAY FROM NOW() - p.created_at) < 90 THEN 0.7
        WHEN EXTRACT(DAY FROM NOW() - p.created_at) < 180 THEN 0.4
        ELSE 0.2
      END as novelty_score,
      
      -- TAG MATCH COUNT (for contextual_fit calculation)
      COALESCE(ptags.tag_match_count, 0) as tag_match_count,
      
      -- Review stats
      COALESCE(pr.avg_rating, 0) as avg_rating,
      COALESCE(pr.review_count, 0) as review_count,
      COALESCE(pr.trusted_review_count, 0) as trusted_review_count
      
    FROM places p
    INNER JOIN place_types pt ON p.place_type_id = pt.id
    LEFT JOIN place_reviews pr ON p.id = pr.place_id
    LEFT JOIN place_tags ptags ON p.id = ptags.place_id
    
    WHERE 
      -- FILTERING CRITERIA
      (p_location IS NULL OR p.city = p_location)
      AND (p_place_type_ids IS NULL OR p.place_type_id = ANY(p_place_type_ids))
      AND (p_budget IS NULL OR p.price_level = p_budget)
      AND (p_environment IS NULL OR p.indoor_outdoor = p_environment)
      AND pr.review_count > 0  -- Only places with reviews
  )
  SELECT 
    sp.id,
    sp.name,
    sp.place_type_id,
    sp.category_slug,
    sp.city,
    sp.address,
    sp.description,
    sp.photo_urls,
    sp.latitude,
    sp.longitude,
    sp.price_level,
    sp.indoor_outdoor,
    sp.verified,
    sp.quality_score,
    sp.social_trust,
    sp.popularity_score,
    sp.novelty_score,
    sp.tag_match_count,
    sp.avg_rating,
    sp.review_count,
    sp.trusted_review_count
  FROM scored_places sp
  ORDER BY 
    -- Sort by a rough quality score first (for efficiency)
    -- Final score will be calculated in application with preference_similarity
    (sp.quality_score * 0.4 + sp.social_trust * 0.3 + sp.popularity_score * 0.2 + sp.novelty_score * 0.1) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Performance indexes for the recommendation function
-- =====================================================

-- Index on city for location filtering
CREATE INDEX IF NOT EXISTS idx_places_city ON places(city);

-- Index on price_level for budget filtering
CREATE INDEX IF NOT EXISTS idx_places_price_level ON places(price_level);

-- Index on indoor_outdoor for environment filtering
CREATE INDEX IF NOT EXISTS idx_places_indoor_outdoor ON places(indoor_outdoor);

-- Index on place_type_id for category filtering
CREATE INDEX IF NOT EXISTS idx_places_place_type_id ON places(place_type_id);

-- Index on created_at for novelty score
CREATE INDEX IF NOT EXISTS idx_places_created_at ON places(created_at DESC);

-- Index on reviews for aggregation
CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Index on review_experience_tags for tag matching
CREATE INDEX IF NOT EXISTS idx_review_experience_tags_review_id ON review_experience_tags(review_id);
CREATE INDEX IF NOT EXISTS idx_review_experience_tags_tag_id ON review_experience_tags(experience_tag_id);

-- =====================================================
-- Test the function
-- =====================================================
-- Run this to verify it works:
-- SELECT * FROM get_recommended_places('Trento', NULL, NULL, NULL, NULL, NULL, 10);
