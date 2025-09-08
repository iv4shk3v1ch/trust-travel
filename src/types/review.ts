export interface Review {
  id: string;
  userId: string;
  placeName: string;
  rating: number; // 1-5 stars
  visitDate: string; // ISO date string
  tags: string[];
  reviewText?: string;
  photos?: string[]; // URLs to uploaded photos
  createdAt: string;
  updatedAt: string;
}

export interface QuickReview {
  id: string;
  userId: string;
  placeId: string;
  placeName: string;
  satisfaction: number; // 1-5 emoji scale
  value: number; // 1-5 emoji scale
  contextTags: string[];
  comment?: string;
  visitDate: string; // ISO date string
  createdAt: string;
}

export interface ReviewFormData {
  placeName: string;
  rating: number;
  visitDate: string;
  tags: string[];
  reviewText: string;
  photos: File[];
}

export interface QuickReviewFormData {
  placeName: string;
  satisfaction: number;
  value: number;
  contextTags: string[];
  comment?: string;
  visitDate: string;
}

export const CONTEXT_TAGS = [
  'family-friendly',
  'romantic',
  'budget-friendly',
  'luxury',
  'outdoor',
  'historical',
  'cultural',
  'food',
  'shopping',
  'nature',
  'relaxing',
  'scenic',
  'crowded',
  'local-favorite'
] as const;

export const REVIEW_TAGS = [
  'dog-friendly',
  'vegan',
  'family-friendly',
  'romantic',
  'budget-friendly',
  'luxury',
  'outdoor',
  'historical',
  'cultural',
  'nightlife',
  'food',
  'shopping',
  'nature',
  'adventure',
  'relaxing',
  'accessible',
  'scenic',
  'crowded',
  'quiet',
  'local-favorite'
] as const;

export type ReviewTag = typeof REVIEW_TAGS[number];
export type ContextTag = typeof CONTEXT_TAGS[number];
