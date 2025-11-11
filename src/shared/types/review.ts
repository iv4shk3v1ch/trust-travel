// Updated to match new simplified database schema
export interface Review {
  id: string;
  user_id: string;
  place_id: string;
  price_range: string | null; // '0-10', '10-20', '20-35', '35-50', '50-75', '75-100', '100+'
  comment: string | null;
  visit_date: string; // date (YYYY-MM-DD)
  overall_rating: number | null; // 0-5, decimal(2,1)
  created_at: string;
  updated_at: string;
  review_embedding?: number[]; // vector field (optional when reading)
  embedding_model?: string | null;
  embedding_updated_at?: string | null;
}

export interface ExperienceTag {
  id: string;
  name: string;
  slug: string;
  category: string; // e.g., 'atmosphere', 'activity', 'food', 'service'
  icon?: string | null;
  description?: string | null;
  created_at: string;
}

export interface ReviewExperienceTag {
  review_id: string;
  experience_tag_id: string;
  sentiment_score: number; // 0-1, default 0.5
  created_at: string;
}

// For displaying reviews with their tags
export interface ReviewWithTags extends Review {
  experience_tags?: ExperienceTag[];
  place?: {
    name: string;
    category: string;
  };
}

export interface ReviewFormData {
  place_id: string;
  overall_rating: number;
  visit_date: string;
  experience_tag_ids: string[]; // IDs of selected experience tags
  price_range?: string;
  comment?: string;
}

// Price range options for food/dining places
export const PRICE_RANGES = [
  { value: '0-10', label: '$0-10 per person' },
  { value: '10-20', label: '$10-20 per person' },
  { value: '20-35', label: '$20-35 per person' },
  { value: '35-50', label: '$35-50 per person' },
  { value: '50-75', label: '$50-75 per person' },
  { value: '75-100', label: '$75-100 per person' },
  { value: '100+', label: '$100+ per person' }
] as const;
