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

export interface ReviewFormData {
  placeName: string;
  rating: number;
  visitDate: string;
  tags: string[];
  reviewText: string;
  photos: File[];
}

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
