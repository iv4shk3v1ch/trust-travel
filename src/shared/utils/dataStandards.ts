/**
 * DATA STANDARDS FOR TRUST TRAVEL
 * Updated: 2026-01-23
 * 
 * This file defines standardized data structures following the new hierarchical schema:
 * - 5 main categories
 * - 18 subcategories  
 * - 25 experience tags (22 core + 3 dietary)
 * - Service types for food/drink places
 * 
 * IMPORTANT: These match the database schema exactly. Do not modify without updating DB.
 */

// ============================================================================
// MAIN CATEGORIES (5 - Hierarchical Parent Categories)
// ============================================================================

export const MAIN_CATEGORIES = {
  FOOD_DRINK: 'food_drink',
  NIGHTLIFE: 'nightlife',
  CULTURE_SIGHTS: 'culture_sights',
  NATURE_OUTDOOR: 'nature_outdoor',
  SHOPPING_ACTIVITIES: 'shopping_activities',
} as const;

export const MAIN_CATEGORY_LABELS: Record<string, string> = {
  [MAIN_CATEGORIES.FOOD_DRINK]: 'Food & Drink',
  [MAIN_CATEGORIES.NIGHTLIFE]: 'Nightlife',
  [MAIN_CATEGORIES.CULTURE_SIGHTS]: 'Culture & Sights',
  [MAIN_CATEGORIES.NATURE_OUTDOOR]: 'Nature & Outdoor',
  [MAIN_CATEGORIES.SHOPPING_ACTIVITIES]: 'Shopping & Activities',
};

export const MAIN_CATEGORY_ICONS: Record<string, string> = {
  [MAIN_CATEGORIES.FOOD_DRINK]: '🍽️',
  [MAIN_CATEGORIES.NIGHTLIFE]: '🌙',
  [MAIN_CATEGORIES.CULTURE_SIGHTS]: '🏛️',
  [MAIN_CATEGORIES.NATURE_OUTDOOR]: '🌳',
  [MAIN_CATEGORIES.SHOPPING_ACTIVITIES]: '🛍️',
};

// ============================================================================
// PLACE SUBCATEGORIES (18 - Actual Place Types)
// ============================================================================

export const PLACE_CATEGORIES = {
  // Food & Drink (4)
  RESTAURANT: 'restaurant',
  STREET_FOOD: 'street_food',
  CAFE: 'cafe',
  BAR: 'bar',
  ACCOMMODATION: 'accommodation',
  
  // Nightlife (1)
  NIGHTCLUB: 'nightclub',
  
  // Culture & Sights (4)
  MUSEUM: 'museum',
  ART_GALLERY: 'art_gallery',
  HISTORICAL_SITE: 'historical_site',
  LANDMARK: 'landmark',
  
  // Nature & Outdoor (4)
  PARK: 'park',
  VIEWPOINT: 'viewpoint',
  HIKING_TRAIL: 'hiking_trail',
  LAKE_RIVER_BEACH: 'lake_river_beach',
  
  // Shopping & Activities (5)
  MARKET: 'market',
  SHOPPING_AREA: 'shopping_area',
  ENTERTAINMENT_VENUE: 'entertainment_venue',
  SPA_WELLNESS: 'spa_wellness',
} as const;

// Map subcategories to their parent main category
export const SUBCATEGORY_TO_MAIN: Record<string, string> = {
  // Food & Drink
  [PLACE_CATEGORIES.RESTAURANT]: MAIN_CATEGORIES.FOOD_DRINK,
  [PLACE_CATEGORIES.STREET_FOOD]: MAIN_CATEGORIES.FOOD_DRINK,
  [PLACE_CATEGORIES.CAFE]: MAIN_CATEGORIES.FOOD_DRINK,
  [PLACE_CATEGORIES.BAR]: MAIN_CATEGORIES.FOOD_DRINK,
  [PLACE_CATEGORIES.ACCOMMODATION]: MAIN_CATEGORIES.FOOD_DRINK,
  
  // Nightlife
  [PLACE_CATEGORIES.NIGHTCLUB]: MAIN_CATEGORIES.NIGHTLIFE,
  
  // Culture & Sights
  [PLACE_CATEGORIES.MUSEUM]: MAIN_CATEGORIES.CULTURE_SIGHTS,
  [PLACE_CATEGORIES.ART_GALLERY]: MAIN_CATEGORIES.CULTURE_SIGHTS,
  [PLACE_CATEGORIES.HISTORICAL_SITE]: MAIN_CATEGORIES.CULTURE_SIGHTS,
  [PLACE_CATEGORIES.LANDMARK]: MAIN_CATEGORIES.CULTURE_SIGHTS,
  
  // Nature & Outdoor
  [PLACE_CATEGORIES.PARK]: MAIN_CATEGORIES.NATURE_OUTDOOR,
  [PLACE_CATEGORIES.VIEWPOINT]: MAIN_CATEGORIES.NATURE_OUTDOOR,
  [PLACE_CATEGORIES.HIKING_TRAIL]: MAIN_CATEGORIES.NATURE_OUTDOOR,
  [PLACE_CATEGORIES.LAKE_RIVER_BEACH]: MAIN_CATEGORIES.NATURE_OUTDOOR,
  
  // Shopping & Activities
  [PLACE_CATEGORIES.MARKET]: MAIN_CATEGORIES.SHOPPING_ACTIVITIES,
  [PLACE_CATEGORIES.SHOPPING_AREA]: MAIN_CATEGORIES.SHOPPING_ACTIVITIES,
  [PLACE_CATEGORIES.ENTERTAINMENT_VENUE]: MAIN_CATEGORIES.SHOPPING_ACTIVITIES,
  [PLACE_CATEGORIES.SPA_WELLNESS]: MAIN_CATEGORIES.SHOPPING_ACTIVITIES,
};

export const PLACE_CATEGORY_LABELS: Record<string, string> = {
  [PLACE_CATEGORIES.RESTAURANT]: 'Restaurant',
  [PLACE_CATEGORIES.STREET_FOOD]: 'Street Food',
  [PLACE_CATEGORIES.CAFE]: 'Cafe',
  [PLACE_CATEGORIES.BAR]: 'Bar',
  [PLACE_CATEGORIES.ACCOMMODATION]: 'Accommodation',
  [PLACE_CATEGORIES.NIGHTCLUB]: 'Nightclub',
  [PLACE_CATEGORIES.MUSEUM]: 'Museum',
  [PLACE_CATEGORIES.ART_GALLERY]: 'Art Gallery',
  [PLACE_CATEGORIES.HISTORICAL_SITE]: 'Historical Site',
  [PLACE_CATEGORIES.LANDMARK]: 'Landmark',
  [PLACE_CATEGORIES.PARK]: 'Park',
  [PLACE_CATEGORIES.VIEWPOINT]: 'Viewpoint',
  [PLACE_CATEGORIES.HIKING_TRAIL]: 'Hiking Trail',
  [PLACE_CATEGORIES.LAKE_RIVER_BEACH]: 'Lake/River/Beach',
  [PLACE_CATEGORIES.MARKET]: 'Market',
  [PLACE_CATEGORIES.SHOPPING_AREA]: 'Shopping Area',
  [PLACE_CATEGORIES.ENTERTAINMENT_VENUE]: 'Entertainment Venue',
  [PLACE_CATEGORIES.SPA_WELLNESS]: 'Spa & Wellness',
};

// ============================================================================
// EXPERIENCE TAGS (25 Total: 22 Core + 3 Dietary)
// ============================================================================

// Offering Tags (4) - What's available
export const OFFERING_TAGS = {
  FOOD: 'food',
  DRINKS: 'drinks',
  COFFEE: 'coffee',
  BAKERY: 'bakery',
} as const;

// Timing Tags (4) - When to visit
export const TIMING_TAGS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  LATE_NIGHT: 'late_night',
} as const;

// Duration Tags (2) - How long to stay
export const DURATION_TAGS = {
  QUICK_STOP: 'quick_stop',
  LONG_STAY: 'long_stay',
} as const;

// Social Tags (5) - Who to go with
export const SOCIAL_TAGS = {
  SOLO: 'solo',
  FRIENDS: 'friends',
  DATE: 'date',
  FAMILY: 'family',
  WITH_PET: 'with_pet',
} as const;

// Atmosphere Tags (4) - Vibe & feeling
export const ATMOSPHERE_TAGS = {
  CALM: 'calm',
  LIVELY: 'lively',
  ROMANTIC: 'romantic',
  AUTHENTIC_LOCAL: 'authentic_local',
} as const;

// Practical Tags (3) - Useful signals
export const PRACTICAL_TAGS = {
  BUDGET_FRIENDLY: 'budget_friendly',
  SCENIC_VIEW: 'scenic_view',
  HIDDEN_GEM: 'hidden_gem',
} as const;

// Dietary Tags (3) - Food restrictions
export const DIETARY_TAGS = {
  VEGAN: 'vegan',
  HALAL: 'halal',
  GLUTEN_FREE: 'gluten_free',
} as const;

// All experience tags combined
export const EXPERIENCE_TAGS = {
  ...OFFERING_TAGS,
  ...TIMING_TAGS,
  ...DURATION_TAGS,
  ...SOCIAL_TAGS,
  ...ATMOSPHERE_TAGS,
  ...PRACTICAL_TAGS,
  ...DIETARY_TAGS,
} as const;

// Tag labels for display
export const EXPERIENCE_TAG_LABELS: Record<string, string> = {
  // Offering
  [OFFERING_TAGS.FOOD]: 'Food',
  [OFFERING_TAGS.DRINKS]: 'Drinks',
  [OFFERING_TAGS.COFFEE]: 'Coffee',
  [OFFERING_TAGS.BAKERY]: 'Bakery',
  
  // Timing
  [TIMING_TAGS.MORNING]: 'Morning',
  [TIMING_TAGS.AFTERNOON]: 'Afternoon',
  [TIMING_TAGS.EVENING]: 'Evening',
  [TIMING_TAGS.LATE_NIGHT]: 'Late Night',
  
  // Duration
  [DURATION_TAGS.QUICK_STOP]: 'Quick Stop',
  [DURATION_TAGS.LONG_STAY]: 'Long Stay',
  
  // Social
  [SOCIAL_TAGS.SOLO]: 'Solo',
  [SOCIAL_TAGS.FRIENDS]: 'Friends',
  [SOCIAL_TAGS.DATE]: 'Date',
  [SOCIAL_TAGS.FAMILY]: 'Family',
  [SOCIAL_TAGS.WITH_PET]: 'Pet-Friendly',
  
  // Atmosphere
  [ATMOSPHERE_TAGS.CALM]: 'Calm',
  [ATMOSPHERE_TAGS.LIVELY]: 'Lively',
  [ATMOSPHERE_TAGS.ROMANTIC]: 'Romantic',
  [ATMOSPHERE_TAGS.AUTHENTIC_LOCAL]: 'Authentic Local',
  
  // Practical
  [PRACTICAL_TAGS.BUDGET_FRIENDLY]: 'Budget-Friendly',
  [PRACTICAL_TAGS.SCENIC_VIEW]: 'Scenic View',
  [PRACTICAL_TAGS.HIDDEN_GEM]: 'Hidden Gem',
  
  // Dietary
  [DIETARY_TAGS.VEGAN]: 'Vegan Options',
  [DIETARY_TAGS.HALAL]: 'Halal',
  [DIETARY_TAGS.GLUTEN_FREE]: 'Gluten-Free',
};

// Tag groupings for UI display
export const TAG_GROUPS = {
  offering: Object.values(OFFERING_TAGS),
  timing: Object.values(TIMING_TAGS),
  duration: Object.values(DURATION_TAGS),
  social: Object.values(SOCIAL_TAGS),
  atmosphere: Object.values(ATMOSPHERE_TAGS),
  practical: Object.values(PRACTICAL_TAGS),
  dietary: Object.values(DIETARY_TAGS),
} as const;

export const TAG_GROUP_LABELS = {
  offering: "What's Available",
  timing: 'When to Visit',
  duration: 'How Long',
  social: 'Who With',
  atmosphere: 'Vibe',
  practical: 'Highlights',
  dietary: 'Dietary',
} as const;

// ============================================================================
// SERVICE TYPES (Place Feature for Food/Drink)
// ============================================================================

export const SERVICE_TYPES = {
  SIT_DOWN: 'sit_down',
  TAKEAWAY: 'takeaway',
  COUNTER_SERVICE: 'counter_service',
} as const;

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  [SERVICE_TYPES.SIT_DOWN]: 'Sit-down dining',
  [SERVICE_TYPES.TAKEAWAY]: 'Takeaway',
  [SERVICE_TYPES.COUNTER_SERVICE]: 'Counter service',
};

// ============================================================================
// PRICE CATEGORIES
// ============================================================================

export const PRICE_CATEGORIES = {
  BUDGET: 'budget',
  MODERATE: 'moderate',
  EXPENSIVE: 'expensive',
  LUXURY: 'luxury',
} as const;

export const PRICE_CATEGORY_LABELS: Record<string, string> = {
  [PRICE_CATEGORIES.BUDGET]: 'Budget (<€10)',
  [PRICE_CATEGORIES.MODERATE]: 'Moderate (€10-30)',
  [PRICE_CATEGORIES.EXPENSIVE]: 'Expensive (€30-60)',
  [PRICE_CATEGORIES.LUXURY]: 'Luxury (>€60)',
};

export const PRICE_CATEGORY_SYMBOLS: Record<string, string> = {
  [PRICE_CATEGORIES.BUDGET]: '€',
  [PRICE_CATEGORIES.MODERATE]: '€€',
  [PRICE_CATEGORIES.EXPENSIVE]: '€€€',
  [PRICE_CATEGORIES.LUXURY]: '€€€€',
};

// ============================================================================
// INDOOR/OUTDOOR PREFERENCES
// ============================================================================

export const INDOOR_OUTDOOR = {
  INDOOR: 'indoor',
  OUTDOOR: 'outdoor',
  MIXED: 'mixed',
} as const;

export const INDOOR_OUTDOOR_LABELS: Record<string, string> = {
  [INDOOR_OUTDOOR.INDOOR]: 'Indoor',
  [INDOOR_OUTDOOR.OUTDOOR]: 'Outdoor',
  [INDOOR_OUTDOOR.MIXED]: 'Both',
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MainCategory = typeof MAIN_CATEGORIES[keyof typeof MAIN_CATEGORIES];
export type PlaceCategory = typeof PLACE_CATEGORIES[keyof typeof PLACE_CATEGORIES];
export type ExperienceTag = typeof EXPERIENCE_TAGS[keyof typeof EXPERIENCE_TAGS];
export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES];
export type PriceCategory = typeof PRICE_CATEGORIES[keyof typeof PRICE_CATEGORIES];
export type IndoorOutdoor = typeof INDOOR_OUTDOOR[keyof typeof INDOOR_OUTDOOR];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get subcategories for a main category
 */
export function getSubcategoriesForMain(mainCategory: MainCategory): PlaceCategory[] {
  return Object.entries(SUBCATEGORY_TO_MAIN)
    .filter(([, main]) => main === mainCategory)
    .map(([sub]) => sub as PlaceCategory);
}

/**
 * Get main category for a subcategory
 */
export function getMainCategoryForSub(subcategory: PlaceCategory): MainCategory {
  return SUBCATEGORY_TO_MAIN[subcategory] as MainCategory;
}

/**
 * Check if a place category is food-related (should have service_type)
 */
export function isFoodCategory(category: PlaceCategory): boolean {
  const foodCategories: PlaceCategory[] = [
    PLACE_CATEGORIES.RESTAURANT,
    PLACE_CATEGORIES.STREET_FOOD,
    PLACE_CATEGORIES.CAFE,
    PLACE_CATEGORIES.BAR,
  ];
  return foodCategories.includes(category);
}

/**
 * Get recommended tags for a place category
 */
export function getRecommendedTags(category: PlaceCategory): ExperienceTag[] {
  const mappings: Partial<Record<PlaceCategory, ExperienceTag[]>> = {
    [PLACE_CATEGORIES.RESTAURANT]: [
      EXPERIENCE_TAGS.FOOD,
      EXPERIENCE_TAGS.FAMILY,
      EXPERIENCE_TAGS.DATE,
      EXPERIENCE_TAGS.ROMANTIC,
      EXPERIENCE_TAGS.LIVELY,
    ],
    [PLACE_CATEGORIES.CAFE]: [
      EXPERIENCE_TAGS.COFFEE,
      EXPERIENCE_TAGS.BAKERY,
      EXPERIENCE_TAGS.SOLO,
      EXPERIENCE_TAGS.CALM,
      EXPERIENCE_TAGS.MORNING,
    ],
    [PLACE_CATEGORIES.BAR]: [
      EXPERIENCE_TAGS.DRINKS,
      EXPERIENCE_TAGS.FRIENDS,
      EXPERIENCE_TAGS.LIVELY,
      EXPERIENCE_TAGS.EVENING,
      EXPERIENCE_TAGS.LATE_NIGHT,
    ],
    [PLACE_CATEGORIES.NIGHTCLUB]: [
      EXPERIENCE_TAGS.DRINKS,
      EXPERIENCE_TAGS.FRIENDS,
      EXPERIENCE_TAGS.LIVELY,
      EXPERIENCE_TAGS.LATE_NIGHT,
      EXPERIENCE_TAGS.LONG_STAY,
    ],
    [PLACE_CATEGORIES.MUSEUM]: [
      EXPERIENCE_TAGS.SOLO,
      EXPERIENCE_TAGS.FAMILY,
      EXPERIENCE_TAGS.CALM,
      EXPERIENCE_TAGS.LONG_STAY,
      EXPERIENCE_TAGS.AUTHENTIC_LOCAL,
    ],
    [PLACE_CATEGORIES.PARK]: [
      EXPERIENCE_TAGS.FAMILY,
      EXPERIENCE_TAGS.WITH_PET,
      EXPERIENCE_TAGS.CALM,
      EXPERIENCE_TAGS.SCENIC_VIEW,
      EXPERIENCE_TAGS.LONG_STAY,
    ],
    [PLACE_CATEGORIES.VIEWPOINT]: [
      EXPERIENCE_TAGS.SOLO,
      EXPERIENCE_TAGS.DATE,
      EXPERIENCE_TAGS.SCENIC_VIEW,
      EXPERIENCE_TAGS.QUICK_STOP,
      EXPERIENCE_TAGS.ROMANTIC,
    ],
  };

  return mappings[category] || [];
}
