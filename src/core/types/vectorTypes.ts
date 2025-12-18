/**
 * Vector and Embedding Types
 * Types for vector-first recommendation system
 */

// Vector dimension constant
export const EMBEDDING_DIMENSION = 384;

// Embedding model identifier
export const EMBEDDING_MODEL = 'all-MiniLM-L6-v2';

/**
 * Vector type (384-dimensional array)
 */
export type Vector = number[];

/**
 * Interaction weight entry
 */
export interface InteractionWeight {
  action_type: string;
  weight: number;
  description: string;
  created_at: string;
}

/**
 * Interaction action types
 */
export type InteractionActionType =
  // High-signal interactions
  | 'review_submit'
  | 'save'
  | 'navigate'
  | 'share'
  // Medium-signal interactions
  | 'like'
  | 'call'
  | 'website'
  | 'compare'
  // Low-signal interactions
  | 'view'
  | 'quick_view'
  | 'click'
  | 'filter'
  // Negative signals
  | 'dislike'
  | 'hide'
  // Neutral/tracking only
  | 'hover'
  | 'scroll_past'
  | 'search'
  | 'chatbot_query'
  | 'review_start';

/**
 * Embedding metadata
 */
export interface EmbeddingMetadata {
  model: string;
  dimension: number;
  generated_at: string;
  text_source?: string;
}

/**
 * Vector search result (from database function)
 */
export interface VectorSearchResult {
  place_id: string;
  place_name: string;
  place_type: string;
  city: string;
  similarity: number;
  avg_rating: number;
  review_count: number;
}

/**
 * Similar user result (for collaborative filtering)
 */
export interface SimilarUserResult {
  user_id: string;
  similarity: number;
}

/**
 * Embedding generation request
 */
export interface EmbeddingRequest {
  text: string;
  context?: 'place' | 'user' | 'review';
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Embedding generation response
 */
export interface EmbeddingResponse {
  embedding: Vector;
  dimension: number;
  model: string;
  generated_at: string;
}

/**
 * Learning rate configuration for incremental updates
 */
export interface LearningConfig {
  alpha: number; // How much to keep from old vector (0-1)
  max_weight: number; // Maximum weight for single interaction
  normalize: boolean; // Whether to normalize after update
}
