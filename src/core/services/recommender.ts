import { supabaseAdmin } from '../database/supabase';
import { TravelPlan } from '@/shared/types/travel-plan';
import {
  MAIN_CATEGORIES,
  PLACE_CATEGORIES,
  SUBCATEGORY_TO_MAIN,
  type ExperienceTag,
  type PlaceCategory
} from '@/shared/utils/dataStandards';

type ReviewWithPlace = {
  id: string;
  user_id: string;
  place_id: string;
  overall_rating: number | null;
  visit_date: string | null;
  comment: string | null;
  places: {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
    description: string | null;
    website: string | null;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
    price_level: string | null;
    indoor_outdoor: string | null;
    verified: boolean | null;
    created_at: string | null;
    place_type_id: string | null;
    place_types: {
      slug: string | null;
      name: string | null;
    } | null;
  } | null;
};

type RawReviewRow = {
  id: string;
  user_id: string;
  place_id: string;
  overall_rating: number | null;
  visit_date: string | null;
  comment: string | null;
  places: ReviewWithPlace['places'] | ReviewWithPlace['places'][] | null;
};

type SeedRatingRow = {
  user_id: string;
  city: string;
  anchor_key: string;
  anchor_name: string;
  concept_key: string;
  place_category: string;
  main_category: string;
  experience_tags: string[] | null;
  rating: number;
};

type UserSimilarity = {
  userId: string;
  similarity: number;
  overlapCount: number;
  meanRating: number;
  isTrusted: boolean;
};

type CandidateScore = {
  place: ReviewWithPlace['places'];
  predictedRating: number;
  collaborativeScore: number;
  categoryAffinity: number;
  qualityScore: number;
  popularityScore: number;
  noveltyScore: number;
  tagConfidence: number;
  trustedReviewersCount: number;
  socialTrustScore: number;
  similarUsersCount: number;
  averageRating: number;
  reviewCount: number;
  matchingTags: ExperienceTag[];
  mainCategory: string;
  diversityBoost: number;
  finalScore: number;
};

export interface RecommendedPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  city: string;
  address?: string;
  description?: string;
  photo_urls?: string[];
  website?: string;
  phone?: string;
  working_hours?: string;
  latitude?: number | null;
  longitude?: number | null;
  price_level?: string | null;
  price_category?: string | null;
  average_rating: number;
  review_count: number;
  matching_tags: ExperienceTag[];
  tag_confidence: number;
  verified?: boolean;
  indoor_outdoor?: 'indoor' | 'outdoor' | 'mixed';
  created_at?: string;
  trusted_reviewers_count: number;
  social_trust_boost: number;
  popularity_score: number;
  novelty_score: number;
  final_ranking_score: number;
  quality_score?: number;
  social_trust?: number;
  preference_similarity?: number;
  contextual_fit?: number;
  final_score?: number;
  predicted_rating?: number;
  similar_users_count?: number;
  recommendation_basis?: 'collaborative' | 'preference_fallback';
  recommendation_reason?: string;
  score_breakdown?: {
    collaborative: number;
    category_affinity: number;
    quality: number;
    popularity: number;
    novelty: number;
    tag_match: number;
    social_trust: number;
    diversity: number;
  };
}

export type RecommendationMode = 'popular' | 'cf_only' | 'hybrid';

const AREA_TO_CITY: Record<string, string> = {
  'trento': 'Trento',
  'trento-city': 'Trento',
  'milan': 'Milan',
  'milano': 'Milan',
  'milan-city': 'Milan',
  'rome': 'Rome',
  'roma': 'Rome',
  'rome-city': 'Rome',
  'florence': 'Florence',
  'firenze': 'Florence',
  'florence-city': 'Florence'
};

const LEGACY_CATEGORY_MAP: Record<string, PlaceCategory> = {
  'coffee-shop': PLACE_CATEGORIES.CAFE,
  'fast-food': PLACE_CATEGORIES.STREET_FOOD,
  'historical-site': PLACE_CATEGORIES.HISTORICAL_SITE,
  'hiking-trail': PLACE_CATEGORIES.HIKING_TRAIL,
  'shopping': PLACE_CATEGORIES.SHOPPING_AREA,
  'attraction': PLACE_CATEGORIES.LANDMARK,
  'theater': PLACE_CATEGORIES.ENTERTAINMENT_VENUE,
  'theatre': PLACE_CATEGORIES.ENTERTAINMENT_VENUE,
  'music-venue': PLACE_CATEGORIES.ENTERTAINMENT_VENUE,
  'opera': PLACE_CATEGORIES.ENTERTAINMENT_VENUE,
  'cinema': PLACE_CATEGORIES.ENTERTAINMENT_VENUE,
  'hotel': PLACE_CATEGORIES.ACCOMMODATION,
  'beach': PLACE_CATEGORIES.LAKE_RIVER_BEACH,
  'lake': PLACE_CATEGORIES.LAKE_RIVER_BEACH,
  'river': PLACE_CATEGORIES.LAKE_RIVER_BEACH
};

const LEGACY_TAG_MAP: Record<string, ExperienceTag[]> = {
  'exceptional-food': ['food'],
  'cultural-immersion': ['authentic_local'],
  'scenic-beauty': ['scenic_view'],
  'historical-significance': ['authentic_local'],
  'unique-architecture': ['authentic_local'],
  'relaxing': ['calm'],
  'energetic': ['lively'],
  'intimate': ['romantic'],
  'authentic-local': ['authentic_local'],
  'budget-friendly': ['budget_friendly'],
  'luxury': [],
  'crowd-level-low': ['calm'],
  'crowd-level-high': ['lively'],
  'solo-friendly': ['solo'],
  'family-friendly': ['family'],
  'quick-visit': ['quick_stop'],
  'central-location': [],
  'romantic': ['romantic']
};

const TRAVEL_TYPE_TAGS: Record<TravelPlan['travelType'], ExperienceTag[]> = {
  solo: ['solo', 'calm'],
  date: ['date', 'romantic'],
  family: ['family'],
  friends: ['friends', 'lively'],
  business: ['quick_stop', 'calm']
};

const PLACE_TAG_HINTS: Record<PlaceCategory, ExperienceTag[]> = {
  restaurant: ['food', 'long_stay', 'evening', 'date', 'friends'],
  street_food: ['food', 'quick_stop', 'budget_friendly', 'authentic_local'],
  cafe: ['coffee', 'morning', 'afternoon', 'quick_stop', 'calm'],
  bar: ['drinks', 'evening', 'friends', 'date', 'lively'],
  accommodation: ['long_stay', 'calm'],
  nightclub: ['drinks', 'late_night', 'friends', 'lively'],
  museum: ['afternoon', 'long_stay', 'solo', 'authentic_local'],
  art_gallery: ['afternoon', 'solo', 'date', 'authentic_local'],
  historical_site: ['afternoon', 'solo', 'authentic_local'],
  landmark: ['afternoon', 'solo', 'authentic_local'],
  park: ['afternoon', 'family', 'calm', 'long_stay'],
  viewpoint: ['scenic_view', 'afternoon', 'date', 'solo'],
  hiking_trail: ['scenic_view', 'long_stay', 'solo', 'friends'],
  lake_river_beach: ['scenic_view', 'long_stay', 'friends', 'family'],
  market: ['food', 'authentic_local', 'budget_friendly', 'afternoon'],
  shopping_area: ['friends', 'afternoon'],
  entertainment_venue: ['evening', 'friends', 'date'],
  spa_wellness: ['calm', 'long_stay', 'date']
};

function normalizeWhitespace(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(token => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ');
}

function normalizeCategorySlug(value: string | null | undefined): PlaceCategory | null {
  const normalized = normalizeWhitespace(value).toLowerCase().replace(/\s+/g, '_');
  if (!normalized) return null;
  if (normalized in LEGACY_CATEGORY_MAP) {
    return LEGACY_CATEGORY_MAP[normalized];
  }
  if (Object.values(PLACE_CATEGORIES).includes(normalized as PlaceCategory)) {
    return normalized as PlaceCategory;
  }
  return null;
}

function getMainCategory(category: PlaceCategory): string {
  return SUBCATEGORY_TO_MAIN[category] || MAIN_CATEGORIES.CULTURE_SIGHTS;
}

function inferCategoryFromPlaceMetadata(place: ReviewWithPlace['places'], fallback?: PlaceCategory | null): PlaceCategory | null {
  const combined = `${normalizeWhitespace(place?.name)} ${normalizeWhitespace(place?.description)}`.toLowerCase();
  if (!combined) return fallback || null;

  if (/(cafe|caf[eé]|coffee|pasticceria|panificio|bakery|gelateria|gelato|cioccolateria)/.test(combined)) {
    return PLACE_CATEGORIES.CAFE;
  }
  if (/(ristorante|restaurant|trattoria|osteria|pizzeria|pizzeria|bistro|bistrot)/.test(combined)) {
    return PLACE_CATEGORIES.RESTAURANT;
  }
  if (/(enoteca|wine bar|cocktail|pub|bar\b|aperitivo)/.test(combined)) {
    return PLACE_CATEGORIES.BAR;
  }
  if (/(mercato|market\b|mercati)/.test(combined)) {
    return PLACE_CATEGORIES.MARKET;
  }
  if (/(cinema|theater|theatre|auditorium|arena|multisala|teatro|concert)/.test(combined)) {
    return PLACE_CATEGORIES.ENTERTAINMENT_VENUE;
  }
  if (/(museum|museo|pinacoteca|gallerie|gallery|fondazione)/.test(combined)) {
    return PLACE_CATEGORIES.MUSEUM;
  }
  if (/(park|parco|giardini|gardens|garden\b)/.test(combined)) {
    return PLACE_CATEGORIES.PARK;
  }
  if (/(piazzale|panorama|viewpoint|belvedere|terrace|terrazza)/.test(combined)) {
    return PLACE_CATEGORIES.VIEWPOINT;
  }

  return fallback || null;
}

function getEffectiveCategory(place: ReviewWithPlace['places']): PlaceCategory {
  const normalized = normalizeCategorySlug(place?.place_types?.slug);

  if (
    !normalized ||
    normalized === PLACE_CATEGORIES.LANDMARK ||
    normalized === PLACE_CATEGORIES.HISTORICAL_SITE
  ) {
    return inferCategoryFromPlaceMetadata(place, normalized) || PLACE_CATEGORIES.LANDMARK;
  }

  return normalized;
}

function normalizeRequestedCategories(categories: string[] | undefined): PlaceCategory[] {
  return Array.from(
    new Set(
      (categories || [])
        .map(category => normalizeCategorySlug(category))
        .filter(Boolean) as PlaceCategory[]
    )
  );
}

function normalizeRequestedTags(travelPlan: TravelPlan): ExperienceTag[] {
  const tags = new Set<ExperienceTag>();

  for (const tag of travelPlan.experienceTags || []) {
    const normalized = normalizeWhitespace(tag).toLowerCase().replace(/\s+/g, '_');
    if (normalized in LEGACY_TAG_MAP) {
      LEGACY_TAG_MAP[normalized].forEach(mapped => tags.add(mapped));
      continue;
    }
    tags.add(normalized as ExperienceTag);
  }

  for (const tag of TRAVEL_TYPE_TAGS[travelPlan.travelType] || []) {
    tags.add(tag);
  }

  for (const need of travelPlan.specialNeeds || []) {
    const normalized = normalizeWhitespace(need).toLowerCase();
    if (normalized.includes('vegetarian')) tags.add('vegan');
    if (normalized.includes('pets')) tags.add('with_pet');
  }

  return Array.from(tags);
}

function inferTargetCity(travelPlan: TravelPlan, fallbackCity?: string): string {
  const candidates = [
    normalizeWhitespace(travelPlan.destination.region),
    normalizeWhitespace(travelPlan.destination.area)
  ].filter(Boolean);

  for (const candidate of candidates) {
    const direct = AREA_TO_CITY[candidate.toLowerCase()];
    if (direct) return direct;

    const token = candidate
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace(/-city$/, '');

    if (AREA_TO_CITY[token]) {
      return AREA_TO_CITY[token];
    }

    const words = candidate.toLowerCase();
    for (const [alias, city] of Object.entries(AREA_TO_CITY)) {
      if (words.includes(alias.replace(/-city$/, ''))) {
        return city;
      }
    }

    if (!['historic-villages', 'nature-easy', 'nature-hike'].includes(token)) {
      return titleCase(candidate.replace(/-/g, ' '));
    }
  }

  return fallbackCity || 'Trento';
}

function parseSortableDate(value: string | null | undefined): number {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return 0;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function derivePlaceTags(place: ReviewWithPlace['places'], category: PlaceCategory): ExperienceTag[] {
  const tags = new Set<ExperienceTag>(PLACE_TAG_HINTS[category] || []);
  const description = normalizeWhitespace(place?.description).toLowerCase();

  if (place?.price_level === 'low') tags.add('budget_friendly');
  if (place?.indoor_outdoor === 'outdoor') tags.add('scenic_view');
  if (description.includes('view') || description.includes('panorama') || description.includes('scenic')) {
    tags.add('scenic_view');
  }
  if (description.includes('hidden') || description.includes('gem')) {
    tags.add('hidden_gem');
  }
  if (description.includes('local') || description.includes('authentic')) {
    tags.add('authentic_local');
  }

  return Array.from(tags);
}

async function getTrustedUsers(currentUserId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('trust_links')
    .select('source_user,target_user')
    .or(`source_user.eq.${currentUserId},target_user.eq.${currentUserId}`);

  if (error || !data) return [];

  return data.map(link =>
    link.source_user === currentUserId ? link.target_user : link.source_user
  );
}

async function fetchAllReviewsWithPlaces(): Promise<ReviewWithPlace[]> {
  const rows: ReviewWithPlace[] = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        user_id,
        place_id,
        overall_rating,
        visit_date,
        comment,
        places!inner(
          id,
          name,
          city,
          address,
          description,
          website,
          phone,
          latitude,
          longitude,
          price_level,
          indoor_outdoor,
          verified,
          created_at,
          place_type_id,
          place_types(slug,name)
        )
      `)
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    const normalizedRows = (data as unknown as RawReviewRow[]).map(row => ({
      ...row,
      places: Array.isArray(row.places) ? (row.places[0] || null) : row.places
    }));

    rows.push(...(normalizedRows as ReviewWithPlace[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows.filter(row => row.places && typeof row.overall_rating === 'number');
}

async function fetchUserSeedRatings(userId: string): Promise<SeedRatingRow[]> {
  const { data, error } = await supabaseAdmin
    .from('user_seed_ratings')
    .select('user_id, city, anchor_key, anchor_name, concept_key, place_category, main_category, experience_tags, rating')
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  return data as SeedRatingRow[];
}

function computeMeanRating(reviews: ReviewWithPlace[]): number {
  if (!reviews.length) return 3.5;
  return reviews.reduce((sum, review) => sum + (review.overall_rating || 0), 0) / reviews.length;
}

function computeUserCategoryAffinities(reviews: ReviewWithPlace[], userMean: number): Map<string, number> {
  const byCategory = new Map<string, { total: number; count: number }>();

  for (const review of reviews) {
    const category = getEffectiveCategory(review.places);
    if (!category || typeof review.overall_rating !== 'number') continue;

    const adjusted = 0.5 + ((review.overall_rating - userMean) / 4);
    const bucket = byCategory.get(category) || { total: 0, count: 0 };
    bucket.total += clamp(adjusted, 0, 1);
    bucket.count += 1;
    byCategory.set(category, bucket);
  }

  return new Map(
    Array.from(byCategory.entries()).map(([category, bucket]) => [
      category,
      bucket.total / bucket.count
    ])
  );
}

function computeUserMainCategoryAffinities(categoryAffinities: Map<string, number>): Map<string, number> {
  const grouped = new Map<string, { total: number; count: number }>();

  for (const [category, affinity] of categoryAffinities.entries()) {
    const mainCategory = getMainCategory(category as PlaceCategory);
    const bucket = grouped.get(mainCategory) || { total: 0, count: 0 };
    bucket.total += affinity;
    bucket.count += 1;
    grouped.set(mainCategory, bucket);
  }

  return new Map(
    Array.from(grouped.entries()).map(([mainCategory, bucket]) => [
      mainCategory,
      bucket.total / bucket.count
    ])
  );
}

function computeSeedCategoryAffinities(seedRatings: SeedRatingRow[]): Map<string, number> {
  const grouped = new Map<string, { total: number; count: number }>();

  for (const seed of seedRatings) {
    const category = normalizeCategorySlug(seed.place_category);
    if (!category) continue;

    const normalizedRating = clamp((seed.rating - 1) / 4, 0, 1);
    const bucket = grouped.get(category) || { total: 0, count: 0 };
    bucket.total += normalizedRating;
    bucket.count += 1;
    grouped.set(category, bucket);
  }

  return new Map(
    Array.from(grouped.entries()).map(([category, bucket]) => [
      category,
      bucket.total / bucket.count
    ])
  );
}

function computeSeedMainCategoryAffinities(seedRatings: SeedRatingRow[]): Map<string, number> {
  const grouped = new Map<string, { total: number; count: number }>();

  for (const seed of seedRatings) {
    const mainCategory = normalizeWhitespace(seed.main_category);
    if (!mainCategory) continue;

    const normalizedRating = clamp((seed.rating - 1) / 4, 0, 1);
    const bucket = grouped.get(mainCategory) || { total: 0, count: 0 };
    bucket.total += normalizedRating;
    bucket.count += 1;
    grouped.set(mainCategory, bucket);
  }

  return new Map(
    Array.from(grouped.entries()).map(([mainCategory, bucket]) => [
      mainCategory,
      bucket.total / bucket.count
    ])
  );
}

function deriveSeedTags(seedRatings: SeedRatingRow[]): ExperienceTag[] {
  const weightedTags = new Map<ExperienceTag, number>();

  for (const seed of seedRatings) {
    if (seed.rating < 4) continue;
    for (const tag of seed.experience_tags || []) {
      const normalized = normalizeWhitespace(tag).toLowerCase().replace(/\s+/g, '_') as ExperienceTag;
      weightedTags.set(normalized, (weightedTags.get(normalized) || 0) + seed.rating);
    }
  }

  return Array.from(weightedTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);
}

function mergeAffinityMaps(
  primary: Map<string, number>,
  secondary: Map<string, number>,
  secondaryWeight: number
): Map<string, number> {
  const merged = new Map(primary);

  for (const [key, secondaryValue] of secondary.entries()) {
    const primaryValue = merged.get(key);
    if (typeof primaryValue === 'number') {
      merged.set(key, clamp((primaryValue * (1 - secondaryWeight)) + (secondaryValue * secondaryWeight), 0, 1));
    } else {
      merged.set(key, secondaryValue);
    }
  }

  return merged;
}

function buildRecommendationReason(score: CandidateScore): string {
  if (score.collaborativeScore >= 0.75 && score.similarUsersCount >= 2) {
    return 'High agreement from similar travelers';
  }
  if (score.mainCategory === MAIN_CATEGORIES.FOOD_DRINK && score.categoryAffinity >= 0.65) {
    return 'Matches your food and drink preferences';
  }
  if (score.mainCategory === MAIN_CATEGORIES.SHOPPING_ACTIVITIES || score.mainCategory === MAIN_CATEGORIES.NIGHTLIFE) {
    return 'Adds a less obvious activity option';
  }
  if (score.noveltyScore >= 0.7 && score.popularityScore <= 0.6) {
    return 'Good fit with more novelty than the usual landmarks';
  }
  if (score.mainCategory === MAIN_CATEGORIES.NATURE_OUTDOOR) {
    return 'Balances sightseeing with outdoor options';
  }
  return 'Strong fit for your cross-city profile';
}

function getCandidateDedupKey(score: CandidateScore): string {
  const city = normalizeWhitespace(score.place?.city).toLowerCase();
  const name = normalizeWhitespace(score.place?.name).toLowerCase();
  const address = normalizeWhitespace(score.place?.address).toLowerCase();
  return `${city}::${name}::${address || 'no-address'}`;
}

function computeSimilarity(
  currentReviews: ReviewWithPlace[],
  candidateReviews: ReviewWithPlace[],
  currentMean: number,
  candidateMean: number
): UserSimilarity | null {
  const currentByPlace = new Map(currentReviews.map(review => [review.place_id, review]));
  const overlap = candidateReviews.filter(review => currentByPlace.has(review.place_id));
  if (overlap.length < 2) return null;

  let numerator = 0;
  let currentMagnitude = 0;
  let candidateMagnitude = 0;

  for (const review of overlap) {
    const currentRating = currentByPlace.get(review.place_id)?.overall_rating;
    const candidateRating = review.overall_rating;
    if (typeof currentRating !== 'number' || typeof candidateRating !== 'number') continue;

    const currentCentered = currentRating - currentMean;
    const candidateCentered = candidateRating - candidateMean;
    numerator += currentCentered * candidateCentered;
    currentMagnitude += currentCentered ** 2;
    candidateMagnitude += candidateCentered ** 2;
  }

  if (!currentMagnitude || !candidateMagnitude) return null;

  const rawSimilarity = numerator / (Math.sqrt(currentMagnitude) * Math.sqrt(candidateMagnitude));
  const overlapWeight = Math.min(overlap.length / 5, 1);
  const similarity = rawSimilarity * overlapWeight;

  if (similarity <= 0) return null;

  return {
    userId: overlap[0].user_id,
    similarity,
    overlapCount: overlap.length,
    meanRating: candidateMean,
    isTrusted: false
  };
}

function computeMapCosineSimilarity(
  left: Map<string, number>,
  right: Map<string, number>
): { similarity: number; overlap: number } | null {
  const keys = Array.from(left.keys()).filter(key => right.has(key));
  if (!keys.length) return null;

  let numerator = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (const key of keys) {
    const leftValue = left.get(key) || 0;
    const rightValue = right.get(key) || 0;
    numerator += leftValue * rightValue;
    leftMagnitude += leftValue ** 2;
    rightMagnitude += rightValue ** 2;
  }

  if (!leftMagnitude || !rightMagnitude) return null;

  return {
    similarity: numerator / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude)),
    overlap: keys.length
  };
}

function computeSeedBasedSimilarity(
  currentCategoryAffinities: Map<string, number>,
  currentMainCategoryAffinities: Map<string, number>,
  candidateReviews: ReviewWithPlace[],
  candidateMean: number
): UserSimilarity | null {
  const candidateCategoryAffinities = computeUserCategoryAffinities(candidateReviews, candidateMean);
  const candidateMainCategoryAffinities = computeUserMainCategoryAffinities(candidateCategoryAffinities);

  const categorySimilarity = computeMapCosineSimilarity(currentCategoryAffinities, candidateCategoryAffinities);
  const mainCategorySimilarity = computeMapCosineSimilarity(currentMainCategoryAffinities, candidateMainCategoryAffinities);

  if (!categorySimilarity && !mainCategorySimilarity) {
    return null;
  }

  const weightedCategory = categorySimilarity ? categorySimilarity.similarity * 0.65 : 0;
  const weightedMain = mainCategorySimilarity ? mainCategorySimilarity.similarity * 0.35 : 0;
  const overlapCount = (categorySimilarity?.overlap || 0) + (mainCategorySimilarity?.overlap || 0);
  const overlapWeight = Math.min(overlapCount / 6, 1);
  const similarity = clamp((weightedCategory + weightedMain) * overlapWeight, 0, 1);

  if (similarity < 0.18) {
    return null;
  }

  return {
    userId: candidateReviews[0]?.user_id || '',
    similarity,
    overlapCount,
    meanRating: candidateMean,
    isTrusted: false
  };
}

function getQualityScore(averageRating: number, reviewCount: number, globalAverage: number): number {
  const priorWeight = 5;
  const bayesianAverage = ((reviewCount * averageRating) + (priorWeight * globalAverage)) / (reviewCount + priorWeight);
  return clamp((bayesianAverage - 1) / 4, 0, 1);
}

function getPopularityScore(reviewCount: number): number {
  if (reviewCount <= 0) return 0;
  return clamp(Math.log(reviewCount + 1) / Math.log(26), 0, 1);
}

function getNoveltyScore(place: ReviewWithPlace['places'], reviewCount: number): number {
  const freshnessBase = (() => {
    const createdAt = parseSortableDate(place?.created_at);
    if (!createdAt) return 0.4;
    const days = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
    if (days <= 60) return 1;
    if (days <= 180) return 0.7;
    return 0.35;
  })();

  const hiddenGemBase = 1 - clamp(reviewCount / 25, 0, 1);
  return clamp((freshnessBase * 0.5) + (hiddenGemBase * 0.5), 0, 1);
}

function shouldExcludePlace(place: ReviewWithPlace['places'], category: PlaceCategory): boolean {
  const combined = `${normalizeWhitespace(place?.name)} ${normalizeWhitespace(place?.description)}`.toLowerCase();

  if (!combined) return false;
  if (combined.includes('permanently closed') || combined.includes('temporarily closed') || combined.includes(' - closed')) {
    return true;
  }

  if (
    [PLACE_CATEGORIES.LANDMARK, PLACE_CATEGORIES.HISTORICAL_SITE, PLACE_CATEGORIES.MUSEUM].includes(category) &&
    (combined.includes('travel') || combined.includes('tour') || combined.includes('agency') || combined.includes('excursion'))
  ) {
    return true;
  }

  return false;
}

function buildRecommendation(
  score: CandidateScore,
  requestedTags: ExperienceTag[]
): RecommendedPlace {
  const category = getEffectiveCategory(score.place);
  const recommendationBasis = score.collaborativeScore > 0.05 ? 'collaborative' : 'preference_fallback';

  return {
    id: score.place?.id || '',
    name: score.place?.name || 'Unknown place',
    category,
    city: score.place?.city || '',
    address: score.place?.address || undefined,
    description: score.place?.description || undefined,
    photo_urls: [],
    website: score.place?.website || undefined,
    phone: score.place?.phone || undefined,
    working_hours: undefined,
    latitude: score.place?.latitude ?? null,
    longitude: score.place?.longitude ?? null,
    price_level: score.place?.price_level ?? null,
    price_category: score.place?.price_level ?? null,
    average_rating: Math.round(score.averageRating * 10) / 10,
    review_count: score.reviewCount,
    matching_tags: score.matchingTags,
    tag_confidence: requestedTags.length
      ? Math.round((score.matchingTags.length / requestedTags.length) * 100) / 100
      : Math.round(score.tagConfidence * 100) / 100,
    verified: Boolean(score.place?.verified),
    indoor_outdoor: (score.place?.indoor_outdoor as 'indoor' | 'outdoor' | 'mixed' | null) || 'mixed',
    created_at: score.place?.created_at || undefined,
    trusted_reviewers_count: score.trustedReviewersCount,
    social_trust_boost: Math.round(score.socialTrustScore * 100) / 100,
    popularity_score: Math.round(score.popularityScore * 100) / 100,
    novelty_score: Math.round(score.noveltyScore * 100) / 100,
    final_ranking_score: Math.round(score.finalScore * 100) / 100,
    quality_score: Math.round(score.qualityScore * 100) / 100,
    social_trust: Math.round(score.socialTrustScore * 100) / 100,
    preference_similarity: Math.round(score.categoryAffinity * 100) / 100,
    contextual_fit: Math.round(score.tagConfidence * 100) / 100,
    final_score: Math.round(score.finalScore * 100) / 100,
    predicted_rating: Math.round(score.predictedRating * 10) / 10,
    similar_users_count: score.similarUsersCount,
    recommendation_basis: recommendationBasis,
    recommendation_reason: buildRecommendationReason(score),
    score_breakdown: {
      collaborative: Math.round(score.collaborativeScore * 100) / 100,
      category_affinity: Math.round(score.categoryAffinity * 100) / 100,
      quality: Math.round(score.qualityScore * 100) / 100,
      popularity: Math.round(score.popularityScore * 100) / 100,
      novelty: Math.round(score.noveltyScore * 100) / 100,
      tag_match: Math.round(score.tagConfidence * 100) / 100,
      social_trust: Math.round(score.socialTrustScore * 100) / 100,
      diversity: Math.round(score.diversityBoost * 100) / 100
    }
  };
}

function diversifyRecommendations(
  scores: CandidateScore[],
  limit: number,
  strategy: RecommendationMode = 'popular'
): CandidateScore[] {
  const uniqueScores = new Map<string, CandidateScore>();
  for (const score of [...scores].sort((a, b) => b.finalScore - a.finalScore)) {
    const dedupKey = getCandidateDedupKey(score);
    if (!uniqueScores.has(dedupKey)) {
      uniqueScores.set(dedupKey, score);
    }
  }

  const sorted = Array.from(uniqueScores.values());
  const selected: CandidateScore[] = [];
  const categoryCounts = new Map<string, number>();
  const mainCategoryCounts = new Map<string, number>();

  if (strategy === 'hybrid') {
    const minimumTargets = [
      MAIN_CATEGORIES.FOOD_DRINK,
      MAIN_CATEGORIES.CULTURE_SIGHTS,
      MAIN_CATEGORIES.NATURE_OUTDOOR,
      MAIN_CATEGORIES.SHOPPING_ACTIVITIES
    ];

    for (const mainCategory of minimumTargets) {
      const candidate = sorted.find(item => {
        if (selected.some(selectedItem => selectedItem.place?.id === item.place?.id)) return false;
        return item.mainCategory === mainCategory;
      });

      if (candidate) {
        const category = getEffectiveCategory(candidate.place);
        selected.push(candidate);
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        mainCategoryCounts.set(candidate.mainCategory, (mainCategoryCounts.get(candidate.mainCategory) || 0) + 1);
      }
    }
  }

  for (const candidate of sorted) {
    if (selected.some(item => item.place?.id === candidate.place?.id)) continue;
    const category = getEffectiveCategory(candidate.place);
    const count = categoryCounts.get(category) || 0;
    const maxPerCategory = strategy === 'hybrid'
      ? (selected.length < 10 ? 2 : 4)
      : (selected.length < 8 ? 2 : 4);

    if (count >= maxPerCategory) {
      continue;
    }

    if (strategy === 'hybrid') {
      const mainCount = mainCategoryCounts.get(candidate.mainCategory) || 0;
      if (mainCount >= 6 && candidate.mainCategory === MAIN_CATEGORIES.CULTURE_SIGHTS) {
        continue;
      }
    }

    selected.push(candidate);
    categoryCounts.set(category, count + 1);
    mainCategoryCounts.set(candidate.mainCategory, (mainCategoryCounts.get(candidate.mainCategory) || 0) + 1);

    if (selected.length >= limit) {
      break;
    }
  }

  if (selected.length < limit) {
    for (const candidate of sorted) {
      if (selected.some(item => item.place?.id === candidate.place?.id)) continue;
      selected.push(candidate);
      if (selected.length >= limit) break;
    }
  }

  return selected.sort((a, b) => b.finalScore - a.finalScore);
}

function buildFallbackCandidates(
  targetCityReviews: ReviewWithPlace[],
  requestedCategories: PlaceCategory[],
  requestedTags: ExperienceTag[],
  preferenceSignals?: {
    categoryAffinities?: Map<string, number>;
    mainCategoryAffinities?: Map<string, number>;
    mode?: 'popular' | 'hybrid';
  }
): CandidateScore[] {
  const reviewsByPlace = new Map<string, ReviewWithPlace[]>();
  for (const review of targetCityReviews) {
    const bucket = reviewsByPlace.get(review.place_id) || [];
    bucket.push(review);
    reviewsByPlace.set(review.place_id, bucket);
  }

  const globalAverage = computeMeanRating(targetCityReviews);
  const candidates: CandidateScore[] = [];

  for (const reviews of reviewsByPlace.values()) {
    const place = reviews[0].places;
    if (!place) continue;

    const category = getEffectiveCategory(place);
    if (shouldExcludePlace(place, category)) {
      continue;
    }
    if (category === PLACE_CATEGORIES.ACCOMMODATION && !requestedCategories.includes(PLACE_CATEGORIES.ACCOMMODATION)) {
      continue;
    }
    if (requestedCategories.length && !requestedCategories.includes(category)) {
      continue;
    }

    const averageRating = computeMeanRating(reviews);
    const reviewCount = reviews.length;
    const mainCategory = getMainCategory(category);
    const placeTags = derivePlaceTags(place, category);
    const matchingTags = placeTags.filter(tag => requestedTags.includes(tag));
    const tagConfidence = requestedTags.length ? matchingTags.length / requestedTags.length : 0;
    const qualityScore = getQualityScore(averageRating, reviewCount, globalAverage);
    const popularityScore = getPopularityScore(reviewCount);
    const noveltyScore = getNoveltyScore(place, reviewCount);
    const categoryAffinity = preferenceSignals?.categoryAffinities?.get(category) ?? 0.5;
    const mainCategoryAffinity = preferenceSignals?.mainCategoryAffinities?.get(mainCategory)
      ?? (mainCategory === MAIN_CATEGORIES.FOOD_DRINK ? 0.55 : 0.5);
    const diversityBoost = preferenceSignals?.mode === 'hybrid'
      ? clamp(
          (mainCategory === MAIN_CATEGORIES.FOOD_DRINK ? 0.08 : 0) +
          (mainCategory === MAIN_CATEGORIES.SHOPPING_ACTIVITIES || mainCategory === MAIN_CATEGORIES.NIGHTLIFE ? 0.06 : 0) +
          Math.max(mainCategoryAffinity - 0.5, 0) * 0.35,
          0,
          0.18
        )
      : 0;

    const finalScore = preferenceSignals?.mode === 'hybrid'
      ? (
          qualityScore * 0.24 +
          categoryAffinity * 0.22 +
          mainCategoryAffinity * 0.12 +
          tagConfidence * 0.14 +
          noveltyScore * 0.10 +
          popularityScore * 0.10 +
          diversityBoost * 0.08
        )
      : (
          (qualityScore * 0.45) +
          (popularityScore * 0.35) +
          (noveltyScore * 0.05) +
          (tagConfidence * 0.20)
        );

    candidates.push({
      place,
      predictedRating: averageRating,
      collaborativeScore: 0,
      categoryAffinity,
      qualityScore,
      popularityScore,
      noveltyScore,
      tagConfidence,
      trustedReviewersCount: 0,
      socialTrustScore: 0,
      similarUsersCount: 0,
      averageRating,
      reviewCount,
      matchingTags,
      mainCategory,
      diversityBoost,
      finalScore: clamp(finalScore, 0, 1)
    });
  }

  return candidates;
}

function getFallbackRecommendations(
  targetCityReviews: ReviewWithPlace[],
  requestedCategories: PlaceCategory[],
  requestedTags: ExperienceTag[],
  limit: number,
  preferenceSignals?: {
    categoryAffinities?: Map<string, number>;
    mainCategoryAffinities?: Map<string, number>;
    mode?: 'popular' | 'hybrid';
  }
): RecommendedPlace[] {
  return diversifyRecommendations(
    buildFallbackCandidates(targetCityReviews, requestedCategories, requestedTags, preferenceSignals),
    limit,
    preferenceSignals?.mode || 'popular'
  ).map(candidate =>
    buildRecommendation(candidate, requestedTags)
  );
}

type PreparedRecommendationData = {
  requestedCategories: PlaceCategory[];
  requestedTags: ExperienceTag[];
  currentUserReviews: ReviewWithPlace[];
  currentUserSeedRatings: SeedRatingRow[];
  targetCityReviews: ReviewWithPlace[];
  trustedUsers: Set<string>;
  currentMean: number;
  currentReviewedPlaceIds: Set<string>;
  categoryAffinities: Map<string, number>;
  mainCategoryAffinities: Map<string, number>;
  topSimilarUsers: UserSimilarity[];
  similarityByUser: Map<string, UserSimilarity>;
  globalAverage: number;
};

async function prepareRecommendationData(
  travelPlan: TravelPlan,
  currentUserId?: string
): Promise<PreparedRecommendationData | null> {
  const allReviews = await fetchAllReviewsWithPlaces();
  if (!allReviews.length) {
    return null;
  }

  const currentUserReviews = currentUserId
    ? allReviews.filter(review => review.user_id === currentUserId && review.places)
    : [];
  const currentUserSeedRatings = currentUserId
    ? await fetchUserSeedRatings(currentUserId)
    : [];

  const dominantCity = currentUserReviews.length
    ? Array.from(
        currentUserReviews.reduce((map, review) => {
          const city = review.places?.city || '';
          map.set(city, (map.get(city) || 0) + 1);
          return map;
        }, new Map<string, number>()).entries()
      ).sort((a, b) => b[1] - a[1])[0]?.[0]
    : undefined;

  const targetCity = inferTargetCity(travelPlan, dominantCity);
  const explicitRequestedCategories = normalizeRequestedCategories(travelPlan.categories);
  const requestedTags = normalizeRequestedTags(travelPlan);
  const targetCityReviews = allReviews.filter(review => review.places?.city === targetCity);

  if (!targetCityReviews.length) {
    return null;
  }

  const trustedUsers = currentUserId ? new Set(await getTrustedUsers(currentUserId)) : new Set<string>();
  const currentMean = computeMeanRating(currentUserReviews);
  const currentReviewedPlaceIds = new Set(currentUserReviews.map(review => review.place_id));
  const reviewCategoryAffinities = computeUserCategoryAffinities(currentUserReviews, currentMean);
  const seedCategoryAffinities = computeSeedCategoryAffinities(currentUserSeedRatings);
  const categoryAffinities = mergeAffinityMaps(
    reviewCategoryAffinities,
    seedCategoryAffinities,
    currentUserReviews.length >= 5 ? 0.25 : 0.7
  );
  const reviewMainCategoryAffinities = computeUserMainCategoryAffinities(reviewCategoryAffinities);
  const seedMainCategoryAffinities = computeSeedMainCategoryAffinities(currentUserSeedRatings);
  const seedRequestedCategories = Array.from(seedCategoryAffinities.entries())
    .filter(([, affinity]) => affinity >= 0.58)
    .map(([category]) => category as PlaceCategory);
  const requestedCategories = explicitRequestedCategories.length
    ? explicitRequestedCategories
    : Array.from(new Set(seedRequestedCategories));
  const mainCategoryAffinities = mergeAffinityMaps(
    reviewMainCategoryAffinities,
    seedMainCategoryAffinities,
    currentUserReviews.length >= 5 ? 0.25 : 0.7
  );
  const seedTags = deriveSeedTags(currentUserSeedRatings);
  const mergedRequestedTags = Array.from(new Set([...requestedTags, ...seedTags]));
  const userReviewsByUser = new Map<string, ReviewWithPlace[]>();

  for (const review of allReviews) {
    const bucket = userReviewsByUser.get(review.user_id) || [];
    bucket.push(review);
    userReviewsByUser.set(review.user_id, bucket);
  }

  const similarityByUser = new Map<string, UserSimilarity>();
  if (currentUserId && currentUserReviews.length >= 5) {
    for (const [userId, reviews] of userReviewsByUser.entries()) {
      if (userId === currentUserId) continue;

      const candidateMean = computeMeanRating(reviews);
      const similarity = computeSimilarity(currentUserReviews, reviews, currentMean, candidateMean);
      if (!similarity) continue;

      similarity.isTrusted = trustedUsers.has(userId);
      if (similarity.isTrusted) {
        similarity.similarity *= 1.1;
      }
      similarityByUser.set(userId, similarity);
    }
  }

  if (currentUserId && currentUserSeedRatings.length >= 8) {
    for (const [userId, reviews] of userReviewsByUser.entries()) {
      if (userId === currentUserId) continue;

      const candidateMean = computeMeanRating(reviews);
      const seedSimilarity = computeSeedBasedSimilarity(
        categoryAffinities,
        mainCategoryAffinities,
        reviews,
        candidateMean
      );
      if (!seedSimilarity) continue;

      seedSimilarity.isTrusted = trustedUsers.has(userId);
      if (seedSimilarity.isTrusted) {
        seedSimilarity.similarity *= 1.05;
      }

      const existing = similarityByUser.get(userId);
      if (!existing || seedSimilarity.similarity > existing.similarity) {
        similarityByUser.set(userId, seedSimilarity);
      }
    }
  }

  const similarities = Array.from(similarityByUser.values());
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topSimilarUsers = similarities.slice(0, 30);

  return {
    requestedCategories,
    requestedTags: mergedRequestedTags,
    currentUserReviews,
    currentUserSeedRatings,
    targetCityReviews,
    trustedUsers,
    currentMean,
    currentReviewedPlaceIds,
    categoryAffinities,
    mainCategoryAffinities,
    topSimilarUsers,
    similarityByUser: new Map(topSimilarUsers.map(item => [item.userId, item])),
    globalAverage: computeMeanRating(targetCityReviews)
  };
}

function buildCFCandidates(
  prepared: PreparedRecommendationData,
  mode: 'cf_only' | 'hybrid'
): CandidateScore[] {
  const reviewsByPlace = new Map<string, ReviewWithPlace[]>();
  for (const review of prepared.targetCityReviews) {
    const bucket = reviewsByPlace.get(review.place_id) || [];
    bucket.push(review);
    reviewsByPlace.set(review.place_id, bucket);
  }

  const candidates: CandidateScore[] = [];

  for (const [placeId, reviews] of reviewsByPlace.entries()) {
    if (prepared.currentReviewedPlaceIds.has(placeId)) continue;

    const place = reviews[0].places;
    if (!place) continue;

    const category = getEffectiveCategory(place);
    if (shouldExcludePlace(place, category)) {
      continue;
    }
    const mainCategory = getMainCategory(category);
    if (category === PLACE_CATEGORIES.ACCOMMODATION && !prepared.requestedCategories.includes(PLACE_CATEGORIES.ACCOMMODATION)) {
      continue;
    }
    if (prepared.requestedCategories.length && !prepared.requestedCategories.includes(category)) {
      continue;
    }

    const averageRating = computeMeanRating(reviews);
    const reviewCount = reviews.length;
    const qualityScore = getQualityScore(averageRating, reviewCount, prepared.globalAverage);
    const popularityScore = getPopularityScore(reviewCount);
    const noveltyScore = getNoveltyScore(place, reviewCount);
    const categoryAffinity = prepared.categoryAffinities.get(category) ?? 0.5;
    const mainCategoryAffinity = prepared.mainCategoryAffinities.get(mainCategory)
      ?? (mainCategory === MAIN_CATEGORIES.FOOD_DRINK ? 0.58 : 0.5);

    let weightedDeviationSum = 0;
    let similarityWeightSum = 0;
    let trustedReviewersCount = 0;
    let similarUsersCount = 0;

    for (const review of reviews) {
      const similarity = prepared.similarityByUser.get(review.user_id);
      if (prepared.trustedUsers.has(review.user_id)) {
        trustedReviewersCount += 1;
      }
      if (!similarity || typeof review.overall_rating !== 'number') continue;

      weightedDeviationSum += similarity.similarity * (review.overall_rating - similarity.meanRating);
      similarityWeightSum += Math.abs(similarity.similarity);
      similarUsersCount += 1;
    }

    if (similarityWeightSum <= 0) {
      continue;
    }

    const predictedRating = clamp(prepared.currentMean + (weightedDeviationSum / similarityWeightSum), 1, 5);
    const collaborativeScore = clamp((predictedRating - 1) / 4, 0, 1);
    const supportConfidence = clamp(
      (Math.min(similarUsersCount, 5) / 5) * 0.6 +
      Math.min(similarityWeightSum, 1.5) / 1.5 * 0.4,
      0,
      1
    );
    const socialTrustScore = reviewCount > 0
      ? clamp(trustedReviewersCount / reviewCount, 0, 1)
      : 0;

    const placeTags = derivePlaceTags(place, category);
    const matchingTags = placeTags.filter(tag => prepared.requestedTags.includes(tag));
    const tagConfidence = prepared.requestedTags.length
      ? clamp(matchingTags.length / prepared.requestedTags.length, 0, 1)
      : 0;
    const diversityBoost = mode === 'hybrid'
      ? clamp(
          (mainCategory === MAIN_CATEGORIES.FOOD_DRINK ? 0.10 : 0) +
          (mainCategory === MAIN_CATEGORIES.SHOPPING_ACTIVITIES || mainCategory === MAIN_CATEGORIES.NIGHTLIFE ? 0.08 : 0) +
          Math.max(mainCategoryAffinity - 0.5, 0) * 0.45 +
          Math.max(tagConfidence - 0.3, 0) * 0.20,
          0,
          0.20
        )
      : 0;
    const mainstreamPenalty = mode === 'hybrid' &&
      mainCategory === MAIN_CATEGORIES.CULTURE_SIGHTS &&
      popularityScore > 0.82 &&
      collaborativeScore < 0.72 &&
      categoryAffinity < 0.62
        ? 0.08
        : 0;

    const finalScore = mode === 'cf_only'
      ? (
          collaborativeScore * 0.74 +
          supportConfidence * 0.12 +
          qualityScore * 0.06 +
          categoryAffinity * 0.04 +
          popularityScore * 0.02 +
          noveltyScore * 0.02
        )
      : (
          collaborativeScore * 0.24 +
          supportConfidence * 0.08 +
          categoryAffinity * 0.14 +
          mainCategoryAffinity * 0.08 +
          tagConfidence * 0.08 +
          noveltyScore * 0.06 +
          qualityScore * 0.18 +
          socialTrustScore * 0.03 +
          popularityScore * 0.10 +
          diversityBoost * 0.09
        );

    if (mode === 'cf_only' && supportConfidence < 0.12 && collaborativeScore < 0.72) {
      continue;
    }

    if (qualityScore < 0.45 && collaborativeScore < 0.45) {
      continue;
    }

    candidates.push({
      place,
      predictedRating,
      collaborativeScore,
      categoryAffinity,
      qualityScore,
      popularityScore,
      noveltyScore,
      tagConfidence,
      trustedReviewersCount,
      socialTrustScore,
      similarUsersCount,
      averageRating,
      reviewCount,
      matchingTags,
      mainCategory,
      diversityBoost,
      finalScore: clamp(finalScore - mainstreamPenalty, 0, 1)
    });
  }

  return candidates;
}

export async function recommendPopular(
  travelPlan: TravelPlan,
  currentUserId?: string,
  limit: number = 20
): Promise<RecommendedPlace[]> {
  try {
    const prepared = await prepareRecommendationData(travelPlan, currentUserId);
    if (!prepared) {
      return [];
    }

    return getFallbackRecommendations(
      prepared.targetCityReviews,
      prepared.requestedCategories,
      prepared.requestedTags,
      limit
    );
  } catch (error) {
    console.error('Error in popular recommendations:', error);
    return [];
  }
}

export async function recommendCFOnly(
  travelPlan: TravelPlan,
  currentUserId?: string,
  limit: number = 20
): Promise<RecommendedPlace[]> {
  try {
    const prepared = await prepareRecommendationData(travelPlan, currentUserId);
    if (!prepared) {
      return [];
    }

    const hasSeedSignal = prepared.currentUserSeedRatings.length >= 8;
    if (!currentUserId || !prepared.topSimilarUsers.length || (!hasSeedSignal && prepared.currentUserReviews.length < 5)) {
      return [];
    }

    const candidates = buildCFCandidates(prepared, 'cf_only');
    if (!candidates.length) {
      return [];
    }

    return diversifyRecommendations(candidates, limit, 'cf_only').map(candidate =>
      buildRecommendation(candidate, prepared.requestedTags)
    );
  } catch (error) {
    console.error('Error in CF-only recommendations:', error);
    return [];
  }
}

export async function recommendHybrid(
  travelPlan: TravelPlan,
  currentUserId?: string,
  limit: number = 20
): Promise<RecommendedPlace[]> {
  try {
    const prepared = await prepareRecommendationData(travelPlan, currentUserId);
    if (!prepared) {
      return [];
    }

    const hasSeedSignal = prepared.currentUserSeedRatings.length >= 8;
    if (!currentUserId || !prepared.topSimilarUsers.length || (!hasSeedSignal && prepared.currentUserReviews.length < 5)) {
      return getFallbackRecommendations(
        prepared.targetCityReviews,
        prepared.requestedCategories,
        prepared.requestedTags,
        limit,
        {
          categoryAffinities: prepared.categoryAffinities,
          mainCategoryAffinities: prepared.mainCategoryAffinities,
          mode: 'hybrid'
        }
      );
    }

    const candidates = [
      ...buildCFCandidates(prepared, 'hybrid'),
      ...buildFallbackCandidates(
        prepared.targetCityReviews,
        prepared.requestedCategories,
        prepared.requestedTags,
        {
          categoryAffinities: prepared.categoryAffinities,
          mainCategoryAffinities: prepared.mainCategoryAffinities,
          mode: 'hybrid'
        }
      )
    ];
    if (!candidates.length) {
      return getFallbackRecommendations(
        prepared.targetCityReviews,
        prepared.requestedCategories,
        prepared.requestedTags,
        limit,
        {
          categoryAffinities: prepared.categoryAffinities,
          mainCategoryAffinities: prepared.mainCategoryAffinities,
          mode: 'hybrid'
        }
      );
    }

    return diversifyRecommendations(candidates, limit, 'hybrid').map(candidate =>
      buildRecommendation(candidate, prepared.requestedTags)
    );
  } catch (error) {
    console.error('Error in hybrid recommendations:', error);
    return [];
  }
}

export async function getRecommendations(travelPlan: TravelPlan, currentUserId?: string): Promise<RecommendedPlace[]> {
  return recommendCFOnly(travelPlan, currentUserId);
}

export async function getImmediateRecommendations(
  travelPlan: TravelPlan,
  currentUserId?: string,
  mode: RecommendationMode = 'cf_only'
): Promise<RecommendedPlace[]> {
  const baseRecommendations = mode === 'popular'
    ? await recommendPopular(travelPlan, currentUserId)
    : mode === 'hybrid'
      ? await recommendHybrid(travelPlan, currentUserId)
      : await recommendCFOnly(travelPlan, currentUserId);
  const recommendations = baseRecommendations;
  const currentHour = new Date().getHours();

  return recommendations.filter(place => {
    if (
      place.category === PLACE_CATEGORIES.PARK ||
      place.category === PLACE_CATEGORIES.VIEWPOINT ||
      place.category === PLACE_CATEGORIES.HIKING_TRAIL ||
      place.category === PLACE_CATEGORIES.LAKE_RIVER_BEACH
    ) {
      return true;
    }

    if (place.category === PLACE_CATEGORIES.CAFE && currentHour >= 7 && currentHour <= 20) {
      return true;
    }

    if (place.category === PLACE_CATEGORIES.RESTAURANT && (
      (currentHour >= 12 && currentHour <= 15) || (currentHour >= 19 && currentHour <= 23)
    )) {
      return true;
    }

    if ((place.category === PLACE_CATEGORIES.BAR || place.category === PLACE_CATEGORIES.NIGHTCLUB) && currentHour >= 18) {
      return true;
    }

    if ((place.category === PLACE_CATEGORIES.MUSEUM ||
        place.category === PLACE_CATEGORIES.ART_GALLERY ||
        place.category === PLACE_CATEGORIES.SHOPPING_AREA) &&
      currentHour >= 9 && currentHour <= 18) {
      return true;
    }

    return place.final_ranking_score >= 0.65;
  });
}

const recommenderApi = {
  recommendPopular,
  recommendCFOnly,
  recommendHybrid,
  getRecommendations,
  getImmediateRecommendations
};

export default recommenderApi;
