/**
 * DATA STANDARDS FOR TRUST TRAVEL
 * 
 * This file defines standardized data structures, categories, and naming conventions
 * to ensure consistency across the application. All place categories, tags, and
 * review data should follow these standards.
 * 
 * DO NOT create variations or synonyms - stick to these exact terms.
 */

// ============================================================================
// PLACE CATEGORIES
// ============================================================================

/**
 * Standardized place categories - Use these exact names everywhere
 * Each category covers multiple sub-types to avoid duplication
 */
export const PLACE_CATEGORIES = {
  // Food & Drink
  RESTAURANT: 'restaurant',           // All dining: fine dining, casual, cafe
  BAR: 'bar',                        // All bars: pub, wine bar, cocktail bar, sports bar
  COFFEE_SHOP: 'coffee-shop',        // Coffee shops, tea houses, cafes with minimal food
  FAST_FOOD: 'fast-food',            // Fast food chains, quick service restaurants


  // Accommodation
  HOTEL: 'hotel',                    // Hotels, resorts, motels, inns
  HOSTEL: 'hostel',                  // Budget accommodation, backpacker hostels
  VACATION_RENTAL: 'vacation-rental', // Airbnb, apartments, houses, villas
  
  // Entertainment & Nightlife
  CLUB: 'club',                      // Nightclubs, dance clubs
  THEATER: 'theater',                // Theaters, cinemas, opera houses
  MUSIC_VENUE: 'music-venue',        // Concert halls, live music venues, karaoke
  
  // Culture & Education
  MUSEUM: 'museum',                  // Museums, galleries, exhibitions
  HISTORICAL_SITE: 'historical-site', // Monuments, ruins, heritage sites
  RELIGIOUS_SITE: 'religious-site',  // Churches, temples, mosques, synagogues
  
  // Nature & Outdoors
  PARK: 'park',                      // Parks, gardens, reserves
  BEACH: 'beach',                    // Beaches, lakeshores, waterfront
  HIKING_TRAIL: 'hiking-trail',      // Trails, nature walks, trekking routes
  VIEWPOINT: 'viewpoint',            // Scenic overlooks, observation decks
  
  // Activities & Sports
  ADVENTURE_ACTIVITY: 'adventure-activity', // Zip-lining, bungee, extreme sports
  WATER_ACTIVITY: 'water-activity',  // Diving, surfing, boating, swimming
  SPORTS_FACILITY: 'sports-facility', // Gyms, stadiums, courts, fields
  
  // Shopping & Services
  SHOPPING: 'shopping',              // Malls, markets, boutiques, stores
  SPA_WELLNESS: 'spa-wellness',      // Spas, wellness centers, massage
  
  // Transportation & Infrastructure
  TRANSPORT_HUB: 'transport-hub',    // Airports, train stations, bus terminals
  
  // Other
  ATTRACTION: 'attraction',          // Tourist attractions, landmarks
  EVENT_VENUE: 'event-venue',       // Convention centers, event spaces
} as const;

export type PlaceCategory = typeof PLACE_CATEGORIES[keyof typeof PLACE_CATEGORIES];

// ============================================================================
// EXPERIENCE TAGS
// ============================================================================

/**
 * Standardized experience tags - Use these exact names everywhere
 * These tags are designed for recommender systems and capture key dimensions:
 * - Who to visit with (social context)
 * - Main value proposition (what makes it special)
 * - Experience type and atmosphere
 * - Important practical considerations
 */
export const EXPERIENCE_TAGS = {
  // === SOCIAL CONTEXT (Who to visit with) ===
  ROMANTIC: 'romantic',              // Perfect for couples/dates
  FAMILY_FRIENDLY: 'family-friendly', // Good for families with children
  FRIENDS_GROUP: 'friends-group',     // Great for groups of friends
  SOLO_FRIENDLY: 'solo-friendly',     // Comfortable for solo travelers
  
  // === VALUE PROPOSITION (What makes it special) ===
  UNIQUE_ARCHITECTURE: 'unique-architecture', // Notable building/design
  EXCEPTIONAL_FOOD: 'exceptional-food',       // Outstanding culinary experience
  CULTURAL_IMMERSION: 'cultural-immersion',   // Authentic local culture
  SCENIC_BEAUTY: 'scenic-beauty',             // Beautiful views/natural beauty
  HISTORICAL_SIGNIFICANCE: 'historical-significance', // Important historical value
  
  // === ATMOSPHERE & EXPERIENCE TYPE ===
  RELAXING: 'relaxing',              // Calm, peaceful experience
  ENERGETIC: 'energetic',            // High energy, lively atmosphere
  INTIMATE: 'intimate',              // Small, cozy, personal setting
  AUTHENTIC_LOCAL: 'authentic-local', // Real local experience, not touristy
  
  // === PRACTICAL CONSIDERATIONS ===
  BUDGET_FRIENDLY: 'budget-friendly', // Good value, affordable
  LUXURY: 'luxury',                   // High-end, premium experience
  CROWD_LEVEL_LOW: 'crowd-level-low', // Usually not crowded
  CROWD_LEVEL_HIGH: 'crowd-level-high', // Usually busy/crowded
  QUICK_VISIT: 'quick-visit',         // Can be enjoyed in short time
  EXTENDED_STAY: 'extended-stay',     // Worth spending several hours
} as const;

export type ExperienceTag = typeof EXPERIENCE_TAGS[keyof typeof EXPERIENCE_TAGS];

// ============================================================================
// REVIEW STANDARDS
// ============================================================================

/**
 * Standardized review rating categories
 */
export const REVIEW_CATEGORIES = {
  OVERALL: 'overall',
  ATMOSPHERE: 'atmosphere',          // For restaurants, bars
  SERVICE: 'service',                // For restaurants, hotels, shops
  FOOD_QUALITY: 'food-quality',      // For restaurants/bars
} as const;

export type ReviewCategory = typeof REVIEW_CATEGORIES[keyof typeof REVIEW_CATEGORIES];

/**
 * Rating scales by place type - determines which categories to show
 */
export const RATING_SCALES_BY_PLACE_TYPE = {
  // Food places: Rate food, service, and atmosphere
  FOOD_PLACES: [
    PLACE_CATEGORIES.RESTAURANT,
    PLACE_CATEGORIES.BAR,
    PLACE_CATEGORIES.COFFEE_SHOP,
    PLACE_CATEGORIES.FAST_FOOD,
  ],
  
  // Service places: Rate overall experience and service
  SERVICE_PLACES: [
    PLACE_CATEGORIES.HOTEL,
    PLACE_CATEGORIES.HOSTEL,
    PLACE_CATEGORIES.SHOPPING,
    PLACE_CATEGORIES.MUSEUM,
    PLACE_CATEGORIES.CLUB,
    PLACE_CATEGORIES.THEATER,
    PLACE_CATEGORIES.MUSIC_VENUE,
    PLACE_CATEGORIES.SPA_WELLNESS,
    PLACE_CATEGORIES.ADVENTURE_ACTIVITY,
    PLACE_CATEGORIES.WATER_ACTIVITY,
    PLACE_CATEGORIES.SPORTS_FACILITY,
    PLACE_CATEGORIES.ATTRACTION,
    PLACE_CATEGORIES.EVENT_VENUE,
  ],
  
  // Experience places: Rate only overall experience
  EXPERIENCE_PLACES: [
    PLACE_CATEGORIES.PARK,
    PLACE_CATEGORIES.BEACH,
    PLACE_CATEGORIES.HIKING_TRAIL,
    PLACE_CATEGORIES.VIEWPOINT,
    PLACE_CATEGORIES.RELIGIOUS_SITE,
    PLACE_CATEGORIES.HISTORICAL_SITE,
    PLACE_CATEGORIES.TRANSPORT_HUB,
    PLACE_CATEGORIES.VACATION_RENTAL,
  ],
} as const;

/**
 * Get required rating categories for a place type
 */
export function getRatingCategoriesForPlace(placeCategory: PlaceCategory): ReviewCategory[] {
  // Check if it's a food place
  const foodPlaces = RATING_SCALES_BY_PLACE_TYPE.FOOD_PLACES as readonly PlaceCategory[];
  if (foodPlaces.includes(placeCategory)) {
    return [
      REVIEW_CATEGORIES.FOOD_QUALITY,
      REVIEW_CATEGORIES.SERVICE,
      REVIEW_CATEGORIES.ATMOSPHERE,
    ];
  }
  
  // Check if it's a service place
  const servicePlaces = RATING_SCALES_BY_PLACE_TYPE.SERVICE_PLACES as readonly PlaceCategory[];
  if (servicePlaces.includes(placeCategory)) {
    return [
      REVIEW_CATEGORIES.OVERALL,
      REVIEW_CATEGORIES.SERVICE,
    ];
  }
  
  // Default to experience places (overall only)
  return [REVIEW_CATEGORIES.OVERALL];
}

/**
 * Check if place requires price information (food places)
 */
export function shouldAskForPrice(placeCategory: PlaceCategory): boolean {
  const foodPlaces = RATING_SCALES_BY_PLACE_TYPE.FOOD_PLACES as readonly PlaceCategory[];
  return foodPlaces.includes(placeCategory);
}

/**
 * Review sentiment categories
 */
export const REVIEW_SENTIMENTS = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
} as const;

export type ReviewSentiment = typeof REVIEW_SENTIMENTS[keyof typeof REVIEW_SENTIMENTS];

// ============================================================================
// PRICE RANGES
// ============================================================================

/**
 * Standardized price range indicators for general places
 */
export const PRICE_RANGES = {
  FREE: 'free',               // Free entry
  BUDGET: 'budget',           // $ - Under $25 per person
  MODERATE: 'moderate',       // $$ - $25-75 per person
  UPSCALE: 'upscale',        // $$$ - $75-150 per person
  LUXURY: 'luxury',          // $$$$ - Over $150 per person
} as const;

/**
 * Specific price ranges for food/dining (per person spending)
 */
export const FOOD_PRICE_RANGES = {
  RANGE_0_10: '0-10',         // 0-10 euros per person
  RANGE_10_20: '10-20',       // 10-20 euros per person
  RANGE_20_35: '20-35',       // 20-35 euros per person
  RANGE_35_50: '35-50',       // 35-50 euros per person
  RANGE_50_75: '50-75',       // 50-75 euros per person
  RANGE_75_100: '75-100',     // 75-100 euros per person
  RANGE_100_PLUS: '100+',     // 100+ euros per person
} as const;

export type PriceRange = typeof PRICE_RANGES[keyof typeof PRICE_RANGES];
export type FoodPriceRange = typeof FOOD_PRICE_RANGES[keyof typeof FOOD_PRICE_RANGES];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates if a category is a valid place category
 */
export function isValidPlaceCategory(category: string): category is PlaceCategory {
  return Object.values(PLACE_CATEGORIES).includes(category as PlaceCategory);
}

/**
 * Validates if a tag is a valid experience tag
 */
export function isValidExperienceTag(tag: string): tag is ExperienceTag {
  return Object.values(EXPERIENCE_TAGS).includes(tag as ExperienceTag);
}

/**
 * Get human-readable display name for a category
 */
export function getCategoryDisplayName(category: PlaceCategory): string {
  const displayNames: Record<PlaceCategory, string> = {
    [PLACE_CATEGORIES.RESTAURANT]: 'Restaurant',
    [PLACE_CATEGORIES.BAR]: 'Bar',
    [PLACE_CATEGORIES.COFFEE_SHOP]: 'Coffee Shop',
    [PLACE_CATEGORIES.FAST_FOOD]: 'Fast Food',
    [PLACE_CATEGORIES.HOTEL]: 'Hotel',
    [PLACE_CATEGORIES.HOSTEL]: 'Hostel',
    [PLACE_CATEGORIES.VACATION_RENTAL]: 'Vacation Rental',
    [PLACE_CATEGORIES.CLUB]: 'Club',
    [PLACE_CATEGORIES.THEATER]: 'Theater',
    [PLACE_CATEGORIES.MUSIC_VENUE]: 'Music Venue',
    [PLACE_CATEGORIES.MUSEUM]: 'Museum',
    [PLACE_CATEGORIES.HISTORICAL_SITE]: 'Historical Site',
    [PLACE_CATEGORIES.RELIGIOUS_SITE]: 'Religious Site',
    [PLACE_CATEGORIES.PARK]: 'Park',
    [PLACE_CATEGORIES.BEACH]: 'Beach',
    [PLACE_CATEGORIES.HIKING_TRAIL]: 'Hiking Trail',
    [PLACE_CATEGORIES.VIEWPOINT]: 'Viewpoint',
    [PLACE_CATEGORIES.ADVENTURE_ACTIVITY]: 'Adventure Activity',
    [PLACE_CATEGORIES.WATER_ACTIVITY]: 'Water Activity',
    [PLACE_CATEGORIES.SPORTS_FACILITY]: 'Sports Facility',
    [PLACE_CATEGORIES.SHOPPING]: 'Shopping',
    [PLACE_CATEGORIES.SPA_WELLNESS]: 'Spa & Wellness',
    [PLACE_CATEGORIES.TRANSPORT_HUB]: 'Transport Hub',
    [PLACE_CATEGORIES.ATTRACTION]: 'Attraction',
    [PLACE_CATEGORIES.EVENT_VENUE]: 'Event Venue',
  };
  
  return displayNames[category] || category;
}

/**
 * Get human-readable display name for food price ranges
 */
export function getFoodPriceDisplayName(range: FoodPriceRange): string {
  const displayNames: Record<FoodPriceRange, string> = {
    [FOOD_PRICE_RANGES.RANGE_0_10]: '0-10 euros per person',
    [FOOD_PRICE_RANGES.RANGE_10_20]: '10-20 euros per person',
    [FOOD_PRICE_RANGES.RANGE_20_35]: '20-35 euros per person',
    [FOOD_PRICE_RANGES.RANGE_35_50]: '35-50 euros per person',
    [FOOD_PRICE_RANGES.RANGE_50_75]: '50-75 euros per person',
    [FOOD_PRICE_RANGES.RANGE_75_100]: '75-100 euros per person',
    [FOOD_PRICE_RANGES.RANGE_100_PLUS]: '100+ euros per person',
  };
  
  return displayNames[range] || range;
}

/**
 * Get human-readable display name for rating categories
 */
export function getRatingCategoryDisplayName(category: ReviewCategory): string {
  const displayNames: Record<ReviewCategory, string> = {
    [REVIEW_CATEGORIES.OVERALL]: 'Overall Experience',
    [REVIEW_CATEGORIES.FOOD_QUALITY]: 'Food Quality',
    [REVIEW_CATEGORIES.SERVICE]: 'Service',
    [REVIEW_CATEGORIES.ATMOSPHERE]: 'Atmosphere',
  };
  
  return displayNames[category] || category;
}

/**
 * Create a review flow configuration for a specific place category
 */
export interface ReviewFlowConfig {
  ratingCategories: ReviewCategory[];
  requiresPrice: boolean;
  priceLabel?: string;
  suggestedTags: ExperienceTag[];
}

export function getReviewFlowConfig(placeCategory: PlaceCategory): ReviewFlowConfig {
  const ratingCategories = getRatingCategoriesForPlace(placeCategory);
  const requiresPrice = shouldAskForPrice(placeCategory);
  const suggestedTags = getRecommendedTagsForCategory(placeCategory);
  
  return {
    ratingCategories,
    requiresPrice,
    priceLabel: requiresPrice ? 'How much did you spend per person?' : undefined,
    suggestedTags,
  };
}
export function getTagDisplayName(tag: ExperienceTag): string {
  return tag
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get tags that are commonly associated with a place category
 */
export function getRecommendedTagsForCategory(category: PlaceCategory): ExperienceTag[] {
  const categoryTagMappings: Partial<Record<PlaceCategory, ExperienceTag[]>> = {
    [PLACE_CATEGORIES.RESTAURANT]: [
      EXPERIENCE_TAGS.FAMILY_FRIENDLY,
      EXPERIENCE_TAGS.ROMANTIC,
      EXPERIENCE_TAGS.FRIENDS_GROUP,
      EXPERIENCE_TAGS.BUDGET_FRIENDLY,
      EXPERIENCE_TAGS.LUXURY,
      EXPERIENCE_TAGS.EXCEPTIONAL_FOOD,
      EXPERIENCE_TAGS.INTIMATE,
      EXPERIENCE_TAGS.ENERGETIC,
    ],
    [PLACE_CATEGORIES.BAR]: [
      EXPERIENCE_TAGS.ENERGETIC,
      EXPERIENCE_TAGS.FRIENDS_GROUP,
      EXPERIENCE_TAGS.ROMANTIC,
      EXPERIENCE_TAGS.INTIMATE,
      EXPERIENCE_TAGS.AUTHENTIC_LOCAL,
      EXPERIENCE_TAGS.CROWD_LEVEL_HIGH,
      EXPERIENCE_TAGS.EXTENDED_STAY,
    ],
    [PLACE_CATEGORIES.BEACH]: [
      EXPERIENCE_TAGS.RELAXING,
      EXPERIENCE_TAGS.SCENIC_BEAUTY,
      EXPERIENCE_TAGS.FAMILY_FRIENDLY,
      EXPERIENCE_TAGS.FRIENDS_GROUP,
      EXPERIENCE_TAGS.CROWD_LEVEL_HIGH,
      EXPERIENCE_TAGS.CROWD_LEVEL_LOW,
      EXPERIENCE_TAGS.EXTENDED_STAY,
    ],
    [PLACE_CATEGORIES.MUSEUM]: [
      EXPERIENCE_TAGS.HISTORICAL_SIGNIFICANCE,
      EXPERIENCE_TAGS.CULTURAL_IMMERSION,
      EXPERIENCE_TAGS.FAMILY_FRIENDLY,
      EXPERIENCE_TAGS.SOLO_FRIENDLY,
      EXPERIENCE_TAGS.UNIQUE_ARCHITECTURE,
      EXPERIENCE_TAGS.QUICK_VISIT,
    ],
    // Add more mappings as needed
  };

  return categoryTagMappings[category] || [];
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Standard place data structure
 */
export interface StandardPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  tags: ExperienceTag[];
  priceRange?: PriceRange;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  description?: string;
  openingHours?: string;
  website?: string;
  phone?: string;
  averageRating?: number;
  reviewCount?: number;
}

/**
 * Standard review data structure
 */
export interface StandardReview {
  id: string;
  placeId: string;
  userId: string;
  ratings: Partial<Record<ReviewCategory, number>>; // 1-5 scale
  comment?: string;
  photoUrl?: string;                    // Optional photo of the experience
  tags: ExperienceTag[];               // Experience tags from the standard list
  sentiment: ReviewSentiment;
  visitDate?: string;
  createdAt: string;
  updatedAt: string;
  helpful?: number;                    // Number of helpful votes
  
  // Price information (for food places)
  foodPriceRange?: FoodPriceRange;     // Per-person spending for food places
  
  // Verification & Trust
  verified?: boolean;                  // If the review has been verified
  verificationMethod?: 'photo' | 'receipt' | 'location' | 'manual';
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Validates a place object against standards
 */
export function validatePlace(place: Partial<StandardPlace>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!place.name) {
    errors.push('Place name is required');
  }

  if (!place.category || !isValidPlaceCategory(place.category)) {
    errors.push('Valid place category is required');
  }

  if (place.tags) {
    const invalidTags = place.tags.filter(tag => !isValidExperienceTag(tag));
    if (invalidTags.length > 0) {
      errors.push(`Invalid tags: ${invalidTags.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a review object against standards
 */
export function validateReview(review: Partial<StandardReview>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!review.placeId) {
    errors.push('Place ID is required');
  }

  if (!review.userId) {
    errors.push('User ID is required');
  }

  if (!review.ratings || Object.keys(review.ratings).length === 0) {
    errors.push('At least one rating is required');
  }

  // Validate rating values (1-5 scale)
  if (review.ratings) {
    Object.entries(review.ratings).forEach(([category, rating]) => {
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        errors.push(`Rating for ${category} must be between 1 and 5`);
      }
    });
  }

  if (review.tags) {
    const invalidTags = review.tags.filter(tag => !isValidExperienceTag(tag));
    if (invalidTags.length > 0) {
      errors.push(`Invalid tags: ${invalidTags.join(', ')}`);
    }
  }

  if (review.sentiment && !Object.values(REVIEW_SENTIMENTS).includes(review.sentiment)) {
    errors.push('Valid sentiment is required');
  }

  // Validate food price range if provided
  if (review.foodPriceRange && !Object.values(FOOD_PRICE_RANGES).includes(review.foodPriceRange)) {
    errors.push('Invalid food price range');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
