import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import {
  MAIN_CATEGORIES,
  PLACE_CATEGORIES,
  SUBCATEGORY_TO_MAIN,
  type PlaceCategory
} from '../src/shared/utils/dataStandards';

loadEnv({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type PlaceRow = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  description: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  price_level: string | null;
  indoor_outdoor: string | null;
  verified: boolean | null;
  created_at: string | null;
  place_types: { slug: string | null; name: string | null } | null;
};

type ReviewWithPlace = {
  id: string;
  user_id: string;
  place_id: string;
  overall_rating: number | null;
  visit_date: string | null;
  comment: string | null;
  places: PlaceRow | null;
};

type RawReviewRow = Omit<ReviewWithPlace, 'places'> & { places: PlaceRow | PlaceRow[] | null };

type SeedRatingRow = {
  user_id: string;
  city: string;
  place_category: string;
  main_category: string;
  experience_tags: string[] | null;
  rating: number;
};

type UserSimilarity = { userId: string; similarity: number; overlapCount: number; meanRating: number };
type EvaluationMode = 'popular' | 'cf_only' | 'hybrid';
type CaseMetrics = { precisionAtK: number; recallAtK: number; hitRateAtK: number; ndcgAtK: number; recommendationCount: number; relevantCount: number };
type CandidateScore = {
  place: PlaceRow;
  finalScore: number;
  predictedRating: number;
  collaborativeScore: number;
  categoryAffinity: number;
  qualityScore: number;
  popularityScore: number;
  noveltyScore: number;
  tagConfidence: number;
  similarUsersCount: number;
  reviewCount: number;
  mainCategory: string;
};

type EvaluationCase = {
  userId: string;
  targetCity: string;
  trainReviews: ReviewWithPlace[];
  heldOutReviews: ReviewWithPlace[];
  seedRatings: SeedRatingRow[];
};

type AggregatedMetrics = {
  cases: number;
  coverage: number;
  precisionAtK: number;
  recallAtK: number;
  hitRateAtK: number;
  ndcgAtK: number;
  avgRecommendationCount: number;
};

type EvaluationReport = {
  generatedAt: string;
  protocol: {
    kind: 'cross_city_leave_one_city_out';
    k: number;
    minTrainReviews: number;
    minTargetReviews: number;
    positiveThreshold: number;
  };
  dataset: {
    reviews: number;
    users: number;
    places: number;
    cases: number;
    targetCities: string[];
  };
  overall: Record<EvaluationMode, AggregatedMetrics>;
  byCity: Record<string, Record<EvaluationMode, AggregatedMetrics>>;
};

const TARGET_CITIES = ['Trento', 'Milan', 'Rome', 'Florence'] as const;
const MODE_ORDER: EvaluationMode[] = ['popular', 'cf_only', 'hybrid'];
const POSITIVE_THRESHOLD = 4;
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

function arg(flag: string, fallback?: string) {
  const idx = process.argv.indexOf(flag);
  return idx === -1 ? fallback : process.argv[idx + 1];
}

function norm(value: string | null | undefined) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normCategory(value: string | null | undefined): PlaceCategory | null {
  const slug = norm(value).toLowerCase().replace(/\s+/g, '_');
  if (!slug) return null;
  if (slug in LEGACY_CATEGORY_MAP) return LEGACY_CATEGORY_MAP[slug];
  return Object.values(PLACE_CATEGORIES).includes(slug as PlaceCategory) ? (slug as PlaceCategory) : null;
}

function mainCategory(category: PlaceCategory) {
  return SUBCATEGORY_TO_MAIN[category] || MAIN_CATEGORIES.CULTURE_SIGHTS;
}

function inferCategory(place: PlaceRow | null, fallback?: PlaceCategory | null): PlaceCategory | null {
  const text = `${norm(place?.name)} ${norm(place?.description)}`.toLowerCase();
  if (!text) return fallback || null;
  if (/(cafe|coffee|pasticceria|panificio|bakery|gelateria|gelato|cioccolateria)/.test(text)) return PLACE_CATEGORIES.CAFE;
  if (/(ristorante|restaurant|trattoria|osteria|pizzeria|bistro|bistrot)/.test(text)) return PLACE_CATEGORIES.RESTAURANT;
  if (/(enoteca|wine bar|cocktail|pub|bar\b|aperitivo)/.test(text)) return PLACE_CATEGORIES.BAR;
  if (/(mercato|market\b|mercati)/.test(text)) return PLACE_CATEGORIES.MARKET;
  if (/(cinema|theater|theatre|auditorium|arena|multisala|teatro|concert)/.test(text)) return PLACE_CATEGORIES.ENTERTAINMENT_VENUE;
  if (/(museum|museo|pinacoteca|gallerie|gallery|fondazione)/.test(text)) return PLACE_CATEGORIES.MUSEUM;
  if (/(park|parco|giardini|gardens|garden\b)/.test(text)) return PLACE_CATEGORIES.PARK;
  if (/(piazzale|panorama|viewpoint|belvedere|terrace|terrazza)/.test(text)) return PLACE_CATEGORIES.VIEWPOINT;
  return fallback || null;
}

function categoryOf(place: PlaceRow | null): PlaceCategory {
  const normalized = normCategory(place?.place_types?.slug);
  if (!normalized || normalized === PLACE_CATEGORIES.LANDMARK || normalized === PLACE_CATEGORIES.HISTORICAL_SITE) {
    return inferCategory(place, normalized) || PLACE_CATEGORIES.LANDMARK;
  }
  return normalized;
}

function meanRating(reviews: ReviewWithPlace[]) {
  if (!reviews.length) return 3.5;
  return reviews.reduce((sum, review) => sum + (review.overall_rating || 0), 0) / reviews.length;
}

function categoryAffinities(reviews: ReviewWithPlace[], userMean: number) {
  const grouped = new Map<string, { total: number; count: number }>();
  for (const review of reviews) {
    if (!review.places || typeof review.overall_rating !== 'number') continue;
    const category = categoryOf(review.places);
    const adjusted = clamp(0.5 + ((review.overall_rating - userMean) / 4), 0, 1);
    const bucket = grouped.get(category) || { total: 0, count: 0 };
    bucket.total += adjusted;
    bucket.count += 1;
    grouped.set(category, bucket);
  }
  return new Map(Array.from(grouped.entries()).map(([key, value]) => [key, value.total / value.count]));
}

function mainCategoryAffinities(values: Map<string, number>) {
  const grouped = new Map<string, { total: number; count: number }>();
  for (const [category, affinity] of values.entries()) {
    const bucket = grouped.get(mainCategory(category as PlaceCategory)) || { total: 0, count: 0 };
    bucket.total += affinity;
    bucket.count += 1;
    grouped.set(mainCategory(category as PlaceCategory), bucket);
  }
  return new Map(Array.from(grouped.entries()).map(([key, value]) => [key, value.total / value.count]));
}

function seedCategoryAffinities(seedRatings: SeedRatingRow[]) {
  const grouped = new Map<string, { total: number; count: number }>();
  for (const seed of seedRatings) {
    const category = normCategory(seed.place_category);
    if (!category) continue;
    const score = clamp((seed.rating - 1) / 4, 0, 1);
    const bucket = grouped.get(category) || { total: 0, count: 0 };
    bucket.total += score;
    bucket.count += 1;
    grouped.set(category, bucket);
  }
  return new Map(Array.from(grouped.entries()).map(([key, value]) => [key, value.total / value.count]));
}

function seedMainCategoryAffinities(seedRatings: SeedRatingRow[]) {
  const grouped = new Map<string, { total: number; count: number }>();
  for (const seed of seedRatings) {
    const key = norm(seed.main_category);
    if (!key) continue;
    const score = clamp((seed.rating - 1) / 4, 0, 1);
    const bucket = grouped.get(key) || { total: 0, count: 0 };
    bucket.total += score;
    bucket.count += 1;
    grouped.set(key, bucket);
  }
  return new Map(Array.from(grouped.entries()).map(([key, value]) => [key, value.total / value.count]));
}

function seedTags(seedRatings: SeedRatingRow[]) {
  const weights = new Map<string, number>();
  for (const seed of seedRatings) {
    if (seed.rating < 4) continue;
    for (const tag of seed.experience_tags || []) {
      const normalized = norm(tag).toLowerCase().replace(/\s+/g, '_');
      weights.set(normalized, (weights.get(normalized) || 0) + seed.rating);
    }
  }
  return Array.from(weights.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag]) => tag);
}

function mergeAffinities(primary: Map<string, number>, secondary: Map<string, number>, secondaryWeight: number) {
  const merged = new Map(primary);
  for (const [key, secondaryValue] of secondary.entries()) {
    const primaryValue = merged.get(key);
    merged.set(key, typeof primaryValue === 'number'
      ? clamp((primaryValue * (1 - secondaryWeight)) + (secondaryValue * secondaryWeight), 0, 1)
      : secondaryValue);
  }
  return merged;
}

function placeTags(place: PlaceRow, category: PlaceCategory) {
  const base: Record<PlaceCategory, string[]> = {
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
  const tags = new Set(base[category] || []);
  const description = norm(place.description).toLowerCase();
  if (place.price_level === 'low') tags.add('budget_friendly');
  if (place.indoor_outdoor === 'outdoor') tags.add('scenic_view');
  if (description.includes('view') || description.includes('panorama') || description.includes('scenic')) tags.add('scenic_view');
  if (description.includes('hidden') || description.includes('gem')) tags.add('hidden_gem');
  if (description.includes('local') || description.includes('authentic')) tags.add('authentic_local');
  return Array.from(tags);
}

function qualityScore(averageRating: number, reviewCount: number, globalAverage: number) {
  const smoothing = 6;
  const bayesian = ((averageRating * reviewCount) + (globalAverage * smoothing)) / (reviewCount + smoothing);
  return clamp((bayesian - 1) / 4, 0, 1);
}

function popularityScore(reviewCount: number) {
  return clamp(Math.log1p(reviewCount) / Math.log(35), 0, 1);
}

function noveltyScore(place: PlaceRow, reviewCount: number) {
  const description = norm(place.description).toLowerCase();
  let novelty = 1 - popularityScore(reviewCount);
  if (description.includes('hidden') || description.includes('gem')) novelty += 0.15;
  if (description.includes('local') || description.includes('neighborhood')) novelty += 0.08;
  return clamp(novelty, 0, 1);
}

function shouldExclude(place: PlaceRow, category: PlaceCategory) {
  const combined = `${norm(place.name)} ${norm(place.description)}`.toLowerCase();
  if (/\b(train|station|metro|subway|airport|terminal|bus station|railway|tram|transfer)\b/.test(combined)) return true;
  if (/\b(tour|travel agency|agency|excursion|ticket office)\b/.test(combined) &&
    (category === PLACE_CATEGORIES.LANDMARK || category === PLACE_CATEGORIES.HISTORICAL_SITE || category === PLACE_CATEGORIES.MUSEUM)) {
    return true;
  }
  return false;
}

function similarity(current: ReviewWithPlace[], candidate: ReviewWithPlace[], currentMean: number, candidateMean: number): UserSimilarity | null {
  const currentByPlace = new Map(current.map(review => [review.place_id, review]));
  const overlaps = candidate.filter(review => currentByPlace.has(review.place_id));
  if (overlaps.length < 2) return null;

  let numerator = 0;
  let currentMag = 0;
  let candidateMag = 0;
  for (const candidateReview of overlaps) {
    const currentReview = currentByPlace.get(candidateReview.place_id);
    if (!currentReview || typeof currentReview.overall_rating !== 'number' || typeof candidateReview.overall_rating !== 'number') continue;
    const currentCentered = currentReview.overall_rating - currentMean;
    const candidateCentered = candidateReview.overall_rating - candidateMean;
    numerator += currentCentered * candidateCentered;
    currentMag += currentCentered ** 2;
    candidateMag += candidateCentered ** 2;
  }
  if (numerator <= 0 || currentMag <= 0 || candidateMag <= 0) return null;
  const cosine = numerator / (Math.sqrt(currentMag) * Math.sqrt(candidateMag));
  const overlapWeight = Math.min(1, overlaps.length / 5);
  const value = cosine * overlapWeight;
  return value > 0 ? { userId: candidate[0]?.user_id || '', similarity: value, overlapCount: overlaps.length, meanRating: candidateMean } : null;
}

function cosineSimilarity(left: Map<string, number>, right: Map<string, number>) {
  const keys = Array.from(left.keys()).filter(key => right.has(key));
  if (!keys.length) return 0;
  let numerator = 0;
  let leftMag = 0;
  let rightMag = 0;
  for (const key of keys) {
    const l = (left.get(key) || 0) - 0.5;
    const r = (right.get(key) || 0) - 0.5;
    numerator += l * r;
    leftMag += l ** 2;
    rightMag += r ** 2;
  }
  return leftMag > 0 && rightMag > 0 ? numerator / (Math.sqrt(leftMag) * Math.sqrt(rightMag)) : 0;
}

function seedSimilarity(currentCategory: Map<string, number>, currentMain: Map<string, number>, candidate: ReviewWithPlace[], candidateMean: number): UserSimilarity | null {
  const candidateCategory = categoryAffinities(candidate, candidateMean);
  const candidateMain = mainCategoryAffinities(candidateCategory);
  const score = clamp((cosineSimilarity(currentCategory, candidateCategory) * 0.7) + (cosineSimilarity(currentMain, candidateMain) * 0.3), 0, 1);
  return score > 0.05
    ? { userId: candidate[0]?.user_id || '', similarity: score * 0.65, overlapCount: Math.max(candidateCategory.size, candidateMain.size), meanRating: candidateMean }
    : null;
}

function dedupKey(candidate: CandidateScore) {
  return [norm(candidate.place.city).toLowerCase(), norm(candidate.place.name).toLowerCase(), norm(candidate.place.address).toLowerCase()].join('|');
}

function diversify(candidates: CandidateScore[], limit: number, mode: EvaluationMode) {
  const deduped = new Map<string, CandidateScore>();
  for (const candidate of candidates) {
    const key = dedupKey(candidate);
    const existing = deduped.get(key);
    if (!existing || candidate.finalScore > existing.finalScore) deduped.set(key, candidate);
  }
  const sorted = Array.from(deduped.values()).sort((a, b) => b.finalScore - a.finalScore || b.predictedRating - a.predictedRating || b.reviewCount - a.reviewCount);
  const selected: CandidateScore[] = [];
  const perCategory = new Map<string, number>();
  const perMain = new Map<string, number>();

  for (const candidate of sorted) {
    const category = categoryOf(candidate.place);
    const categoryCount = perCategory.get(category) || 0;
    const maxPerCategory = mode === 'hybrid' ? (selected.length < 10 ? 2 : 4) : (selected.length < 8 ? 2 : 4);
    if (categoryCount >= maxPerCategory) continue;
    if (mode === 'hybrid') {
      const mainCount = perMain.get(candidate.mainCategory) || 0;
      if (mainCount >= 6 && candidate.mainCategory === MAIN_CATEGORIES.CULTURE_SIGHTS) continue;
    }
    selected.push(candidate);
    perCategory.set(category, categoryCount + 1);
    perMain.set(candidate.mainCategory, (perMain.get(candidate.mainCategory) || 0) + 1);
    if (selected.length >= limit) break;
  }

  if (selected.length < limit) {
    for (const candidate of sorted) {
      if (selected.some(item => item.place.id === candidate.place.id)) continue;
      selected.push(candidate);
      if (selected.length >= limit) break;
    }
  }

  return selected.sort((a, b) => b.finalScore - a.finalScore);
}

async function loadReviews() {
  const rows: ReviewWithPlace[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,user_id,place_id,overall_rating,visit_date,comment,
        places!inner(
          id,name,city,address,description,website,latitude,longitude,price_level,
          indoor_outdoor,verified,created_at,place_types(slug,name)
        )
      `)
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || !data.length) break;
    rows.push(...(data as unknown as RawReviewRow[]).map(row => ({ ...row, places: Array.isArray(row.places) ? (row.places[0] || null) : row.places })));
    if (data.length < pageSize) break;
  }
  return rows.filter(row => row.places && typeof row.overall_rating === 'number');
}

async function loadSeedRatings() {
  const { data, error } = await supabaseAdmin
    .from('user_seed_ratings')
    .select('user_id,city,place_category,main_category,experience_tags,rating');
  if (error || !data) return [];
  return data as SeedRatingRow[];
}

function prepareCaseData(evaluationCase: EvaluationCase) {
  const currentUserReviews = evaluationCase.trainReviews.filter(review => review.user_id === evaluationCase.userId && review.places);
  const targetCityReviews = evaluationCase.trainReviews.filter(review => review.places?.city === evaluationCase.targetCity);
  const currentMean = meanRating(currentUserReviews);
  const reviewedPlaceIds = new Set(currentUserReviews.map(review => review.place_id));

  const reviewCategory = categoryAffinities(currentUserReviews, currentMean);
  const seedCategory = seedCategoryAffinities(evaluationCase.seedRatings);
  const mergedCategory = mergeAffinities(reviewCategory, seedCategory, currentUserReviews.length >= 5 ? 0.25 : 0.7);
  const reviewMain = mainCategoryAffinities(reviewCategory);
  const seedMain = seedMainCategoryAffinities(evaluationCase.seedRatings);
  const mergedMain = mergeAffinities(reviewMain, seedMain, currentUserReviews.length >= 5 ? 0.25 : 0.7);

  const reviewsByUser = new Map<string, ReviewWithPlace[]>();
  for (const review of evaluationCase.trainReviews) {
    const bucket = reviewsByUser.get(review.user_id) || [];
    bucket.push(review);
    reviewsByUser.set(review.user_id, bucket);
  }

  const similarityByUser = new Map<string, UserSimilarity>();
  if (currentUserReviews.length >= 5) {
    for (const [userId, reviews] of reviewsByUser.entries()) {
      if (userId === evaluationCase.userId) continue;
      const candidate = similarity(currentUserReviews, reviews, currentMean, meanRating(reviews));
      if (candidate) similarityByUser.set(userId, candidate);
    }
  }

  if (evaluationCase.seedRatings.length >= 8) {
    for (const [userId, reviews] of reviewsByUser.entries()) {
      if (userId === evaluationCase.userId) continue;
      const candidate = seedSimilarity(mergedCategory, mergedMain, reviews, meanRating(reviews));
      if (!candidate) continue;
      const existing = similarityByUser.get(userId);
      if (!existing || candidate.similarity > existing.similarity) similarityByUser.set(userId, candidate);
    }
  }

  return {
    currentUserReviews,
    targetCityReviews,
    currentUserSeedRatings: evaluationCase.seedRatings,
    currentMean,
    reviewedPlaceIds,
    categoryAffinities: mergedCategory,
    mainCategoryAffinities: mergedMain,
    requestedTags: seedTags(evaluationCase.seedRatings),
    topSimilarUsers: Array.from(similarityByUser.values()).sort((a, b) => b.similarity - a.similarity).slice(0, 30),
    similarityByUser,
    globalAverage: meanRating(targetCityReviews)
  };
}

function fallbackCandidates(prepared: ReturnType<typeof prepareCaseData>) {
  const reviewsByPlace = new Map<string, ReviewWithPlace[]>();
  for (const review of prepared.targetCityReviews) {
    const bucket = reviewsByPlace.get(review.place_id) || [];
    bucket.push(review);
    reviewsByPlace.set(review.place_id, bucket);
  }
  const candidates: CandidateScore[] = [];
  for (const reviews of reviewsByPlace.values()) {
    const place = reviews[0].places;
    if (!place) continue;
    const category = categoryOf(place);
    if (shouldExclude(place, category)) continue;
    const avg = meanRating(reviews);
    const count = reviews.length;
    const quality = qualityScore(avg, count, prepared.globalAverage);
    const popularity = popularityScore(count);
    const novelty = noveltyScore(place, count);
    const main = mainCategory(category);
    const matchingTags = placeTags(place, category).filter(tag => prepared.requestedTags.includes(tag));
    const tagConfidence = prepared.requestedTags.length ? matchingTags.length / prepared.requestedTags.length : 0;
    const categoryAffinity = prepared.categoryAffinities.get(category) ?? 0.5;
    const mainAffinity = prepared.mainCategoryAffinities.get(main) ?? 0.5;
    const diversityBoost = clamp((main === MAIN_CATEGORIES.FOOD_DRINK ? 0.08 : 0) + ((main === MAIN_CATEGORIES.SHOPPING_ACTIVITIES || main === MAIN_CATEGORIES.NIGHTLIFE) ? 0.06 : 0) + Math.max(mainAffinity - 0.5, 0) * 0.35, 0, 0.18);
    const hybridScore = quality * 0.24 + categoryAffinity * 0.22 + mainAffinity * 0.12 + tagConfidence * 0.14 + novelty * 0.10 + popularity * 0.10 + diversityBoost * 0.08;
    candidates.push({ place, finalScore: clamp(hybridScore, 0, 1), predictedRating: avg, collaborativeScore: 0, categoryAffinity, qualityScore: quality, popularityScore: popularity, noveltyScore: novelty, tagConfidence, similarUsersCount: 0, reviewCount: count, mainCategory: main });
  }
  return candidates;
}

function fallbackRecommendations(prepared: ReturnType<typeof prepareCaseData>, limit: number, mode: 'popular' | 'hybrid') {
  const candidates = fallbackCandidates(prepared).map(candidate => {
    if (mode === 'popular') {
      return {
        ...candidate,
        finalScore: clamp(candidate.qualityScore * 0.45 + candidate.popularityScore * 0.35 + candidate.noveltyScore * 0.05 + candidate.tagConfidence * 0.20, 0, 1)
      };
    }
    return candidate;
  });
  return diversify(candidates, limit, mode).map(candidate => candidate.place.id);
}

function collaborativeCandidates(prepared: ReturnType<typeof prepareCaseData>, mode: 'cf_only' | 'hybrid') {
  const reviewsByPlace = new Map<string, ReviewWithPlace[]>();
  for (const review of prepared.targetCityReviews) {
    const bucket = reviewsByPlace.get(review.place_id) || [];
    bucket.push(review);
    reviewsByPlace.set(review.place_id, bucket);
  }
  const candidates: CandidateScore[] = [];

  for (const [placeId, reviews] of reviewsByPlace.entries()) {
    if (prepared.reviewedPlaceIds.has(placeId)) continue;
    const place = reviews[0].places;
    if (!place) continue;
    const category = categoryOf(place);
    if (shouldExclude(place, category)) continue;

    const avg = meanRating(reviews);
    const count = reviews.length;
    const quality = qualityScore(avg, count, prepared.globalAverage);
    const popularity = popularityScore(count);
    const novelty = noveltyScore(place, count);
    const main = mainCategory(category);
    const categoryAffinity = prepared.categoryAffinities.get(category) ?? 0.5;
    const mainAffinity = prepared.mainCategoryAffinities.get(main) ?? (main === MAIN_CATEGORIES.FOOD_DRINK ? 0.58 : 0.5);

    let weightedDeviation = 0;
    let similarityWeight = 0;
    let similarUsersCount = 0;
    for (const review of reviews) {
      const similar = prepared.similarityByUser.get(review.user_id);
      if (!similar || typeof review.overall_rating !== 'number') continue;
      weightedDeviation += similar.similarity * (review.overall_rating - similar.meanRating);
      similarityWeight += Math.abs(similar.similarity);
      similarUsersCount += 1;
    }
    if (similarityWeight <= 0) continue;

    const predicted = clamp(prepared.currentMean + (weightedDeviation / similarityWeight), 1, 5);
    const collaborative = clamp((predicted - 1) / 4, 0, 1);
    const supportConfidence = clamp((Math.min(similarUsersCount, 5) / 5) * 0.6 + (Math.min(similarityWeight, 1.5) / 1.5) * 0.4, 0, 1);
    const matchingTags = placeTags(place, category).filter(tag => prepared.requestedTags.includes(tag));
    const tagConfidence = prepared.requestedTags.length ? clamp(matchingTags.length / prepared.requestedTags.length, 0, 1) : 0;
    const diversityBoost = mode === 'hybrid'
      ? clamp((main === MAIN_CATEGORIES.FOOD_DRINK ? 0.10 : 0) + ((main === MAIN_CATEGORIES.SHOPPING_ACTIVITIES || main === MAIN_CATEGORIES.NIGHTLIFE) ? 0.08 : 0) + Math.max(mainAffinity - 0.5, 0) * 0.45 + Math.max(tagConfidence - 0.3, 0) * 0.20, 0, 0.20)
      : 0;
    const mainstreamPenalty = mode === 'hybrid' && main === MAIN_CATEGORIES.CULTURE_SIGHTS && popularity > 0.82 && collaborative < 0.72 && categoryAffinity < 0.62 ? 0.08 : 0;
    const finalScore = mode === 'cf_only'
      ? (collaborative * 0.74 + supportConfidence * 0.12 + quality * 0.06 + categoryAffinity * 0.04 + popularity * 0.02 + novelty * 0.02)
      : (collaborative * 0.24 + supportConfidence * 0.08 + categoryAffinity * 0.14 + mainAffinity * 0.08 + tagConfidence * 0.08 + novelty * 0.06 + quality * 0.18 + popularity * 0.10 + diversityBoost * 0.09);

    if (mode === 'cf_only' && supportConfidence < 0.12 && collaborative < 0.72) continue;
    if (quality < 0.45 && collaborative < 0.45) continue;

    candidates.push({ place, finalScore: clamp(finalScore - mainstreamPenalty, 0, 1), predictedRating: predicted, collaborativeScore: collaborative, categoryAffinity, qualityScore: quality, popularityScore: popularity, noveltyScore: novelty, tagConfidence, similarUsersCount, reviewCount: count, mainCategory: main });
  }

  return candidates;
}

function collaborativeRecommendations(prepared: ReturnType<typeof prepareCaseData>, mode: 'cf_only' | 'hybrid', limit: number) {
  return diversify(collaborativeCandidates(prepared, mode), limit, mode).map(candidate => candidate.place.id);
}

function recommendCase(evaluationCase: EvaluationCase, mode: EvaluationMode, k: number) {
  const prepared = prepareCaseData(evaluationCase);
  if (!prepared.targetCityReviews.length) return [];
  if (mode === 'popular') return fallbackRecommendations(prepared, k, 'popular');

  const hasSeedSignal = prepared.currentUserSeedRatings.length >= 8;
  if (!prepared.topSimilarUsers.length || (!hasSeedSignal && prepared.currentUserReviews.length < 5)) {
    return mode === 'hybrid' ? fallbackRecommendations(prepared, k, 'hybrid') : [];
  }

  if (mode === 'hybrid') {
    const candidateScores = [
      ...fallbackCandidates(prepared),
      ...collaborativeCandidates(prepared, 'hybrid')
    ];
    const ids = diversify(candidateScores, k, 'hybrid').map(candidate => candidate.place.id);
    return ids.length ? ids : fallbackRecommendations(prepared, k, 'hybrid');
  }

  const collaborative = collaborativeRecommendations(prepared, mode, k);
  return collaborative;
}

function caseMetrics(recommended: string[], heldOutReviews: ReviewWithPlace[], k: number): CaseMetrics {
  const relevance = new Map<string, number>();
  for (const review of heldOutReviews) {
    if (typeof review.overall_rating !== 'number' || review.overall_rating < POSITIVE_THRESHOLD) continue;
    relevance.set(review.place_id, Math.max(relevance.get(review.place_id) || 0, review.overall_rating - POSITIVE_THRESHOLD + 1));
  }
  const relevantCount = relevance.size;
  if (!relevantCount) return { precisionAtK: 0, recallAtK: 0, hitRateAtK: 0, ndcgAtK: 0, recommendationCount: recommended.length, relevantCount: 0 };

  let hits = 0;
  let dcg = 0;
  recommended.slice(0, k).forEach((placeId, index) => {
    const rel = relevance.get(placeId) || 0;
    if (rel > 0) {
      hits += 1;
      dcg += ((2 ** rel) - 1) / Math.log2(index + 2);
    }
  });
  const idealRel = Array.from(relevance.values()).sort((a, b) => b - a).slice(0, k);
  const idcg = idealRel.reduce((sum, rel, index) => sum + (((2 ** rel) - 1) / Math.log2(index + 2)), 0);

  return {
    precisionAtK: hits / k,
    recallAtK: hits / relevantCount,
    hitRateAtK: hits > 0 ? 1 : 0,
    ndcgAtK: idcg > 0 ? dcg / idcg : 0,
    recommendationCount: recommended.length,
    relevantCount
  };
}

function aggregate(metrics: CaseMetrics[]): AggregatedMetrics {
  if (!metrics.length) return { cases: 0, coverage: 0, precisionAtK: 0, recallAtK: 0, hitRateAtK: 0, ndcgAtK: 0, avgRecommendationCount: 0 };
  const sum = metrics.reduce((acc, item) => {
    acc.coverage += item.recommendationCount > 0 ? 1 : 0;
    acc.precisionAtK += item.precisionAtK;
    acc.recallAtK += item.recallAtK;
    acc.hitRateAtK += item.hitRateAtK;
    acc.ndcgAtK += item.ndcgAtK;
    acc.avgRecommendationCount += item.recommendationCount;
    return acc;
  }, { coverage: 0, precisionAtK: 0, recallAtK: 0, hitRateAtK: 0, ndcgAtK: 0, avgRecommendationCount: 0 });
  return {
    cases: metrics.length,
    coverage: sum.coverage / metrics.length,
    precisionAtK: sum.precisionAtK / metrics.length,
    recallAtK: sum.recallAtK / metrics.length,
    hitRateAtK: sum.hitRateAtK / metrics.length,
    ndcgAtK: sum.ndcgAtK / metrics.length,
    avgRecommendationCount: sum.avgRecommendationCount / metrics.length
  };
}

function fmt(value: number) {
  return value.toFixed(3);
}

function print(report: EvaluationReport) {
  console.log('\nOffline cross-city evaluation');
  console.log('----------------------------------------');
  console.log(`Cases: ${report.dataset.cases}`);
  console.log(`Users: ${report.dataset.users}`);
  console.log(`Places: ${report.dataset.places}`);
  console.log(`Reviews: ${report.dataset.reviews}`);
  console.log(`Protocol: leave-one-city-out, positive threshold >= ${report.protocol.positiveThreshold}, K=${report.protocol.k}\n`);
  console.log('Overall results');
  console.log('mode       coverage  p@10   r@10   hr@10  ndcg@10 avg_list');
  for (const mode of MODE_ORDER) {
    const metrics = report.overall[mode];
    console.log(`${mode.padEnd(10)} ${fmt(metrics.coverage).padEnd(8)} ${fmt(metrics.precisionAtK).padEnd(6)} ${fmt(metrics.recallAtK).padEnd(6)} ${fmt(metrics.hitRateAtK).padEnd(6)} ${fmt(metrics.ndcgAtK).padEnd(7)} ${fmt(metrics.avgRecommendationCount)}`);
  }
  console.log('\nBy city');
  for (const city of report.dataset.targetCities) {
    console.log(`\n${city}`);
    console.log('mode       coverage  p@10   r@10   hr@10  ndcg@10');
    for (const mode of MODE_ORDER) {
      const metrics = report.byCity[city][mode];
      console.log(`${mode.padEnd(10)} ${fmt(metrics.coverage).padEnd(8)} ${fmt(metrics.precisionAtK).padEnd(6)} ${fmt(metrics.recallAtK).padEnd(6)} ${fmt(metrics.hitRateAtK).padEnd(6)} ${fmt(metrics.ndcgAtK)}`);
    }
  }
}

async function main() {
  const k = Number(arg('--k', '10'));
  const minTrainReviews = Number(arg('--min-train', '5'));
  const minTargetReviews = Number(arg('--min-target', '3'));
  const out = arg('--out');

  const [allReviews, allSeedRatings] = await Promise.all([loadReviews(), loadSeedRatings()]);
  const users = new Set(allReviews.map(review => review.user_id));
  const places = new Set(allReviews.map(review => review.place_id));
  const reviewsByUser = new Map<string, ReviewWithPlace[]>();
  const seedsByUser = new Map<string, SeedRatingRow[]>();

  for (const review of allReviews) {
    const bucket = reviewsByUser.get(review.user_id) || [];
    bucket.push(review);
    reviewsByUser.set(review.user_id, bucket);
  }
  for (const seed of allSeedRatings) {
    const bucket = seedsByUser.get(seed.user_id) || [];
    bucket.push(seed);
    seedsByUser.set(seed.user_id, bucket);
  }

  const cases: EvaluationCase[] = [];
  for (const [userId, userReviews] of reviewsByUser.entries()) {
    const reviewsByCity = new Map<string, ReviewWithPlace[]>();
    for (const review of userReviews) {
      const city = review.places?.city;
      if (!city) continue;
      const bucket = reviewsByCity.get(city) || [];
      bucket.push(review);
      reviewsByCity.set(city, bucket);
    }
    if (reviewsByCity.size < 2) continue;

    for (const targetCity of TARGET_CITIES) {
      const heldOut = reviewsByCity.get(targetCity) || [];
      if (heldOut.length < minTargetReviews) continue;
      if (!heldOut.some(review => (review.overall_rating || 0) >= POSITIVE_THRESHOLD)) continue;
      const sourceReviews = userReviews.filter(review => review.places?.city !== targetCity);
      if (sourceReviews.length < minTrainReviews) continue;
      cases.push({
        userId,
        targetCity,
        trainReviews: allReviews.filter(review => review.user_id !== userId || review.places?.city !== targetCity),
        heldOutReviews: heldOut,
        seedRatings: seedsByUser.get(userId) || []
      });
    }
  }

  const overallByMode: Record<EvaluationMode, CaseMetrics[]> = { popular: [], cf_only: [], hybrid: [] };
  const cityByMode = new Map<string, Record<EvaluationMode, CaseMetrics[]>>(TARGET_CITIES.map(city => [city, { popular: [], cf_only: [], hybrid: [] }]));

  for (const evaluationCase of cases) {
    for (const mode of MODE_ORDER) {
      const metrics = caseMetrics(recommendCase(evaluationCase, mode, k), evaluationCase.heldOutReviews, k);
      overallByMode[mode].push(metrics);
      cityByMode.get(evaluationCase.targetCity)?.[mode].push(metrics);
    }
  }

  const report: EvaluationReport = {
    generatedAt: new Date().toISOString(),
    protocol: { kind: 'cross_city_leave_one_city_out', k, minTrainReviews, minTargetReviews, positiveThreshold: POSITIVE_THRESHOLD },
    dataset: { reviews: allReviews.length, users: users.size, places: places.size, cases: cases.length, targetCities: [...TARGET_CITIES] },
    overall: { popular: aggregate(overallByMode.popular), cf_only: aggregate(overallByMode.cf_only), hybrid: aggregate(overallByMode.hybrid) },
    byCity: Object.fromEntries(TARGET_CITIES.map(city => [city, {
      popular: aggregate(cityByMode.get(city)?.popular || []),
      cf_only: aggregate(cityByMode.get(city)?.cf_only || []),
      hybrid: aggregate(cityByMode.get(city)?.hybrid || [])
    }]))
  };

  print(report);
  if (out) {
    writeFileSync(resolve(out), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`\nSaved report to ${resolve(out)}`);
  }
}

main().catch(error => {
  console.error('Offline evaluation failed:', error);
  process.exit(1);
});
